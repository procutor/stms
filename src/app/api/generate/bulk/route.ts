import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateTimetable } from '@/lib/timetable-generator'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.schoolId || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { regenerate = false } = await request.json()

    console.log('🚀 Starting bulk timetable generation for school:', session.user.schoolId)

    const results = {
      schoolGeneration: null as any,
      summary: {
        totalClasses: 0,
        totalTeachers: 0,
        totalLessons: 0
      }
    }

    // Get class and teacher counts
    const [classCount, teacherCount] = await Promise.all([
      db.class.count({ where: { schoolId: session.user.schoolId } }),
      db.user.count({ 
        where: { 
          schoolId: session.user.schoolId,
          role: { in: ['TEACHER', 'TRAINER'] },
          isActive: true 
        } 
      })
    ])

    results.summary.totalClasses = classCount
    results.summary.totalTeachers = teacherCount

    console.log(`📊 Found ${classCount} classes and ${teacherCount} teachers`)

    // Generate school-wide timetable (this handles ALL classes and teachers in one pass)
    console.log('📚 Generating school-wide timetable...')
    console.log('   This schedules ALL classes and teachers in a single optimized pass')
    
    try {
      const schoolResult = await generateTimetable(session.user.schoolId, 'both')
      results.schoolGeneration = schoolResult
      console.log('✅ School-wide generation completed:', schoolResult.success ? 'SUCCESS' : 'FAILED')
      
      if (schoolResult.success) {
        // Count total lessons scheduled
        const lessonCount = await db.timetable.count({ 
          where: { schoolId: session.user.schoolId } 
        })
        results.summary.totalLessons = lessonCount
        console.log(`📊 Total lessons scheduled: ${lessonCount}`)
      }
    } catch (error) {
      console.error('❌ School-wide generation failed:', error)
      results.schoolGeneration = { success: false, conflicts: [{ type: 'error', message: 'School-wide generation failed' }] }
    }

    console.log('🎉 Bulk generation completed!')

    return NextResponse.json({
      success: results.schoolGeneration?.success || false,
      results,
      message: results.schoolGeneration?.success 
        ? `Successfully generated timetable with ${results.summary.totalLessons} lessons`
        : 'Timetable generation had conflicts or failed'
    })

  } catch (error) {
    console.error('Bulk generation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Bulk generation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
