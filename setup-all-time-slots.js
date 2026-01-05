import fetch from 'node-fetch'

const SUPABASE_URL = 'http://localhost:3000'
const SUPER_ADMIN_EMAIL = 'damascenetugireyezu@gmail.com'

async function setupAllTimeSlots() {
    try {
        console.log('🚀 Starting authentication and bulk time slots setup...')
        
        // Step 1: Authenticate as Super Admin
        console.log('🔐 Authenticating as Super Admin...')
        const authResponse = await fetch(`${SUPABASE_URL}/api/auth/signin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: SUPER_ADMIN_EMAIL,
                password: 'SuperAdmin123!',
                redirect: false
            })
        })
        
        if (!authResponse.ok) {
            console.error('❌ Authentication failed:', await authResponse.text())
            return
        }
        
        const authData = await authResponse.json()
        console.log('✅ Authentication successful')
        
        // Extract cookies from auth response
        const setCookieHeader = authResponse.headers.get('set-cookie')
        if (!setCookieHeader) {
            console.error('❌ No authentication cookies received')
            return
        }
        
        // Step 2: Call bulk time slots setup API
        console.log('⏰ Setting up time slots for all schools...')
        const setupResponse = await fetch(`${SUPABASE_URL}/api/setup-time-slots-all`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': setCookieHeader
            }
        })
        
        if (!setupResponse.ok) {
            const errorText = await setupResponse.text()
            console.error('❌ Bulk setup failed:', errorText)
            return
        }
        
        const setupData = await setupResponse.json()
        console.log('✅ Bulk setup completed successfully!')
        console.log('\n📊 SETUP SUMMARY:')
        console.log(`📋 Total schools processed: ${setupData.totalSchools}`)
        console.log(`✅ Successful schools: ${setupData.successfulSchools}`)
        console.log(`❌ Failed schools: ${setupData.failedSchools}`)
        console.log(`⏭️  Skipped schools: ${setupData.skippedSchools}`)
        console.log(`📝 Total time slots created: ${setupData.totalSlotsCreated}`)
        
        if (setupData.results && setupData.results.length > 0) {
            console.log('\n🏫 DETAILED RESULTS:')
            setupData.results.forEach(result => {
                const status = result.status === 'success' ? '✅' : 
                             result.status === 'failed' ? '❌' : '⏭️'
                console.log(`${status} ${result.schoolName}: ${result.status}`)
                if (result.error) {
                    console.log(`   Error: ${result.error}`)
                }
                if (result.slotsCreated > 0) {
                    console.log(`   Slots created: ${result.slotsCreated}`)
                }
            })
        }
        
    } catch (error) {
        console.error('💥 Error during setup:', error)
    }
}

setupAllTimeSlots()