import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const schoolType = searchParams.get('schoolType')
        const isGlobal = searchParams.get('isGlobal')
        const isActive = searchParams.get('isActive')

        // Build where clause
        const where: any = {}
        
        if (schoolType) {
            where.schoolType = schoolType
        }
        
        if (isGlobal !== null && isGlobal !== undefined) {
            where.isGlobal = isGlobal === 'true'
        }
        
        if (isActive !== null && isActive !== undefined) {
            where.isActive = isActive === 'true'
        }

        // If user is SCHOOL_ADMIN, only show global templates and their own school's templates
        if (session.user.role === 'SCHOOL_ADMIN') {
            where.OR = [
                { isGlobal: true },
                { schoolId: session.user.schoolId }
            ]
        }

        const templates = await db.timeSlotTemplate.findMany({
            where,
            include: {
                slots: {
                    orderBy: [
                        { day: 'asc' },
                        { orderIndex: 'asc' }
                    ]
                },
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                school: {
                    select: {
                        id: true,
                        name: true,
                        type: true
                    }
                },
                _count: {
                    select: {
                        slots: true
                    }
                }
            },
            orderBy: [
                { isGlobal: 'desc' }, // Global templates first
                { name: 'asc' }
            ]
        })

        return NextResponse.json(templates)
    } catch (error) {
        console.error('Error fetching time slot templates:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== 'SCHOOL_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { name, description, schoolType, isGlobal, slots } = body

        // Validate required fields
        if (!name || !slots || !Array.isArray(slots) || slots.length === 0) {
            return NextResponse.json(
                { error: 'Name and slots are required' },
                { status: 400 }
            )
        }

        // Validate slots structure
        for (const slot of slots) {
            if (!slot.day || !slot.period || !slot.name || !slot.startTime || !slot.endTime || !slot.session) {
                return NextResponse.json(
                    { error: 'Each slot must have day, period, name, startTime, endTime, and session' },
                    { status: 400 }
                )
            }
        }

        // Create template with slots in a transaction
        const template = await db.$transaction(async (tx) => {
            // Create the template
            const newTemplate = await tx.timeSlotTemplate.create({
                data: {
                    name,
                    description: description || null,
                    schoolType: schoolType || null,
                    isGlobal: isGlobal || false,
                    createdBy: session.user.id,
                    schoolId: session.user.schoolId
                }
            })

            // Create template slots
            const templateSlots = await Promise.all(
                slots.map((slot: any, index: number) => 
                    tx.timeSlotTemplateSlot.create({
                        data: {
                            templateId: newTemplate.id,
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
                ...newTemplate,
                slots: templateSlots
            }
        })

        return NextResponse.json(template, { status: 201 })
    } catch (error) {
        console.error('Error creating time slot template:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}