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

        // Get trainer-module assignments
        const assignments = await db.trainerModule.findMany({
            where: {
                trainer: {
                    schoolId: session.user.schoolId
                }
            },
            include: {
                trainer: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        teachingStreams: true,
                        maxWeeklyHours: true,
                        isActive: true,
                        _count: {
                            select: {
                                teacherSubjects: true,
                                trainerModules: true,
                                timetablesAsTeacher: true
                            }
                        }
                    }
                },
                module: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        level: true,
                        trade: true,
                        totalHours: true,
                        category: true,
                        blockSize: true
                    }
                }
            }
        })

        // Transform data to match component expectations
        const transformedAssignments = assignments.map(assignment => ({
            id: assignment.id,
            teacherId: assignment.trainerId,
            moduleId: assignment.moduleId,
            assignedAt: new Date().toISOString(), // Use current date as assigned date
            teacher: assignment.trainer,
            module: assignment.module
        }))

        return NextResponse.json(transformedAssignments)

    } catch (error) {
        console.error('Teacher/Trainer assignments fetch error:', error)
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
        const { teacherId, moduleId } = body

        if (!teacherId || !moduleId) {
            return NextResponse.json(
                { error: 'Teacher ID and Module ID are required' },
                { status: 400 }
            )
        }

        // Verify teacher exists and belongs to the school
        const teacher = await db.user.findFirst({
            where: {
                id: teacherId,
                schoolId: session.user.schoolId,
                role: { in: ['TRAINER', 'TEACHER'] }
            }
        })

        if (!teacher) {
            return NextResponse.json(
                { error: 'Teacher/Trainer not found or does not belong to your school' },
                { status: 404 }
            )
        }

        // Verify module exists
        const module = await db.module.findUnique({
            where: { id: moduleId }
        })

        if (!module) {
            return NextResponse.json(
                { error: 'Module not found' },
                { status: 404 }
            )
        }

        // Check if assignment already exists
        const existingAssignment = await db.trainerModule.findUnique({
            where: {
                trainerId_moduleId: {
                    trainerId: teacherId,
                    moduleId: moduleId
                }
            }
        })

        if (existingAssignment) {
            return NextResponse.json(
                { error: 'Teacher/Trainer is already assigned to this module' },
                { status: 400 }
            )
        }

        // Create the assignment
        const assignment = await db.trainerModule.create({
            data: {
                trainerId: teacherId,
                moduleId: moduleId
            },
            include: {
                trainer: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        teachingStreams: true,
                        maxWeeklyHours: true,
                        isActive: true
                    }
                },
                module: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        level: true,
                        trade: true,
                        totalHours: true,
                        category: true,
                        blockSize: true
                    }
                }
            }
        })

        return NextResponse.json({
            message: 'Teacher/Trainer assignment created successfully',
            assignment: {
                id: assignment.id,
                teacherId: assignment.trainerId,
                moduleId: assignment.moduleId,
                assignedAt: new Date().toISOString(),
                teacher: assignment.trainer,
                module: assignment.module
            }
        }, { status: 201 })

    } catch (error) {
        console.error('Teacher/Trainer assignment creation error:', error)
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
        const assignmentId = searchParams.get('id')

        if (!assignmentId) {
            return NextResponse.json(
                { error: 'Assignment ID is required' },
                { status: 400 }
            )
        }

        // Verify assignment exists and belongs to the school
        const assignment = await db.trainerModule.findUnique({
            where: { id: assignmentId },
            include: {
                trainer: {
                    select: {
                        schoolId: true
                    }
                }
            }
        })

        if (!assignment || assignment.trainer.schoolId !== session.user.schoolId) {
            return NextResponse.json(
                { error: 'Assignment not found' },
                { status: 404 }
            )
        }

        // Delete the assignment
        await db.trainerModule.delete({
            where: { id: assignmentId }
        })

        return NextResponse.json({
            message: 'Teacher/Trainer assignment deleted successfully'
        })

    } catch (error) {
        console.error('Teacher/Trainer assignment deletion error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}