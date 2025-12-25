import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const teacherSubjectAssignmentSchema = z.object({
    teacherId: z.string(),
    subjectId: z.string()
})

const trainerModuleAssignmentSchema = z.object({
    trainerId: z.string(),
    moduleId: z.string()
})

// Get all assignments for the school
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

        // Get teacher-subject assignments
        const teacherSubjects = await db.teacherSubject.findMany({
            where: {
                teacher: {
                    schoolId: session.user.schoolId
                },
                subject: {
                    schoolId: session.user.schoolId
                }
            },
            include: {
                teacher: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        teachingStreams: true
                    } as any
                },
                subject: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        level: true
                    } as any
                }
            }
        })

        // Get trainer-module assignments
        const trainerModules = await db.trainerModule.findMany({
            where: {
                trainer: {
                    schoolId: session.user.schoolId
                },
                module: {
                    schoolId: session.user.schoolId
                }
            },
            include: {
                trainer: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        teachingStreams: true
                    } as any
                },
                module: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        level: true,
                        category: true
                    } as any
                }
            }
        })

        return NextResponse.json({
            teacherSubjects,
            trainerModules
        })

    } catch (error) {
        console.error('Assignments fetch error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// Create teacher-subject assignment
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
        const { type, ...assignmentData } = body

        if (type === 'teacher-subject') {
            const validatedData = teacherSubjectAssignmentSchema.parse(assignmentData)

            // Verify teacher belongs to school and is a teacher
            const teacher = await db.user.findFirst({
                where: {
                    id: validatedData.teacherId,
                    schoolId: session.user.schoolId,
                    role: 'TEACHER'
                }
            })

            if (!teacher) {
                return NextResponse.json(
                    { error: 'Teacher not found' },
                    { status: 404 }
                )
            }

            // Verify subject belongs to school
            const subject = await db.subject.findFirst({
                where: {
                    id: validatedData.subjectId,
                    schoolId: session.user.schoolId
                } as any
            })

            if (!subject) {
                return NextResponse.json(
                    { error: 'Subject not found' },
                    { status: 404 }
                )
            }

            // Check if assignment already exists
            const existingAssignment = await db.teacherSubject.findUnique({
                where: {
                    teacherId_subjectId: {
                        teacherId: validatedData.teacherId,
                        subjectId: validatedData.subjectId
                    }
                }
            })

            if (existingAssignment) {
                return NextResponse.json(
                    { error: 'Assignment already exists' },
                    { status: 400 }
                )
            }

            // Create assignment
            const assignment = await db.teacherSubject.create({
                data: validatedData,
                include: {
                    teacher: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            teachingStreams: true
                        } as any
                    },
                    subject: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                            level: true
                        } as any
                    }
                }
            })

            return NextResponse.json({
                message: 'Teacher-subject assignment created successfully',
                assignment
            }, { status: 201 })

        } else if (type === 'trainer-module') {
            const validatedData = trainerModuleAssignmentSchema.parse(assignmentData)

            // Verify trainer belongs to school and is a trainer
            const trainer = await db.user.findFirst({
                where: {
                    id: validatedData.trainerId,
                    schoolId: session.user.schoolId,
                    role: 'TRAINER'
                }
            })

            if (!trainer) {
                return NextResponse.json(
                    { error: 'Trainer not found' },
                    { status: 404 }
                )
            }

            // Verify module belongs to school
            const module = await db.module.findFirst({
                where: {
                    id: validatedData.moduleId,
                    schoolId: session.user.schoolId
                } as any
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
                        trainerId: validatedData.trainerId,
                        moduleId: validatedData.moduleId
                    }
                }
            })

            if (existingAssignment) {
                return NextResponse.json(
                    { error: 'Assignment already exists' },
                    { status: 400 }
                )
            }

            // Create assignment
            const assignment = await db.trainerModule.create({
                data: validatedData,
                include: {
                    trainer: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            teachingStreams: true
                        } as any
                    },
                    module: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                            level: true,
                            category: true
                        } as any
                    }
                }
            })

            return NextResponse.json({
                message: 'Trainer-module assignment created successfully',
                assignment
            }, { status: 201 })

        } else {
            return NextResponse.json(
                { error: 'Invalid assignment type' },
                { status: 400 }
            )
        }

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.errors },
                { status: 400 }
            )
        }

        console.error('Assignment creation error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// Delete assignment
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
        const type = searchParams.get('type')
        const teacherId = searchParams.get('teacherId')
        const subjectId = searchParams.get('subjectId')
        const trainerId = searchParams.get('trainerId')
        const moduleId = searchParams.get('moduleId')

        if (type === 'teacher-subject' && teacherId && subjectId) {
            // Verify assignment exists and belongs to school
            const assignment = await db.teacherSubject.findFirst({
                where: {
                    teacherId,
                    subjectId,
                    teacher: {
                        schoolId: session.user.schoolId
                    },
                    subject: {
                        schoolId: session.user.schoolId
                    }
                },
                include: {
                    teacher: true,
                    subject: true
                }
            })

            if (!assignment) {
                return NextResponse.json(
                    { error: 'Assignment not found' },
                    { status: 404 }
                )
            }

            // Check if teacher has active timetables for this subject
            const activeTimetables = await db.timetable.count({
                where: {
                    teacherId,
                    subjectId,
                    class: {
                        schoolId: session.user.schoolId
                    }
                }
            })

            // If there are active timetables, automatically remove them first
            if (activeTimetables > 0) {
                console.log(`Removing ${activeTimetables} timetables for teacher ${teacherId} and subject ${subjectId}`)

                await db.timetable.deleteMany({
                    where: {
                        teacherId,
                        subjectId,
                        class: {
                            schoolId: session.user.schoolId
                        }
                    }
                })
            }

            // Delete assignment
            await db.teacherSubject.delete({
                where: {
                    teacherId_subjectId: {
                        teacherId,
                        subjectId
                    }
                }
            })

            return NextResponse.json({
                message: 'Teacher-subject assignment removed successfully'
            })

        } else if (type === 'trainer-module' && trainerId && moduleId) {
            // Verify assignment exists and belongs to school
            const assignment = await db.trainerModule.findFirst({
                where: {
                    trainerId,
                    moduleId,
                    trainer: {
                        schoolId: session.user.schoolId
                    },
                    module: {
                        schoolId: session.user.schoolId
                    }
                },
                include: {
                    trainer: true,
                    module: true
                }
            })

            if (!assignment) {
                return NextResponse.json(
                    { error: 'Assignment not found' },
                    { status: 404 }
                )
            }

            // Check if trainer has active timetables for this module
            const activeTimetables = await db.timetable.count({
                where: {
                    teacherId: trainerId,
                    moduleId,
                    class: {
                        schoolId: session.user.schoolId
                    }
                }
            })

            // If there are active timetables, automatically remove them first
            if (activeTimetables > 0) {
                console.log(`Removing ${activeTimetables} timetables for trainer ${trainerId} and module ${moduleId}`)

                await db.timetable.deleteMany({
                    where: {
                        teacherId: trainerId,
                        moduleId,
                        class: {
                            schoolId: session.user.schoolId
                        }
                    }
                })
            }

            // Delete assignment
            await db.trainerModule.delete({
                where: {
                    trainerId_moduleId: {
                        trainerId,
                        moduleId
                    }
                }
            })

            return NextResponse.json({
                message: 'Trainer-module assignment removed successfully'
            })

        } else {
            return NextResponse.json(
                { error: 'Invalid parameters' },
                { status: 400 }
            )
        }

    } catch (error) {
        console.error('Assignment deletion error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}