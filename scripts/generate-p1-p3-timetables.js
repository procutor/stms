/**
 * P1-P3 Weekly Timetable Generator - FINAL VERSION
 * With sufficient teachers to avoid conflicts
 * 
 * Rules:
 * - Each class has 50 periods per week (25 before lunch, 25 after lunch)
 * - Before lunch: 08:00-11:40 (Periods P1-P5)
 * - After lunch: 13:10-16:50 (Periods P6-P10)
 * - Subjects balanced between morning and afternoon
 * - NO teacher conflicts across any classes
 */

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']

// Period structure
const PERIODS = [
  { period: 1, start: '08:00', end: '08:40', session: 'BEFORE_LUNCH' },
  { period: 2, start: '08:40', end: '09:20', session: 'BEFORE_LUNCH' },
  { period: 3, start: '09:20', end: '10:00', session: 'BEFORE_LUNCH' },
  { period: 4, start: '10:20', end: '11:00', session: 'BEFORE_LUNCH' },
  { period: 5, start: '11:00', end: '11:40', session: 'BEFORE_LUNCH' },
  { period: 6, start: '13:10', end: '13:50', session: 'AFTER_LUNCH' },
  { period: 7, start: '13:50', end: '14:30', session: 'AFTER_LUNCH' },
  { period: 8, start: '14:30', end: '15:10', session: 'AFTER_LUNCH' },
  { period: 9, start: '15:30', end: '16:10', session: 'AFTER_LUNCH' },
  { period: 10, start: '16:10', end: '16:50', session: 'AFTER_LUNCH' }
]

// Classes
const CLASSES = [
  { id: 'p1a', name: 'P1 A', level: 'P1' },
  { id: 'p1b', name: 'P1 B', level: 'P1' },
  { id: 'p1c', name: 'P1 C', level: 'P1' },
  { id: 'p2a', name: 'P2 A', level: 'P2' },
  { id: 'p2b', name: 'P2 B', level: 'P2' },
  { id: 'p2c', name: 'P2 C', level: 'P2' },
  { id: 'p3a', name: 'P3 A', level: 'P3' },
  { id: 'p3b', name: 'P3 B', level: 'P3' },
  { id: 'p3c', name: 'P3 C', level: 'P3' }
]

// Subjects with periods per week
const SUBJECTS = {
  MATH: { name: 'Mathematics', periodsPerWeek: 10, difficulty: 'HIGH' },
  ENG: { name: 'English', periodsPerWeek: 8, difficulty: 'MEDIUM' },
  KIN: { name: 'Kinyarwanda', periodsPerWeek: 6, difficulty: 'MEDIUM' },
  SCI: { name: 'Science', periodsPerWeek: 8, difficulty: 'HIGH' },
  SS: { name: 'Social Studies', periodsPerWeek: 6, difficulty: 'MEDIUM' },
  PE: { name: 'Physical Education', periodsPerWeek: 4, difficulty: 'LOW' },
  ART: { name: 'Art & Craft', periodsPerWeek: 4, difficulty: 'LOW' },
  RE: { name: 'Religious Education', periodsPerWeek: 4, difficulty: 'LOW' }
}

// Teachers with subjects they can teach - MORE TEACHERS to avoid conflicts
const TEACHERS = [
  // Mathematics teachers (need more for 9 classes)
  { id: 't1', name: 'Mrs. UWASE Jeanette', subjects: ['MATH', 'SCI'] },
  { id: 't4a', name: 'Mr. NIYONKURU Samuel', subjects: ['MATH', 'PE'] },
  { id: 't4b', name: 'Mrs. MUREMYI Solange', subjects: ['MATH', 'SCI'] },
  
  // English teachers
  { id: 't2', name: 'Mr. HABIMANA Pascal', subjects: ['ENG', 'SS'] },
  { id: 't6', name: 'Mr. MUGISHA Robert', subjects: ['ENG', 'SS'] },
  { id: 't2b', name: 'Mrs. MUKESHA Alice', subjects: ['ENG', 'SS'] },
  
  // Kinyarwanda / RE teachers
  { id: 't3', name: 'Mrs. MUKANKUSI Alice', subjects: ['KIN', 'RE'] },
  { id: 't3b', name: 'Mr. NTAGANZWA Pierre', subjects: ['KIN', 'RE'] },
  
  // Art & Science
  { id: 't5', name: 'Mrs. INGABIRE Grace', subjects: ['SCI', 'ART'] },
  { id: 't5b', name: 'Mr. KAYITARE Esperance', subjects: ['ART', 'PE'] }
]

// Global teacher schedule to track availability across ALL classes
const globalTeacherSchedule = {}

// Check if teacher is available at given day/period
function isTeacherAvailable(teacherId, day, period) {
  const key = `${teacherId}-${day}-${period}`
  return !globalTeacherSchedule[key]
}

// Book a slot for a teacher
function bookTeacherSlot(teacherId, day, period, classId) {
  const key = `${teacherId}-${day}-${period}`
  if (globalTeacherSchedule[key]) {
    return false // Already booked
  }
  globalTeacherSchedule[key] = { classId, teacherId }
  return true
}

// Generate timetable for one class with proper teacher conflict prevention
function generateClassTimetable(classId, className, classLevel) {
  const timetable = []
  const morningPeriods = [1, 2, 3, 4, 5]
  const afternoonPeriods = [6, 7, 8, 9, 10]
  const assignedPeriods = new Set()
  
  // Helper to get available day/period slot
  function findAvailableSlot(preferredPeriods, subject, teacherId) {
    const shuffledDays = [...DAYS].sort(() => Math.random() - 0.5)
    
    for (const day of shuffledDays) {
      const shuffledPeriods = [...preferredPeriods].sort(() => Math.random() - 0.5)
      
      for (const period of shuffledPeriods) {
        const slotKey = `${classId}-${day}-${period}`
        if (!assignedPeriods.has(slotKey) && isTeacherAvailable(teacherId, day, period)) {
          if (bookTeacherSlot(teacherId, day, period, classId)) {
            assignedPeriods.add(slotKey)
            return { day, period }
          }
        }
      }
    }
    return null
  }
  
  // Assign each subject's periods
  Object.entries(SUBJECTS).forEach(([code, subject]) => {
    const periodsNeeded = subject.periodsPerWeek
    const morningSlots = Math.floor(periodsNeeded / 2)
    const afternoonSlots = periodsNeeded - morningSlots
    
    // Get teacher for this subject and class (distribute across teachers)
    const teachersForSubject = TEACHERS.filter(t => t.subjects.includes(code))
    const classIndex = CLASSES.findIndex(c => c.id === classId)
    const teacherIndex = classIndex % teachersForSubject.length
    const teacher = teachersForSubject[teacherIndex]
    
    // Assign morning slots
    for (let i = 0; i < morningSlots; i++) {
      const slot = findAvailableSlot(morningPeriods, code, teacher.id)
      if (slot) {
        timetable.push({
          day: slot.day,
          period: slot.period,
          subject: code,
          subjectName: subject.name,
          teacherId: teacher.id,
          teacherName: teacher.name,
          session: 'BEFORE_LUNCH',
          classId,
          className,
          classLevel
        })
      }
    }
    
    // Assign afternoon slots
    for (let i = 0; i < afternoonSlots; i++) {
      const slot = findAvailableSlot(afternoonPeriods, code, teacher.id)
      if (slot) {
        timetable.push({
          day: slot.day,
          period: slot.period,
          subject: code,
          subjectName: subject.name,
          teacherId: teacher.id,
          teacherName: teacher.name,
          session: 'AFTER_LUNCH',
          classId,
          className,
          classLevel
        })
      }
    }
  })
  
  return timetable
}

// Generate all class timetables
function generateAllTimetables() {
  const allTimetables = {}
  
  // Shuffle class order to distribute teacher load fairly
  const shuffledClasses = [...CLASSES].sort(() => Math.random() - 0.5)
  
  shuffledClasses.forEach(cls => {
    console.log(`Generating timetable for ${cls.name}...`)
    const timetable = generateClassTimetable(cls.id, cls.name, cls.level)
    allTimetables[cls.id] = timetable
  })
  
  return allTimetables
}

// Print timetable in a readable format
function printTimetable(classId, timetable) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`CLASS: ${classId}`)
  console.log(`${'='.repeat(60)}`)
  
  DAYS.forEach(day => {
    console.log(`\n${day}:`)
    PERIODS.forEach(p => {
      const slot = timetable.find(s => s.day === day && s.period === p.period)
      if (slot) {
        const session = p.period <= 5 ? '(Before Lunch)' : '(After Lunch)'
        console.log(`  P${p.period} (${p.start}-${p.end}) ${session}: ${slot.subjectName} - ${slot.teacherName}`)
      } else {
        const session = p.period <= 5 ? '(Before Lunch)' : '(After Lunch)'
        console.log(`  P${p.period} (${p.start}-${p.end}) ${session}: FREE`)
      }
    })
  })
}

// Print summary
function printSummary(allTimetables) {
  console.log(`\n${'#'.repeat(80)}`)
  console.log('P1-P3 WEEKLY TIMETABLE SUMMARY')
  console.log(`${'#'.repeat(80)}`)
  
  CLASSES.forEach(cls => {
    const timetable = allTimetables[cls.id]
    if (timetable) {
      printTimetable(cls.name, timetable)
    }
  })
  
  // Verify rules
  console.log(`\n${'#'.repeat(80)}`)
  console.log('VERIFICATION')
  console.log(`${'#'.repeat(80)}`)
  
  let allBalanced = true
  
  CLASSES.forEach(cls => {
    const timetable = allTimetables[cls.id] || []
    const morningCount = timetable.filter(s => s.period <= 5).length
    const afternoonCount = timetable.filter(s => s.period > 5).length
    
    if (morningCount !== 25 || afternoonCount !== 25) {
      console.error(`❌ ${cls.name}: Morning=${morningCount}, Afternoon=${afternoonCount} - NOT BALANCED!`)
      allBalanced = false
    } else {
      console.log(`✅ ${cls.name}: Morning=${morningCount}, Afternoon=${afternoonCount}, Total=${timetable.length}`)
    }
  })
  
  // Check teacher conflicts across all classes
  console.log('\nChecking for teacher conflicts...')
  const conflictCheck = {}
  let totalConflicts = 0
  
  CLASSES.forEach(cls => {
    const timetable = allTimetables[cls.id] || []
    timetable.forEach(slot => {
      const key = `${slot.teacherId}-${slot.day}-${slot.period}`
      if (conflictCheck[key]) {
        console.error(`❌ TEACHER CONFLICT: ${slot.teacherName} at ${slot.day} P${slot.period} for ${cls.name} AND ${conflictCheck[key].className}`)
        totalConflicts++
      } else {
        conflictCheck[key] = { className: cls.name, teacherName: slot.teacherName, day: slot.day, period: slot.period }
      }
    })
  })
  
  if (totalConflicts === 0) {
    console.log('✅ No teacher conflicts detected!')
  } else {
    console.error(`❌ ${totalConflicts} teacher conflicts found!`)
  }
  
  // Export to JSON
  const fs = require('fs')
  fs.writeFileSync('p1-p3-timetables.json', JSON.stringify(allTimetables, null, 2))
  console.log('\n✅ Timetables exported to p1-p3-timetables.json')
  
  return allBalanced && totalConflicts === 0
}

// Generate and display
console.log('Starting P1-P3 timetable generation with ' + TEACHERS.length + ' teachers...')

// Try multiple times until no conflicts
let success = false
let attempts = 0
const maxAttempts = 50

while (!success && attempts < maxAttempts) {
  attempts++
  // Reset global schedule
  Object.keys(globalTeacherSchedule).forEach(key => delete globalTeacherSchedule[key])
  
  const allTimetables = generateAllTimetables()
  success = printSummary(allTimetables)
  
  if (!success) {
    console.log(`\nRetrying... (attempt ${attempts}/${maxAttempts})`)
  }
}

if (success) {
  console.log(`\n🎉 Successfully generated conflict-free timetables in ${attempts} attempt(s)!`)
} else {
  console.log('\n⚠️ Could not generate conflict-free timetables. Please add more teachers or reduce classes.')
}
