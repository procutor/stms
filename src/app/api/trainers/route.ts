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

        const trainers = await db.user.findMany({
            where: {
                schoolId: session.user.schoolId,
                role: 'TRAINER'
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
                _count: {
                    select: {
                        teacherSubjects: true,
                        trainerModules: true,
                        timetablesAsTeacher: true
                    }
                }
            } as any,
            orderBy: {
                name: 'asc'
            }
        })

        return NextResponse.json(trainers)

    } catch (error) {
        console.error('Trainers fetch error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}