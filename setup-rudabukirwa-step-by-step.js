import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// Default time slots configuration based on GS GIKOMERO TSS
const DEFAULT_SCHEDULE = {
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    periods: [
        { period: 1, name: 'Period 1', startTime: '07:45', endTime: '08:30' },
        { period: 2, name: 'Period 2', startTime: '08:30', endTime: '09:15' },
        { period: 3, name: 'Period 3', startTime: '09:15', endTime: '10:00' },
        { period: 4, name: 'Period 4', startTime: '10:00', endTime: '10:45' },
        { period: 5, name: 'Period 5', startTime: '10:45', endTime: '11:30' },
        { period: 6, name: 'Period 6', startTime: '11:30', endTime: '12:15' },
        { period: 7, name: 'Period 7', startTime: '12:15', endTime: '13:00' },
        { period: 8, name: 'Period 8', startTime: '13:00', endTime: '13:45' },
        { period: 9, name: 'Period 9', startTime: '13:45', endTime: '14:30' },
        { period: 10, name: 'Period 10', startTime: '14:30', endTime: '15:15' }
    ],
    breaks: [
        { period: 0, name: 'Assembly', startTime: '08:00', endTime: '08:15', breakType: 'ASSEMBLY' },
        { period: 0, name: 'Morning Break', startTime: '10:00', endTime: '10:15', breakType: 'SHORT_BREAK' },
        { period: 0, name: 'Lunch Break', startTime: '12:15', endTime: '13:00', breakType: 'LUNCH_BREAK' },
        { period: 0, name: 'Afternoon Break', startTime: '15:15', endTime: '15:30', breakType: 'SHORT_BREAK' }
    ]
}

async function createSingleTimeSlot(schoolId, day, period, name, startTime, endTime, isBreak = false, breakType = null) {
    try {
        const session = parseInt(startTime.split(':')[0]) < 12 ? 'AM' : 'PM'
        
        const timeSlot = await db.timeSlot.create({
            data: {
                schoolId,
                day,
                period,
                name,
                startTime: new Date(`1970-01-01T${startTime}`),
                endTime: new Date(`1970-01-01T${endTime}`),
                session,
                isBreak,
                breakType,
                isActive: true
            }
        })
        
        return { success: true, timeSlot }
    } catch (error) {
        if (error.code === 'P2002') {
            return { success: false, error: `Time slot already exists: ${day} Period ${period} - ${name}` }
        }
        return { success: false, error: error.message }
    }
}

async function setupRudabukirwaTimeSlots() {
    try {
        console.log('🏫 Setting up time slots for GS RUDAKABUKIRWA step by step...')
        
        // Find the school
        const school = await db.school.findFirst({
            where: {
                name: 'GS RUDAKABUKIRWA',
                status: 'APPROVED'
            }
        })
        
        if (!school) {
            console.error('❌ GS RUDAKABUKIRWA school not found')
            return
        }
        
        console.log(`✅ Found school: ${school.name} (${school.id})`)
        
        let createdCount = 0
        let failedCount = 0
        
        // Process each day
        for (const day of DEFAULT_SCHEDULE.days) {
            console.log(`\n📅 Setting up ${day}...`)
            
            // Create breaks first
            for (const breakSlot of DEFAULT_SCHEDULE.breaks) {
                const result = await createSingleTimeSlot(
                    school.id,
                    day,
                    breakSlot.period,
                    breakSlot.name,
                    breakSlot.startTime,
                    breakSlot.endTime,
                    true,
                    breakSlot.breakType
                )
                
                if (result.success) {
                    console.log(`   ✅ Created: ${breakSlot.name}`)
                    createdCount++
                } else {
                    console.log(`   ⚠️  Skipped: ${result.error}`)
                    failedCount++
                }
            }
            
            // Create periods
            for (const period of DEFAULT_SCHEDULE.periods) {
                const result = await createSingleTimeSlot(
                    school.id,
                    day,
                    period.period,
                    period.name,
                    period.startTime,
                    period.endTime,
                    false,
                    null
                )
                
                if (result.success) {
                    console.log(`   ✅ Created: ${period.name}`)
                    createdCount++
                } else {
                    console.log(`   ⚠️  Skipped: ${result.error}`)
                    failedCount++
                }
            }
        }
        
        console.log(`\n📊 SETUP SUMMARY:`)
        console.log(`✅ Successfully created: ${createdCount} time slots`)
        console.log(`⚠️  Skipped/Failed: ${failedCount} time slots`)
        
        // Verify the final count
        const finalCount = await db.timeSlot.count({
            where: {
                schoolId: school.id,
                isActive: true
            }
        })
        
        console.log(`🔍 Final verification: ${finalCount} time slots exist`)
        
        // Show sample Monday schedule
        const mondaySlots = await db.timeSlot.findMany({
            where: {
                schoolId: school.id,
                day: 'Monday',
                isActive: true
            },
            orderBy: [
                { period: 'asc' },
                { startTime: 'asc' }
            ]
        })
        
        console.log(`\n📅 Sample Monday Schedule:`)
        mondaySlots.forEach(slot => {
            const time = `${slot.startTime.toTimeString().slice(0, 5)}-${slot.endTime.toTimeString().slice(0, 5)}`
            const type = slot.isBreak ? '☕' : '📚'
            console.log(`   ${type} ${slot.name}: ${time}`)
        })
        
    } catch (error) {
        console.error('💥 Error setting up time slots:', error)
    } finally {
        await db.$disconnect()
    }
}

// Run the setup
setupRudabukirwaTimeSlots()
    .then(() => {
        console.log('\n🎉 Step-by-step setup completed!')
    })
    .catch(error => {
        console.error('💥 Setup failed:', error)
        process.exit(1)
    })