import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const template = await db.timeSlotTemplate.findUnique({
            where: { id: params.id },
            include: {
                slots: {
                    orderBy: [
                        { day: 'asc' },
                        { orderIndex: 'asc' }
                    ]
                },
                school: {
                    select: {
                        id: true,
                        name: true,
                        type: true
                    }
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

        return NextResponse.json(template)
    } catch (error) {
        console.error('Error fetching time slot template:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== 'SCHOOL_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { name, description, isGlobal, slots } = body

        // Check if template exists and user has permission
        const existingTemplate = await db.timeSlotTemplate.findUnique({
            where: { id: params.id }
        })

        if (!existingTemplate) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 })
        }

        // Check permissions
        if (!existingTemplate.isGlobal && existingTemplate.schoolId !== session.user.schoolId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Update template with slots in a transaction
        const template = await db.$transaction(async (tx) => {
            // Update the template
            const updatedTemplate = await tx.timeSlotTemplate.update({
                where: { id: params.id },
                data: {
                    name: name || existingTemplate.name,
                    description: description !== undefined ? description : existingTemplate.description,
                    isGlobal: isGlobal !== undefined ? isGlobal : existingTemplate.isGlobal,
                    updatedAt: new Date()
                }
            })

            // If slots are provided, update them
            if (slots && Array.isArray(slots)) {
                // Delete existing slots
                await tx.timeSlotTemplateSlot.deleteMany({
                    where: { templateId: params.id }
                })

                // Create new slots
                const templateSlots = await Promise.all(
                    slots.map((slot: any, index: number) => 
                        tx.timeSlotTemplateSlot.create({
                            data: {
                                templateId: params.id,
                                day: slot.day,
                                period: slot.period,
                                name: slot.name,
                                startTime: slot.startTime,
                                endTime: slot.endTime,
                                session: slot.session,
                                isBreak: slot.isBreak || false,
                                breakType: slot.isBreak ? slot.breakType : null,
                                orderIndex: index
                            }
                        })
                    )
                )

                return {
                    ...updatedTemplate,
                    slots: templateSlots
                }
            }

            // If no slots provided, return existing slots
            const existingSlots = await tx.timeSlotTemplateSlot.findMany({
                where: { templateId: params.id },
                orderBy: [
                    { day: 'asc' },
                    { orderIndex: 'asc' }
                ]
            })

            return {
                ...updatedTemplate,
                slots: existingSlots
            }
        })

        return NextResponse.json(template)
    } catch (error) {
        console.error('Error updating time slot template:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== 'SCHOOL_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check if template exists and user has permission
        const existingTemplate = await db.timeSlotTemplate.findUnique({
            where: { id: params.id }
        })

        if (!existingTemplate) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 })
        }

        // Check permissions (only template creator or school admin can delete)
        if (!existingTemplate.isGlobal && existingTemplate.schoolId !== session.user.schoolId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Delete template (cascade will delete slots)
        await db.timeSlotTemplate.delete({
            where: { id: params.id }
        })

        return NextResponse.json({ message: 'Template deleted successfully' })
    } catch (error) {
        console.error('Error deleting time slot template:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}