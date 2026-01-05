import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function debugUserSession() {
    try {
        console.log('🔍 Debugging user session and time slots...\n')
        
        // Get all users to see what school IDs exist
        const users = await db.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                schoolId: true,
                isActive: true,
                school: {
                    select: {
                        id: true,
                        name: true,
                        status: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })
        
        console.log('👥 All Users:')
        users.forEach(user => {
            console.log(`   ${user.name} (${user.email})`)
            console.log(`   Role: ${user.role}, School: ${user.school?.name || 'No School'}, Active: ${user.isActive}`)
            console.log(`   School ID: ${user.schoolId}`)
            console.log('')
        })
        
        // Get all schools and their time slot counts
        const schools = await db.school.findMany({
            select: {
                id: true,
                name: true,
                status: true,
                _count: {
                    select: {
                        timeSlots: {
                            where: { isActive: true }
                        }
                    }
                }
            }
        })
        
        console.log('🏫 Schools and Time Slots:')
        schools.forEach(school => {
            console.log(`   ${school.name} (${school.status})`)
            console.log(`   Time Slots: ${school._count.timeSlots}`)
            console.log(`   School ID: ${school.id}`)
            console.log('')
        })
        
        // Check specific time slots for each school
        for (const school of schools) {
            const timeSlots = await db.timeSlot.findMany({
                where: {
                    schoolId: school.id,
                    isActive: true
                },
                orderBy: [
                    { day: 'asc' },
                    { period: 'asc' }
                ]
            })
            
            console.log(`📅 Time slots for ${school.name}:`)
            if (timeSlots.length === 0) {
                console.log('   ❌ No time slots found')
            } else {
                // Group by day
                const slotsByDay = {}
                timeSlots.forEach(slot => {
                    if (!slotsByDay[slot.day]) {
                        slotsByDay[slot.day] = []
                    }
                    slotsByDay[slot.day].push(slot)
                })
                
                Object.keys(slotsByDay).forEach(day => {
                    console.log(`   ${day}: ${slotsByDay[day].length} slots`)
                })
            }
            console.log('')
        }
        
    } catch (error) {
        console.error('💥 Error:', error)
    } finally {
        await db.$disconnect()
    }
}

debugUserSession()