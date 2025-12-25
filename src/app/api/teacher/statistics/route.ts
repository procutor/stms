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

        // Ensure teachers can only access their own statistics unless they're admin
        if (session.user.role === 'TEACHER' || session.user.role === 'TRAINER') {
            if (teacherId !== session.user.id) {
                return NextResponse.json(
                    { error: 'Unauthorized - Can only access your own statistics' },
                    { status: 403 }
                )
            }
        }

        // Get current date info
        const now = new Date()
        const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
        
        // Get timetables for statistics
        const timetables = await db.timetable.findMany({
            where: {
                teacherId: teacherId,
                schoolId: session.user.schoolId || ''
            },
            include: {
                timeSlot: {
                    select: {
                        day: true,
                        period: true,
                        isBreak: true
                    }
                },
                class: {
                    select: {
                        name: true
                    }
                }
            }
        })

        // Calculate timetable statistics
        const totalLessons = timetables.length
        const teachingLessons = timetables.filter(t => !t.timeSlot.isBreak).length
        const breaks = timetables.filter(t => t.timeSlot.isBreak).length
        const uniqueDays = new Set(timetables.map(t => t.timeSlot.day)).size
        const uniqueClasses = new Set(timetables.map(t => t.classId)).size
        const maxPeriod = Math.max(...timetables.map(t => t.timeSlot.period), 0)

        // Today's lessons
        const todayLessons = timetables.filter(t => t.timeSlot.day === currentDay && !t.timeSlot.isBreak)
        
        // Weekly lesson distribution
        const dayOrder = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
        const lessonsPerDay = dayOrder.map(day => ({
            day,
            count: timetables.filter(t => t.timeSlot.day === day && !t.timeSlot.isBreak).length
        }))

        // Get assignment statistics
        const subjectAssignments = await db.teacherSubject.count({
            where: {
                teacherId: teacherId,
                teacher: {
                    schoolId: session.user.schoolId || ''
                }
            }
        })

        const moduleAssignments = await db.trainerModule.count({
            where: {
                trainerId: teacherId,
                trainer: {
                    schoolId: session.user.schoolId || ''
                }
            }
        })

        const classSubjectAssignments = await db.teacherClassSubject.count({
            where: {
                teacherId: teacherId,
                schoolId: session.user.schoolId || ''
            }
        })

        const classModuleAssignments = await db.trainerClassModule.count({
            where: {
                trainerId: teacherId,
                schoolId: session.user.schoolId || ''
            }
        })

        // Calculate workload metrics
        const averageLessonsPerDay = uniqueDays > 0 ? Math.round((teachingLessons / uniqueDays) * 10) / 10 : 0
        const totalAssignments = subjectAssignments + moduleAssignments
        const totalClassAssignments = classSubjectAssignments + classModuleAssignments

        // Get teacher's availability settings
        const teacher = await db.user.findUnique({
            where: {
                id: teacherId
            },
            select: {
                maxWeeklyHours: true,
                unavailableDays: true,
                unavailablePeriods: true,
                teachingStreams: true
            }
        })

        // Calculate utilization percentage
        const maxHours = teacher?.maxWeeklyHours || 40
        const estimatedHours = Math.round((teachingLessons * 0.75) * 10) / 10 // Assuming ~45 min per lesson
        const utilizationPercentage = maxHours > 0 ? Math.round((estimatedHours / maxHours) * 100) : 0

        // Get recent activity (last 5 timetables created/updated)
        const recentTimetables = await db.timetable.findMany({
            where: {
                teacherId: teacherId,
                schoolId: session.user.schoolId || ''
            },
            orderBy: {
                updatedAt: 'desc'
            },
            take: 5,
            select: {
                id: true,
                updatedAt: true,
                class: {
                    select: {
                        name: true
                    }
                },
                timeSlot: {
                    select: {
                        day: true,
                        period: true
                    }
                }
            }
        })

        const statistics = {
            // Timetable Statistics
            totalLessons,
            teachingLessons,
            breaks,
            uniqueDays,
            uniqueClasses,
            maxPeriod,
            todayLessons: todayLessons.length,
            averageLessonsPerDay,
            utilizationPercentage,

            // Assignment Statistics
            subjectAssignments,
            moduleAssignments,
            totalAssignments,
            classSubjectAssignments,
            classModuleAssignments,
            totalClassAssignments,

            // Workload Information
            maxWeeklyHours: teacher?.maxWeeklyHours || 40,
            estimatedWeeklyHours: estimatedHours,
            teachingStreams: teacher?.teachingStreams || 'PRIMARY',

            // Distribution Data
            lessonsPerDay,
            recentActivity: recentTimetables.map(t => ({
                id: t.id,
                className: t.class.name,
                day: t.timeSlot.day,
                period: t.timeSlot.period,
                updatedAt: t.updatedAt
            })),

            // Availability Information
            unavailableDays: teacher?.unavailableDays ? JSON.parse(teacher.unavailableDays) : [],
            unavailablePeriods: teacher?.unavailablePeriods ? JSON.parse(teacher.unavailablePeriods) : []
        }

        // Generate summary for dashboard
        const summary = {
            status: utilizationPercentage < 70 ? 'Light Load' : 
                   utilizationPercentage > 90 ? 'Heavy Load' : 'Balanced',
            weeklyGoal: `${estimatedHours}/${maxHours} hours`,
            nextClass: todayLessons.length > 0 ? 
                `Today: ${todayLessons.length} lessons` : 
                'No classes today',
            assignments: `${totalAssignments} subjects/modules, ${totalClassAssignments} class assignments`
        }

        return NextResponse.json({
            statistics,
            summary,
            lastUpdated: new Date().toISOString()
        })

    } catch (error) {
        console.error('Teacher statistics fetch error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}