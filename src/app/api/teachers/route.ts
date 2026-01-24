import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TeacherService } from '@/lib/services/TeacherService'
import { z } from 'zod'

const teacherDeleteSchema = z.object({
    id: z.string().min(1, 'Teacher ID is required')
})

const teacherCreateSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters').optional(),
    role: z.string().optional(),
    teachingStreams: z.string().optional(),
    maxWeeklyHours: z.number().min(1).max(60).optional(),
    unavailableDays: z.string().optional(),
    unavailablePeriods: z.string().optional()
})

const teacherUpdateSchema = z.object({
    id: z.string(),
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    email: z.string().email('Invalid email address').optional(),
    password: z.string().min(6, 'Password must be at least 6 characters').optional(),
    teachingStreams: z.string().optional(),
    maxWeeklyHours: z.number().min(1).max(60).optional(),
    unavailableDays: z.string().optional(),
    unavailablePeriods: z.string().optional(),
    isActive: z.boolean().optional()
})

// Authentication middleware
async function checkAuth() {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
        throw new Error('Unauthorized')
    }
    
    if (!session.user.schoolId) {
        throw new Error('No school assigned to this account')
    }
    
    return session
}

export async function POST(request: NextRequest) {
    try {
        const session = await checkAuth()
        const body = await request.json()
        
        // Remove password from validation and generate default password
        const { password, ...createData } = body
        const validatedData = teacherCreateSchema.omit({ password: true }).parse(createData)
        
        // Generate default password: Rwanda@123
        const defaultPassword = 'Rwanda@123'

        // Use service layer to create teacher
        const teacher = await TeacherService.createTeacher({
            name: validatedData.name,
            email: validatedData.email,
            password: defaultPassword,
            schoolId: session.user.schoolId!,
            role: body.role,
            teachingStreams: validatedData.teachingStreams as any,
            maxWeeklyHours: validatedData.maxWeeklyHours
        })

        return NextResponse.json({
            message: 'Teacher created successfully',
            teacher: {
                id: teacher.id,
                name: teacher.name,
                email: teacher.email,
                maxWeeklyHours: teacher.maxWeeklyHours
            },
            credentials: {
                email: teacher.email,
                password: defaultPassword
            }
        }, { status: 201 })

    } catch (error) {
        console.error('Teacher creation error:', error)
        
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.errors },
                { status: 400 }
            )
        }
        
        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }
        
        if (error instanceof Error && error.message.includes('school assigned')) {
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await checkAuth()
        const body = await request.json()
        const validatedData = teacherDeleteSchema.parse(body)

        // Check if teacher exists and belongs to the school
        const teacher = await TeacherService.getTeacherById(validatedData.id)

        if (!teacher || teacher.schoolId !== session.user.schoolId) {
            return NextResponse.json(
                { error: 'Teacher not found' },
                { status: 404 }
            )
        }

        // Check for existing assignments (comprehensive check)
        const allAssignments = await TeacherService.getAllTeacherAssignments(validatedData.id)

        if (allAssignments.totalCount > 0) {
            const assignmentDetails = []

            if (allAssignments.teacherSubjects.length > 0) {
                assignmentDetails.push(`${allAssignments.teacherSubjects.length} subject assignments`)
            }
            if (allAssignments.trainerModules.length > 0) {
                assignmentDetails.push(`${allAssignments.trainerModules.length} module assignments`)
            }
            if (allAssignments.teacherClassSubjects.length > 0) {
                assignmentDetails.push(`${allAssignments.teacherClassSubjects.length} class-subject assignments`)
            }
            if (allAssignments.trainerClassModules.length > 0) {
                assignmentDetails.push(`${allAssignments.trainerClassModules.length} class-module assignments`)
            }
            if (allAssignments.timetables.length > 0) {
                assignmentDetails.push(`${allAssignments.timetables.length} timetable entries`)
            }

            return NextResponse.json(
                {
                    error: `Cannot delete teacher with existing assignments: ${assignmentDetails.join(', ')}. Please remove all assignments first.`,
                    assignmentCount: allAssignments.totalCount,
                    assignmentBreakdown: {
                        subjects: allAssignments.teacherSubjects.length,
                        modules: allAssignments.trainerModules.length,
                        classSubjects: allAssignments.teacherClassSubjects.length,
                        classModules: allAssignments.trainerClassModules.length,
                        timetables: allAssignments.timetables.length
                    }
                },
                { status: 400 }
            )
        }

        // Delete teacher using service layer
        await TeacherService.deleteTeacher(validatedData.id)

        return NextResponse.json({
            message: 'Teacher deleted successfully'
        })

    } catch (error) {
        console.error('Teacher deletion error:', error)

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.errors },
                { status: 400 }
            )
        }

        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await checkAuth()

        // Use service layer to get teachers
        const teachers = await TeacherService.getAllTeachers(session.user.schoolId!)

        return NextResponse.json(teachers)

    } catch (error) {
        console.error('Teachers fetch error:', error)
        
        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await checkAuth()
        const body = await request.json()
        const validatedData = teacherUpdateSchema.parse(body)

        // Check if teacher exists and belongs to the school
        const existingTeacher = await TeacherService.getTeacherById(validatedData.id)
        
        if (!existingTeacher || existingTeacher.schoolId !== session.user.schoolId) {
            return NextResponse.json(
                { error: 'Teacher not found' },
                { status: 404 }
            )
        }

        // Update teacher using service layer
        const updatedTeacher = await TeacherService.updateTeacher(validatedData.id, {
            name: validatedData.name,
            teachingStreams: validatedData.teachingStreams,
            maxWeeklyHours: validatedData.maxWeeklyHours,
            isActive: validatedData.isActive
        })

        return NextResponse.json({
            message: 'Teacher updated successfully',
            teacher: updatedTeacher
        })

    } catch (error) {
        console.error('Teacher update error:', error)
        
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.errors },
                { status: 400 }
            )
        }
        
        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

