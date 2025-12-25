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
        const classId = searchParams.get('classId')
        const teacherId = searchParams.get('teacherId')

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
                        code: true
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
        const clearAll = searchParams.get('clearAll') === 'true'

        if (!clearAll) {
            return NextResponse.json(
                { error: 'Missing clearAll parameter' },
                { status: 400 }
            )
        }

        // Delete all timetables for the school
        const deletedCount = await db.timetable.deleteMany({
            where: {
                schoolId: session.user.schoolId
            }
        })

        return NextResponse.json({
            message: 'All timetables cleared successfully',
            deletedCount: deletedCount.count
        })

    } catch (error) {
        console.error('Timetables clear error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}