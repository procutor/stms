import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateTimetable, generateTimetableForClass, generateTimetableForTeacher } from '@/lib/timetable-generator'
import { db } from '@/lib/db'
import { z } from 'zod'

const generateSchema = z.object({
    classId: z.string().optional(),
    teacherId: z.string().optional(),
    scope: z.enum(['all-classes', 'all-teachers', 'both']).optional(),
    regenerate: z.boolean().default(false),
    incremental: z.boolean().default(false)
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
        const validatedData = generateSchema.parse(body)

        // Verify school exists and is approved
        const school = await db.school.findUnique({
            where: { id: session.user.schoolId! }
        })

        if (!school || school.status !== 'APPROVED') {
            return NextResponse.json(
                { error: 'School not approved or not found' },
                { status: 403 }
            )
        }

        let result

        if (validatedData.classId) {
            // Class-specific generation
            // Check if class exists
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

            // Check if class already has timetables (for incremental mode)
            const existingTimetables = await db.timetable.findMany({
                where: {
                    schoolId: session.user.schoolId!,
                    classId: validatedData.classId
                },
                select: { id: true }
            })

            const hasExistingTimetables = existingTimetables.length > 0

            if (validatedData.incremental && hasExistingTimetables) {
                return NextResponse.json({
                    message: `Class ${classExists.name} already has timetables. Use regeneration mode to overwrite.`,
                    existingTimetables: 1, // Show 1 timetable instead of individual lesson count
                    classId: validatedData.classId,
                    className: classExists.name,
                    suggestion: 'Set regenerate: true to replace existing timetables'
                })
            }

            // Check if class has any lessons to schedule
            const { lessons: preparedLessons } = await prepareLessonsForSchool(session.user.schoolId!)
            const classLessons = preparedLessons.filter(lesson => lesson.classId === validatedData.classId)

            if (classLessons.length === 0) {
                return NextResponse.json(
                    { 
                        error: `Cannot generate timetable for ${classExists.name} - no teacher or trainer assignments found.`,
                        classId: validatedData.classId,
                        className: classExists.name,
                        classLevel: classExists.level,
                        instructions: [
                            'This class has no teacher-class or trainer-class assignments.',
                            'To generate a timetable, you need to create assignments first.',
                            'For Primary/Secondary classes (P1-P5, S1-S6): Add teacher-class-subject assignments.',
                            'For TSS classes (L3-L5): Add trainer-class-module assignments.',
                            'Use the "Teacher Assignments" option in the sidebar to create assignments.'
                        ],
                        availableClassesWithAssignments: await getClassesWithAssignments(session.user.schoolId!)
                    },
                    { status: 400 }
                )
            }

            // Generate timetable for specific class
            result = await generateTimetableForClass(session.user.schoolId!, validatedData.classId, {
                incremental: validatedData.incremental,
                regenerate: validatedData.regenerate
            })

            if (result.success) {
                return NextResponse.json({
                    message: `Timetable ${validatedData.incremental ? 'generated' : 'regenerated'} successfully for class ${classExists.name}`,
                    conflicts: result.conflicts,
                    conflictCount: result.conflicts.length,
                    classId: validatedData.classId,
                    className: classExists.name,
                    mode: validatedData.incremental ? 'incremental' : 'regeneration'
                })
            } else {
                return NextResponse.json(
                    {
                        error: 'Timetable generation for class failed',
                        conflicts: result.conflicts
                    },
                    { status: 500 }
                )
            }
        } else if (validatedData.teacherId) {
            // Teacher-specific generation
            // Check if teacher exists
            const teacherExists = await db.user.findFirst({
                where: {
                    id: validatedData.teacherId,
                    schoolId: session.user.schoolId!,
                    role: { in: ['TEACHER', 'TRAINER'] }
                }
            })

            if (!teacherExists) {
                return NextResponse.json(
                    { error: 'Teacher not found' },
                    { status: 404 }
                )
            }

            // Check if teacher already has timetables (for incremental mode)
            const existingTimetables = await db.timetable.findMany({
                where: {
                    schoolId: session.user.schoolId!,
                    teacherId: validatedData.teacherId
                },
                select: { id: true }
            })

            const hasExistingTimetables = existingTimetables.length > 0

            if (validatedData.incremental && hasExistingTimetables) {
                return NextResponse.json({
                    message: `${teacherExists.name} already has timetables. Use regeneration mode to overwrite.`,
                    existingTimetables: 1, // Show 1 timetable instead of individual lesson count
                    teacherId: validatedData.teacherId,
                    teacherName: teacherExists.name,
                    suggestion: 'Set regenerate: true to replace existing timetables'
                })
            }

            // Check if teacher has any lessons to schedule
            const { lessons: preparedLessons } = await prepareLessonsForSchool(session.user.schoolId!)
            const teacherLessons = preparedLessons.filter(lesson => lesson.teacherId === validatedData.teacherId)

            if (teacherLessons.length === 0) {
                return NextResponse.json(
                    { 
                        error: `No lessons found for ${teacherExists.name}. Please check teacher-class assignments.`,
                        teacherId: validatedData.teacherId,
                        teacherName: teacherExists.name
                    },
                    { status: 404 }
                )
            }

            // Generate timetable for specific teacher
            result = await generateTimetableForTeacher(session.user.schoolId!, validatedData.teacherId, {
                incremental: validatedData.incremental,
                regenerate: validatedData.regenerate
            })

            if (result.success) {
                return NextResponse.json({
                    message: `Timetable ${validatedData.incremental ? 'generated' : 'regenerated'} successfully for ${teacherExists.name}`,
                    conflicts: result.conflicts,
                    conflictCount: result.conflicts.length,
                    teacherId: validatedData.teacherId,
                    teacherName: teacherExists.name,
                    mode: validatedData.incremental ? 'incremental' : 'regeneration'
                })
            } else {
                return NextResponse.json(
                    {
                        error: 'Timetable generation for teacher failed',
                        conflicts: result.conflicts
                    },
                    { status: 500 }
                )
            }
        } else {
            // Full school generation with scope
            const scope = validatedData.scope || 'both'
            result = await generateTimetable(session.user.schoolId!, scope)

            if (result.success) {
                let scopeMessage = ''
                if (scope === 'all-classes') {
                    scopeMessage = ' for all classes'
                } else if (scope === 'all-teachers') {
                    scopeMessage = ' for all teachers'
                }
                return NextResponse.json({
                    message: `Timetable generated successfully${scopeMessage}`,
                    conflicts: result.conflicts,
                    conflictCount: result.conflicts.length,
                    scope: scope
                })
            } else {
                return NextResponse.json(
                    {
                        error: 'Timetable generation failed',
                        conflicts: result.conflicts
                    },
                    { status: 500 }
                )
            }
        }

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.errors },
                { status: 400 }
            )
        }

        console.error('Timetable generation error:', error)
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
        const teacherId = searchParams.get('teacherId')
        const checkExisting = searchParams.get('checkExisting') === 'true'

        // If checking for existing timetables by class
        if (checkExisting && classId) {
            const existingTimetables = await db.timetable.findMany({
                where: {
                    schoolId: session.user.schoolId!,
                    classId: classId
                },
                select: {
                    id: true,
                    createdAt: true,
                    updatedAt: true
                }
            })

            // For classes: return 1 if any timetables exist (one comprehensive timetable per class)
            const hasTimetables = existingTimetables.length > 0
            const timetableCount = hasTimetables ? 1 : 0

            return NextResponse.json({
                classId: classId,
                hasTimetables: hasTimetables,
                count: timetableCount,
                timetables: existingTimetables
            })
        }

        // If checking for existing timetables by teacher
        if (checkExisting && teacherId) {
            const existingTimetables = await db.timetable.findMany({
                where: {
                    schoolId: session.user.schoolId!,
                    teacherId: teacherId
                },
                select: {
                    id: true,
                    createdAt: true,
                    updatedAt: true
                }
            })

            // For teachers: return 1 if any timetables exist (one comprehensive timetable per teacher)
            const hasTimetables = existingTimetables.length > 0
            const timetableCount = hasTimetables ? 1 : 0

            return NextResponse.json({
                teacherId: teacherId,
                hasTimetables: hasTimetables,
                count: timetableCount,
                timetables: existingTimetables
            })
        }

        let whereClause: any = {
            schoolId: session.user.schoolId
        }

        if (classId) {
            whereClause.classId = classId
        }

        if (teacherId) {
            whereClause.teacherId = teacherId
        }

        const timetables = await db.timetable.findMany({
            where: whereClause,
            include: {
                class: {
                    select: {
                        name: true,
                        level: true
                    }
                },
                teacher: {
                    select: {
                        name: true
                    }
                },
                subject: {
                    select: {
                        name: true
                    }
                },
                module: {
                    select: {
                        name: true,
                        category: true
                    }
                },
                timeSlot: {
                    select: {
                        day: true,
                        period: true,
                        startTime: true,
                        endTime: true
                    }
                }
            },
            orderBy: [
                {
                    timeSlot: {
                        day: 'asc'
                    }
                },
                {
                    timeSlot: {
                        period: 'asc'
                    }
                }
            ]
        })

        return NextResponse.json(timetables)

    } catch (error) {
        console.error('Timetables fetch error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// Import the lesson preparation function
import { prepareLessonsForSchool } from '@/lib/lesson-preparation'

// Helper function to get classes that have assignments
async function getClassesWithAssignments(schoolId: string) {
    const teacherClassSubjects = await db.teacherClassSubject.findMany({
        where: { schoolId },
        select: { classId: true }
    })

    const trainerClassModules = await db.trainerClassModule.findMany({
        where: { schoolId },
        select: { classId: true }
    })

    const classIds = new Set<string>()
    teacherClassSubjects.forEach((assignment: any) => classIds.add(assignment.classId))
    trainerClassModules.forEach((assignment: any) => classIds.add(assignment.classId))

    const classes = await db.class.findMany({
        where: { id: { in: Array.from(classIds) } },
        select: { id: true, name: true, level: true }
    })

    return classes
}