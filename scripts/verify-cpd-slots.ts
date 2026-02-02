/**
 * Script to verify CPD time slots are correctly set
 * Run: npx ts-node scripts/verify-cpd-slots.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyCPDSlots(schoolId: string) {
  try {
    console.log(`\n🔍 Verifying CPD time slots for school: ${schoolId}`)
    
    const cpdSlots = await prisma.timeSlot.findMany({
      where: {
        schoolId: schoolId,
        day: 'WEDNESDAY',
        period: { in: [9, 10] }
      }
    })
    
    console.log('\n📋 Wednesday Periods 9-10:')
    cpdSlots.forEach(slot => {
      console.log(`   - ${slot.day} Period ${slot.period}: ${slot.name}`)
      console.log(`     Time: ${slot.startTime} - ${slot.endTime}`)
      console.log(`     isCPD: ${slot.isCPD}, isBreak: ${slot.isBreak}`)
    })
    
    // Count total time slots for the school
    const totalSlots = await prisma.timeSlot.count({
      where: { schoolId }
    })
    
    const activeSlots = await prisma.timeSlot.count({
      where: { schoolId, isActive: true }
    })
    
    const cpdCount = await prisma.timeSlot.count({
      where: { schoolId, isCPD: true }
    })
    
    console.log(`\n📊 School Statistics:`)
    console.log(`   Total time slots: ${totalSlots}`)
    console.log(`   Active time slots: ${activeSlots}`)
    console.log(`   CPD time slots: ${cpdCount}`)
    
    // Show all CPD slots
    const allCpdSlots = await prisma.timeSlot.findMany({
      where: { schoolId, isCPD: true },
      orderBy: [{ day: 'asc' }, { period: 'asc' }]
    })
    
    console.log(`\n📋 All CPD Slots:`)
    allCpdSlots.forEach(slot => {
      console.log(`   - ${slot.day} Period ${slot.period}: ${slot.name} (${slot.startTime} - ${slot.endTime})`)
    })
    
  } catch (error) {
    console.error('Error verifying CPD slots:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Get school ID from command line or use default
const schoolId = process.argv[2] || 'cml3yn9x3003j10qyofl4fb7o'
verifyCPDSlots(schoolId)
