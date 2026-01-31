/**
 * Setup time slots for a school
 * This script creates the standard time slots for Monday-Friday, periods 1-10
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Helper function to convert time string to DateTime
function timeToDateTime(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return date
}

async function setupTimeSlots(schoolId: string) {
  console.log(`Setting up time slots for school: ${schoolId}`)
  
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
            shift: 'MORNING'
          }
        })
        created++
      }
    }
  }
  
  console.log(`Created ${created} time slots for school ${schoolId}`)
  return created
}

// Run for a specific school or all schools
async function main() {
  const schoolId = process.argv[2]
  
  if (!schoolId) {
    console.log('Usage: npx tsx scripts/setup-time-slots.ts <schoolId>')
    console.log('Example: npx tsx scripts/setup-time-slots.ts cm123abc')
    return
  }
  
  await setupTimeSlots(schoolId)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
