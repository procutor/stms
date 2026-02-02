import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const updateSubjectSchema = z.object({
    name: z.string().min(2, 'Subject name must be at least 2 characters'),
    code: z.string().min(1, 'Subject code is required'),
    level: z.string().min(1, 'Level is required'),
    periodsPerWeek: z.number().min(1).max(10)
})

export async function GET(
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

        const subject = await db.subject.findFirst({
            where: {
                id: params.id,
                schoolId: session.user.schoolId
            }
        })

        if (!subject) {
            return NextResponse.json(
                { error: 'Subject not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(subject)

    } catch (error) {
        console.error('Subject fetch error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

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
        const validatedData = updateSubjectSchema.parse(body)

        // Check if subject exists and belongs to the school
        const existingSubject = await db.subject.findFirst({
            where: {
                id: params.id,
                schoolId: session.user.schoolId
            }
        })

        if (!existingSubject) {
            return NextResponse.json(
                { error: 'Subject not found' },
                { status: 404 }
            )
        }

        // Check if another subject with same name exists (excluding current subject)
        const duplicateSubject = await db.subject.findFirst({
            where: {
                schoolId: session.user.schoolId,
                name: validatedData.name,
                id: {
                    not: params.id
                }
            }
        })

        if (duplicateSubject) {
            return NextResponse.json(
                { error: 'Subject with this name already exists' },
                { status: 400 }
            )
        }

        // Update subject
        const updatedSubject = await db.subject.update({
            where: {
                id: params.id
            },
            data: validatedData
        })

        return NextResponse.json({
            message: 'Subject updated successfully',
            subject: updatedSubject
        })

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.errors },
                { status: 400 }
            )
        }

        console.error('Subject update error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function DELETE(
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

        // Check if subject exists and belongs to the school
        const subject = await db.subject.findFirst({
            where: {
                id: params.id,
                schoolId: session.user.schoolId
            }
        })

        if (!subject) {
            return NextResponse.json(
                { error: 'Subject not found' },
                { status: 404 }
            )
        }

        // First, delete all related records to avoid foreign key constraint violations
        // Delete timetables that reference this subject
        await db.timetable.deleteMany({
            where: {
                subjectId: params.id
            }
        })
        
        // Delete teacher_class_subjects that reference this subject
        await db.teacherClassSubject.deleteMany({
            where: {
                subjectId: params.id
            }
        })
        
        // Delete teacher_subjects that reference this subject
        await db.teacherSubject.deleteMany({
            where: {
                subjectId: params.id
            }
        })
        
        // Delete class_subjects that reference this subject
        await db.classSubject.deleteMany({
            where: {
                subjectId: params.id
            }
        })
        
        // Now delete the subject
        await db.subject.delete({
            where: {
                id: params.id
            }
        })

        return NextResponse.json({
            message: 'Subject deleted successfully'
        })

    } catch (error) {
        console.error('Subject deletion error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}