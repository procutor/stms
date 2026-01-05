import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// Default time slots configuration based on GS GIKOMERO TSS
const DEFAULT_TIME_SLOTS = {
    schedule: {
        start: '07:45',
        end: '18:50',
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    },
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
        { period: 0, name: 'Morning Break', startTime: '10:00', endTime: '10:15', breakType: 'SHORT_BREAK' },
        { period: 0, name: 'Lunch Break', startTime: '12:15', endTime: '13:00', breakType: 'LUNCH_BREAK' },
        { period: 0, name: 'Afternoon Break', startTime: '15:15', endTime: '15:30', breakType: 'SHORT_BREAK' },
        { period: 0, name: 'Assembly', startTime: '08:00', endTime: '08:15', breakType: 'ASSEMBLY' }
    ]
}

async function createTimeSlotsForSchool(schoolId) {
    const timeSlots = []
    
    for (const day of DEFAULT_TIME_SLOTS.schedule.days) {
        // Add breaks first
        for (const breakSlot of DEFAULT_TIME_SLOTS.breaks) {
            timeSlots.push({
                schoolId,
                day,
                period: breakSlot.period,
                name: breakSlot.name,
                startTime: new Date(`1970-01-01T${breakSlot.startTime}`),
                endTime: new Date(`1970-01-01T${breakSlot.endTime}`),
                session: 'AM', // Default session
                isBreak: true,
                breakType: breakSlot.breakType,
                isActive: true
            })
        }
        
        // Add periods
        for (const period of DEFAULT_TIME_SLOTS.periods) {
            const session = parseInt(period.startTime.split(':')[0]) < 12 ? 'AM' : 'PM'
            timeSlots.push({
                schoolId,
                day,
                period: period.period,
                name: period.name,
                startTime: new Date(`1970-01-01T${period.startTime}`),
                endTime: new Date(`1970-01-01T${period.endTime}`),
                session,
                isBreak: false,
                breakType: null,
                isActive: true
            })
        }
    }
    
    return timeSlots
}

async function setupRudabukirwaTimeSlots() {
    try {
        console.log('🏫 Setting up time slots for GS RUDAKABUKIRWA...')
        
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
        
        // Check existing slots
        const existingSlots = await db.timeSlot.count({
            where: {
                schoolId: school.id,
                isActive: true
            }
        })
        
        if (existingSlots > 0) {
            console.log(`⚠️  School already has ${existingSlots} time slots`)
            return
        }
        
        // Create time slots
        const timeSlots = await createTimeSlotsForSchool(school.id)
        
        console.log(`📝 Creating ${timeSlots.length} time slots...`)
        
        const createdSlots = await db.timeSlot.createMany({
            data: timeSlots
        })
        
        console.log(`✅ Successfully created ${createdSlots.count} time slots for GS RUDAKABUKIRWA`)
        
        // Verify the creation
        const verifySlots = await db.timeSlot.count({
            where: {
                schoolId: school.id,
                isActive: true
            }
        })
        
        console.log(`🔍 Verification: ${verifySlots} time slots now exist for the school`)
        
        // Show sample schedule
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
        
        console.log(`\n📅 Sample Schedule for Monday:`)
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
        console.log('\n🎉 Setup completed!')
    })
    .catch(error => {
        console.error('💥 Setup failed:', error)
        process.exit(1)
    })