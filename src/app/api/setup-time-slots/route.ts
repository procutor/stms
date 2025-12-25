import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { createSchoolTimeSlots } from '@/lib/create-school-time-slots'

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || session.user.role !== 'SCHOOL_ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized - School Admin role required' },
                { status: 401 }
            )
        }

        const schoolId = session.user.schoolId!

        console.log(`Setting up time slots for school: ${schoolId}`)
        
        // Create time slots using the function
        const result = await createSchoolTimeSlots(schoolId)

        if (result.success) {
            return NextResponse.json({
                message: `Successfully created ${result.count} time slots`,
                count: result.count,
                schoolId: schoolId
            })
        } else {
            return NextResponse.json(
                { error: 'Failed to create time slots', details: result.error },
                { status: 500 }
            )
        }

    } catch (error) {
        console.error('Time slots setup error:', error)
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
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

        // Check current time slots
        const timeSlots = await db.timeSlot.findMany({
            where: {
                schoolId: session.user.schoolId!,
                isActive: true
            },
            orderBy: [
                { day: 'asc' },
                { period: 'asc' }
            ]
        })

        const periodCount = timeSlots.filter((ts: any) => ts.period > 0).length
        const breakCount = timeSlots.filter((ts: any) => ts.isBreak).length

        return NextResponse.json({
            message: 'Current time slots status',
            timeSlotsCount: timeSlots.length,
            periodsCount: periodCount,
            breaksCount: breakCount,
            hasCorrectStructure: periodCount === 65 && breakCount === 16, // 5 days × 13 periods + 5 days × 3 breaks + 5 days × 1 assembly
            timeSlots: timeSlots.map((ts: any) => ({
                day: ts.day,
                period: ts.period,
                name: ts.name,
                startTime: ts.startTime.toTimeString().slice(0, 8),
                endTime: ts.endTime.toTimeString().slice(0, 8),
                isBreak: ts.isBreak
            }))
        })

    } catch (error) {
        console.error('Time slots status error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}