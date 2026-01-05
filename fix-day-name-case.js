import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const DAY_MAPPING = {
    'Monday': 'MONDAY',
    'Tuesday': 'TUESDAY', 
    'Wednesday': 'WEDNESDAY',
    'Thursday': 'THURSDAY',
    'Friday': 'FRIDAY'
}

async function fixDayNameCase() {
    try {
        console.log('🔧 Fixing day name case consistency...\n')
        
        // Find all time slots with title case day names
        const titleCaseSlots = await db.timeSlot.findMany({
            where: {
                day: {
                    in: Object.keys(DAY_MAPPING)
                },
                isActive: true
            }
        })
        
        console.log(`📝 Found ${titleCaseSlots.length} time slots with title case day names`)
        
        if (titleCaseSlots.length === 0) {
            console.log('✅ All day names are already in correct case')
            return
        }
        
        // Group by school to show what will be updated
        const slotsBySchool = {}
        titleCaseSlots.forEach(slot => {
            if (!slotsBySchool[slot.schoolId]) {
                slotsBySchool[slot.schoolId] = []
            }
            slotsBySchool[slot.schoolId].push(slot)
        })
        
        // Get school names for reporting
        const schools = await db.school.findMany({
            where: {
                id: {
                    in: Object.keys(slotsBySchool)
                }
            },
            select: {
                id: true,
                name: true
            }
        })
        
        const schoolMap = {}
        schools.forEach(school => {
            schoolMap[school.id] = school.name
        })
        
        console.log('🏫 Schools to be updated:')
        Object.keys(slotsBySchool).forEach(schoolId => {
            const schoolName = schoolMap[schoolId] || 'Unknown School'
            const slots = slotsBySchool[schoolId]
            const uniqueDays = [...new Set(slots.map(s => s.day))]
            console.log(`   ${schoolName}: ${slots.length} slots (${uniqueDays.join(', ')})`)
        })
        
        // Update each time slot
        let updatedCount = 0
        for (const slot of titleCaseSlots) {
            const newDayName = DAY_MAPPING[slot.day]
            
            await db.timeSlot.update({
                where: { id: slot.id },
                data: { day: newDayName }
            })
            
            updatedCount++
        }
        
        console.log(`\n✅ Successfully updated ${updatedCount} time slots`)
        
        // Verify the fix
        console.log('\n🔍 Verifying fix...')
        const remainingTitleCase = await db.timeSlot.count({
            where: {
                day: {
                    in: Object.keys(DAY_MAPPING)
                },
                isActive: true
            }
        })
        
        if (remainingTitleCase === 0) {
            console.log('✅ All day names are now consistent (all caps)')
        } else {
            console.log(`⚠️  Still found ${remainingTitleCase} title case day names`)
        }
        
        // Show final status for GS RUDAKABUKIRWA
        const rudabukirwaId = 'cmjl8j7ik00i13n3x2fm832nu'
        const rudabukirwaSlots = await db.timeSlot.findMany({
            where: {
                schoolId: rudabukirwaId,
                isActive: true
            },
            orderBy: [
                { day: 'asc' },
                { period: 'asc' }
            ]
        })
        
        const rudabukirwaDays = [...new Set(rudabukirwaSlots.map(s => s.day))]
        console.log(`\n📅 GS RUDAKABUKIRWA now has: ${rudabukirwaDays.join(', ')}`)
        
    } catch (error) {
        console.error('💥 Error fixing day names:', error)
    } finally {
        await db.$disconnect()
    }
}

fixDayNameCase()