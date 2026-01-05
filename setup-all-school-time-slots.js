import { db } from './src/lib/db'
import { createSchoolTimeSlots } from './src/lib/create-school-time-slots'

/**
 * Utility script to automatically set up time slots for all approved schools
 * This can be run directly with: node setup-all-school-time-slots.js
 */

async function setupAllSchoolTimeSlots() {
    console.log('🚀 Starting automatic time slot setup for all schools...\n')

    try {
        // Get all approved schools
        const schools = await db.school.findMany({
            where: {
                status: 'APPROVED'
            },
            select: {
                id: true,
                name: true,
                type: true
            }
        })

        console.log(`📋 Found ${schools.length} approved schools to process\n`)

        let totalCreatedSlots = 0
        let successfulSchools = 0
        let failedSchools = 0
        let skippedSchools = 0

        // Process each school
        for (const school of schools) {
            try {
                console.log(`🏫 Processing: ${school.name} (${school.type})`)
                
                // Check if school already has time slots
                const existingSlots = await db.timeSlot.count({
                    where: {
                        schoolId: school.id,
                        isActive: true
                    }
                })

                if (existingSlots > 0) {
                    console.log(`   ⏭️  Already has ${existingSlots} time slots - skipping\n`)
                    skippedSchools++
                    continue
                }

                // Create time slots for this school
                const result = await createSchoolTimeSlots(school.id)

                if (result.success) {
                    const slotsCount = result.count || 0
                    console.log(`   ✅ Successfully created ${slotsCount} time slots\n`)
                    totalCreatedSlots += slotsCount
                    successfulSchools++
                } else {
                    console.log(`   ❌ Failed: ${result.error}\n`)
                    failedSchools++
                }

            } catch (schoolError) {
                console.error(`   💥 Error: ${schoolError}\n`)
                failedSchools++
            }
        }

        // Final summary
        console.log('=' .repeat(60))
        console.log('📊 SETUP SUMMARY')
        console.log('=' .repeat(60))
        console.log(`✅ Successful schools: ${successfulSchools}`)
        console.log(`❌ Failed schools: ${failedSchools}`)
        console.log(`⏭️  Skipped schools: ${skippedSchools}`)
        console.log(`📝 Total time slots created: ${totalCreatedSlots}`)
        console.log(`🏫 Total schools processed: ${schools.length}`)
        
        if (successfulSchools > 0) {
            console.log('\n🎉 Time slot setup completed successfully!')
            console.log('All approved schools now have default time slots configured.')
        } else {
            console.log('\n⚠️  No new time slots were created.')
            console.log('This might be because all schools already have time slots.')
        }

    } catch (error) {
        console.error('💥 Fatal error during setup:', error)
        process.exit(1)
    } finally {
        await db.$disconnect()
    }
}

// Run the setup
setupAllSchoolTimeSlots()