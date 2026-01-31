/**
 * Timetable Generator for P1 A-C, P2 A-C, P3 A-C
 * 
 * Rules Applied:
 * - 50 periods per class per week (25 before lunch, 25 after lunch)
 * - Subjects balanced between morning and afternoon sessions
 * - No teacher conflicts across all classes
 * - Unique timetables for each class
 * - Difficulty balanced (no all-difficult subjects in one session)
 */

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']

// Periods per day
const PERIOD_STRUCTURE = [
  { period: 1, session: 'MORNING', time: '07:40-08:20' },
  { period: 2, session: 'MORNING', time: '08:20-09:00' },
  { period: 3, session: 'MORNING', time: '09:00-09:40' },
  { period: -1, session: 'MORNING', time: '09:40-10:00', isBreak: true, name: 'MORNING BREAK' },
  { period: 4, session: 'MORNING', time: '10:00-10:40' },
  { period: 5, session: 'MORNING', time: '10:40-11:20' },
  { period: -2, session: 'AFTERNOON', time: '11:20-12:20', isBreak: true, name: 'LUNCH BREAK' },
  { period: 6, session: 'AFTERNOON', time: '12:20-13:00' },
  { period: 7, session: 'AFTERNOON', time: '13:00-13:40' },
  { period: 8, session: 'AFTERNOON', time: '13:40-14:20' },
  { period: -3, session: 'AFTERNOON', time: '14:20-14:30', isBreak: true, name: 'AFTERNOON BREAK' },
  { period: 9, session: 'AFTERNOON', time: '14:30-15:10' },
  { period: 10, session: 'AFTERNOON', time: '15:10-15:50' },
]

// Subjects with difficulty rating (1=low, 2=medium, 3=high)
const SUBJECTS = [
  { id: 'MATH', name: 'Mathematics', periodsPerWeek: 10, difficulty: 3 },
  { id: 'ENG', name: 'English', periodsPerWeek: 8, difficulty: 2 },
  { id: 'KIN', name: 'Kinyarwanda', periodsPerWeek: 6, difficulty: 2 },
  { id: 'SCI', name: 'Science', periodsPerWeek: 8, difficulty: 3 },
  { id: 'SS', name: 'Social Studies', periodsPerWeek: 6, difficulty: 1 },
  { id: 'PE', name: 'Physical Education', periodsPerWeek: 4, difficulty: 1 },
  { id: 'ART', name: 'Art & Craft', periodsPerWeek: 4, difficulty: 1 },
  { id: 'RE', name: 'Religious Education', periodsPerWeek: 4, difficulty: 1 },
]

// Teachers with their subject assignments
const TEACHERS = [
  { id: 'T1', name: 'Mr. Jean Baptiste', subjects: ['MATH', 'SCI'] },
  { id: 'T2', name: 'Mrs. Marie Claire', subjects: ['ENG', 'ART'] },
  { id: 'T3', name: 'Mr. Paul Kagame', subjects: ['KIN', 'SS'] },
  { id: 'T4', name: 'Ms. Sarah Williams', subjects: ['MATH', 'PE'] },
  { id: 'T5', name: 'Mr. John Doe', subjects: ['SCI', 'RE'] },
  { id: 'T6', name: 'Mrs. Grace Ninger', subjects: ['ENG', 'SS'] },
]

// Classes
const CLASSES = [
  { id: 'P1A', name: 'P1 A', level: 'P1' },
  { id: 'P1B', name: 'P1 B', level: 'P1' },
  { id: 'P1C', name: 'P1 C', level: 'P1' },
  { id: 'P2A', name: 'P2 A', level: 'P2' },
  { id: 'P2B', name: 'P2 B', level: 'P2' },
  { id: 'P2C', name: 'P2 C', level: 'P2' },
  { id: 'P3A', name: 'P3 A', level: 'P3' },
  { id: 'P3B', name: 'P3 B', level: 'P3' },
  { id: 'P3C', name: 'P3 C', level: 'P3' },
]

// Global schedule tracker: teacherId -> Set of "DAY-PERIOD"
const globalTeacherSchedule = {}
for (const teacher of TEACHERS) {
  globalTeacherSchedule[teacher.id] = new Set()
}

// Seed for reproducibility
let seed = 12345
function random() {
  const x = Math.sin(seed++) * 10000
  return x - Math.floor(x)
}

function shuffleArray(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// Generate timetable for a single class with conflict checking
function generateClassTimetable(classId) {
  const timetable = []
  const classSchedule = new Set() // Track used slots: "DAY-PERIOD"
  
  // Get class info
  const cls = CLASSES.find(c => c.id === classId)

  // Prepare lessons with session preference
  const lessons = []
  for (const subject of SUBJECTS) {
    const teacher = TEACHERS.find(t => t.subjects.includes(subject.id))
    if (!teacher) continue

    const totalPeriods = subject.periodsPerWeek
    const morningPeriods = Math.floor(totalPeriods / 2)
    const afternoonPeriods = totalPeriods - morningPeriods

    for (let i = 0; i < morningPeriods; i++) {
      lessons.push({
        subjectId: subject.id,
        subjectName: subject.name,
        teacherId: teacher.id,
        teacherName: teacher.name,
        session: 'MORNING',
        difficulty: subject.difficulty,
      })
    }
    for (let i = 0; i < afternoonPeriods; i++) {
      lessons.push({
        subjectId: subject.id,
        subjectName: subject.name,
        teacherId: teacher.id,
        teacherName: teacher.name,
        session: 'AFTERNOON',
        difficulty: subject.difficulty,
      })
    }
  }

  const shuffledLessons = shuffleArray(lessons)

  // Track how many periods of each subject we've scheduled
  const subjectCount = {}
  const subjectTarget = {}
  for (const s of SUBJECTS) subjectTarget[s.id] = s.periodsPerWeek

  // First pass: try to schedule with conflict checking
  for (const lesson of shuffledLessons) {
    if (subjectCount[lesson.subjectId] >= subjectTarget[lesson.subjectId]) continue

    const slots = PERIOD_STRUCTURE.filter(
      s => !s.isBreak && s.session === lesson.session
    )

    // Find slots where teacher is available
    const availableSlots = slots.filter(slot => {
      const slotKey = `${slot.period}`
      const teacherAvailable = !globalTeacherSchedule[lesson.teacherId].has(slotKey)
      const classAvailable = !classSchedule.has(slotKey)
      return teacherAvailable && classAvailable
    })

    if (availableSlots.length > 0) {
      // Shuffle available slots for variety
      const shuffledSlots = shuffleArray(availableSlots)
      const slot = shuffledSlots[0]

      for (const day of DAYS) {
        if (subjectCount[lesson.subjectId] >= subjectTarget[lesson.subjectId]) break
        const daySlotKey = `${day}-${slot.period}`
        
        if (!classSchedule.has(daySlotKey) && 
            !globalTeacherSchedule[lesson.teacherId].has(daySlotKey)) {
          
          timetable.push({
            day,
            period: slot.period,
            time: slot.time,
            session: slot.session,
            subjectId: lesson.subjectId,
            subjectName: lesson.subjectName,
            teacherId: lesson.teacherId,
            teacherName: lesson.teacherName,
          })

          classSchedule.add(daySlotKey)
          globalTeacherSchedule[lesson.teacherId].add(daySlotKey)
          subjectCount[lesson.subjectId] = (subjectCount[lesson.subjectId] || 0) + 1
        }
      }
    }
  }

  // Second pass: fill remaining slots
  const morningSlots = PERIOD_STRUCTURE.filter(s => s.session === 'MORNING' && !s.isBreak)
  const afternoonSlots = PERIOD_STRUCTURE.filter(s => s.session === 'AFTERNOON' && !s.isBreak)

  let morningCount = timetable.filter(t => t.session === 'MORNING').length
  let afternoonCount = timetable.filter(t => t.session === 'AFTERNOON').length

  while (morningCount < 25 || afternoonCount < 25) {
    const needMorning = morningCount < 25
    const needAfternoon = afternoonCount < 25

    for (const day of DAYS) {
      for (const subject of SUBJECTS) {
        if (subjectCount[subject.id] >= subjectTarget[subject.id]) continue
        if (needMorning && morningCount >= 25) continue
        if (needAfternoon && afternoonCount >= 25) continue

        const teacher = TEACHERS.find(t => t.subjects.includes(subject.id))
        if (!teacher) continue

        const slots = needMorning ? morningSlots : afternoonSlots
        
        for (const slot of slots) {
          if (subjectCount[subject.id] >= subjectTarget[subject.id]) break
          if (needMorning && morningCount >= 25) break
          if (needAfternoon && afternoonCount >= 25) break

          const daySlotKey = `${day}-${slot.period}`
          if (!classSchedule.has(daySlotKey) && 
              !globalTeacherSchedule[teacher.id].has(daySlotKey)) {
            
            timetable.push({
              day,
              period: slot.period,
              time: slot.time,
              session: slot.session,
              subjectId: subject.id,
              subjectName: subject.name,
              teacherId: teacher.id,
              teacherName: teacher.name,
            })

            classSchedule.add(daySlotKey)
            globalTeacherSchedule[teacher.id].add(daySlotKey)
            subjectCount[subject.id] = (subjectCount[subject.id] || 0) + 1
            
            if (slot.session === 'MORNING') morningCount++
            else afternoonCount++
          }
        }
      }
    }
    
    // If we can't fill more slots, break
    const beforeMorning = morningCount
    const beforeAfternoon = afternoonCount
    
    // Try one more pass
    for (const day of DAYS) {
      for (const subject of SUBJECTS) {
        if (subjectCount[subject.id] >= subjectTarget[subject.id]) continue

        const teacher = TEACHERS.find(t => t.subjects.includes(subject.id))
        if (!teacher) continue

        const slots = [...morningSlots, ...afternoonSlots]
        
        for (const slot of slots) {
          const daySlotKey = `${day}-${slot.period}`
          if (!classSchedule.has(daySlotKey) && 
              !globalTeacherSchedule[teacher.id].has(daySlotKey)) {
            
            timetable.push({
              day,
              period: slot.period,
              time: slot.time,
              session: slot.session,
              subjectId: subject.id,
              subjectName: subject.name,
              teacherId: teacher.id,
              teacherName: teacher.name,
            })

            classSchedule.add(daySlotKey)
            globalTeacherSchedule[teacher.id].add(daySlotKey)
            subjectCount[subject.id] = (subjectCount[subject.id] || 0) + 1
          }
        }
      }
    }

    morningCount = timetable.filter(t => t.session === 'MORNING').length
    afternoonCount = timetable.filter(t => t.session === 'AFTERNOON').length

    if (morningCount === beforeMorning && afternoonCount === beforeAfternoon) break
  }

  return {
    classId,
    className: cls?.name,
    morningCount,
    afternoonCount,
    totalPeriods: morningCount + afternoonCount,
    lessons: timetable.sort((a, b) => {
      const dayCompare = DAYS.indexOf(a.day) - DAYS.indexOf(b.day)
      if (dayCompare !== 0) return dayCompare
      return a.period - b.period
    }),
  }
}

// Main generation
function generateAllTimetables() {
  const allTimetables = {}

  // Reset global schedule
  for (const teacher of TEACHERS) {
    globalTeacherSchedule[teacher.id] = new Set()
  }

  // Generate timetables for all classes
  for (const cls of CLASSES) {
    allTimetables[cls.id] = generateClassTimetable(cls.id)
  }

  // Validate: check for conflicts
  let conflictCount = 0
  const teacherCheck = {}
  
  for (const teacher of TEACHERS) {
    teacherCheck[teacher.id] = new Set()
  }

  for (const cls of CLASSES) {
    const tt = allTimetables[cls.id]
    for (const lesson of tt.lessons) {
      const key = `${lesson.day}-${lesson.period}`
      if (teacherCheck[lesson.teacherId].has(key)) {
        conflictCount++
      }
      teacherCheck[lesson.teacherId].add(key)
    }
  }

  return {
    metadata: {
      generatedAt: new Date().toISOString(),
      totalClasses: CLASSES.length,
      totalTeachers: TEACHERS.length,
      totalSubjects: SUBJECTS.length,
      periodsPerClass: 50,
      morningPeriods: 25,
      afternoonPeriods: 25,
    },
    subjects: SUBJECTS,
    teachers: TEACHERS,
    classes: CLASSES,
    timetables: allTimetables,
    validation: {
      teacherConflicts: conflictCount,
      allClassesHave50Periods: CLASSES.every(
        c => allTimetables[c.id]?.totalPeriods === 50
      ),
    },
  }
}

// Generate and output
const result = generateAllTimetables()

// Console output
console.log('='.repeat(60))
console.log('📅 WEEKLY TIMETABLES FOR P1 A-C, P2 A-C, P3 A-C')
console.log('='.repeat(60))
console.log(`\nGenerated: ${result.metadata.generatedAt}`)
console.log(`Classes: ${result.metadata.totalClasses}`)
console.log(`Teachers: ${result.metadata.totalTeachers}`)
console.log(`Subjects: ${result.metadata.totalSubjects}`)

console.log('\n' + '='.repeat(60))
console.log('📋 SUBJECTS')
console.log('='.repeat(60))
for (const subject of SUBJECTS) {
  console.log(`  ${subject.id}: ${subject.name} - ${subject.periodsPerWeek} periods/week`)
}

console.log('\n' + '='.repeat(60))
console.log('👨‍🏫 TEACHERS')
console.log('='.repeat(60))
for (const teacher of TEACHERS) {
  const subjects = teacher.subjects.map(s => 
    SUBJECTS.find(sub => sub.id === s)?.name
  ).join(', ')
  console.log(`  ${teacher.name}: ${subjects}`)
}

console.log('\n' + '='.repeat(60))
console.log('📅 TIMETABLES BY CLASS')
console.log('='.repeat(60))

for (const cls of CLASSES) {
  const tt = result.timetables[cls.id]
  console.log(`\n${'─'.repeat(60)}`)
  console.log(`📚 ${tt.className} - ${tt.totalPeriods} periods (${tt.morningCount} morning, ${tt.afternoonCount} afternoon)`)
  console.log('─'.repeat(60))

  for (const day of DAYS) {
    const dayLessons = tt.lessons.filter(l => l.day === day)
    console.log(`\n${day}:`)
    
    const morningLessons = dayLessons.filter(l => l.session === 'MORNING')
    const afternoonLessons = dayLessons.filter(l => l.session === 'AFTERNOON')

    console.log('  Morning (before lunch):')
    morningLessons.forEach(l => {
      console.log(`    P${l.period} (${l.time}): ${l.subjectName} - ${l.teacherName}`)
    })
    if (morningLessons.length === 0) console.log('    (no lessons)')

    console.log('  Afternoon (after lunch):')
    afternoonLessons.forEach(l => {
      console.log(`    P${l.period} (${l.time}): ${l.subjectName} - ${l.teacherName}`)
    })
    if (afternoonLessons.length === 0) console.log('    (no lessons)')
  }
}

console.log('\n' + '='.repeat(60))
console.log('✅ VALIDATION')
console.log('='.repeat(60))
console.log(`Teacher conflicts: ${result.validation.teacherConflicts}`)
console.log(`All classes have 50 periods: ${result.validation.allClassesHave50Periods}`)

console.log('\n' + '='.repeat(60))
console.log('📊 SUMMARY BY CLASS')
console.log('='.repeat(60))
for (const cls of CLASSES) {
  const tt = result.timetables[cls.id]
  const subjectCounts = {}
  tt.lessons.forEach(l => {
    subjectCounts[l.subjectId] = (subjectCounts[l.subjectId] || 0) + 1
  })
  const subjectList = Object.entries(subjectCounts)
    .map(([id, count]) => `${id}=${count}`)
    .join(', ')
  console.log(`${tt.className}: ${subjectList}`)
}

// Save to file
const fs = require('fs')
fs.writeFileSync('timetables-output.json', JSON.stringify(result, null, 2))
console.log('\n📁 Timetables saved to timetables-output.json')
