import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.schoolId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const timeSlots = await db.timeSlot.findMany({
            where: {
                schoolId: session.user.schoolId,
                isActive: true
            },
            orderBy: [
                { day: 'asc' },
                { period: 'asc' }
            ]
        })

        return NextResponse.json(timeSlots)
    } catch (error) {
        console.error('Error fetching time slots:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.schoolId || session.user.role !== 'SCHOOL_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { day, period, name, startTime, endTime, session: timeSession, isBreak, breakType } = body

        // Validate required fields
        if (!day || !period || !name || !startTime || !endTime || !timeSession) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Validate period overlap
        const existingSlots = await db.timeSlot.findMany({
            where: {
                schoolId: session.user.schoolId,
                day,
                isActive: true
            }
        })

        const newStart = new Date(`1970-01-01T${startTime}`)
        const newEnd = new Date(`1970-01-01T${endTime}`)

        for (const slot of existingSlots) {
            const s = slot as any // Cast to access new fields
            const slotStart = new Date(`1970-01-01T${slot.startTime.toTimeString().slice(0, 8)}`)
            const slotEnd = new Date(`1970-01-01T${slot.endTime.toTimeString().slice(0, 8)}`)

            // Check for overlap
            if ((newStart < slotEnd && newEnd > slotStart)) {
                return NextResponse.json({
                    error: `Time slot overlaps with existing period ${s.name} (${slot.startTime.toTimeString().slice(0, 8)} - ${slot.endTime.toTimeString().slice(0, 8)})`
                }, { status: 400 })
            }
        }

        const timeSlot = await db.timeSlot.create({
            data: {
                schoolId: session.user.schoolId,
                day,
                period,
                name,
                startTime: new Date(`1970-01-01T${startTime}`),
                endTime: new Date(`1970-01-01T${endTime}`),
                session: timeSession,
                isBreak: isBreak || false,
                breakType: isBreak ? breakType : null
            } as any
        })

        return NextResponse.json(timeSlot, { status: 201 })
    } catch (error) {
        console.error('Error creating time slot:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}