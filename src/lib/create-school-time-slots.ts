import { db } from '@/lib/db'

/**
 * Create time slots for a school with periods P1-P10 (08:00-16:50)
 *
 * ASSEMBLY:
 * - School Assembly: 07:45 – 08:00
 *
 * MORNING:
 * - Period 1: 08:00 – 08:40
 * - Period 2: 08:40 – 09:20
 * - Period 3: 09:20 – 10:00
 *
 * --- MORNING BREAK (10:00 – 10:20) ---
 *
 * - Period 4: 10:20 – 11:00
 * - Period 5: 11:00 – 11:40
 *
 * --- LUNCH BREAK (11:40 – 13:10) ---
 *
 * AFTERNOON:
 * - Period 6: 13:10 – 13:50
 * - Period 7: 13:50 – 14:30
 * - Period 8: 14:30 – 15:10
 *
 * --- AFTERNOON BREAK (15:10 – 15:30) ---
 *
 * - Period 9: 15:30 – 16:10
 * - Period 10: 16:10 – 16:50
 *
 * CORE TIME RULE: All lessons MUST be scheduled strictly within 08:00-16:50
 */

export async function createSchoolTimeSlots(schoolId: string) {
  console.log(`Creating time slots for school: ${schoolId}`)
  
  // First, deactivate existing time slots for this school
  await db.timeSlot.updateMany({
    where: { schoolId },
    data: { isActive: false }
  })

  const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
  const timeSlots = []

  // Create time slots for each day
  for (const day of daysOfWeek) {
    // School Assembly: 07:45 – 08:00
    timeSlots.push(
      {
        schoolId,
        day,
        period: 0, // Use 0 for breaks
        name: 'School Assembly',
        startTime: new Date('1970-01-01T07:45:00'),
        endTime: new Date('1970-01-01T08:00:00'),
        session: 'ASSEMBLY',
        isBreak: true,
        breakType: 'ASSEMBLY',
        isActive: true
      },
      // Period 1: 08:00 – 08:40
      {
        schoolId,
        day,
        period: 1,
        name: 'Period 1',
        startTime: new Date('1970-01-01T08:00:00'),
        endTime: new Date('1970-01-01T08:40:00'),
        session: 'MORNING',
        isActive: true
      },
      // Period 2: 08:40 – 09:20
      {
        schoolId,
        day,
        period: 2,
        name: 'Period 2',
        startTime: new Date('1970-01-01T08:40:00'),
        endTime: new Date('1970-01-01T09:20:00'),
        session: 'MORNING',
        isActive: true
      },
      // Period 3: 09:20 – 10:00
      {
        schoolId,
        day,
        period: 3,
        name: 'Period 3',
        startTime: new Date('1970-01-01T09:20:00'),
        endTime: new Date('1970-01-01T10:00:00'),
        session: 'MORNING',
        isActive: true
      },
      // Morning Break: 10:00 – 10:20
      {
        schoolId,
        day,
        period: 0, // Use 0 for breaks
        name: 'Morning Break',
        startTime: new Date('1970-01-01T10:00:00'),
        endTime: new Date('1970-01-01T10:20:00'),
        session: 'BREAK',
        isBreak: true,
        breakType: 'MORNING',
        isActive: true
      },
      // Period 4: 10:20 – 11:00
      {
        schoolId,
        day,
        period: 4,
        name: 'Period 4',
        startTime: new Date('1970-01-01T10:20:00'),
        endTime: new Date('1970-01-01T11:00:00'),
        session: 'MORNING',
        isActive: true
      },
      // Period 5: 11:00 – 11:40
      {
        schoolId,
        day,
        period: 5,
        name: 'Period 5',
        startTime: new Date('1970-01-01T11:00:00'),
        endTime: new Date('1970-01-01T11:40:00'),
        session: 'MORNING',
        isActive: true
      },
      // Lunch Break: 11:40 – 13:10
      {
        schoolId,
        day,
        period: 0, // Use 0 for breaks
        name: 'Lunch Break',
        startTime: new Date('1970-01-01T11:40:00'),
        endTime: new Date('1970-01-01T13:10:00'),
        session: 'BREAK',
        isBreak: true,
        breakType: 'LUNCH',
        isActive: true
      },
      // Period 6: 13:10 – 13:50
      {
        schoolId,
        day,
        period: 6,
        name: 'Period 6',
        startTime: new Date('1970-01-01T13:10:00'),
        endTime: new Date('1970-01-01T13:50:00'),
        session: 'AFTERNOON',
        isActive: true
      },
      // Period 7: 13:50 – 14:30
      {
        schoolId,
        day,
        period: 7,
        name: 'Period 7',
        startTime: new Date('1970-01-01T13:50:00'),
        endTime: new Date('1970-01-01T14:30:00'),
        session: 'AFTERNOON',
        isActive: true
      },
      // Period 8: 14:30 – 15:10
      {
        schoolId,
        day,
        period: 8,
        name: 'Period 8',
        startTime: new Date('1970-01-01T14:30:00'),
        endTime: new Date('1970-01-01T15:10:00'),
        session: 'AFTERNOON',
        isActive: true
      },
      // Afternoon Break: 15:10 – 15:30
      {
        schoolId,
        day,
        period: 0, // Use 0 for breaks
        name: 'Afternoon Break',
        startTime: new Date('1970-01-01T15:10:00'),
        endTime: new Date('1970-01-01T15:30:00'),
        session: 'BREAK',
        isBreak: true,
        breakType: 'AFTERNOON',
        isActive: true
      },
      // Period 9: 15:30 – 16:10
      {
        schoolId,
        day,
        period: 9,
        name: 'Period 9',
        startTime: new Date('1970-01-01T15:30:00'),
        endTime: new Date('1970-01-01T16:10:00'),
        session: 'AFTERNOON',
        isActive: true
      },
      // Period 10: 16:10 – 16:50
      {
        schoolId,
        day,
        period: 10,
        name: 'Period 10',
        startTime: new Date('1970-01-01T16:10:00'),
        endTime: new Date('1970-01-01T16:50:00'),
        session: 'AFTERNOON',
        isActive: true
      },
      // Period 11: 16:50 – 17:30
      {
        schoolId,
        day,
        period: 11,
        name: 'Period 11',
        startTime: new Date('1970-01-01T16:50:00'),
        endTime: new Date('1970-01-01T17:30:00'),
        session: 'EVENING',
        isActive: true
      },
      // Period 12: 17:30 – 18:10
      {
        schoolId,
        day,
        period: 12,
        name: 'Period 12',
        startTime: new Date('1970-01-01T17:30:00'),
        endTime: new Date('1970-01-01T18:10:00'),
        session: 'EVENING',
        isActive: true
      },
      // Period 13: 18:10 – 18:50
      {
        schoolId,
        day,
        period: 13,
        name: 'Period 13',
        startTime: new Date('1970-01-01T18:10:00'),
        endTime: new Date('1970-01-01T18:50:00'),
        session: 'EVENING',
        isActive: true
      },

    )
  }

  // Bulk create all time slots
  try {
    const createdSlots = await db.timeSlot.createMany({
      data: timeSlots
    })
    
    console.log(`✅ Created ${createdSlots.count} time slots for school ${schoolId}`)
    
    // Verify the creation
    const totalSlots = await db.timeSlot.count({
      where: { schoolId, isActive: true }
    })
    
    console.log(`📊 Total active time slots: ${totalSlots}`)
    
    return { success: true, count: createdSlots.count }
  } catch (error) {
    console.error('❌ Error creating time slots:', error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}