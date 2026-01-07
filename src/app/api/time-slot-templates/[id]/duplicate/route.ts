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
        const { name, description } = body

        // Check if template exists and user has permission
        const existingTemplate = await db.timeSlotTemplate.findUnique({
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

        if (!existingTemplate) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 })
        }

        // Check permissions (can duplicate global templates or own templates)
        if (session.user.role === 'SCHOOL_ADMIN') {
            const hasAccess = existingTemplate.isGlobal || existingTemplate.schoolId === session.user.schoolId
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

        // Duplicate template
        const duplicatedTemplate = await db.$transaction(async (tx) => {
            // Create the duplicated template
            const newTemplate = await tx.timeSlotTemplate.create({
                data: {
                    name: name || `${existingTemplate.name} (Copy)`,
                    description: description || existingTemplate.description,
                    isGlobal: false, // Duplicated templates are always school-specific
                    schoolId: session.user.schoolId
                }
            })

            // Duplicate template slots
            const templateSlots = await Promise.all(
                existingTemplate.slots.map((slot) => 
                    tx.timeSlotTemplateSlot.create({
                        data: {
                            templateId: newTemplate.id,
                            day: slot.day,
                            period: slot.period,
                            name: slot.name,
                            startTime: slot.startTime,
                            endTime: slot.endTime,
                            session: slot.session,
                            isBreak: slot.isBreak,
                            breakType: slot.breakType,
                            orderIndex: slot.orderIndex
                        }
                    })
                )
            )

            return {
                ...newTemplate,
                slots: templateSlots
            }
        })

        return NextResponse.json(duplicatedTemplate, { status: 201 })
    } catch (error) {
        console.error('Error duplicating time slot template:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}