import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== 'SCHOOL_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { replaceExisting = false } = body

        // Check if template exists
        const template = await db.timeSlotTemplate.findUnique({
            where: { id: params.id },
            include: {
                slots: {
                    orderBy: [
                        { day: 'asc' },
                        { orderIndex: 'asc' }
                    ]
                }
            }
        })

        if (!template) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 })
        }

        // Check permissions
        if (session.user.role === 'SCHOOL_ADMIN') {
            const hasAccess = template.isGlobal || template.schoolId === session.user.schoolId
            if (!hasAccess) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
            }
        }

        // Check if user has school access
        if (!session.user.schoolId) {
            return NextResponse.json(
                { error: 'No school assigned to this account' },
                { status: 400 }
            )
        }

        // Apply template to school
        const result = await db.$transaction(async (tx) => {
            let deletedCount = 0
            let createdCount = 0

            // If replacing existing time slots, delete them first
            if (replaceExisting) {
                const deleteResult = await tx.timeSlot.deleteMany({
                    where: {
                        schoolId: session.user.schoolId
                    }
                })
                deletedCount = deleteResult.count
            }

            // Create new time slots from template
            const timeSlots = await Promise.all(
                template.slots.map((slot) => 
                    tx.timeSlot.create({
                        data: {
                            schoolId: session.user.schoolId,
                            day: slot.day,
                            period: slot.period,
                            name: slot.name,
                            startTime: new Date(`1970-01-01T${slot.startTime}`),
                            endTime: new Date(`1970-01-01T${slot.endTime}`),
                            session: slot.session,
                            isBreak: slot.isBreak,
                            breakType: slot.breakType,
                            isActive: true
                        }
                    })
                )
            )
            createdCount = timeSlots.length

            return {
                deletedCount,
                createdCount,
                timeSlots
            }
        })

        return NextResponse.json({
            message: 'Template applied successfully',
            template: {
                id: template.id,
                name: template.name
            },
            result
        })
    } catch (error) {
        console.error('Error applying time slot template:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}