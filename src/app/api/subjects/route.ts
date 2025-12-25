import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const subjectSchema = z.object({
    name: z.string().min(2, 'Subject name must be at least 2 characters'),
    code: z.string().min(1, 'Subject code is required'),
    level: z.string().min(1, 'Level is required'),
    periodsPerWeek: z.number().min(1).max(10)
})

export async function POST(request: NextRequest) {
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
        const validatedData = subjectSchema.parse(body)

        // Check if subject with same name already exists for this school
        const existingSubject = await db.subject.findFirst({
            where: {
                schoolId: session.user.schoolId!,
                name: validatedData.name
            }
        })

        if (existingSubject) {
            return NextResponse.json(
                { error: 'Subject with this name already exists' },
                { status: 400 }
            )
        }

        // Create subject
        const subject = await db.subject.create({
            data: {
                name: validatedData.name,
                code: validatedData.code,
                level: validatedData.level,
                periodsPerWeek: validatedData.periodsPerWeek,
                schoolId: session.user.schoolId!
            }
        })

        return NextResponse.json({
            message: 'Subject created successfully',
            subject
        }, { status: 201 })

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.errors },
                { status: 400 }
            )
        }

        console.error('Subject creation error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

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

        const subjects = await db.subject.findMany({
            where: {
                schoolId: session.user.schoolId
            },
            include: {
                _count: {
                    select: {
                        teachers: true,
                        classSubjects: true,
                        timetables: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        })

        return NextResponse.json(subjects)

    } catch (error) {
        console.error('Subjects fetch error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}