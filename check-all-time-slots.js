import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function checkAllTimeSlots() {
    try {
        console.log('🔍 Checking time slots for all schools...\n')
        
        const schools = await db.school.findMany({
            where: {
                status: 'APPROVED'
            },
            select: {
                id: true,
                name: true,
                type: true
            },
            orderBy: {
                name: 'asc'
            }
        })
        
        for (const school of schools) {
            const timeSlots = await db.timeSlot.findMany({
                where: {
                    schoolId: school.id,
                    isActive: true
                },
                orderBy: [
                    { day: 'asc' },
                    { period: 'asc' }
                ]
            })
            
            const periodCount = timeSlots.filter(ts => !ts.isBreak).length
            const breakCount = timeSlots.filter(ts => ts.isBreak).length
            
            console.log(`🏫 ${school.name} (${school.type})`)
            console.log(`   📊 Time Slots: ${timeSlots.length} total`)
            console.log(`   📚 Periods: ${periodCount}`)
            console.log(`   ☕ Breaks: ${breakCount}`)
            
            if (timeSlots.length === 0) {
                console.log(`   ⚠️  NEEDS SETUP - No time slots configured`)
            } else {
                // Show sample schedule for one day
                const mondaySlots = timeSlots.filter(ts => ts.day === 'Monday')
                if (mondaySlots.length > 0) {
                    console.log(`   📅 Sample (Monday):`)
                    mondaySlots.slice(0, 5).forEach(slot => {
                        const time = `${slot.startTime.toTimeString().slice(0, 5)}-${slot.endTime.toTimeString().slice(0, 5)}`
                        const type = slot.isBreak ? '☕' : '📚'
                        console.log(`      ${type} ${slot.name}: ${time}`)
                    })
                }
            }
            console.log('')
        }
        
    } catch (error) {
        console.error('Error checking time slots:', error)
    } finally {
        await db.$disconnect()
    }
}

checkAllTimeSlots()