import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const createSchema = z.object({
    classId: z.string(),
    subjectId: z.string()
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

        const body = await request.json()
        const validatedData = createSchema.parse(body)

        // Verify class exists and belongs to school
        const classExists = await db.class.findFirst({
            where: {
                id: validatedData.classId,
                schoolId: session.user.schoolId!
            }
        })

        if (!classExists) {
            return NextResponse.json(
                { error: 'Class not found' },
                { status: 404 }
            )
        }

        // Verify subject exists and belongs to school
        const subjectExists = await db.subject.findFirst({
            where: {
                id: validatedData.subjectId,
                schoolId: session.user.schoolId!
            }
        })

        if (!subjectExists) {
            return NextResponse.json(
                { error: 'Subject not found' },
                { status: 404 }
            )
        }

        // Check if assignment already exists
        const existingAssignment = await db.classSubject.findUnique({
            where: {
                classId_subjectId: {
                    classId: validatedData.classId,
                    subjectId: validatedData.subjectId
                }
            }
        })

        if (existingAssignment) {
            return NextResponse.json(
                { error: 'Assignment already exists' },
                { status: 409 }
            )
        }

        // Create the assignment
        const assignment = await db.classSubject.create({
            data: {
                classId: validatedData.classId,
                subjectId: validatedData.subjectId
            }
        })

        return NextResponse.json(assignment)

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.errors },
                { status: 400 }
            )
        }

        console.error('Class-subject assignment creation error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const classId = searchParams.get('classId')
        const subjectId = searchParams.get('subjectId')

        let whereClause: any = {
            class: {
                schoolId: session.user.schoolId
            }
        }

        if (classId) {
            whereClause.classId = classId
        }

        if (subjectId) {
            whereClause.subjectId = subjectId
        }

        const assignments = await db.classSubject.findMany({
            where: whereClause,
            include: {
                class: {
                    select: {
                        name: true,
                        level: true,
                        stream: true
                    }
                },
                subject: {
                    select: {
                        name: true,
                        code: true,
                        level: true
                    }
                }
            },
            orderBy: [
                {
                    class: {
                        name: 'asc'
                    }
                },
                {
                    subject: {
                        name: 'asc'
                    }
                }
            ]
        })

        return NextResponse.json({
            classSubjects: assignments
        })

    } catch (error) {
        console.error('Class-subject assignments fetch error:', error)
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

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json(
                { error: 'Assignment ID required' },
                { status: 400 }
            )
        }

        // Verify assignment exists and belongs to school
        const assignment = await db.classSubject.findFirst({
            where: {
                id: id,
                class: {
                    schoolId: session.user.schoolId!
                }
            }
        })

        if (!assignment) {
            return NextResponse.json(
                { error: 'Assignment not found' },
                { status: 404 }
            )
        }

        // Delete the assignment
        await db.classSubject.delete({
            where: { id: id }
        })

        return NextResponse.json({ message: 'Assignment deleted successfully' })

    } catch (error) {
        console.error('Class-subject assignment deletion error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}