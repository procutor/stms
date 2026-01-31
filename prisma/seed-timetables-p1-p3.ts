import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Time slots configuration
const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']

// Subjects with periods per week (totaling 50 periods)
const SUBJECTS = [
  { name: 'Mathematics', code: 'MATH', periodsPerWeek: 10, difficulty: 'HIGH' },
  { name: 'English', code: 'ENG', periodsPerWeek: 8, difficulty: 'MEDIUM' },
  { name: 'Kinyarwanda', code: 'KIN', periodsPerWeek: 6, difficulty: 'MEDIUM' },
  { name: 'Science', code: 'SCI', periodsPerWeek: 8, difficulty: 'HIGH' },
  { name: 'Social Studies', code: 'SS', periodsPerWeek: 6, difficulty: 'LOW' },
  { name: 'Physical Education', code: 'PE', periodsPerWeek: 4, difficulty: 'LOW' },
  { name: 'Art & Craft', code: 'ART', periodsPerWeek: 4, difficulty: 'LOW' },
  { name: 'Religious Education', code: 'RE', periodsPerWeek: 4, difficulty: 'LOW' },
]

// Teachers to create
const TEACHERS = [
  { name: 'Mr. Jean Baptiste', email: 'jean@greenwood.edu', subjects: ['MATH', 'SCI'] },
  { name: 'Mrs. Marie Claire', email: 'marie@greenwood.edu', subjects: ['ENG', 'ART'] },
  { name: 'Mr. Paul Kagame', email: 'paul@greenwood.edu', subjects: ['KIN', 'SS'] },
  { name: 'Ms. Sarah Williams', email: 'sarah@greenwood.edu', subjects: ['MATH', 'PE'] },
  { name: 'Mr. John Doe', email: 'john@greenwood.edu', subjects: ['SCI', 'RE'] },
  { name: 'Mrs. Grace Ninger', email: 'grace@greenwood.edu', subjects: ['ENG', 'SS'] },
]

// Classes with streams
const CLASSES = [
  { level: 'P1', streams: ['A', 'B', 'C'] },
  { level: 'P2', streams: ['A', 'B', 'C'] },
  { level: 'P3', streams: ['A', 'B', 'C'] },
]

async function main() {
  console.log('🌱 Seeding timetables for P1-P3...\n')

  // Get or create Greenwood Primary School
  const school = await prisma.school.upsert({
    where: { email: 'admin@greenwoodprimary.edu' },
    update: {},
    create: {
      name: 'Greenwood Primary School',
      type: 'PRIMARY',
      email: 'admin@greenwoodprimary.edu',
      phone: '+1234567890',
      address: '123 Education Street, Learning City',
      status: 'APPROVED',
      approvedAt: new Date(),
    },
  })

  console.log(`✅ School: ${school.name} (${school.id})`)

  // Create teachers
  const createdTeachers: any[] = []
  for (const teacherData of TEACHERS) {
    const password = await bcrypt.hash('password123', 12)
    const teacher = await prisma.user.upsert({
      where: { email: teacherData.email },
      update: {},
      create: {
        name: teacherData.name,
        email: teacherData.email,
        password,
        role: 'TEACHER',
        schoolId: school.id,
        isActive: true,
        maxWeeklyHours: 40,
      },
    })
    createdTeachers.push({ ...teacher, subjects: teacherData.subjects })
    console.log(`✅ Teacher: ${teacher.name}`)
  }

  // Create subjects
  const createdSubjects: any[] = []
  for (const subjectData of SUBJECTS) {
    const subject = await prisma.subject.upsert({
      where: {
        schoolId_name_level: {
          schoolId: school.id,
          name: subjectData.name,
          level: '',
        },
      },
      update: {},
      create: {
        name: subjectData.name,
        code: subjectData.code,
        level: '',
        periodsPerWeek: subjectData.periodsPerWeek,
        schoolId: school.id,
      },
    })
    createdSubjects.push({ ...subject, difficulty: subjectData.difficulty })
    console.log(`✅ Subject: ${subject.name} (${subject.periodsPerWeek} periods/week)`)
  }

  // Create classes with streams
  const createdClasses: any[] = []
  for (const classData of CLASSES) {
    for (const stream of classData.streams) {
      const className = `${classData.level} ${stream}`
      const cls = await prisma.class.upsert({
        where: {
          schoolId_level_stream: {
            schoolId: school.id,
            level: classData.level,
            stream: stream,
          },
        },
        update: {},
        create: {
          name: className,
          level: classData.level,
          stream: stream,
          schoolId: school.id,
        },
      })
      createdClasses.push(cls)
      console.log(`✅ Class: ${cls.name}`)
    }
  }

  // Assign subjects to teachers
  for (const teacher of createdTeachers) {
    for (const subjectCode of teacher.subjects) {
      const subject = createdSubjects.find((s) => s.code === subjectCode)
      if (subject) {
        await prisma.teacherSubject.upsert({
          where: {
            teacherId_subjectId: {
              teacherId: teacher.id,
              subjectId: subject.id,
            },
          },
          update: {},
          create: {
            teacherId: teacher.id,
            subjectId: subject.id,
          },
        })
      }
    }
  }
  console.log('✅ Teacher-Subject assignments created')

  // Assign teachers to classes
  let assignmentCount = 0
  for (const cls of createdClasses) {
    for (const subject of createdSubjects) {
      const teacher = createdTeachers.find((t) => t.subjects.includes(subject.code))
      if (teacher) {
        const existing = await prisma.teacherClassSubject.findFirst({
          where: {
            schoolId: school.id,
            classId: cls.id,
            teacherId: teacher.id,
            subjectId: subject.id,
          },
        })

        if (!existing) {
          await prisma.teacherClassSubject.create({
            data: {
              schoolId: school.id,
              classId: cls.id,
              teacherId: teacher.id,
              subjectId: subject.id,
            },
          })
          assignmentCount++
        }
      }
    }
  }
  console.log(`✅ Teacher-Class-Subject assignments created (${assignmentCount} total)`)

  // Create time slots
  const periodStructure = [
    { period: 1, start: '07:40', end: '08:20', session: 'MORNING', isBreak: false },
    { period: 2, start: '08:20', end: '09:00', session: 'MORNING', isBreak: false },
    { period: 3, start: '09:00', end: '09:40', session: 'MORNING', isBreak: false },
    { period: -1, start: '09:40', end: '10:00', session: 'MORNING', isBreak: true, breakType: 'MORNING_BREAK' },
    { period: 4, start: '10:00', end: '10:40', session: 'MORNING', isBreak: false },
    { period: 5, start: '10:40', end: '11:20', session: 'MORNING', isBreak: false },
    { period: -2, start: '11:20', end: '12:20', session: 'AFTERNOON', isBreak: true, breakType: 'LUNCH_BREAK' },
    { period: 6, start: '12:20', end: '13:00', session: 'AFTERNOON', isBreak: false },
    { period: 7, start: '13:00', end: '13:40', session: 'AFTERNOON', isBreak: false },
    { period: 8, start: '13:40', end: '14:20', session: 'AFTERNOON', isBreak: false },
    { period: -3, start: '14:20', end: '14:30', session: 'AFTERNOON', isBreak: true, breakType: 'AFTERNOON_BREAK' },
    { period: 9, start: '14:30', end: '15:10', session: 'AFTERNOON', isBreak: false },
    { period: 10, start: '15:10', end: '15:50', session: 'AFTERNOON', isBreak: false },
  ]

  await prisma.timeSlot.deleteMany({ where: { schoolId: school.id } })

  const timeSlots: any[] = []
  for (const day of DAYS) {
    for (const periodData of periodStructure) {
      const [startHour, startMin] = periodData.start.split(':').map(Number)
      const [endHour, endMin] = periodData.end.split(':').map(Number)

      const startTime = new Date()
      startTime.setHours(startHour, startMin, 0, 0)

      const endTime = new Date()
      endTime.setHours(endHour, endMin, 0, 0)

      timeSlots.push({
        day,
        period: periodData.period,
        startTime,
        endTime,
        schoolId: school.id,
        name: periodData.isBreak ? periodData.breakType! : `Period ${periodData.period}`,
        session: periodData.session,
        isBreak: periodData.isBreak,
        breakType: periodData.breakType || null,
      })
    }
  }

  await prisma.timeSlot.createMany({ data: timeSlots })
  console.log(`✅ Time slots created (${timeSlots.length} slots)`)

  // Clear existing timetables
  await prisma.timetable.deleteMany({ where: { schoolId: school.id } })
  console.log('✅ Cleared existing timetables')

  // Generate timetables
  console.log('\n📅 Generating timetables...\n')

  const allTimeSlots = await prisma.timeSlot.findMany({
    where: { schoolId: school.id, isBreak: false },
    orderBy: [{ day: 'asc' }, { period: 'asc' }],
  })

  const morningSlots = allTimeSlots.filter((ts) => ts.session === 'MORNING')
  const afternoonSlots = allTimeSlots.filter((ts) => ts.session === 'AFTERNOON')

  console.log(`Teaching slots: ${morningSlots.length} morning, ${afternoonSlots.length} afternoon`)

  const teacherSchedule: Record<string, Set<string>> = {}
  createdTeachers.forEach((t) => {
    teacherSchedule[t.id] = new Set()
  })

  for (const cls of createdClasses) {
    console.log(`\n📋 Generating timetable for ${cls.name}...`)

    const classAssignments = await prisma.teacherClassSubject.findMany({
      where: { classId: cls.id },
      include: { subject: true, teacher: true },
    })

    const lessons: any[] = []
    for (const assignment of classAssignments) {
      const subjectPeriods = assignment.subject.periodsPerWeek
      const difficulty = createdSubjects.find((s) => s.id === assignment.subjectId)?.difficulty || 'MEDIUM'

      const morningCount = Math.floor(subjectPeriods / 2)
      const afternoonCount = subjectPeriods - morningCount

      for (let i = 0; i < morningCount; i++) {
        lessons.push({
          assignmentId: assignment.id,
          subjectId: assignment.subjectId,
          teacherId: assignment.teacherId,
          classId: cls.id,
          difficulty,
          session: 'MORNING',
        })
      }
      for (let i = 0; i < afternoonCount; i++) {
        lessons.push({
          assignmentId: assignment.id,
          subjectId: assignment.subjectId,
          teacherId: assignment.teacherId,
          classId: cls.id,
          difficulty,
          session: 'AFTERNOON',
        })
      }
    }

    shuffleArray(lessons)

    const classSchedule = new Set<string>()
    let scheduledCount = 0

    for (const lesson of lessons) {
      const slots = lesson.session === 'MORNING' ? morningSlots : afternoonSlots
      const availableSlots = slots.filter(
        (slot) => !classSchedule.has(`${slot.day}-${slot.period}`)
      )

      if (availableSlots.length > 0) {
        const conflictFreeSlots = availableSlots.filter(
          (slot) => !teacherSchedule[lesson.teacherId].has(`${slot.day}-${slot.period}`)
        )

        const chosenSlot = conflictFreeSlots.length > 0
          ? conflictFreeSlots[Math.floor(Math.random() * conflictFreeSlots.length)]
          : availableSlots[Math.floor(Math.random() * availableSlots.length)]

        await prisma.timetable.create({
          data: {
            schoolId: school.id,
            classId: lesson.classId,
            teacherId: lesson.teacherId,
            subjectId: lesson.subjectId,
            timeSlotId: chosenSlot.id,
          },
        })

        classSchedule.add(`${chosenSlot.day}-${chosenSlot.period}`)
        teacherSchedule[lesson.teacherId].add(`${chosenSlot.day}-${chosenSlot.period}`)
        scheduledCount++
      }
    }

    console.log(`✅ ${cls.name}: ${scheduledCount} periods scheduled`)
  }

  // Validate no conflicts
  console.log('\n🔍 Validating teacher conflicts...')

  let totalEntries = 0
  let conflictCount = 0

  for (const teacher of createdTeachers) {
    const teacherTimetables = await prisma.timetable.findMany({
      where: { teacherId: teacher.id },
      include: { timeSlot: true },
    })

    const slotUsage: Record<string, number> = {}
    for (const tt of teacherTimetables) {
      const key = `${tt.timeSlot.day}-${tt.timeSlot.period}`
      slotUsage[key] = (slotUsage[key] || 0) + 1
    }

    const conflicts = Object.values(slotUsage).filter((count) => count > 1).length
    if (conflicts > 0) {
      console.log(`⚠️ ${teacher.name}: ${conflicts} conflict(s) detected`)
      conflictCount += conflicts
    }
    totalEntries += teacherTimetables.length
  }

  console.log(`\n✅ Validation: ${totalEntries} entries, ${conflictCount} conflicts`)

  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 SUMMARY')
  console.log('='.repeat(50))
  console.log(`School: ${school.name}`)
  console.log(`Classes: ${createdClasses.length} (P1 A-C, P2 A-C, P3 A-C)`)
  console.log(`Teachers: ${createdTeachers.length}`)
  console.log(`Subjects: ${createdSubjects.length}`)
  console.log(`Periods per class: 50/week (25 morning, 25 afternoon)`)
  console.log(`Total timetable entries: ${totalEntries}`)
  console.log('='.repeat(50))

  console.log('\n📧 Teacher login credentials:')
  for (const teacher of createdTeachers) {
    console.log(`  ${teacher.name}: ${teacher.email} / password123`)
  }

  console.log('\n🎉 Timetable generation completed!')
}

function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
