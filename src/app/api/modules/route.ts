import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const moduleSchema = z.object({
    name: z.string().min(2, 'Module name must be at least 2 characters'),
    code: z.string().min(1, 'Module code is required'),
    level: z.string().min(1, 'Level is required'),
    trade: z.string().optional(),
    totalHours: z.number().min(1).max(40),
    category: z.enum(['SPECIFIC', 'GENERAL', 'COMPLEMENTARY'])
})

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || session.user.role !== 'SCHOOL_ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        if (!session.user.schoolId) {
            return NextResponse.json(
                { error: 'No school assigned to this account' },
                { status: 400 }
            )
        }

        const body = await request.json()
        const validatedData = moduleSchema.parse(body)

        // Check if module with same name and level already exists for this school
        const existingModule = await db.module.findFirst({
            where: {
                schoolId: session.user.schoolId!,
                name: validatedData.name,
                level: validatedData.level
            } as any
        })

        if (existingModule) {
            return NextResponse.json(
                { error: 'Module with this name and level already exists' },
                { status: 400 }
            )
        }

        // Create module
        const moduleData: any = {
            name: validatedData.name,
            code: validatedData.code,
            level: validatedData.level,
            totalHours: validatedData.totalHours,
            category: validatedData.category,
            schoolId: session.user.schoolId!
        }

        // Set blockSize based on category: SPECIFIC and GENERAL modules require 2 consecutive periods
        if (validatedData.category === 'SPECIFIC' || validatedData.category === 'GENERAL') {
            moduleData.blockSize = 2
        } else {
            moduleData.blockSize = 1 // COMPLEMENTARY modules can be single periods
        }

        // Add trade field if provided
        if (validatedData.trade) {
            moduleData.trade = validatedData.trade
        }

        const module = await db.module.create({
            data: moduleData
        })

        return NextResponse.json({
            message: 'Module created successfully',
            module
        }, { status: 201 })

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.errors },
                { status: 400 }
            )
        }

        console.error('Module creation error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || session.user.role !== 'SCHOOL_ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        if (!session.user.schoolId) {
            return NextResponse.json(
                { error: 'No school assigned to this account' },
                { status: 400 }
            )
        }

        const modules = await db.module.findMany({
            where: {
                schoolId: session.user.schoolId
            },
            include: {
                _count: {
                    select: {
                        trainers: true,
                        timetables: true
                    }
                }
            },
            orderBy: [
                { level: 'asc' },
                { name: 'asc' }
            ] as any
        })

        return NextResponse.json(modules)

    } catch (error) {
        console.error('Modules fetch error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || session.user.role !== 'SCHOOL_ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        if (!session.user.schoolId) {
            return NextResponse.json(
                { error: 'No school assigned to this account' },
                { status: 400 }
            )
        }

        const { searchParams } = new URL(request.url)
        const moduleId = searchParams.get('id')

        if (!moduleId) {
            return NextResponse.json(
                { error: 'Module ID is required' },
                { status: 400 }
            )
        }

        const body = await request.json()
        const validatedData = moduleSchema.parse(body)

        // Check if module exists and belongs to the school
        const existingModule = await db.module.findFirst({
            where: {
                id: moduleId,
                schoolId: session.user.schoolId
            } as any
        })

        if (!existingModule) {
            return NextResponse.json(
                { error: 'Module not found' },
                { status: 404 }
            )
        }

        // Check if another module with same name and level exists (excluding current)
        const duplicateModule = await db.module.findFirst({
            where: {
                schoolId: session.user.schoolId,
                name: validatedData.name,
                level: validatedData.level,
                id: { not: moduleId }
            } as any
        })

        if (duplicateModule) {
            return NextResponse.json(
                { error: 'Another module with this name and level already exists' },
                { status: 400 }
            )
        }

        // Update module
        const updateData: any = {
            name: validatedData.name,
            code: validatedData.code,
            level: validatedData.level,
            totalHours: validatedData.totalHours,
            category: validatedData.category
        }

        // Set blockSize based on category: SPECIFIC and GENERAL modules require 2 consecutive periods
        if (validatedData.category === 'SPECIFIC' || validatedData.category === 'GENERAL') {
            updateData.blockSize = 2
        } else {
            updateData.blockSize = 1 // COMPLEMENTARY modules can be single periods
        }

        // Add trade field if provided
        if (validatedData.trade !== undefined) {
            updateData.trade = validatedData.trade
        }

        const updatedModule = await db.module.update({
            where: { id: moduleId },
            data: updateData
        })

        return NextResponse.json({
            message: 'Module updated successfully',
            module: updatedModule
        })

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.errors },
                { status: 400 }
            )
        }

        console.error('Module update error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || session.user.role !== 'SCHOOL_ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        if (!session.user.schoolId) {
            return NextResponse.json(
                { error: 'No school assigned to this account' },
                { status: 400 }
            )
        }

        const { searchParams } = new URL(request.url)
        const moduleId = searchParams.get('id')

        if (!moduleId) {
            return NextResponse.json(
                { error: 'Module ID is required' },
                { status: 400 }
            )
        }

        // Check if module exists and belongs to the school
        const module = await db.module.findFirst({
            where: {
                id: moduleId,
                schoolId: session.user.schoolId
            } as any
        })

        if (!module) {
            return NextResponse.json(
                { error: 'Module not found' },
                { status: 404 }
            )
        }

        // Check if module has assignments
        const assignmentCount = await db.trainerModule.count({
            where: { moduleId }
        })

        if (assignmentCount > 0) {
            return NextResponse.json(
                { error: 'Cannot delete module with existing trainer assignments. Please remove all assignments first.' },
                { status: 400 }
            )
        }

        // Check if module has timetables
        const timetableCount = await db.timetable.count({
            where: { moduleId }
        })

        if (timetableCount > 0) {
            return NextResponse.json(
                { error: 'Cannot delete module with existing timetables. Please regenerate timetables first.' },
                { status: 400 }
            )
        }

        // Delete module
        await db.module.delete({
            where: { id: moduleId }
        })

        return NextResponse.json({
            message: 'Module deleted successfully'
        })

    } catch (error) {
        console.error('Module deletion error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}