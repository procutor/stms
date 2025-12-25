import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.schoolId || session.user.role !== 'SCHOOL_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const timeSlotId = params.id

        // Check if time slot exists and belongs to the school
        const timeSlot = await db.timeSlot.findFirst({
            where: {
                id: timeSlotId,
                schoolId: session.user.schoolId
            }
        })

        if (!timeSlot) {
            return NextResponse.json({ error: 'Time slot not found' }, { status: 404 })
        }

        // Check if time slot is being used in any timetables
        const timetableCount = await db.timetable.count({
            where: {
                timeSlotId: timeSlotId
            }
        })

        if (timetableCount > 0) {
            return NextResponse.json({
                error: 'Cannot delete time slot that is being used in timetables. Please remove all timetable entries first.'
            }, { status: 400 })
        }

        // Delete the time slot
        await db.timeSlot.delete({
            where: { id: timeSlotId }
        })

        return NextResponse.json({ message: 'Time slot deleted successfully' })
    } catch (error) {
        console.error('Error deleting time slot:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}