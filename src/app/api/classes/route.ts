import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const classSchema = z.object({
    name: z.string().min(2, 'Class name must be at least 2 characters'),
    level: z.string().min(1, 'Level is required'),
    stream: z.string().optional()
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
        const validatedData = classSchema.parse(body)

        // Check if class with same name and level already exists for this school
        const existingClass = await db.class.findFirst({
            where: {
                schoolId: session.user.schoolId!,
                name: validatedData.name,
                level: validatedData.level
            }
        })

        if (existingClass) {
            return NextResponse.json(
                { error: 'Class with this name and level already exists' },
                { status: 400 }
            )
        }

        // Create class
        const cls = await db.class.create({
            data: {
                name: validatedData.name,
                level: validatedData.level,
                stream: validatedData.stream,
                schoolId: session.user.schoolId!
            }
        })

        return NextResponse.json({
            message: 'Class created successfully',
            class: cls
        }, { status: 201 })

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.errors },
                { status: 400 }
            )
        }

        console.error('Class creation error:', error)
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

        const classes = await db.class.findMany({
            where: {
                schoolId: session.user.schoolId
            },
            include: {
                _count: {
                    select: {
                        subjects: true,
                        timetables: true,
                        trainerClassModules: true
                    }
                }
            },
            orderBy: [
                { level: 'asc' },
                { name: 'asc' }
            ]
        })

        return NextResponse.json(classes)

    } catch (error) {
        console.error('Classes fetch error:', error)
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
        const classId = searchParams.get('id')

        if (!classId) {
            return NextResponse.json(
                { error: 'Class ID is required' },
                { status: 400 }
            )
        }

        const body = await request.json()
        const validatedData = classSchema.parse(body)

        // Check if class exists and belongs to the user's school
        const existingClass = await db.class.findFirst({
            where: {
                id: classId,
                schoolId: session.user.schoolId!
            }
        })

        if (!existingClass) {
            return NextResponse.json(
                { error: 'Class not found' },
                { status: 404 }
            )
        }

        // Check if another class with same name and level already exists (excluding current class)
        const duplicateClass = await db.class.findFirst({
            where: {
                schoolId: session.user.schoolId!,
                name: validatedData.name,
                level: validatedData.level,
                id: { not: classId }
            }
        })

        if (duplicateClass) {
            return NextResponse.json(
                { error: 'Another class with this name and level already exists' },
                { status: 400 }
            )
        }

        // Update class
        const updatedClass = await db.class.update({
            where: { id: classId },
            data: {
                name: validatedData.name,
                level: validatedData.level,
                stream: validatedData.stream
            }
        })

        return NextResponse.json({
            message: 'Class updated successfully',
            class: updatedClass
        })

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.errors },
                { status: 400 }
            )
        }

        console.error('Class update error:', error)
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
        const classId = searchParams.get('id')

        if (!classId) {
            return NextResponse.json(
                { error: 'Class ID is required' },
                { status: 400 }
            )
        }

        // Check if class exists and belongs to the user's school
        const cls = await db.class.findFirst({
            where: {
                id: classId,
                schoolId: session.user.schoolId!
            }
        })

        if (!cls) {
            return NextResponse.json(
                { error: 'Class not found' },
                { status: 404 }
            )
        }

        // Delete related records first to avoid foreign key constraints
        await db.timetable.deleteMany({
            where: { classId }
        })

        await db.classSubject.deleteMany({
            where: { classId }
        })

        await db.teacherClassSubject.deleteMany({
            where: { classId }
        })

        await db.trainerClassModule.deleteMany({
            where: { classId }
        })

        // Delete the class
        await db.class.delete({
            where: { id: classId }
        })

        return NextResponse.json({
            message: 'Class deleted successfully'
        })

    } catch (error) {
        console.error('Class deletion error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}