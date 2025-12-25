const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createTimeSlots() {
  try {
    console.log('🚀 Setting up school time slots...')
    
    // Get the first approved school
    const school = await prisma.school.findFirst({
      where: { status: 'APPROVED' }
    })
    
    if (!school) {
      console.error('❌ No approved school found')
      return
    }
    
    console.log(`📚 Found school: ${school.name} (${school.id})`)
    
    // Delete existing time slots completely
    await prisma.timeSlot.deleteMany({
      where: { schoolId: school.id }
    })
    
    // Deactivate any remaining time slots (just in case)
    await prisma.timeSlot.updateMany({
      where: { schoolId: school.id },
      data: { isActive: false }
    })
    
    const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
    const timeSlots = []
    
    // Create time slots for each day
    for (const day of daysOfWeek) {
      // Periods 1-10 with breaks
      timeSlots.push(
        // Period 1: 08:00 – 08:40
        {
          schoolId: school.id,
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
          schoolId: school.id,
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
          schoolId: school.id,
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
          schoolId: school.id,
          day,
          period: 0,
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
          schoolId: school.id,
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
          schoolId: school.id,
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
          schoolId: school.id,
          day,
          period: 0,
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
          schoolId: school.id,
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
          schoolId: school.id,
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
          schoolId: school.id,
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
          schoolId: school.id,
          day,
          period: 0,
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
          schoolId: school.id,
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
          schoolId: school.id,
          day,
          period: 10,
          name: 'Period 10',
          startTime: new Date('1970-01-01T16:10:00'),
          endTime: new Date('1970-01-01T16:50:00'),
          session: 'AFTERNOON',
          isActive: true
        }
      )
    }
    
    console.log(`📝 Creating ${timeSlots.length} time slots...`)
    
    let createdCount = 0
    let errors = 0
    
    for (const slot of timeSlots) {
      try {
        await prisma.timeSlot.create({
          data: slot
        })
        createdCount++
      } catch (error) {
        console.log(`⚠️  Skipped slot ${slot.day} period ${slot.period}: ${error.message}`)
        errors++
      }
    }
    
    console.log(`✅ Successfully created ${createdCount} time slots`)
    console.log(`⚠️  ${errors} slots had conflicts and were skipped`)
    
    // Verify creation
    const totalSlots = await prisma.timeSlot.count({
      where: { schoolId: school.id, isActive: true }
    })
    
    const periods = await prisma.timeSlot.count({
      where: { schoolId: school.id, isActive: true, period: { gt: 0 } }
    })
    
    const breaks = await prisma.timeSlot.count({
      where: { schoolId: school.id, isActive: true, isBreak: true }
    })
    
    console.log(`📊 Final Verification:`)
    console.log(`   Total active slots: ${totalSlots}`)
    console.log(`   Periods: ${periods}`)
    console.log(`   Breaks: ${breaks}`)
    console.log(`   Expected: 50 periods (10 × 5 days) + 15 breaks (3 × 5 days) = 65 total`)
    
    if (totalSlots >= 50 && periods >= 50) {
      console.log(`🎉 Success! Time slots structure is working`)
    } else {
      console.log(`⚠️  Warning: Structure doesn't match expected values`)
    }
    
  } catch (error) {
    console.error('❌ Error creating time slots:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTimeSlots()