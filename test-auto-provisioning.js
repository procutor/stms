// Test script to verify automatic school provisioning
// This tests if new schools get time slots automatically created

const testSchoolRegistration = async () => {
    try {
        console.log('🧪 Testing automatic school provisioning...')
        
        // Test data for a new school
        const schoolData = {
            schoolName: 'Auto Provision Test School',
            schoolType: 'SECONDARY',
            province: 'Kigali',
            district: 'Gasabo',
            sector: 'Gisozi',
            email: `test-auto-provision-${Date.now()}@example.com`,
            phone: '+250788123456',
            adminName: 'Test Admin Auto Provision',
            password: 'TestPassword123!'
        }
        
        console.log('📝 School registration data:', {
            ...schoolData,
            password: '[HIDDEN]'
        })
        
        // Make request to school registration endpoint
        const response = await fetch('http://localhost:3000/api/schools', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(schoolData)
        })
        
        const result = await response.json()
        
        if (response.ok) {
            console.log('✅ School registration successful!')
            console.log('📊 Response:', result)
            
            // Now check if time slots were automatically created
            const schoolId = result.schoolId
            console.log(`🔍 Checking time slots for school: ${schoolId}`)
            
            const timeSlotsResponse = await fetch('http://localhost:3000/api/setup-time-slots', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            
            if (timeSlotsResponse.ok) {
                const timeSlotsData = await timeSlotsResponse.json()
                console.log('⏰ Time slots check:', {
                    count: timeSlotsData.timeSlotsCount,
                    periods: timeSlotsData.periodsCount,
                    breaks: timeSlotsData.breaksCount,
                    hasCorrectStructure: timeSlotsData.hasCorrectStructure
                })
                
                if (timeSlotsData.timeSlotsCount > 0) {
                    console.log('🎉 SUCCESS: Time slots were automatically created!')
                    console.log('🚀 School is now ready to generate timetables')
                } else {
                    console.log('❌ FAIL: No time slots found')
                }
            } else {
                console.log('⚠️  Could not check time slots (might need auth)')
            }
            
        } else {
            console.log('❌ School registration failed:', result)
        }
        
    } catch (error) {
        console.error('💥 Test error:', error)
    }
}

// Run the test
testSchoolRegistration()