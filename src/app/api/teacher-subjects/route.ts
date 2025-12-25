import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

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

        const { searchParams } = new URL(request.url)
        const teacherId = searchParams.get('teacherId')

        if (!teacherId) {
            return NextResponse.json(
                { error: 'Teacher ID is required' },
                { status: 400 }
            )
        }

        // Get teacher-subject assignments
        const assignments = await db.teacherSubject.findMany({
            where: {
                teacherId: teacherId,
                teacher: {
                    schoolId: session.user.schoolId
                }
            },
            include: {
                subject: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        level: true,
                        periodsPerWeek: true
                    }
                }
            }
        })

        // Transform data to match expected format
        const subjects = assignments.map(assignment => assignment.subject)

        return NextResponse.json(subjects)

    } catch (error) {
        console.error('Teacher subjects fetch error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

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
        const { teacherId, subjectId } = body

        if (!teacherId || !subjectId) {
            return NextResponse.json(
                { error: 'Teacher ID and Subject ID are required' },
                { status: 400 }
            )
        }

        // Verify teacher exists and belongs to the school
        const teacher = await db.user.findFirst({
            where: {
                id: teacherId,
                schoolId: session.user.schoolId,
                role: 'TEACHER'
            }
        })

        if (!teacher) {
            return NextResponse.json(
                { error: 'Teacher not found or does not belong to your school' },
                { status: 404 }
            )
        }

        // Verify subject exists and belongs to the school
        const subject = await db.subject.findFirst({
            where: {
                id: subjectId,
                schoolId: session.user.schoolId
            }
        })

        if (!subject) {
            return NextResponse.json(
                { error: 'Subject not found or does not belong to your school' },
                { status: 404 }
            )
        }

        // Check if assignment already exists
        const existingAssignment = await db.teacherSubject.findUnique({
            where: {
                teacherId_subjectId: {
                    teacherId: teacherId,
                    subjectId: subjectId
                }
            }
        })

        if (existingAssignment) {
            return NextResponse.json(
                { error: 'Teacher is already assigned to this subject' },
                { status: 400 }
            )
        }

        // Create the assignment
        const assignment = await db.teacherSubject.create({
            data: {
                teacherId: teacherId,
                subjectId: subjectId
            },
            include: {
                subject: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        level: true,
                        periodsPerWeek: true
                    }
                }
            }
        })

        return NextResponse.json({
            message: 'Subject assignment created successfully',
            assignment: assignment.subject
        }, { status: 201 })

    } catch (error) {
        console.error('Subject assignment creation error:', error)
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
        const teacherId = searchParams.get('teacherId')
        const subjectId = searchParams.get('subjectId')

        if (!teacherId || !subjectId) {
            return NextResponse.json(
                { error: 'Teacher ID and Subject ID are required' },
                { status: 400 }
            )
        }

        // Verify assignment exists and belongs to the school
        const assignment = await db.teacherSubject.findFirst({
            where: {
                teacherId: teacherId,
                subjectId: subjectId,
                teacher: {
                    schoolId: session.user.schoolId
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
        await db.teacherSubject.delete({
            where: {
                teacherId_subjectId: {
                    teacherId: teacherId,
                    subjectId: subjectId
                }
            }
        })

        return NextResponse.json({
            message: 'Subject assignment deleted successfully'
        })

    } catch (error) {
        console.error('Subject assignment deletion error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}