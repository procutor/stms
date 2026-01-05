/**
 * Fix script to clean and recreate time slots for a specific school
 * This will solve the "0 time slots" vs "unique constraint" mismatch
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function fixSchoolTimeSlots(schoolId) {
    console.log(`🔧 FIXING TIME SLOTS FOR SCHOOL: ${schoolId}\n`)

    try {
        // First, completely delete all time slots for this school
        console.log('🗑️  Deleting existing time slots...')
        
        // Get all existing time slots first
        const existingSlots = await db.timeSlot.findMany({
            where: { schoolId }
        })
        
        console.log(`   Found ${existingSlots.length} existing time slots to delete`)
        
        // Delete them one by one to ensure they're all removed
        for (const slot of existingSlots) {
            await db.timeSlot.delete({
                where: { id: slot.id }
            })
        }
        
        console.log(`   ✅ Deleted ${existingSlots.length} existing time slots`)

        // Add a small delay to ensure deletes are committed
        await new Promise(resolve => setTimeout(resolve, 100))

        // Now create fresh time slots
        console.log('🆕 Creating fresh time slots...')
        const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
        const timeSlots = []

        for (const day of daysOfWeek) {
            // School Assembly: 07:45 – 08:00
            timeSlots.push(
                {
                    schoolId,
                    day,
                    period: 0,
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
                }
            )
        }

        // Bulk create all time slots
        const createdSlots = await db.timeSlot.createMany({
            data: timeSlots
        })
        
        console.log(`✅ Successfully created ${createdSlots.count} time slots`)
        
        // Verify the creation
        const totalSlots = await db.timeSlot.count({
            where: { schoolId, isActive: true }
        })
        
        console.log(`📊 Verified: ${totalSlots} active time slots`)
        
        // Show sample schedule
        const mondaySlots = await db.timeSlot.findMany({
            where: { schoolId, day: 'MONDAY', isActive: true },
            orderBy: { period: 'asc' }
        })
        
        console.log(`\n📅 Sample Monday Schedule:`)
        mondaySlots.forEach(slot => {
            const time = `${slot.startTime.toTimeString().slice(0, 5)}-${slot.endTime.toTimeString().slice(0, 5)}`
            console.log(`   ${slot.period > 0 ? 'P' + slot.period : 'Break'}: ${time} (${slot.name})`)
        })

        return { success: true, count: createdSlots.count }

    } catch (error) {
        console.error('❌ Error fixing time slots:', error)
        return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
}

// Get school ID from command line or use a default
const schoolId = process.argv[2] || 'cmjl8j7ik00i13n3x2fm832nu' // Default to the school from logs

console.log('🚀 STARTING TIME SLOTS FIX...\n')
fixSchoolTimeSlots(schoolId).then(result => {
    if (result.success) {
        console.log('\n🎉 TIME SLOTS FIXED SUCCESSFULLY!')
        console.log(`School ${schoolId} now has a clean set of ${result.count} time slots.`)
        console.log('You can now refresh your dashboard to see them!')
    } else {
        console.log('\n❌ FIX FAILED:', result.error)
    }
    process.exit(result.success ? 0 : 1)
}).catch(error => {
    console.error('💥 Fatal error:', error)
    process.exit(1)
}).finally(async () => {
    await db.$disconnect()
})