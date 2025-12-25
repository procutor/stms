import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'TRAINER')) {
            return NextResponse.json(
                { error: 'Unauthorized - Teacher/Trainer role required' },
                { status: 401 }
            )
        }

        // Get teacher ID from session or query parameter
        const { searchParams } = new URL(request.url)
        const teacherId = searchParams.get('teacherId') || session.user.id

        // Ensure teachers can only access their own data unless they're admin
        if (session.user.role === 'TEACHER' || session.user.role === 'TRAINER') {
            if (teacherId !== session.user.id) {
                return NextResponse.json(
                    { error: 'Unauthorized - Can only access your own timetable' },
                    { status: 403 }
                )
            }
        }

        // Get timetables for the teacher
        const timetables = await db.timetable.findMany({
            where: {
                teacherId: teacherId,
                schoolId: session.user.schoolId!
            },
            include: {
                class: {
                    select: {
                        name: true,
                        level: true,
                        stream: true
                    }
                },
                teacher: {
                    select: {
                        name: true,
                        email: true
                    }
                },
                subject: {
                    select: {
                        name: true,
                        code: true,
                        level: true
                    }
                },
                module: {
                    select: {
                        name: true,
                        code: true,
                        level: true,
                        category: true,
                        trade: true
                    }
                },
                timeSlot: {
                    select: {
                        day: true,
                        period: true,
                        name: true,
                        startTime: true,
                        endTime: true,
                        session: true,
                        isBreak: true
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

        // Transform the data for frontend consumption
        const transformedTimetables = timetables.map((timetable: any) => ({
            id: timetable.id,
            createdAt: timetable.createdAt,
            day: timetable.timeSlot.day,
            period: timetable.timeSlot.period,
            periodName: timetable.timeSlot.name,
            startTime: `${timetable.timeSlot.startTime.getHours().toString().padStart(2, '0')}:${timetable.timeSlot.startTime.getMinutes().toString().padStart(2, '0')}`,
            endTime: `${timetable.timeSlot.endTime.getHours().toString().padStart(2, '0')}:${timetable.timeSlot.endTime.getMinutes().toString().padStart(2, '0')}`,
            session: timetable.timeSlot.session,
            isBreak: timetable.timeSlot.isBreak,
            class: {
                name: timetable.class.name,
                level: timetable.class.level,
                stream: timetable.class.stream
            },
            subject: timetable.subject ? {
                name: timetable.subject.name,
                code: timetable.subject.code,
                level: timetable.subject.level
            } : null,
            module: timetable.module ? {
                name: timetable.module.name,
                code: timetable.module.code,
                level: timetable.module.level,
                category: timetable.module.category,
                trade: timetable.module.trade
            } : null,
            teacher: {
                name: timetable.teacher.name,
                email: timetable.teacher.email
            }
        }))

        // Calculate statistics
        const stats = {
            totalLessons: transformedTimetables.length,
            uniqueDays: new Set(transformedTimetables.map(t => t.day)).size,
            uniqueClasses: new Set(transformedTimetables.map(t => t.class.name)).size,
            subjects: new Set(transformedTimetables.filter(t => t.subject).map(t => t.subject?.name)).size,
            modules: new Set(transformedTimetables.filter(t => t.module).map(t => t.module?.name)).size,
            maxPeriod: Math.max(...transformedTimetables.map(t => t.period), 0),
            teachingDays: transformedTimetables.filter(t => !t.isBreak).length,
            breaks: transformedTimetables.filter(t => t.isBreak).length
        }

        return NextResponse.json({
            timetables: transformedTimetables,
            statistics: stats
        })

    } catch (error) {
        console.error('Teacher timetable fetch error:', error)
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
                { error: 'Unauthorized - School Admin role required' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { teacherId, regenerate = false } = body

        if (!teacherId) {
            return NextResponse.json(
                { error: 'Teacher ID is required' },
                { status: 400 }
            )
        }

        // Verify teacher exists and belongs to this school
        const teacher = await db.user.findFirst({
            where: {
                id: teacherId,
                schoolId: session.user.schoolId,
                role: { in: ['TEACHER', 'TRAINER'] }
            }
        })

        if (!teacher) {
            return NextResponse.json(
                { error: 'Teacher not found or does not belong to this school' },
                { status: 404 }
            )
        }

        // Delete existing timetables if regenerating
        if (regenerate) {
            await db.timetable.deleteMany({
                where: {
                    teacherId: teacherId,
                    schoolId: session.user.schoolId!
                }
            })
        }

        // Import and use the timetable generation function
        const { generateTimetableForTeacher } = await import('@/lib/timetable-generator')
        
        const result = await generateTimetableForTeacher(session.user.schoolId!, teacherId, {
            incremental: !regenerate,
            regenerate: regenerate
        })

        if (result.success) {
            return NextResponse.json({
                message: `Timetable ${regenerate ? 'regenerated' : 'generated'} successfully for ${teacher.name}`,
                conflicts: result.conflicts,
                conflictCount: result.conflicts.length,
                teacherId: teacherId,
                teacherName: teacher.name
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

    } catch (error) {
        console.error('Teacher timetable generation error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}