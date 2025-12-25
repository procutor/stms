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

        const module = await db.module.findFirst({
            where: {
                id: params.id,
                schoolId: session.user.schoolId
            } as any
        })

        if (!module) {
            return NextResponse.json(
                { error: 'Module not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(module)

    } catch (error) {
        console.error('Module fetch error:', error)
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
        const { name, code, level, trade, totalHours, category } = body

        if (!name || !totalHours || !category) {
            return NextResponse.json(
                { error: 'Module name, total hours, and category are required' },
                { status: 400 }
            )
        }

        if (!['SPECIFIC', 'GENERAL', 'COMPLEMENTARY'].includes(category)) {
            return NextResponse.json(
                { error: 'Category must be SPECIFIC, GENERAL, or COMPLEMENTARY' },
                { status: 400 }
            )
        }

        // Check if module exists and belongs to the user's school
        const existingModule = await db.module.findFirst({
            where: {
                id: params.id,
                schoolId: session.user.schoolId
            } as any
        })

        if (!existingModule) {
            return NextResponse.json(
                { error: 'Module not found' },
                { status: 404 }
            )
        }

        // Check for unique constraint violation (name, level combination)
        const duplicateModule = await db.module.findFirst({
            where: {
                schoolId: session.user.schoolId,
                name,
                level: level || null,
                NOT: { id: params.id }
            } as any
        })

        if (duplicateModule) {
            return NextResponse.json(
                { error: 'A module with this name and level already exists' },
                { status: 400 }
            )
        }

        // Update the module
        const updatedModule = await db.module.update({
            where: { id: params.id },
            data: {
                name,
                code: code || null,
                level: level || null,
                trade: trade || null,
                totalHours: parseInt(totalHours),
                category
            }
        })

        return NextResponse.json(updatedModule)

    } catch (error) {
        console.error('Module update error:', error)
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

        // Check if module exists and belongs to the user's school
        const existingModule = await db.module.findFirst({
            where: {
                id: params.id,
                schoolId: session.user.schoolId
            } as any
        })

        if (!existingModule) {
            return NextResponse.json(
                { error: 'Module not found' },
                { status: 404 }
            )
        }

        // Delete the module
        await db.module.delete({
            where: { id: params.id }
        })

        return NextResponse.json(
            { message: 'Module deleted successfully' },
            { status: 200 }
        )

    } catch (error) {
        console.error('Module deletion error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}