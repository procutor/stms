import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { createSchoolTimeSlots } from '@/lib/create-school-time-slots'

const schoolRegistrationSchema = z.object({
    schoolName: z.string().min(2, 'School name must be at least 2 characters'),
    schoolType: z.string().min(1, 'School type is required'),
    province: z.string().min(1, 'Province is required'),    // Province or City
    district: z.string().min(1, 'District is required'),    // District
    sector: z.string().min(1, 'Sector is required'),      // Sector
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    adminName: z.string().min(2, 'Admin name must be at least 2 characters'),
    password: z.string().min(8, 'Password must be at least 8 characters')
})

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const validatedData = schoolRegistrationSchema.parse(body)

        // Check if school email already exists
        const existingSchool = await db.school.findUnique({
            where: { email: validatedData.email }
        })

        if (existingSchool) {
            return NextResponse.json(
                { error: 'School with this email already exists' },
                { status: 400 }
            )
        }

        // Check if admin email already exists
        const existingUser = await db.user.findUnique({
            where: { email: validatedData.email }
        })

        if (existingUser) {
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 400 }
            )
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(validatedData.password, 12)

        // Create school and admin user and auto-setup time slots in a transaction
        const result = await db.$transaction(async (tx: any) => {
            // Create school (approved status for super admin creation)
            const school = await tx.school.create({
                data: {
                    name: validatedData.schoolName,
                    type: validatedData.schoolType as any,
                    province: validatedData.province,
                    district: validatedData.district,
                    sector: validatedData.sector,
                    email: validatedData.email,
                    phone: validatedData.phone,
                    status: "APPROVED", // Schools created by super admin are automatically approved
                    approvedAt: new Date()
                }
            })

            // Create admin user (active for super admin creation)
            const admin = await tx.user.create({
                data: {
                    email: validatedData.email,
                    name: validatedData.adminName,
                    password: hashedPassword,
                    role: "SCHOOL_ADMIN",
                    schoolId: school.id,
                    isActive: true // Admin is active for super admin created schools
                }
            })

            // Automatically create time slots for the new school
            const timeSlotResult = await createSchoolTimeSlots(school.id)
            
            if (!timeSlotResult.success) {
                throw new Error(`Failed to create time slots: ${timeSlotResult.error}`)
            }

            return { school, admin, timeSlotCount: timeSlotResult.count }
        })

        return NextResponse.json({
            message: 'School created successfully with automatic time slot setup. Your school is now ready to use!',
            schoolId: result.school.id,
            timeSlotsCreated: result.timeSlotCount,
            adminId: result.admin.id
        }, { status: 201 })

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.errors },
                { status: 400 }
            )
        }

        console.error('School registration error:', error)
        
        // Check if it's a time slot creation error
        if (error instanceof Error && error.message.includes('Failed to create time slots')) {
            return NextResponse.json(
                { error: 'School created but failed to setup time slots. Please contact support.', details: error.message },
                { status: 500 }
            )
        }

        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        )
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json()
        const { schoolId, status, name, address, province, district, sector, email, phone } = body

        if (!schoolId) {
            return NextResponse.json(
                { error: 'School ID is required' },
                { status: 400 }
            )
        }

        // Check if school exists
        const existingSchool = await db.school.findUnique({
            where: { id: schoolId }
        })

        if (!existingSchool) {
            return NextResponse.json(
                { error: 'School not found' },
                { status: 404 }
            )
        }

        // If status is being updated
        if (status) {
            const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'INACTIVE']
            if (!validStatuses.includes(status)) {
                return NextResponse.json(
                    { error: 'Invalid status' },
                    { status: 400 }
                )
            }

            // Update school status
            const updatedSchool = await db.school.update({
                where: { id: schoolId },
                data: {
                    status,
                    approvedAt: status === 'APPROVED' ? new Date() : null
                }
            })

            // Also update the admin user's active status
            await db.user.updateMany({
                where: { schoolId },
                data: {
                    isActive: status === 'APPROVED'
                }
            })

            return NextResponse.json({
                message: 'School status updated successfully',
                school: updatedSchool
            })
        }

        // If school information is being updated
        const updateData: any = {}
        
        if (name !== undefined) updateData.name = name
        if (address !== undefined) updateData.address = address
        if (province !== undefined) updateData.province = province
        if (district !== undefined) updateData.district = district
        if (sector !== undefined) updateData.sector = sector
        if (phone !== undefined) updateData.phone = phone
        
        // Handle email update with uniqueness check
        if (email !== undefined && email !== existingSchool.email) {
            const emailExists = await db.school.findUnique({
                where: { email }
            })
            
            if (emailExists) {
                return NextResponse.json(
                    { error: 'School with this email already exists' },
                    { status: 400 }
                )
            }
            
            updateData.email = email
        }

        // Update school information
        const updatedSchool = await db.school.update({
            where: { id: schoolId },
            data: updateData
        })

        return NextResponse.json({
            message: 'School information updated successfully',
            school: updatedSchool
        })

    } catch (error) {
        console.error('School update error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json()
        const { schoolId } = body

        if (!schoolId) {
            return NextResponse.json(
                { error: 'School ID is required' },
                { status: 400 }
            )
        }

        // Check if school exists
        const school = await db.school.findUnique({
            where: { id: schoolId },
            include: {
                _count: {
                    select: {
                        users: true,
                        classes: true,
                        subjects: true,
                        timetables: true
                    }
                }
            }
        })

        if (!school) {
            return NextResponse.json(
                { error: 'School not found' },
                { status: 404 }
            )
        }

        // Delete the school (cascade will handle related records)
        // Note: This will also delete all related users, classes, subjects, and timetables
        await db.school.delete({
            where: { id: schoolId }
        })

        return NextResponse.json({
            message: 'School deleted successfully',
            schoolId
        })

    } catch (error) {
        console.error('School deletion error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const type = searchParams.get('type')

        const schools = await db.school.findMany({
            where: {
                ...(status && { status: status as any }),
                ...(type && { type: type as any })
            },
            include: {
                _count: {
                    select: {
                        users: true,
                        classes: true,
                        subjects: true,
                        timetables: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json(schools)

    } catch (error) {
        console.error('Schools fetch error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}