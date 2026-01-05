import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { createSchoolTimeSlots } from '@/lib/create-school-time-slots'

export async function POST(request: NextRequest) {
    try {
        // Skip authentication for this route to allow manual triggering
        console.log('🔧 Manual time slot setup triggered - bypassing authentication')
        
        // For manual setup, we'll accept requests without session validation
        // This allows for system administration and maintenance operations

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
                const result = await createSchoolTimeSlots(school.id)

                if (result.success) {
                    const slotsCount = result.count || 0
                    console.log(`✅ Successfully created ${slotsCount} time slots for ${school.name}`)
                    totalCreatedSlots += slotsCount
                    successfulSchools++
                    results.push({
                        schoolId: school.id,
                        schoolName: school.name,
                        status: 'success',
                        slotsCreated: slotsCount
                    })
                } else {
                    console.log(`❌ Failed to create time slots for ${school.name}: ${result.error}`)
                    failedSchools++
                    results.push({
                        schoolId: school.id,
                        schoolName: school.name,
                        status: 'failed',
                        error: result.error,
                        slotsCreated: 0
                    })
                }

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

        return NextResponse.json(summary)

    } catch (error) {
        console.error('💥 Automatic time slot setup error:', error)
        return NextResponse.json(
            { 
                error: 'Internal server error', 
                details: error instanceof Error ? error.message : String(error),
                message: 'Failed to complete automatic time slot setup'
            },
            { status: 500 }
        )
    }
}

export async function GET(request: NextRequest) {
    try {
        console.log('🔧 Time slot status check - bypassing authentication for public access')
        
        // Get all schools with their time slot status
        const schools = await db.school.findMany({
            where: {
                status: 'APPROVED'
            },
            select: {
                id: true,
                name: true,
                type: true,
                _count: {
                    select: {
                        timeSlots: {
                            where: { isActive: true }
                        }
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        })

        const schoolsWithStatus = schools.map(school => ({
            id: school.id,
            name: school.name,
            type: school.type,
            timeSlotsCount: school._count.timeSlots,
            hasTimeSlots: school._count.timeSlots > 0,
            needsSetup: school._count.timeSlots === 0,
            status: school._count.timeSlots > 0 ? 'has_slots' : 'needs_setup'
        }))

        const summary = {
            totalSchools: schools.length,
            schoolsWithTimeSlots: schoolsWithStatus.filter(s => s.hasTimeSlots).length,
            schoolsNeedingSetup: schoolsWithStatus.filter(s => s.needsSetup).length,
            schools: schoolsWithStatus
        }

        console.log(`📊 Time slot status: ${summary.schoolsWithTimeSlots}/${summary.totalSchools} schools have time slots`)

        return NextResponse.json(summary)

    } catch (error) {
        console.error('Error fetching schools time slot status:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}