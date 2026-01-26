import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

// Helper function to auto-assign teachers to all existing class-subject combinations
async function bulkAutoAssignTeachers(schoolId: string) {
    try {
        // Find all class_subjects for this school
        const classSubjects = await db.classSubject.findMany({
            where: {
                class: { schoolId }
            },
            include: {
                class: true,
                subject: true
            }
        })

        console.log(`Found ${classSubjects.length} class-subject assignments to process`)

        // Auto-assign teachers for each class-subject combination
        // createMany with skipDuplicates will handle existing assignments
        for (const cs of classSubjects) {
            await autoAssignTeachersToClassSubject(schoolId, cs.classId, cs.subjectId)
        }

        console.log('Bulk auto-assignment completed')
    } catch (error) {
        console.error('Error in bulk auto-assignment:', error)
    }
}

// Helper function to auto-assign teachers to a class-subject combination
async function autoAssignTeachersToClassSubject(schoolId: string, classId: string, subjectId: string) {
    try {
        // Get the class to determine its type
        const classData = await db.class.findUnique({
            where: { id: classId },
            select: { level: true, name: true }
        })

        if (!classData) return

        // Determine school type from class level
        const determineSchoolType = (level: string | null): string => {
            if (!level) return 'UNKNOWN'
            if (level.startsWith('P') || level.startsWith('p')) return 'PRIMARY'
            if (level.startsWith('S') || level.startsWith('s')) return 'SECONDARY'
            if (level.startsWith('L') || level.startsWith('l')) return 'TSS'
            return 'UNKNOWN'
        }

        const schoolType = determineSchoolType(classData.level)

        // Find teachers who can teach this subject and are qualified for this school type
        const qualifiedTeachers = await db.teacherSubject.findMany({
            where: {
                subjectId: subjectId,
                teacher: {
                    schoolId: schoolId,
                    role: 'TEACHER',
                    isActive: true,
                    teachingStreams: {
                        contains: schoolType
                    }
                }
            },
            select: {
                teacherId: true
            }
        })

        // Create teacher_class_subject assignments for qualified teachers
        const assignments = qualifiedTeachers.map(teacher => ({
            teacherId: teacher.teacherId,
            classId: classId,
            subjectId: subjectId,
            schoolId: schoolId
        }))

        if (assignments.length > 0) {
            // Create assignments, skip if they already exist
            for (const assignment of assignments) {
                try {
                    await db.teacherClassSubject.create({
                        data: assignment
                    })
                } catch (error) {
                    // Skip if already exists (unique constraint violation)
                    console.log(`Assignment already exists for teacher ${assignment.teacherId} in class ${assignment.classId} for subject ${assignment.subjectId}`)
                }
            }
            console.log(`Auto-assigned ${assignments.length} teachers to ${classData.name} for subject ${subjectId}`)
        }

    } catch (error) {
        console.error('Error in auto-assigning teachers:', error)
    }
}

export const dynamic = 'force-dynamic'

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

        // Check if this is a bulk auto-assign request
        if (body.action === 'bulk-auto-assign') {
            await bulkAutoAssignTeachers(session.user.schoolId!)
            return NextResponse.json({ message: 'Bulk auto-assignment completed' })
        }

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

        // Auto-assign teachers to this subject-class combination
        await autoAssignTeachersToClassSubject(session.user.schoolId!, validatedData.classId, validatedData.subjectId)

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
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const skip = (page - 1) * limit

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

        const [assignments, totalCount] = await Promise.all([
            db.classSubject.findMany({
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
                ],
                skip,
                take: limit
            }),
            db.classSubject.count({
                where: whereClause
            })
        ])

        return NextResponse.json({
            classSubjects: assignments,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit)
            }
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