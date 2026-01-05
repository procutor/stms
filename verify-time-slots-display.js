/**
 * Script to verify time slots are properly set up and troubleshoot display issues
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function verifyTimeSlotsDisplay() {
    console.log('🔍 VERIFYING TIME SLOTS SETUP AND DISPLAY...\n')

    try {
        // Get all approved schools with their time slots
        const schools = await db.school.findMany({
            where: { status: 'APPROVED' },
            select: {
                id: true,
                name: true,
                type: true,
                timeSlots: {
                    where: { isActive: true },
                    orderBy: [
                        { day: 'asc' },
                        { period: 'asc' }
                    ]
                }
            }
        })

        console.log(`📋 Found ${schools.length} approved schools\n`)

        for (const school of schools) {
            console.log(`🏫 ${school.name} (${school.type})`)
            console.log(`   Time Slots Count: ${school.timeSlots.length}`)
            
            if (school.timeSlots.length > 0) {
                // Group by day to show the schedule
                const slotsByDay = {}
                school.timeSlots.forEach(slot => {
                    if (!slotsByDay[slot.day]) {
                        slotsByDay[slot.day] = []
                    }
                    slotsByDay[slot.day].push(slot)
                })

                console.log(`   Schedule Overview:`)
                Object.keys(slotsByDay).forEach(day => {
                    const daySlots = slotsByDay[day]
                    const periods = daySlots.filter(s => s.period > 0).length
                    const breaks = daySlots.filter(s => s.isBreak).length
                    console.log(`     ${day}: ${periods} periods + ${breaks} breaks = ${daySlots.length} total`)
                })

                // Show sample Monday slots
                const mondaySlots = slotsByDay['MONDAY'] || []
                if (mondaySlots.length > 0) {
                    console.log(`   Sample Monday Schedule:`)
                    mondaySlots.slice(0, 5).forEach(slot => {
                        const time = `${slot.startTime.toTimeString().slice(0, 5)}-${slot.endTime.toTimeString().slice(0, 5)}`
                        console.log(`     ${slot.period > 0 ? 'P' + slot.period : 'Break'}: ${time} (${slot.name})`)
                    })
                    if (mondaySlots.length > 5) {
                        console.log(`     ... and ${mondaySlots.length - 5} more slots`)
                    }
                }
            } else {
                console.log(`   ⚠️  NO TIME SLOTS FOUND!`)
            }
            console.log()
        }

        // Check if there are any inactive time slots that might be causing issues
        const inactiveSlots = await db.timeSlot.count({
            where: { isActive: false }
        })
        
        if (inactiveSlots > 0) {
            console.log(`⚠️  Found ${inactiveSlots} inactive time slots in database`)
            console.log(`   These might be old entries that weren't properly cleaned up`)
        }

        console.log('=' .repeat(60))
        console.log('📊 SUMMARY')
        console.log('=' .repeat(60))
        
        const totalActiveSlots = schools.reduce((sum, school) => sum + school.timeSlots.length, 0)
        console.log(`✅ Total active time slots across all schools: ${totalActiveSlots}`)
        console.log(`✅ Schools with time slots: ${schools.filter(s => s.timeSlots.length > 0).length}`)
        console.log(`✅ Schools without time slots: ${schools.filter(s => s.timeSlots.length === 0).length}`)
        
        if (totalActiveSlots > 0) {
            console.log('\n🎉 TIME SLOTS ARE PROPERLY SET UP!')
            console.log('If you don\'t see them in the dashboard:')
            console.log('1. Try refreshing the page')
            console.log('2. Log out and log back in')
            console.log('3. Check if you\'re logged into the correct school account')
            console.log('4. Clear your browser cache')
        }

    } catch (error) {
        console.error('❌ Error verifying time slots:', error)
    } finally {
        await db.$disconnect()
    }
}

verifyTimeSlotsDisplay()