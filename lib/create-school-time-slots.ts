import { db } from '@/lib/db'

export async function createSchoolTimeSlots(schoolId) {
  try {
    console.log(`Creating time slots for school: ${schoolId}`)

    // Define the exact time structure (same as seed)
    const periodStructure = [
      // Morning periods
      { period: 1, start: '08:00', end: '08:40', session: 'MORNING', isBreak: false },
      { period: 2, start: '08:40', end: '09:20', session: 'MORNING', isBreak: false },
      { period: 3, start: '09:20', end: '10:00', session: 'MORNING', isBreak: false },
      // Morning break
      { period: -1, start: '10:00', end: '10:20', session: 'MORNING', isBreak: true, breakType: 'MORNING_BREAK', name: 'MORNING BREAK' },
      { period: 4, start: '10:20', end: '11:00', session: 'MORNING', isBreak: false },
      { period: 5, start: '11:00', end: '11:40', session: 'MORNING', isBreak: false },
      // Lunch break
      { period: -2, start: '11:40', end: '13:10', session: 'AFTERNOON', isBreak: true, breakType: 'LUNCH_BREAK', name: 'LUNCH BREAK' },
      { period: 6, start: '13:10', end: '13:50', session: 'AFTERNOON', isBreak: false },
      { period: 7, start: '13:50', end: '14:30', session: 'AFTERNOON', isBreak: false },
      { period: 8, start: '14:30', end: '15:10', session: 'AFTERNOON', isBreak: false },
      // Afternoon break
      { period: -3, start: '15:10', end: '15:30', session: 'AFTERNOON', isBreak: true, breakType: 'AFTERNOON_BREAK', name: 'AFTERNOON BREAK' },
      { period: 9, start: '15:30', end: '16:10', session: 'AFTERNOON', isBreak: false },
      { period: 10, start: '16:10', end: '16:50', session: 'AFTERNOON', isBreak: false },
      // End buffer
      { period: -4, start: '16:50', end: '16:55', session: 'AFTERNOON', isBreak: true, breakType: 'END_OF_DAY', name: 'END OF DAY' }
    ]

    // Days for Monday to Friday only
    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']

    const timeSlots = []

    for (const day of days) {
      for (const periodData of periodStructure) {
        const [startHour, startMin] = periodData.start.split(':').map(Number)
        const [endHour, endMin] = periodData.end.split(':').map(Number)

        const startTime = new Date()
        startTime.setHours(startHour, startMin, 0)

        const endTime = new Date()
        endTime.setHours(endHour, endMin, 0)

        timeSlots.push({
          schoolId: schoolId,
          day: day,
          period: periodData.period,
          startTime: startTime,
          endTime: endTime,
          name: periodData.name || `P${periodData.period}`,
          session: periodData.session,
          isBreak: periodData.isBreak,
          breakType: periodData.breakType || null,
          isActive: true
        })
      }
    }

    // Clear existing time slots for this school first
    await db.timeSlot.deleteMany({
      where: { schoolId: schoolId }
    })

    // Create new time slots
    const createdSlots = await db.timeSlot.createMany({
      data: timeSlots
    })

    console.log(`Successfully created ${createdSlots.count} time slots for school ${schoolId}`)

    return {
      success: true,
      count: createdSlots.count
    }

  } catch (error) {
    console.error('Error creating time slots:', error)
    return {
      success: false,
      error: error.message
    }
  }
}
