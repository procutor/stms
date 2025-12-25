// Test script to verify timetable generation respects 08:00-16:50 constraints
const { generateTimetable } = require('./src/lib/timetable-generator');

async function testTimeConstraints() {
    console.log('🔍 Testing timetable generation with new time constraints...');
    
    // Test with a sample school ID
    const schoolId = 'test-school-123';
    
    try {
        console.log('📅 Generating timetable...');
        const result = await generateTimetable(schoolId);
        
        if (result.success) {
            console.log('✅ Timetable generation successful!');
            console.log(`📊 Conflicts: ${result.conflicts.length}`);
            
            // Verify no lessons are scheduled outside 08:00-16:50
            const timetables = await db.timetable.findMany({
                where: { schoolId },
                include: { timeSlot: true }
            });
            
            let violations = 0;
            timetables.forEach(timetable => {
                const period = timetable.timeSlot.period;
                if (period < 1 || period > 10) {
                    console.log(`❌ VIOLATION: Lesson scheduled in period ${period} (outside P1-P10 range)`);
                    violations++;
                }
            });
            
            if (violations === 0) {
                console.log('✅ All lessons scheduled within P1-P10 (08:00-16:50)');
                console.log(`📝 Total lessons scheduled: ${timetables.length}`);
            } else {
                console.log(`❌ Found ${violations} time constraint violations!`);
            }
        } else {
            console.log('❌ Timetable generation failed');
            console.log('Conflicts:', result.conflicts);
        }
    } catch (error) {
        console.error('❌ Test failed with error:', error);
    }
}

// Run the test
testTimeConstraints();