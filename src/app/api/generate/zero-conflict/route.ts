import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { generateZeroConflictTimetable } from '@/lib/zero-conflict-timetable-generator'

export const dynamic = 'force-dynamic'

/**
 * ZERO-CONFLICT TIMETABLE GENERATION API
 * POST /api/generate/zero-conflict
 * 
 * Uses the zero-conflict timetable generator with:
 * - Pre-generation feasibility check
 * - Backtracking mechanism
 * - Enhanced availability tracking
 * - Real-time conflict detection
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || session.user.role !== 'SCHOOL_ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const schoolId = session.user.schoolId!

        console.log('🎯 ZERO-CONFLICT TIMETABLE GENERATION REQUESTED')
        console.log(`School: ${schoolId}`)
        console.log(`User: ${session.user.email}`)

        // Parse request body for options
        const body = await request.json().catch(() => ({}))
        const { regenerate = true } = body

        // Delete existing timetables if regenerating
        if (regenerate) {
            const deleted = await db.timetable.deleteMany({
                where: { schoolId }
            })
            console.log(`🗑️ Deleted ${deleted.count} existing timetables`)
        }

        // Generate zero-conflict timetable
        const result = await generateZeroConflictTimetable(schoolId)

        // Prepare response
        const response = {
            success: result.success,
            message: result.success 
                ? 'Timetable generated successfully with no conflicts' 
                : 'Timetable generation completed with some conflicts',
            conflicts: result.conflicts,
            summary: {
                totalConflicts: result.conflicts.length,
                schoolId,
                generatedAt: new Date().toISOString()
            }
        }

        console.log('📊 Generation result:', response.message)
        console.log(`   Conflicts: ${result.conflicts.length}`)

        return NextResponse.json(response)

    } catch (error) {
        console.error('❌ Zero-conflict generation failed:', error)
        return NextResponse.json(
            { 
                error: 'Failed to generate timetable',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}

/**
 * GET /api/generate/zero-conflict
 * Returns information about the zero-conflict generation system
 */
export async function GET(request: NextRequest) {
    return NextResponse.json({
        name: 'Zero-Conflict Timetable Generator',
        description: 'A conflict-free timetable generation system with backtracking and feasibility checks',
        features: [
            'Pre-generation feasibility check',
            'Backtracking mechanism for conflict resolution',
            'Enhanced teacher/class availability tracking',
            'Real-time conflict detection',
            'Optimal slot distribution'
        ],
        usage: {
            method: 'POST',
            body: {
                regenerate: true // Whether to delete existing timetables first
            }
        }
    })
}
