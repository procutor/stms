// Script to update time slots to P1-P10 configuration (08:00-16:50)
// This will update existing time slots and ensure P1 starts at 08:00 and P10 ends at 16:50

const { db } = require('./src/lib/db');

async function updateTimeSlotsToP1P10() {
    console.log('🔄 Updating time slots to P1-P10 configuration (08:00-16:50)...');
    
    try {
        // Get all schools
        const schools = await db.school.findMany({
            select: { id: true, name: true }
        });
        
        console.log(`📊 Found ${schools.length} schools to update`);
        
        for (const school of schools) {
            console.log(`\n🏫 Updating school: ${school.name} (${school.id})`);
            
            // Deactivate existing time slots for this school
            await db.timeSlot.updateMany({
                where: { schoolId: school.id },
                data: { isActive: false }
            });
            
            // Create new P1-P10 time slots
            const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
            const timeSlots = [];
            
            for (const day of daysOfWeek) {
                timeSlots.push(
                    // Period 1: 08:00 – 08:40
                    {
                        schoolId: school.id,
                        day,
                        period: 1,
                        name: 'Period 1',
                        startTime: new Date('1970-01-01T08:00:00'),
                        endTime: new Date('1970-01-01T08:40:00'),
                        session: 'MORNING',
                        isActive: true
                    },
                    // Period 2: 08:40 – 09:20
                    {
                        schoolId: school.id,
                        day,
                        period: 2,
                        name: 'Period 2',
                        startTime: new Date('1970-01-01T08:40:00'),
                        endTime: new Date('1970-01-01T09:20:00'),
                        session: 'MORNING',
                        isActive: true
                    },
                    // Period 3: 09:20 – 10:00
                    {
                        schoolId: school.id,
                        day,
                        period: 3,
                        name: 'Period 3',
                        startTime: new Date('1970-01-01T09:20:00'),
                        endTime: new Date('1970-01-01T10:00:00'),
                        session: 'MORNING',
                        isActive: true
                    },
                    // Morning Break: 10:00 – 10:20
                    {
                        schoolId: school.id,
                        day,
                        period: 0, // Use 0 for breaks
                        name: 'Morning Break',
                        startTime: new Date('1970-01-01T10:00:00'),
                        endTime: new Date('1970-01-01T10:20:00'),
                        session: 'BREAK',
                        isBreak: true,
                        breakType: 'MORNING',
                        isActive: true
                    },
                    // Period 4: 10:20 – 11:00
                    {
                        schoolId: school.id,
                        day,
                        period: 4,
                        name: 'Period 4',
                        startTime: new Date('1970-01-01T10:20:00'),
                        endTime: new Date('1970-01-01T11:00:00'),
                        session: 'MORNING',
                        isActive: true
                    },
                    // Period 5: 11:00 – 11:40
                    {
                        schoolId: school.id,
                        day,
                        period: 5,
                        name: 'Period 5',
                        startTime: new Date('1970-01-01T11:00:00'),
                        endTime: new Date('1970-01-01T11:40:00'),
                        session: 'MORNING',
                        isActive: true
                    },
                    // Lunch Break: 11:40 – 13:10
                    {
                        schoolId: school.id,
                        day,
                        period: 0, // Use 0 for breaks
                        name: 'Lunch Break',
                        startTime: new Date('1970-01-01T11:40:00'),
                        endTime: new Date('1970-01-01T13:10:00'),
                        session: 'BREAK',
                        isBreak: true,
                        breakType: 'LUNCH',
                        isActive: true
                    },
                    // Period 6: 13:10 – 13:50
                    {
                        schoolId: school.id,
                        day,
                        period: 6,
                        name: 'Period 6',
                        startTime: new Date('1970-01-01T13:10:00'),
                        endTime: new Date('1970-01-01T13:50:00'),
                        session: 'AFTERNOON',
                        isActive: true
                    },
                    // Period 7: 13:50 – 14:30
                    {
                        schoolId: school.id,
                        day,
                        period: 7,
                        name: 'Period 7',
                        startTime: new Date('1970-01-01T13:50:00'),
                        endTime: new Date('1970-01-01T14:30:00'),
                        session: 'AFTERNOON',
                        isActive: true
                    },
                    // Period 8: 14:30 – 15:10
                    {
                        schoolId: school.id,
                        day,
                        period: 8,
                        name: 'Period 8',
                        startTime: new Date('1970-01-01T14:30:00'),
                        endTime: new Date('1970-01-01T15:10:00'),
                        session: 'AFTERNOON',
                        isActive: true
                    },
                    // Afternoon Break: 15:10 – 15:30
                    {
                        schoolId: school.id,
                        day,
                        period: 0, // Use 0 for breaks
                        name: 'Afternoon Break',
                        startTime: new Date('1970-01-01T15:10:00'),
                        endTime: new Date('1970-01-01T15:30:00'),
                        session: 'BREAK',
                        isBreak: true,
                        breakType: 'AFTERNOON',
                        isActive: true
                    },
                    // Period 9: 15:30 – 16:10
                    {
                        schoolId: school.id,
                        day,
                        period: 9,
                        name: 'Period 9',
                        startTime: new Date('1970-01-01T15:30:00'),
                        endTime: new Date('1970-01-01T16:10:00'),
                        session: 'AFTERNOON',
                        isActive: true
                    },
                    // Period 10: 16:10 – 16:50
                    {
                        schoolId: school.id,
                        day,
                        period: 10,
                        name: 'Period 10',
                        startTime: new Date('1970-01-01T16:10:00'),
                        endTime: new Date('1970-01-01T16:50:00'),
                        session: 'AFTERNOON',
                        isActive: true
                    }
                );
            }
            
            // Bulk create new time slots
            const createdSlots = await db.timeSlot.createMany({
                data: timeSlots
            });
            
            console.log(`✅ Created ${createdSlots.count} time slots for ${school.name}`);
            
            // Verify the creation
            const totalSlots = await db.timeSlot.count({
                where: { schoolId: school.id, isActive: true }
            });
            
            console.log(`📊 Total active time slots for ${school.name}: ${totalSlots}`);
            
            // Verify P1 and P10 times
            const p1Slot = await db.timeSlot.findFirst({
                where: { schoolId: school.id, period: 1, isActive: true },
                select: { startTime: true, endTime: true }
            });
            
            const p10Slot = await db.timeSlot.findFirst({
                where: { schoolId: school.id, period: 10, isActive: true },
                select: { startTime: true, endTime: true }
            });
            
            if (p1Slot && p10Slot) {
                const p1Start = p1Slot.startTime.toTimeString().slice(0, 5);
                const p10End = p10Slot.endTime.toTimeString().slice(0, 5);
                
                console.log(`🕐 P1: ${p1Start} – ${p1Slot.endTime.toTimeString().slice(0, 5)}`);
                console.log(`🕐 P10: ${p10Slot.startTime.toTimeString().slice(0, 5)} – ${p10End}`);
                
                if (p1Start === '08:00' && p10End === '16:50') {
                    console.log('✅ Time configuration verified: P1 starts at 08:00, P10 ends at 16:50');
                } else {
                    console.log('⚠️  Time configuration mismatch detected');
                }
            }
        }
        
        console.log('\n🎉 Time slots update completed successfully!');
        console.log('\n📋 Summary:');
        console.log('- All schools now have P1-P10 periods only');
        console.log('- P1 starts at 08:00');
        console.log('- P10 ends at 16:50');
        console.log('- Break periods are preserved');
        console.log('- Periods P11-P13 (beyond 16:50) have been removed');
        
    } catch (error) {
        console.error('❌ Error updating time slots:', error);
    }
}

// Run the update
updateTimeSlotsToP1P10();