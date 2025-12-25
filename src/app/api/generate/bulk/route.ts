import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateTimetable, generateTimetableForClass } from '@/lib/timetable-generator'
import { db } from '@/lib/db'

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
      classGenerations: [] as any[],
      teacherGenerations: [] as any[],
      summary: {
        totalClasses: 0,
        totalTeachers: 0,
        successfulGenerations: 0,
        failedGenerations: 0,
        totalLessons: 0
      }
    }

    // Step 1: Generate school-wide timetable (this handles teacher availability across all classes)
    console.log('📚 Step 1: Generating school-wide timetable...')
    try {
      const schoolResult = await generateTimetable(session.user.schoolId)
      results.schoolGeneration = schoolResult
      console.log('✅ School-wide generation completed:', schoolResult.success ? 'SUCCESS' : 'FAILED')
    } catch (error) {
      console.error('❌ School-wide generation failed:', error)
      results.schoolGeneration = { success: false, conflicts: [{ type: 'error', message: 'School-wide generation failed' }] }
    }

    // Step 2: Get all classes and teachers for this school
    const [classes, teachers] = await Promise.all([
      db.class.findMany({
        where: { schoolId: session.user.schoolId },
        select: { id: true, name: true, level: true }
      }),
      db.user.findMany({
        where: {
          schoolId: session.user.schoolId,
          role: { in: ['TEACHER', 'TRAINER'] },
          isActive: true
        },
        select: { id: true, name: true, email: true, role: true }
      })
    ])

    results.summary.totalClasses = classes.length
    results.summary.totalTeachers = teachers.length

    console.log(`📊 Found ${classes.length} classes and ${teachers.length} teachers`)

    // Step 3: Generate individual class timetables
    console.log('🏫 Step 3: Generating individual class timetables...')
    for (const classData of classes) {
      try {
        console.log(`  📝 Generating timetable for class: ${classData.name}`)
        const classResult = await generateTimetableForClass(session.user.schoolId, classData.id, { regenerate })

        results.classGenerations.push({
          classId: classData.id,
          className: classData.name,
          level: classData.level,
          success: classResult.success,
          conflicts: classResult.conflicts,
          lessonCount: classResult.success ? await getClassLessonCount(classData.id) : 0
        })

        if (classResult.success) {
          results.summary.successfulGenerations++
          results.summary.totalLessons += results.classGenerations[results.classGenerations.length - 1].lessonCount
        } else {
          results.summary.failedGenerations++
        }

        console.log(`    ✅ Class ${classData.name}: ${classResult.success ? 'SUCCESS' : 'FAILED'}`)
      } catch (error) {
        console.error(`    ❌ Class ${classData.name} generation failed:`, error)
        results.classGenerations.push({
          classId: classData.id,
          className: classData.name,
          level: classData.level,
          success: false,
          conflicts: [{ type: 'error', message: 'Generation failed' }],
          lessonCount: 0
        })
        results.summary.failedGenerations++
      }
    }

    // Step 4: Generate individual teacher timetables (optional - teachers are already handled in school generation)
    console.log('👨‍🏫 Step 4: Generating individual teacher timetables...')
    for (const teacher of teachers) {
      try {
        console.log(`  📝 Generating timetable for teacher: ${teacher.name}`)
        const teacherResult = await generateTimetableForTeacher(session.user.schoolId, teacher.id, { regenerate })

        results.teacherGenerations.push({
          teacherId: teacher.id,
          teacherName: teacher.name,
          email: teacher.email,
          role: teacher.role,
          success: teacherResult.success,
          conflicts: teacherResult.conflicts,
          lessonCount: teacherResult.success ? await getTeacherLessonCount(teacher.id) : 0
        })

        if (teacherResult.success) {
          results.summary.successfulGenerations++
          results.summary.totalLessons += results.teacherGenerations[results.teacherGenerations.length - 1].lessonCount
        } else {
          results.summary.failedGenerations++
        }

        console.log(`    ✅ Teacher ${teacher.name}: ${teacherResult.success ? 'SUCCESS' : 'FAILED'}`)
      } catch (error) {
        console.error(`    ❌ Teacher ${teacher.name} generation failed:`, error)
        results.teacherGenerations.push({
          teacherId: teacher.id,
          teacherName: teacher.name,
          email: teacher.email,
          role: teacher.role,
          success: false,
          conflicts: [{ type: 'error', message: 'Generation failed' }],
          lessonCount: 0
        })
        results.summary.failedGenerations++
      }
    }

    console.log('🎉 Bulk generation completed!')
    console.log(`📊 Summary: ${results.summary.successfulGenerations} successful, ${results.summary.failedGenerations} failed, ${results.summary.totalLessons} total lessons`)

    return NextResponse.json({
      success: results.summary.failedGenerations === 0,
      results,
      message: `Bulk generation completed: ${results.summary.successfulGenerations} successful, ${results.summary.failedGenerations} failed`
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

// Helper function to get lesson count for a class
async function getClassLessonCount(classId: string): Promise<number> {
  const count = await db.timetable.count({
    where: { classId }
  })
  return count
}

// Helper function to get lesson count for a teacher
async function getTeacherLessonCount(teacherId: string): Promise<number> {
  const count = await db.timetable.count({
    where: { teacherId }
  })
  return count
}

// Helper function to generate timetable for a specific teacher
async function generateTimetableForTeacher(schoolId: string, teacherId: string, options: { regenerate?: boolean } = {}) {
  // For teachers, we need to generate timetables for all their assigned classes
  // This is a simplified version - in practice, teacher timetables are derived from class timetables

  try {
    // Get all classes this teacher is assigned to
    const teacherAssignments = await db.teacherClassSubject.findMany({
      where: { teacherId },
      select: { classId: true },
      distinct: ['classId']
    })

    const trainerAssignments = await db.trainerClassModule.findMany({
      where: { trainerId: teacherId },
      select: { classId: true },
      distinct: ['classId']
    })

    const classIds = Array.from(new Set([
      ...teacherAssignments.map((a: any) => a.classId),
      ...trainerAssignments.map((a: any) => a.classId)
    ]))

    // Generate timetables for each class this teacher is assigned to
    const results = []
    for (const classId of classIds) {
      const result = await generateTimetableForClass(schoolId, classId, options)
      results.push(result)
    }

    // Return success if at least one class generation succeeded
    const success = results.some(r => r.success)
    const allConflicts = results.flatMap(r => r.conflicts)

    return {
      success,
      conflicts: allConflicts
    }

  } catch (error) {
    console.error(`Teacher timetable generation failed for ${teacherId}:`, error)
    return {
      success: false,
      conflicts: [{ type: 'error', message: 'Teacher timetable generation failed' }]
    }
  }
}