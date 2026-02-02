/**
 * Script to update Wednesday periods 9-10 as CPD and clean up existing CPD schedules
 * Run: npx ts-node scripts/update-cpd-time-slots-simple.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateCPDTimeSlots(schoolId: string) {
  try {
    console.log(`\n🔧 Updating Wednesday periods 9-10 to CPD for school: ${schoolId}`)
    
    // 1. Get the CPD time slot IDs
    const cpdSlots = await prisma.timeSlot.findMany({
      where: {
        schoolId: schoolId,
        day: 'WEDNESDAY',
        period: { in: [9, 10] }
      },
      select: { id: true }
    })
    
    const cpdSlotIds = cpdSlots.map(s => s.id)
    
    // 2. Delete any existing timetables using CPD slots
    if (cpdSlotIds.length > 0) {
      const deleted = await prisma.timetable.deleteMany({
        where: {
          schoolId: schoolId,
          timeSlotId: { in: cpdSlotIds }
        }
      })
      console.log(`   - Deleted ${deleted.count} existing timetable entries using CPD slots`)
    }
    
    // 3. Update existing time slots to be CPD
    const result = await prisma.timeSlot.updateMany({
      where: {
        schoolId: schoolId,
        day: 'WEDNESDAY',
        period: { in: [9, 10] }
      },
      data: {
        name: 'CPD',
        isCPD: true,
        isBreak: false
      }
    })
    
    console.log(`   - Updated ${result.count} time slots to CPD`)
    
    // 4. If no existing slots, create them
    if (result.count === 0) {
      const newCpdSlots = [
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
      
      await prisma.timeSlot.createMany({
        data: newCpdSlots
      })
      console.log('   - Created 2 new CPD time slots')
    }
    
    console.log('✅ Successfully updated Wednesday periods 9-10 as CPD (15:30-16:50)')
    console.log('\n⚠️  IMPORTANT: Regenerate timetables to apply the CPD exclusion')
    
  } catch (error) {
    console.error('Error updating CPD time slots:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Get school ID from command line or use default
const schoolId = process.argv[2] || 'cml3yn9x3003j10qyofl4fb7o' // Charles Lwanga Primary School
updateCPDTimeSlots(schoolId)
