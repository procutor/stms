import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function checkRudabukirwaSlots() {
    try {
        console.log('🔍 Checking existing time slots for GS RUDAKABUKIRWA...')
        
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
        const existingSlots = await db.timeSlot.findMany({
            where: {
                schoolId: school.id,
                isActive: true
            },
            orderBy: [
                { day: 'asc' },
                { period: 'asc' },
                { startTime: 'asc' }
            ]
        })
        
        console.log(`📊 Found ${existingSlots.length} existing time slots:`)
        
        if (existingSlots.length > 0) {
            // Group by day
            const slotsByDay = {}
            existingSlots.forEach(slot => {
                if (!slotsByDay[slot.day]) {
                    slotsByDay[slot.day] = []
                }
                slotsByDay[slot.day].push(slot)
            })
            
            Object.keys(slotsByDay).forEach(day => {
                console.log(`\n📅 ${day}:`)
                slotsByDay[day].forEach(slot => {
                    const time = `${slot.startTime.toTimeString().slice(0, 5)}-${slot.endTime.toTimeString().slice(0, 5)}`
                    const type = slot.isBreak ? '☕' : '📚'
                    console.log(`   ${type} Period ${slot.period}: ${slot.name} (${time})`)
                })
            })
        } else {
            console.log('✅ No existing time slots found')
        }
        
    } catch (error) {
        console.error('💥 Error checking time slots:', error)
    } finally {
        await db.$disconnect()
    }
}

checkRudabukirwaSlots()