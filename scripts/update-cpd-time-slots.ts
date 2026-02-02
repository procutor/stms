/**
 * Script to add CPD time slot on Wednesday 15:30-16:50 for a school
 * Run: npx ts-node scripts/update-time-slots-cpd.ts
 */

import { db } from '@/lib/db'

async function updateCPDTimeSlots(schoolId: string) {
  try {
    console.log(`\n🔧 Adding CPD time slot for school: ${schoolId}`)
    
    // Delete existing CPD slots and periods 9-10 on Wednesday
    await db.timeSlot.deleteMany({
      where: {
        schoolId: schoolId,
        day: 'WEDNESDAY',
        period: { in: [9, 10] }
      }
    })
    
    // Create CPD slots for Wednesday 15:30-16:50
    const cpdSlots = [
      {
        schoolId: schoolId,
        day: 'WEDNESDAY',
        period: 9,
        startTime: new Date('1970-01-01T15:30:00'),
        endTime: new Date('1970-01-01T16:10:00'),
        name: 'CPD',
        session: 'AFTERNOON',
        isBreak: false,
        isCPD: true,
        isActive: true
      },
      {
        schoolId: schoolId,
        day: 'WEDNESDAY',
        period: 10,
        startTime: new Date('1970-01-01T16:10:00'),
        endTime: new Date('1970-01-01T16:50:00'),
        name: 'CPD',
        session: 'AFTERNOON',
        isBreak: false,
        isCPD: true,
        isActive: true
      }
    ]
    
    await db.timeSlot.createMany({
      data: cpdSlots
    })
    
    console.log('✅ Successfully added CPD time slots for Wednesday 15:30-16:50')
    console.log('   - Period 9: 15:30-16:10 (CPD)')
    console.log('   - Period 10: 16:10-16:50 (CPD)')
    console.log('\n⚠️  IMPORTANT: Regenerate timetables to apply the CPD exclusion')
    
  } catch (error) {
    console.error('Error updating CPD time slots:', error)
  }
}

// Get school ID from command line or use default
const schoolId = process.argv[2] || 'cml3yn9x3003j10qyofl4fb7o' // Charles Lwanga Primary School
updateCPDTimeSlots(schoolId)
