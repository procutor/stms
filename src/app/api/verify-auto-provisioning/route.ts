import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

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

        // Get school details
        const school = await db.school.findUnique({
            where: { id: session.user.schoolId },
            include: {
                _count: {
                    select: {
                        users: true,
                        subjects: true,
                        timeSlots: true,
                        classes: true
                    }
                }
            }
        })

        if (!school) {
            return NextResponse.json(
                { error: 'School not found' },
                { status: 404 }
            )
        }

        // Check auto-provisioning status
        const provisioningStatus = {
            schoolId: school.id,
            schoolName: school.name,
            schoolStatus: school.status,
            usersCount: school._count.users,
            subjectsCount: school._count.subjects,
            timeSlotsCount: school._count.timeSlots,
            classesCount: school._count.classes,
            approvedAt: school.approvedAt,
            createdAt: school.createdAt,
            updatedAt: school.updatedAt,
            status: 'ready'
        }

        return NextResponse.json(provisioningStatus)

    } catch (error) {
        console.error('Auto-provisioning verification error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

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

        // Mark school as auto-provisioned by updating status to APPROVED
        const updatedSchool = await db.school.update({
            where: { id: session.user.schoolId },
            data: {
                status: 'APPROVED',
                approvedAt: new Date()
            }
        })

        return NextResponse.json({
            message: 'School approved and marked as auto-provisioned successfully',
            school: {
                id: updatedSchool.id,
                name: updatedSchool.name,
                status: updatedSchool.status,
                approvedAt: updatedSchool.approvedAt
            }
        })

    } catch (error) {
        console.error('Auto-provisioning update error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}