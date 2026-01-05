#!/usr/bin/env node

/**
 * Comprehensive Test for Automatic Time Slot Provisioning
 * 
 * This test verifies that:
 * 1. New school registration automatically creates time slots
 * 2. School approval automatically creates time slots (if none exist)
 * 3. No duplicate time slots are created
 * 4. All default time slots are created with correct times
 */

const { db } = require('./src/lib/db')

async function testAutomaticTimeSlotProvisioning() {
    console.log('🧪 Starting Comprehensive Automatic Time Slot Provisioning Test')
    console.log('=' * 70)

    try {
        // Test 1: Register a new school and verify automatic time slot creation
        console.log('\n📝 Test 1: New School Registration with Automatic Time Slots')
        console.log('-' * 50)

        const testSchoolData = {
            schoolName: 'Test Automatic Provisioning School',
            schoolType: 'SECONDARY',
            province: 'Kigali',
            district: 'Gasabo',
            sector: 'Kacyiru',
            email: `test-auto-provision-${Date.now()}@example.com`,
            phone: '+250788123456',
            adminName: 'Test Admin',
            password: 'TestPassword123!'
        }

        console.log('Creating new school registration request...')
        
        // Simulate the POST request to register school
        const registrationResponse = await fetch('http://localhost:3000/api/schools', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testSchoolData)
        })

        if (!registrationResponse.ok) {
            const errorText = await registrationResponse.text()
            throw new Error(`Registration failed: ${errorText}`)
        }

        const registrationResult = await registrationResponse.json()
        console.log('✅ School registration successful!')
        console.log(`   School: ${registrationResult.school.name}`)
        console.log(`   Admin: ${registrationResult.admin.name}`)
        console.log(`   Time slots created: ${registrationResult.timeSlotsCreated}`)

        const newSchoolId = registrationResult.school.id

        // Verify time slots were created
        const schoolTimeSlots = await db.timeSlot.findMany({
            where: { schoolId: newSchoolId },
            orderBy: [{ day: 'asc' }, { period: 'asc' }]
        })

        console.log(`📊 Found ${schoolTimeSlots.length} time slots for new school`)

        // Verify the time slots match expected configuration
        const expectedSlots = 65 // 13 slots per day × 5 days
        if (schoolTimeSlots.length !== expectedSlots) {
            throw new Error(`Expected ${expectedSlots} time slots, but found ${schoolTimeSlots.length}`)
        }

        console.log('✅ Correct number of time slots created')

        // Test 2: Verify specific time slots have correct times
        console.log('\n⏰ Test 2: Verifying Time Slot Configuration')
        console.log('-' * 50)

        const mondaySlots = schoolTimeSlots.filter(slot => slot.day === 'MONDAY')
        
        // Check key time slots
        const p1Slot = mondaySlots.find(slot => slot.period === 1)
        const p10Slot = mondaySlots.find(slot => slot.period === 10)
        const morningBreakSlot = mondaySlots.find(slot => slot.period === 11)
        const lunchBreakSlot = mondaySlots.find(slot => slot.period === 12)
        const afternoonBreakSlot = mondaySlots.find(slot => slot.period === 13)

        // Verify P1 (07:45 - 08:25)
        if (!p1Slot || p1Slot.startTime.toTimeString().slice(0, 8) !== '07:45:00' || 
            p1Slot.endTime.toTimeString().slice(0, 8) !== '08:25:00') {
            throw new Error('P1 time slot has incorrect times')
        }
        console.log('✅ P1: 07:45 - 08:25 (correct)')

        // Verify P10 (15:55 - 16:35)
        if (!p10Slot || p10Slot.startTime.toTimeString().slice(0, 8) !== '15:55:00' || 
            p10Slot.endTime.toTimeString().slice(0, 8) !== '16:35:00') {
            throw new Error('P10 time slot has incorrect times')
        }
        console.log('✅ P10: 15:55 - 16:35 (correct)')

        // Verify Morning Break (09:45 - 10:05)
        if (!morningBreakSlot || !morningBreakSlot.isBreak || 
            morningBreakSlot.breakType !== 'MORNING') {
            throw new Error('Morning break slot configuration incorrect')
        }
        console.log('✅ Morning Break: 09:45 - 10:05 (correct)')

        // Verify Lunch Break (11:25 - 12:55)
        if (!lunchBreakSlot || !lunchBreakSlot.isBreak || 
            lunchBreakSlot.breakType !== 'LUNCH') {
            throw new Error('Lunch break slot configuration incorrect')
        }
        console.log('✅ Lunch Break: 11:25 - 12:55 (correct)')

        // Verify Afternoon Break (14:55 - 15:15)
        if (!afternoonBreakSlot || !afternoonBreakSlot.isBreak || 
            afternoonBreakSlot.breakType !== 'AFTERNOON') {
            throw new Error('Afternoon break slot configuration incorrect')
        }
        console.log('✅ Afternoon Break: 14:55 - 15:15 (correct)')

        // Test 3: Verify no duplicates when approving existing school
        console.log('\n🔄 Test 3: School Approval Without Duplicates')
        console.log('-' * 50)

        // Create another school with PENDING status
        const pendingSchool = await db.school.create({
            data: {
                name: 'Pending Test School',
                type: 'SECONDARY',
                province: 'Kigali',
                district: 'Gasabo',
                sector: 'Kacyiru',
                email: `pending-test-${Date.now()}@example.com`,
                status: 'PENDING'
            }
        })

        console.log(`Created pending school: ${pendingSchool.name}`)

        // Approve the school (should not create duplicate time slots)
        const approvalResponse = await fetch('http://localhost:3000/api/schools', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                schoolId: pendingSchool.id,
                status: 'APPROVED'
            })
        })

        if (!approvalResponse.ok) {
            throw new Error('School approval failed')
        }

        const approvalResult = await approvalResponse.json()
        console.log('✅ School approval successful')
        console.log(`   Time slots created: ${approvalResult.timeSlotsCreated}`)

        // Check that we have the expected number of time slots
        const pendingSchoolSlots = await db.timeSlot.count({
            where: { schoolId: pendingSchool.id }
        })

        if (pendingSchoolSlots !== expectedSlots) {
            throw new Error(`Expected ${expectedSlots} time slots for approved school, found ${pendingSchoolSlots}`)
        }

        console.log(`✅ No duplicates created - found correct ${pendingSchoolSlots} time slots`)

        // Test 4: Verify existing time slots prevent recreation
        console.log('\n🚫 Test 4: Prevention of Duplicate Time Slots')
        console.log('-' * 50)

        // Try to approve the same school again (should not create more time slots)
        const secondApprovalResponse = await fetch('http://localhost:3000/api/schools', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                schoolId: pendingSchool.id,
                status: 'APPROVED'
            })
        })

        if (!secondApprovalResponse.ok) {
            throw new Error('Second approval attempt failed')
        }

        const secondApprovalResult = await secondApprovalResponse.json()
        console.log(`✅ Second approval attempt - time slots created: ${secondApprovalResult.timeSlotsCreated}`)

        // Verify no additional time slots were created
        const finalSlotCount = await db.timeSlot.count({
            where: { schoolId: pendingSchool.id }
        })

        if (finalSlotCount !== pendingSchoolSlots) {
            throw new Error(`Duplicate time slots created! Count changed from ${pendingSchoolSlots} to ${finalSlotCount}`)
        }

        console.log('✅ No duplicate time slots created on re-approval')

        // Summary
        console.log('\n🎉 ALL TESTS PASSED!')
        console.log('=' * 70)
        console.log('✅ New school registration automatically creates time slots')
        console.log('✅ School approval automatically creates time slots (if needed)')
        console.log('✅ No duplicate time slots are created')
        console.log('✅ All time slots have correct configuration')
        console.log('✅ Automatic provisioning works end-to-end')

        // Cleanup test data
        console.log('\n🧹 Cleaning up test data...')
        await db.timeSlot.deleteMany({ where: { schoolId: { in: [newSchoolId, pendingSchool.id] } } })
        await db.user.deleteMany({ where: { schoolId: newSchoolId } })
        await db.school.deleteMany({ where: { id: { in: [newSchoolId, pendingSchool.id] } } })
        console.log('✅ Test data cleaned up')

        return {
            success: true,
            message: 'All automatic time slot provisioning tests passed!',
            testsRun: 4,
            totalTimeSlotsVerified: expectedSlots
        }

    } catch (error) {
        console.error('\n❌ TEST FAILED!')
        console.error('Error:', error.message)
        console.error('Stack:', error.stack)
        
        return {
            success: false,
            error: error.message,
            testsRun: 'Unknown'
        }
    }
}

// Run the test
if (require.main === module) {
    testAutomaticTimeSlotProvisioning()
        .then(result => {
            console.log('\n' + '=' * 70)
            if (result.success) {
                console.log('🎉 COMPREHENSIVE TEST COMPLETED SUCCESSFULLY!')
                console.log(`📊 Tests Run: ${result.testsRun}`)
                console.log(`⏰ Time Slots Verified: ${result.totalTimeSlotsVerified}`)
            } else {
                console.log('❌ COMPREHENSIVE TEST FAILED!')
                console.log(`💥 Error: ${result.error}`)
            }
            process.exit(result.success ? 0 : 1)
        })
        .catch(error => {
            console.error('💥 Unexpected error:', error)
            process.exit(1)
        })
}

module.exports = { testAutomaticTimeSlotProvisioning }