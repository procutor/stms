import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Get all teachers across all schools with their school information
        const teachers = await db.user.findMany({
            where: {
                role: 'TEACHER'
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                teachingStreams: true,
                maxWeeklyHours: true,
                unavailableDays: true,
                unavailablePeriods: true,
                isActive: true,
                createdAt: true,
                schoolId: true,
                school: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        type: true,
                        status: true
                    }
                },
                _count: {
                    select: {
                        teacherSubjects: true,
                        trainerModules: true,
                        timetablesAsTeacher: true
                    }
                }
            },
            orderBy: [
                { name: 'asc' }
            ]
        })

        // Group teachers by school for easier display
        const teachersBySchool: Record<string, any> = {}
        const schoolMap: Record<string, any> = {}

        teachers.forEach((teacher: any) => {
            const schoolId = teacher.schoolId
            const school = teacher.school

            if (!schoolMap[schoolId]) {
                schoolMap[schoolId] = school
                teachersBySchool[schoolId] = {
                    school: school,
                    teachers: []
                }
            }

            teachersBySchool[schoolId].teachers.push(teacher)
        })

        return NextResponse.json({
            teachers,
            teachersBySchool,
            totalTeachers: teachers.length,
            totalSchools: Object.keys(teachersBySchool).length
        })

    } catch (error) {
        console.error('Super admin teachers fetch error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}