/**
 * Test script for automatic time slot creation functionality
 * This demonstrates how the time slot system works and can be used for testing
 */

import { db } from './src/lib/db'
import { createSchoolTimeSlots } from './src/lib/create-school-time-slots'

async function testTimeSlotSetup() {
    console.log('🧪 Testing Time Slot Setup Functionality\n')

    try {
        // Get all approved schools
        const schools = await db.school.findMany({
            where: { status: 'APPROVED' },
            select: {
                id: true,
                name: true,
                type: true,
                _count: {
                    select: {
                        timeSlots: { where: { isActive: true } }
                    }
                }
            }
        })

        console.log(`📋 Found ${schools.length} approved schools:`)
        schools.forEach(school => {
            console.log(`   • ${school.name} (${school.type}) - ${school._count.timeSlots} time slots`)
        })

        if (schools.length === 0) {
            console.log('\n⚠️  No approved schools found. Creating a test scenario...')
            return
        }

        // Find a school that needs time slots
        const schoolNeedingSlots = schools.find(school => school._count.timeSlots === 0)

        if (!schoolNeedingSlots) {
            console.log('\n✅ All schools already have time slots!')
            
            // Show detailed breakdown for the first school
            const firstSchool = schools[0]
            const timeSlots = await db.timeSlot.findMany({
                where: { 
                    schoolId: firstSchool.id, 
                    isActive: true 
                },
                orderBy: [
                    { day: 'asc' },
                    { period: 'asc' }
                ]
            })

            console.log(`\n📊 Time slot breakdown for ${firstSchool.name}:`)
            console.log(`   Total slots: ${timeSlots.length}`)
            
            const periods = timeSlots.filter(ts => ts.period > 0)
            const breaks = timeSlots.filter(ts => ts.isBreak)
            
            console.log(`   Teaching periods: ${periods.length}`)
            console.log(`   Breaks/Assembly: ${breaks.length}`)
            
            console.log(`\n📅 Sample schedule (Monday):`)
            const mondaySlots = timeSlots.filter(ts => ts.day === 'MONDAY')
            mondaySlots.forEach(slot => {
                const time = `${slot.startTime.toTimeString().slice(0, 5)}-${slot.endTime.toTimeString().slice(0, 5)}`
                console.log(`   ${slot.period > 0 ? 'P' + slot.period : 'Break'}: ${time} (${slot.name})`)
            })
            
        } else {
            console.log(`\n🏫 Testing time slot creation for: ${schoolNeedingSlots.name}`)
            console.log(`   Current slots: ${schoolNeedingSlots._count.timeSlots}`)
            
            // Test the creation function
            const result = await createSchoolTimeSlots(schoolNeedingSlots.id)
            
            if (result.success) {
                console.log(`   ✅ Successfully created ${result.count} time slots!`)
                
                // Verify the creation
                const newCount = await db.timeSlot.count({
                    where: { 
                        schoolId: schoolNeedingSlots.id, 
                        isActive: true 
                    }
                })
                console.log(`   📊 Verified: ${newCount} active time slots`)
                
            } else {
                console.log(`   ❌ Failed: ${result.error}`)
            }
        }

        console.log('\n🎯 Time Slot Features Available:')
        console.log('   • Automatic creation for all schools')
        console.log('   • Editable individual time slots')
        console.log('   • Period overlap validation')
        console.log('   • Break and assembly periods')
        console.log('   • Multiple sessions (Morning, Afternoon, Evening)')
        console.log('   • School-specific configuration')

        console.log('\n🔧 API Endpoints:')
        console.log('   • POST /api/setup-time-slots (School Admin - own school)')
        console.log('   • POST /api/setup-time-slots-all (Super Admin - all schools)')
        console.log('   • GET /api/setup-time-slots (Check status)')
        console.log('   • GET /api/setup-time-slots-all (Super Admin - all schools status)')
        console.log('   • GET /api/time-slots (List time slots)')
        console.log('   • POST /api/time-slots (Create single slot)')
        console.log('   • PATCH /api/time-slots/[id] (Edit slot)')
        console.log('   • DELETE /api/time-slots/[id] (Delete slot)')

    } catch (error) {
        console.error('❌ Test failed:', error)
    } finally {
        await db.$disconnect()
    }
}

// Run the test
testTimeSlotSetup()