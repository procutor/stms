import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function checkWorkingSchedule() {
    try {
        console.log('🔍 Checking the actual working schedule from GS GIKOMERO TSS...\n')
        
        // Get GS GIKOMERO TSS time slots (the reference school)
        const gikomeroSlots = await db.timeSlot.findMany({
            where: {
                schoolId: 'cmjiot5c70001lxpmq362y66y', // GS GIKOMERO TSS ID
                isActive: true
            },
            orderBy: [
                { day: 'asc' },
                { period: 'asc' },
                { startTime: 'asc' }
            ]
        })
        
        console.log('📅 GS GIKOMERO TSS Monday Schedule:')
        const mondaySlots = gikomeroSlots.filter(slot => slot.day === 'MONDAY')
        
        mondaySlots.forEach((slot, index) => {
            const time = `${slot.startTime.toTimeString().slice(0, 5)}-${slot.endTime.toTimeString().slice(0, 5)}`
            const type = slot.isBreak ? '☕' : '📚'
            console.log(`   ${String(index + 1).padStart(2, '0')}. ${type} ${slot.name}: ${time}`)
        })
        
        // Analyze the pattern
        const periods = mondaySlots.filter(slot => !slot.isBreak)
        const breaks = mondaySlots.filter(slot => slot.isBreak)
        
        console.log(`\n📊 Schedule Analysis:`)
        console.log(`   Periods: ${periods.length}`)
        console.log(`   Breaks: ${breaks.length}`)
        console.log(`   Total: ${mondaySlots.length} slots per day`)
        
        console.log(`\n📋 Period Details:`)
        periods.forEach(period => {
            console.log(`   Period ${period.period}: ${period.name}`)
        })
        
        console.log(`\n☕ Break Details:`)
        breaks.forEach(breakSlot => {
            console.log(`   ${breakSlot.name} (${breakSlot.breakType})`)
        })
        
    } catch (error) {
        console.error('💥 Error:', error)
    } finally {
        await db.$disconnect()
    }
}

checkWorkingSchedule()