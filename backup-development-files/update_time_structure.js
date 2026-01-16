const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateTimeStructure() {
  try {
    console.log('🔄 Updating time structure for all schools...')

    // Get all schools
    const schools = await prisma.school.findMany()
    
    for (const school of schools) {
      console.log(`\n📚 Processing school: ${school.name}`)
      
      // Delete existing time slots for this school
      await prisma.timeSlot.deleteMany({
        where: { schoolId: school.id }
      })
      console.log(`  ✅ Cleared existing time slots`)

      // Define the exact time structure
      const periodStructure = [
        // Morning periods
        { period: 1, start: '08:00', end: '08:40', session: 'MORNING', isBreak: false, name: 'P1' },
        { period: 2, start: '08:40', end: '09:20', session: 'MORNING', isBreak: false, name: 'P2' },
        { period: 3, start: '09:20', end: '10:00', session: 'MORNING', isBreak: false, name: 'P3' },
        // Morning break - use special period number
        { period: 11, start: '10:00', end: '10:20', session: 'MORNING', isBreak: true, breakType: 'MORNING_BREAK', name: 'MORNING BREAK' },
        { period: 4, start: '10:20', end: '11:00', session: 'MORNING', isBreak: false, name: 'P4' },
        { period: 5, start: '11:00', end: '11:40', session: 'MORNING', isBreak: false, name: 'P5' },
        // Lunch break - use special period number
        { period: 12, start: '11:40', end: '13:10', session: 'AFTERNOON', isBreak: true, breakType: 'LUNCH_BREAK', name: 'LUNCH BREAK' },
        { period: 6, start: '13:10', end: '13:50', session: 'AFTERNOON', isBreak: false, name: 'P6' },
        { period: 7, start: '13:50', end: '14:30', session: 'AFTERNOON', isBreak: false, name: 'P7' },
        { period: 8, start: '14:30', end: '15:10', session: 'AFTERNOON', isBreak: false, name: 'P8' },
        // Afternoon break - use special period number
        { period: 13, start: '15:10', end: '15:30', session: 'AFTERNOON', isBreak: true, breakType: 'AFTERNOON_BREAK', name: 'AFTERNOON BREAK' },
        { period: 9, start: '15:30', end: '16:10', session: 'AFTERNOON', isBreak: false, name: 'P9' },
        { period: 10, start: '16:10', end: '16:50', session: 'AFTERNOON', isBreak: false, name: 'P10' },
        // End buffer - use special period number
        { period: 14, start: '16:50', end: '16:55', session: 'AFTERNOON', isBreak: true, breakType: 'END_OF_DAY', name: 'END OF DAY' }
      ]

      const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
      
      let createdCount = 0
      
      for (const day of days) {
        for (const periodData of periodStructure) {
          const [startHour, startMin] = periodData.start.split(':').map(Number)
          const [endHour, endMin] = periodData.end.split(':').map(Number)
          
          const startTime = new Date()
          startTime.setHours(startHour, startMin, 0)
          
          const endTime = new Date()
          endTime.setHours(endHour, endMin, 0)

          await prisma.timeSlot.create({
            data: {
              schoolId: school.id,
              day: day,
              period: periodData.period,
              name: periodData.name,
              startTime: startTime,
              endTime: endTime,
              session: periodData.session,
              isBreak: periodData.isBreak,
              breakType: periodData.breakType,
              isActive: true
            }
          })
          createdCount++
        }
      }

      console.log(`  ✅ Created ${createdCount} new time slots`)
    }

    console.log('\n🎉 Time structure update completed successfully!')
    console.log('\n📋 New Structure Summary:')
    console.log('• School day: 08:00 - 16:55')
    console.log('• Each lesson: 40 minutes')
    console.log('• Morning Break: 10:00 - 10:20 (20 min)')
    console.log('• Lunch Break: 11:40 - 13:10 (90 min)')
    console.log('• Afternoon Break: 15:10 - 15:30 (20 min)')
    console.log('• 10 teaching periods + breaks')
    console.log('• Monday to Saturday (6 days)')

  } catch (error) {
    console.error('❌ Error updating time structure:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateTimeStructure()