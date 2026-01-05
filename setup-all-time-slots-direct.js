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
        { period: 0, name: 'Afternoon Break', startTime: '15:15', endTime: '15:30', breakType: 'SHORT_BREAK' }
    ]
}

async function createTimeSlotsForSchool(schoolId) {
    const timeSlots = []
    
    for (const day of DEFAULT_TIME_SLOTS.schedule.days) {
        // Add breaks
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

async function setupAllTimeSlots() {
    try {
        console.log('🚀 Starting automatic time slot setup for all schools...')
        
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
        
        console.log(`📋 Found ${schools.length} approved schools to process`)
        
        const results = []
        let totalCreatedSlots = 0
        let successfulSchools = 0
        let failedSchools = 0
        
        // Process each school
        for (const school of schools) {
            try {
                console.log(`\n🏫 Processing school: ${school.name} (${school.type})`)
                
                // Check if school already has time slots
                const existingSlots = await db.timeSlot.count({
                    where: {
                        schoolId: school.id,
                        isActive: true
                    }
                })
                
                if (existingSlots > 0) {
                    console.log(`⏭️  School ${school.name} already has ${existingSlots} time slots - skipping`)
                    results.push({
                        schoolId: school.id,
                        schoolName: school.name,
                        status: 'skipped',
                        reason: `Already has ${existingSlots} time slots`,
                        slotsCreated: 0
                    })
                    continue
                }
                
                // Create time slots for this school
                const timeSlots = await createTimeSlotsForSchool(school.id)
                
                const createdSlots = await db.timeSlot.createMany({
                    data: timeSlots
                })
                
                console.log(`✅ Successfully created ${createdSlots.count} time slots for ${school.name}`)
                totalCreatedSlots += createdSlots.count
                successfulSchools++
                results.push({
                    schoolId: school.id,
                    schoolName: school.name,
                    status: 'success',
                    slotsCreated: createdSlots.count
                })
                
            } catch (schoolError) {
                console.error(`💥 Error processing school ${school.name}:`, schoolError)
                failedSchools++
                results.push({
                    schoolId: school.id,
                    schoolName: school.name,
                    status: 'error',
                    error: schoolError instanceof Error ? schoolError.message : String(schoolError),
                    slotsCreated: 0
                })
            }
        }
        
        const summary = {
            message: 'Automatic time slot setup completed',
            totalSchools: schools.length,
            successfulSchools,
            failedSchools,
            skippedSchools: schools.length - successfulSchools - failedSchools,
            totalSlotsCreated: totalCreatedSlots,
            results
        }
        
        console.log('\n📊 SETUP SUMMARY:')
        console.log(`✅ Successful schools: ${successfulSchools}`)
        console.log(`❌ Failed schools: ${failedSchools}`)
        console.log(`⏭️  Skipped schools: ${schools.length - successfulSchools - failedSchools}`)
        console.log(`📝 Total time slots created: ${totalCreatedSlots}`)
        
        return summary
        
    } catch (error) {
        console.error('💥 Automatic time slot setup error:', error)
        throw error
    } finally {
        await db.$disconnect()
    }
}

// Run the setup
setupAllTimeSlots()
    .then(summary => {
        console.log('\n🎉 Setup completed successfully!')
        console.log(JSON.stringify(summary, null, 2))
    })
    .catch(error => {
        console.error('💥 Setup failed:', error)
        process.exit(1)
    })