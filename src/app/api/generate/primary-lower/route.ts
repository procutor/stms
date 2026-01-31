import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// Period structure for Primary Lower (P1-P10) - ALL IN MORNING SHIFT (8:00-11:40)
const PERIOD_STRUCTURE = [
  { period: 1, start: '08:00', end: '08:40', session: 'MORNING' },
  { period: 2, start: '08:40', end: '09:20', session: 'MORNING' },
  { period: 3, start: '09:20', end: '10:00', session: 'MORNING' },
  { period: 4, start: '10:20', end: '11:00', session: 'MORNING' },
  { period: 5, start: '11:00', end: '11:40', session: 'MORNING' },
  // Afternoon periods now also in morning shift for Primary Lower
  { period: 6, start: '08:00', end: '08:40', session: 'MORNING' },
  { period: 7, start: '08:40', end: '09:20', session: 'MORNING' },
  { period: 8, start: '09:20', end: '10:00', session: 'MORNING' },
  { period: 9, start: '10:20', end: '11:00', session: 'MORNING' },
  { period: 10, start: '11:00', end: '11:40', session: 'MORNING' }
]

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. School Admin access required.' },
        { status: 401 }
      )
    }

    const schoolId = session.user.schoolId
    if (!schoolId) {
      return NextResponse.json(
        { error: 'No school assigned to this admin' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { classLevels, classStreams, action } = body

    // Validate inputs
    if (!classLevels || classLevels.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one class level (P1, P2, or P3)' },
        { status: 400 }
      )
    }

    // Get school
    const school = await db.school.findUnique({
      where: { id: schoolId }
    })

    if (!school || school.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'School not approved or not found' },
        { status: 403 }
      )
    }

    const isDoubleShift = (school as any).isDoubleShift || false

    // Get classes based on selected levels and streams
    const classes: any[] = []
    for (const level of classLevels) {
      const streams = classStreams && classStreams.length > 0 
        ? classStreams.map((s: string) => s.replace(/[^A-Z]/g, '')) 
        : ['A', 'B', 'C']
      
      for (const stream of streams) {
        const cls = await db.class.findFirst({
          where: {
            schoolId: schoolId,
            level: level,
            stream: stream
          }
        })
        if (cls) {
          classes.push(cls)
        }
      }
    }

    if (classes.length === 0) {
      return NextResponse.json(
        { error: 'No classes found for the selected levels. Please create classes first.' },
        { status: 400 }
      )
    }

    // Get teacher-class-subject assignments for these classes
    const classIds = classes.map(c => c.id)
    const teacherClassSubjects = await db.teacherClassSubject.findMany({
      where: {
        classId: { in: classIds }
      },
      include: {
        subject: true,
        teacher: true
      }
    })

    if (teacherClassSubjects.length === 0) {
      return NextResponse.json(
        { 
          error: 'No subjects assigned to these classes. Please assign subjects and teachers to classes first using "Class Assignments".',
          hint: 'Go to Class Assignments page and add subject-teacher-class assignments'
        },
        { status: 400 }
      )
    }

    // Group assignments by class
    const classAssignments = new Map<string, { class: any; assignments: any[] }>()
    for (const cls of classes) {
      const assignments = teacherClassSubjects.filter(tcs => tcs.classId === cls.id)
      if (assignments.length > 0) {
        classAssignments.set(cls.id, {
          class: cls,
          assignments: assignments
        })
      }
    }

    // Get time slots if needed
    const existingSlots = await db.timeSlot.findMany({
      where: { schoolId: schoolId }
    })

    if (existingSlots.length === 0) {
      const timeSlots = []
      
      for (const day of DAYS) {
        for (const period of PERIOD_STRUCTURE) {
          const [startHour, startMin] = period.start.split(':').map(Number)
          const [endHour, endMin] = period.end.split(':').map(Number)
          
          const startTime = new Date()
          startTime.setHours(startHour, startMin, 0)
          
          const endTime = new Date()
          endTime.setHours(endHour, endMin, 0)
          
          timeSlots.push({
            day: day,
            period: period.period,
            startTime: startTime,
            endTime: endTime,
            name: `P${period.period}`,
            session: period.session,
            isBreak: false,
            breakType: null,
            schoolId: schoolId,
            isActive: true
          })
        }
      }
      
      await db.timeSlot.createMany({ data: timeSlots })
    }

    // For preview action, generate temporary timetables without saving
    if (action === 'preview') {
      const previewTimetables = await generateTimetablesPreview(
        classAssignments,
        schoolId,
        isDoubleShift
      )
      
      return NextResponse.json({
        success: true,
        message: isDoubleShift 
          ? 'Double-shift timetables generated successfully (preview mode)'
          : 'Timetables generated successfully (preview mode)',
        timetables: previewTimetables,
        isDoubleShift: isDoubleShift,
        action: 'preview'
      })
    }

    // For generate action, save timetables to database
    if (action === 'generate') {
      // Clear existing timetables for these classes
      await db.timetable.deleteMany({
        where: {
          schoolId: schoolId,
          classId: { in: classIds }
        }
      })

      // Generate and save timetables
      const result = await generateAndSaveTimetables(
        classAssignments,
        schoolId,
        isDoubleShift
      )

      return NextResponse.json({
        success: result.success,
        message: result.success 
          ? (isDoubleShift 
              ? `Double-shift timetables generated successfully for ${classAssignments.size} classes`
              : `Timetables generated successfully for ${classAssignments.size} classes`)
          : 'Timetable generation completed with some issues',
        conflicts: result.conflicts,
        conflictCount: result.conflicts.length,
        classesGenerated: classAssignments.size,
        totalSlots: result.totalSlots,
        isDoubleShift: isDoubleShift,
        action: 'generate'
      })
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "preview" or "generate".' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Primary Lower Timetable Generation Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Interface for timetable slot
interface TimetableSlot {
  day: string
  period: number
  startTime: Date
  endTime: Date
  subject: string
  subjectId: string
  teacher: string
  teacherId: string
  session: string
  shift?: 'MORNING' | 'AFTERNOON'
}

// Interface for preview timetable
interface PreviewTimetable {
  classId: string
  className: string
  classLevel: string
  stream: string
  shift?: 'MORNING' | 'AFTERNOON' | 'BOTH'
  slots: TimetableSlot[]
}

// Helper function to generate preview timetables
async function generateTimetablesPreview(
  classAssignments: Map<string, { class: any; assignments: any[] }>, 
  schoolId: string,
  isDoubleShift: boolean
): Promise<PreviewTimetable[]> {
  const teacherSchedule = new Map<string, Set<string>>()
  const classSchedule = new Map<string, Set<string>>()
  const timetables: PreviewTimetable[] = []

  // Initialize schedules for each class
  classAssignments.forEach((data, classId) => {
    classSchedule.set(classId, new Set<string>())
    
    if (isDoubleShift) {
      // Create separate timetables for morning and afternoon shifts
      timetables.push({
        classId: classId,
        className: data.class.name,
        classLevel: data.class.level,
        stream: data.class.stream,
        shift: 'MORNING',
        slots: []
      })
      timetables.push({
        classId: classId,
        className: data.class.name,
        classLevel: data.class.level,
        stream: data.class.stream,
        shift: 'AFTERNOON',
        slots: []
      })
    } else {
      // Single timetable for non-double-shift schools
      timetables.push({
        classId: classId,
        className: data.class.name,
        classLevel: data.class.level,
        stream: data.class.stream,
        shift: undefined,
        slots: []
      })
    }
  })

  // Initialize teacher schedules from assignments
  classAssignments.forEach((data) => {
    for (const assignment of data.assignments) {
      if (!teacherSchedule.has(assignment.teacherId)) {
        teacherSchedule.set(assignment.teacherId, new Set<string>())
      }
    }
  })

  // Get time slots
  const timeSlots = await db.timeSlot.findMany({
    where: {
      schoolId: schoolId,
      isActive: true,
      period: { gte: 1, lte: 10 }
    },
    orderBy: [
      { day: 'asc' },
      { period: 'asc' }
    ]
  })

  const morningSlots = timeSlots.filter(ts => ts.period <= 5)
  const afternoonSlots = timeSlots.filter(ts => ts.period > 5)

  if (isDoubleShift) {
    // Double-shift generation with subject mirroring - SEPARATE TIMETABLES FOR EACH SHIFT
    classAssignments.forEach((data, clsId) => {
      const cls = data.class
      const assignments = data.assignments
      
      // Get morning and afternoon timetables for this class
      const morningTimetable = timetables.find(t => t.classId === clsId && t.shift === 'MORNING')
      const afternoonTimetable = timetables.find(t => t.classId === clsId && t.shift === 'AFTERNOON')
      
      if (!morningTimetable || !afternoonTimetable) return
      
      // For each assignment, mirror subjects between morning and afternoon
      for (const assignment of assignments) {
        const subject = assignment.subject
        const teacher = assignment.teacher
        
        // All periods in morning shift - use all periodsPerWeek slots
        const periodsNeeded = subject.periodsPerWeek || 2

        // Assign all periods in morning shift
        for (let i = 0; i < periodsNeeded; i++) {
          const shuffledMorning = [...morningSlots].sort(() => Math.random() - 0.5)
          
          for (const slot of shuffledMorning) {
            const slotKey = `${slot.day}-${slot.period}`
            const teacherKey = `${teacher.id}-${slotKey}`
            
            if (!teacherSchedule.get(teacher.id)?.has(teacherKey) &&
                !classSchedule.get(clsId)?.has(slotKey)) {
              
              teacherSchedule.get(teacher.id)?.add(teacherKey)
              classSchedule.get(clsId)?.add(slotKey)
              
              morningTimetable.slots.push({
                day: slot.day,
                period: slot.period,
                startTime: slot.startTime,
                endTime: slot.endTime,
                subject: subject.name,
                subjectId: subject.id,
                teacher: teacher.name,
                teacherId: teacher.id,
                session: slot.session,
                shift: 'MORNING'
              })
              break
            }
          }
        }
      }

      // Sort slots by day and period
      morningTimetable.slots.sort((a: TimetableSlot, b: TimetableSlot) => {
        if (a.day !== b.day) return a.day.localeCompare(b.day)
        return a.period - b.period
      })
    })
  } else {
    // Non-double-shift generation (original logic)
    classAssignments.forEach((data, clsId) => {
      const cls = data.class
      const assignments = data.assignments
      const timetable = timetables.find(t => t.classId === clsId)
      
      if (!timetable) return
      
      for (const assignment of assignments) {
        const subject = assignment.subject
        const teacher = assignment.teacher
        
        const periodsNeeded = subject.periodsPerWeek || 2
        const morningCount = Math.floor(periodsNeeded / 2)
        const afternoonCount = periodsNeeded - morningCount

        // Assign morning periods
        for (let i = 0; i < morningCount; i++) {
          const shuffledMorning = [...morningSlots].sort(() => Math.random() - 0.5)
          
          for (const slot of shuffledMorning) {
            const slotKey = `${slot.day}-${slot.period}`
            const teacherKey = `${teacher.id}-${slotKey}`
            
            if (!teacherSchedule.get(teacher.id)?.has(teacherKey) &&
                !classSchedule.get(clsId)?.has(slotKey)) {
              
              teacherSchedule.get(teacher.id)?.add(teacherKey)
              classSchedule.get(clsId)?.add(slotKey)
              
              timetable.slots.push({
                day: slot.day,
                period: slot.period,
                startTime: slot.startTime,
                endTime: slot.endTime,
                subject: subject.name,
                subjectId: subject.id,
                teacher: teacher.name,
                teacherId: teacher.id,
                session: slot.session
              })
              break
            }
          }
        }

        // Assign afternoon periods
        for (let i = 0; i < afternoonCount; i++) {
          const shuffledAfternoon = [...afternoonSlots].sort(() => Math.random() - 0.5)
          
          for (const slot of shuffledAfternoon) {
            const slotKey = `${slot.day}-${slot.period}`
            const teacherKey = `${teacher.id}-${slotKey}`
            
            if (!teacherSchedule.get(teacher.id)?.has(teacherKey) &&
                !classSchedule.get(clsId)?.has(slotKey)) {
              
              teacherSchedule.get(teacher.id)?.add(teacherKey)
              classSchedule.get(clsId)?.add(slotKey)
              
              timetable.slots.push({
                day: slot.day,
                period: slot.period,
                startTime: slot.startTime,
                endTime: slot.endTime,
                subject: subject.name,
                subjectId: subject.id,
                teacher: teacher.name,
                teacherId: teacher.id,
                session: slot.session
              })
              break
            }
          }
        }
      }

      // Sort slots by day and period
      timetable.slots.sort((a: TimetableSlot, b: TimetableSlot) => {
        if (a.day !== b.day) return a.day.localeCompare(b.day)
        return a.period - b.period
      })
    })
  }

  return timetables
}

// Result interface for generateAndSaveTimetables
interface GenerationResult {
  success: boolean
  conflicts: any[]
  totalSlots: number
}

// Helper function to generate and save timetables
async function generateAndSaveTimetables(
  classAssignments: Map<string, { class: any; assignments: any[] }>, 
  schoolId: string,
  isDoubleShift: boolean
): Promise<GenerationResult> {
  const conflicts: any[] = []
  const teacherSchedule = new Map<string, Set<string>>()
  const classSchedule = new Map<string, Set<string>>()
  let totalSlots = 0

  // Initialize schedules
  classAssignments.forEach((_, classId) => {
    classSchedule.set(classId, new Set<string>())
  })

  classAssignments.forEach((data) => {
    for (const assignment of data.assignments) {
      if (!teacherSchedule.has(assignment.teacherId)) {
        teacherSchedule.set(assignment.teacherId, new Set<string>())
      }
    }
  })

  // Get time slots
  const timeSlots = await db.timeSlot.findMany({
    where: {
      schoolId: schoolId,
      isActive: true,
      period: { gte: 1, lte: 10 }
    },
    orderBy: [
      { day: 'asc' },
      { period: 'asc' }
    ]
  })

  const morningSlots = timeSlots.filter(ts => ts.period <= 5)
  const afternoonSlots = timeSlots.filter(ts => ts.period > 5)

  if (isDoubleShift) {
    // Double-shift generation with subject mirroring
    classAssignments.forEach((data, clsId) => {
      const cls = data.class
      const assignments = data.assignments
      
      for (const assignment of assignments) {
        const subject = assignment.subject
        const teacher = assignment.teacher
        
        const periodsNeeded = subject.periodsPerWeek || 2
        const morningCount = Math.floor(periodsNeeded / 2)
        const afternoonCount = periodsNeeded - morningCount

        // Morning periods
        for (let i = 0; i < morningCount; i++) {
          const shuffledMorning = [...morningSlots].sort(() => Math.random() - 0.5)
          
          for (const slot of shuffledMorning) {
            const slotKey = `${slot.day}-${slot.period}`
            const teacherKey = `${teacher.id}-${slotKey}`
            
            if (!teacherSchedule.get(teacher.id)?.has(teacherKey) &&
                !classSchedule.get(clsId)?.has(slotKey)) {
              
              teacherSchedule.get(teacher.id)?.add(teacherKey)
              classSchedule.get(clsId)?.add(slotKey)
              
              try {
                db.timetable.create({
                  data: {
                    schoolId: schoolId,
                    classId: cls.id,
                    teacherId: teacher.id,
                    subjectId: subject.id,
                    timeSlotId: slot.id
                  }
                })
                totalSlots++
              } catch (e) {
                // Ignore duplicate entries
              }
              break
            }
          }
        }

        // Afternoon periods (mirrored)
        for (let i = 0; i < afternoonCount; i++) {
          const shuffledAfternoon = [...afternoonSlots].sort(() => Math.random() - 0.5)
          
          for (const slot of shuffledAfternoon) {
            const slotKey = `${slot.day}-${slot.period}`
            const teacherKey = `${teacher.id}-${slotKey}`
            
            if (!teacherSchedule.get(teacher.id)?.has(teacherKey) &&
                !classSchedule.get(clsId)?.has(slotKey)) {
              
              teacherSchedule.get(teacher.id)?.add(teacherKey)
              classSchedule.get(clsId)?.add(slotKey)
              
              try {
                db.timetable.create({
                  data: {
                    schoolId: schoolId,
                    classId: cls.id,
                    teacherId: teacher.id,
                    subjectId: subject.id,
                    timeSlotId: slot.id
                  }
                })
                totalSlots++
              } catch (e) {
                // Ignore duplicate entries
              }
              break
            }
          }
        }
      }
    })
  } else {
    // Non-double-shift generation
    classAssignments.forEach((data, clsId) => {
      const cls = data.class
      const assignments = data.assignments
      
      for (const assignment of assignments) {
        const subject = assignment.subject
        const teacher = assignment.teacher
        
        const periodsNeeded = subject.periodsPerWeek || 2
        const morningCount = Math.floor(periodsNeeded / 2)
        const afternoonCount = periodsNeeded - morningCount

        // Morning periods
        for (let i = 0; i < morningCount; i++) {
          const shuffledMorning = [...morningSlots].sort(() => Math.random() - 0.5)
          
          for (const slot of shuffledMorning) {
            const slotKey = `${slot.day}-${slot.period}`
            const teacherKey = `${teacher.id}-${slotKey}`
            
            if (!teacherSchedule.get(teacher.id)?.has(teacherKey) &&
                !classSchedule.get(clsId)?.has(slotKey)) {
              
              teacherSchedule.get(teacher.id)?.add(teacherKey)
              classSchedule.get(clsId)?.add(slotKey)
              
              try {
                db.timetable.create({
                  data: {
                    schoolId: schoolId,
                    classId: cls.id,
                    teacherId: teacher.id,
                    subjectId: subject.id,
                    timeSlotId: slot.id
                  }
                })
                totalSlots++
              } catch (e) {
                // Ignore duplicate entries
              }
              break
            }
          }
        }

        // Afternoon periods
        for (let i = 0; i < afternoonCount; i++) {
          const shuffledAfternoon = [...afternoonSlots].sort(() => Math.random() - 0.5)
          
          for (const slot of shuffledAfternoon) {
            const slotKey = `${slot.day}-${slot.period}`
            const teacherKey = `${teacher.id}-${slotKey}`
            
            if (!teacherSchedule.get(teacher.id)?.has(teacherKey) &&
                !classSchedule.get(clsId)?.has(slotKey)) {
              
              teacherSchedule.get(teacher.id)?.add(teacherKey)
              classSchedule.get(clsId)?.add(slotKey)
              
              try {
                db.timetable.create({
                  data: {
                    schoolId: schoolId,
                    classId: cls.id,
                    teacherId: teacher.id,
                    subjectId: subject.id,
                    timeSlotId: slot.id
                  }
                })
                totalSlots++
              } catch (e) {
                // Ignore duplicate entries
              }
              break
            }
          }
        }
      }
    })
  }

  return {
    success: conflicts.length === 0,
    conflicts: conflicts,
    totalSlots: totalSlots
  }
}
