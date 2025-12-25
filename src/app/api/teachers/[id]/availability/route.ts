import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const availabilitySchema = z.object({
    unavailableDays: z.array(z.string()).optional(),
    unavailablePeriods: z.array(z.string()).optional()
})

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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

        const body = await request.json()
        const validatedData = availabilitySchema.parse(body)

        // Verify teacher/trainer belongs to school
        const teacher = await db.user.findFirst({
            where: {
                id: params.id,
                schoolId: session.user.schoolId,
                role: { in: ['TEACHER', 'TRAINER'] }
            }
        })

        if (!teacher) {
            return NextResponse.json(
                { error: 'Teacher/Trainer not found' },
                { status: 404 }
            )
        }

        // Update availability
        const updatedTeacher = await db.user.update({
            where: { id: params.id },
            data: {
                unavailableDays: validatedData.unavailableDays || [],
                unavailablePeriods: validatedData.unavailablePeriods || []
            } as any,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                teachingStreams: true,
                unavailableDays: true,
                unavailablePeriods: true,
                maxWeeklyHours: true,
                isActive: true
            }
        })

        return NextResponse.json({
            message: 'Teacher availability updated successfully',
            teacher: updatedTeacher
        })

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.errors },
                { status: 400 }
            )
        }

        console.error('Teacher availability update error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}