import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Helper function to convert time string to DateTime
function timeToDateTime(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return date
}

/**
 * API endpoint to set up default time slots for the current school
 * POST /api/setup-time-slots-all
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || session.user.role !== 'SCHOOL_ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const schoolId = session.user.schoolId!
        
        // Check if school already has time slots
        const existingSlots = await db.timeSlot.count({
            where: { schoolId }
        })

        if (existingSlots > 0) {
            return NextResponse.json({
                message: 'School already has time slots configured',
                existingSlots,
                suggestion: 'Delete existing time slots first if you want to reset them'
            })
        }

        // Standard time slots configuration (updated schedule)
        const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
        
        const timeSlotsConfig = [
            // Morning Assembly (07:45-08:00) - not a lesson period
            { period: 1, startTime: '08:00', endTime: '08:40', session: 'MORNING' },
            { period: 2, startTime: '08:40', endTime: '09:20', session: 'MORNING' },
            { period: 3, startTime: '09:20', endTime: '10:00', session: 'MORNING' },
            { period: 4, startTime: '10:00', endTime: '10:20', session: 'MORNING', isBreak: true, breakType: 'BREAK' },
            { period: 5, startTime: '10:20', endTime: '11:00', session: 'MORNING' },
            { period: 6, startTime: '11:00', endTime: '11:40', session: 'MORNING' },
            { period: 7, startTime: '11:40', endTime: '13:10', session: 'MORNING', isBreak: true, breakType: 'LUNCH' },
            { period: 8, startTime: '13:10', endTime: '13:50', session: 'AFTERNOON' },
            { period: 9, startTime: '13:50', endTime: '14:30', session: 'AFTERNOON' },
            { period: 10, startTime: '14:30', endTime: '15:10', session: 'AFTERNOON' },
            { period: 11, startTime: '15:10', endTime: '15:30', session: 'AFTERNOON', isBreak: true, breakType: 'BREAK' },
            { period: 12, startTime: '15:30', endTime: '16:10', session: 'AFTERNOON' },
            { period: 13, startTime: '16:10', endTime: '16:50', session: 'AFTERNOON' },
        ]

        const createdSlots = []

        for (const day of days) {
            for (const slot of timeSlotsConfig) {
                const created = await db.timeSlot.create({
                    data: {
                        schoolId,
                        day,
                        period: slot.period,
                        name: `${day} Period ${slot.period}`,
                        startTime: timeToDateTime(slot.startTime),
                        endTime: timeToDateTime(slot.endTime),
                        session: slot.session,
                        isBreak: slot.isBreak || false,
                        breakType: slot.breakType || null,
                        isActive: true,
                        isCPD: false,
                        shift: 'MORNING'
                    }
                })
                createdSlots.push(created)
            }
        }

        return NextResponse.json({
            message: 'Default time slots created successfully',
            createdSlots: createdSlots.length,
            summary: {
                totalDays: days.length,
                slotsPerDay: timeSlotsConfig.length,
                breaks: timeSlotsConfig.filter(s => s.isBreak).length,
                totalCreated: createdSlots.length
            }
        })

    } catch (error) {
        console.error('Error setting up time slots:', error)
        return NextResponse.json(
            { error: 'Failed to set up time slots' },
            { status: 500 }
        )
    }
}

/**
 * GET /api/setup-time-slots-all
 * Check if school has time slots configured
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || session.user.role !== 'SCHOOL_ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const schoolId = session.user.schoolId!
        
        const timeSlots = await db.timeSlot.findMany({
            where: { schoolId },
            orderBy: [
                { day: 'asc' },
                { period: 'asc' }
            ]
        })

        const hasTimeSlots = timeSlots.length > 0
        
        // Group by day for easier display
        const byDay = timeSlots.reduce((acc: any, slot) => {
            if (!acc[slot.day]) {
                acc[slot.day] = []
            }
            acc[slot.day].push({
                period: slot.period,
                startTime: slot.startTime,
                endTime: slot.endTime,
                isBreak: slot.isBreak
            })
            return acc
        }, {})

        return NextResponse.json({
            hasTimeSlots,
            totalSlots: timeSlots.length,
            daysWithSlots: Object.keys(byDay).length,
            byDay
        })

    } catch (error) {
        console.error('Error checking time slots:', error)
        return NextResponse.json(
            { error: 'Failed to check time slots' },
            { status: 500 }
        )
    }
}
