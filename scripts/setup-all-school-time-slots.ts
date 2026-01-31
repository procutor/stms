/**
 * Setup default time slots for all registered schools
 * This script creates the standard time slots for Monday-Friday, periods 1-10
 * for all schools that don't have time slots configured yet.
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Helper function to convert time string to DateTime
function timeToDateTime(timeStr: string): Date {
  // Parse "HH:MM" format and create a DateTime
  const [hours, minutes] = timeStr.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return date
}

async function setupTimeSlotsForSchool(schoolId: string, schoolName: string) {
  console.log(`\n📅 Setting up time slots for school: ${schoolName} (${schoolId})`)
  
  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
  
  // Standard time slots configuration (updated schedule)
  const timeSlots = [
    // Morning Assembly (07:45-08:00) - not a lesson period
    { period: 1, startTime: '08:00', endTime: '08:40', session: 'MORNING' },
    { period: 2, startTime: '08:40', endTime: '09:20', session: 'MORNING' },
    { period: 3, startTime: '09:20', endTime: '10:00', session: 'MORNING' },
    { period: 4, startTime: '10:00', endTime: '10:20', session: 'MORNING', isBreak: true, breakType: 'BREAK' },
    { period: 5, startTime: '10:20', endTime: '11:00', session: 'MORNING' },
    { period: 6, startTime: '11:00', endTime: '11:40', session: 'MORNING' },
    { period: 7, startTime: '11:40', endTime: '13:10', session: 'MORNING', isBreak: true, breakType: 'LUNCH' },
    { period: 8, startTime: '13:10', endTime: '13:50', session: 'AFTERNOON' },
    { period: 9, startTime: '13:50', endTime: '14:30', session: 'AFTERNOON' },
    { period: 10, startTime: '14:30', endTime: '15:10', session: 'AFTERNOON' },
    { period: 11, startTime: '15:10', endTime: '15:30', session: 'AFTERNOON', isBreak: true, breakType: 'BREAK' },
    { period: 12, startTime: '15:30', endTime: '16:10', session: 'AFTERNOON' },
    { period: 13, startTime: '16:10', endTime: '16:50', session: 'AFTERNOON' },
  ]
  
  let created = 0
  let skipped = 0
  
  for (const day of days) {
    for (const slot of timeSlots) {
      // Check if slot already exists
      const existing = await prisma.timeSlot.findFirst({
        where: {
          schoolId,
          day,
          period: slot.period
        }
      })
      
      if (!existing) {
        await prisma.timeSlot.create({
          data: {
            schoolId,
            day,
            period: slot.period,
            name: `${day} Period ${slot.period}`,
            startTime: timeToDateTime(slot.startTime),
            endTime: timeToDateTime(slot.endTime),
            session: slot.session,
            isBreak: slot.isBreak || false,
            breakType: slot.breakType || null,
            isActive: true,
            isCPD: false,
            shift: 'MORNING' // Default shift
          }
        })
        created++
      } else {
        skipped++
      }
    }
  }
  
  console.log(`✅ Created ${created} time slots for ${schoolName} (skipped ${skipped} existing)`)
  return created
}

async function setupAllSchools() {
  console.log('🚀 Starting: Setup default time slots for all schools')
  console.log('='.repeat(60))
  
  try {
    // Get all schools
    const schools = await prisma.school.findMany({
      orderBy: { createdAt: 'asc' }
    })
    
    console.log(`\n📊 Found ${schools.length} schools total`)
    
    let totalCreated = 0
    let schoolsWithTimeSlots = 0
    let schoolsWithoutTimeSlots = 0
    
    for (const school of schools) {
      // Check if school already has time slots
      const existingSlots = await prisma.timeSlot.count({
        where: { schoolId: school.id }
      })
      
      if (existingSlots > 0) {
        console.log(`\n⏭️  School ${school.name} already has ${existingSlots} time slots - skipping`)
        schoolsWithTimeSlots++
      } else {
        const created = await setupTimeSlotsForSchool(school.id, school.name)
        totalCreated += created
        schoolsWithoutTimeSlots++
      }
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('📈 SUMMARY')
    console.log('='.repeat(60))
    console.log(`Total schools: ${schools.length}`)
    console.log(`Schools with time slots (skipped): ${schoolsWithTimeSlots}`)
    console.log(`Schools without time slots (setup): ${schoolsWithoutTimeSlots}`)
    console.log(`Total time slots created: ${totalCreated}`)
    console.log('='.repeat(60))
    
    if (totalCreated > 0) {
      console.log('\n✅ Success! Default time slots have been set up for all schools.')
      console.log('   Schools can now generate timetables.')
    } else {
      console.log('\nℹ️  All schools already have time slots configured.')
    }
    
  } catch (error) {
    console.error('\n❌ Error setting up time slots:', error)
    throw error
  }
}

// Run the script
setupAllSchools()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
