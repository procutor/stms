const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSchoolsAndRegenerate() {
    try {
        console.log('🔍 Checking Schools and Regenerating Timetables...\n');
        
        // Check all schools
        const schools = await prisma.school.findMany({
            include: {
                users: {
                    where: { role: 'SCHOOL_ADMIN', isActive: true }
                }
            }
        });
        
        console.log(`📚 Found ${schools.length} schools:`);
        schools.forEach(school => {
            console.log(`  - ${school.name} (${school.status}) - Admin: ${school.users[0]?.email || 'None'}`);
        });
        
        // Get the first school (regardless of status)
        const school = schools[0];
        
        if (!school) {
            console.log('❌ No schools found');
            return;
        }
        
        console.log(`\n📚 Using school: ${school.name} (${school.status})`);
        
        // Check current timetables
        const timetables = await prisma.timetable.findMany({
            where: { schoolId: school.id }
        });
        
        console.log(`📅 Current timetable entries: ${timetables.length}`);
        
        if (timetables.length === 0) {
            console.log('🆕 No timetables found. Generating new timetables...');
            
            try {
                // Import the timetable generator
                const { generateTimetable } = require('./src/lib/timetable-generator.ts');
                
                console.log('🎯 Starting full school timetable generation...');
                const result = await generateTimetable(school.id);
                
                console.log(`Generation result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
                console.log(`Conflicts: ${result.conflicts.length}`);
                
                if (result.conflicts.length > 0) {
                    console.log('\n❌ Conflicts found:');
                    result.conflicts.forEach((conflict, index) => {
                        console.log(`  ${index + 1}. ${conflict.type}: ${conflict.message}`);
                    });
                } else {
                    console.log('\n✅ No conflicts found!');
                }
                
                // Verify generation
                const newTimetables = await prisma.timetable.findMany({
                    where: { schoolId: school.id },
                    include: {
                        teacher: { select: { name: true } },
                        class: { select: { name: true } },
                        subject: { select: { name: true } },
                        module: { select: { name: true } },
                        timeSlot: { select: { day: true, period: true } }
                    }
                });
                
                console.log(`\n📊 Generated ${newTimetables.length} timetable entries`);
                
                // Group by teacher and check for conflicts
                const teacherGroups = {};
                newTimetables.forEach(timetable => {
                    if (!teacherGroups[timetable.teacherId]) {
                        teacherGroups[timetable.teacherId] = [];
                    }
                    teacherGroups[timetable.teacherId].push(timetable);
                });
                
                console.log(`👨‍🏫 Teachers with timetables: ${Object.keys(teacherGroups).length}`);
                
                // Check each teacher for conflicts
                let totalConflicts = 0;
                for (const [teacherId, entries] of Object.entries(teacherGroups)) {
                    const conflicts = findConflicts(entries);
                    totalConflicts += conflicts.length;
                    
                    if (conflicts.length > 0) {
                        console.log(`\n❌ ${entries[0].teacher.name} has ${conflicts.length} conflicts:`);
                        conflicts.forEach(conflict => {
                            console.log(`  - ${conflict.type}: ${conflict.message}`);
                        });
                    } else {
                        console.log(`\n✅ ${entries[0].teacher.name}: No conflicts (${entries.length} lessons)`);
                    }
                }
                
                console.log(`\n📊 Final Summary:`);
                console.log(`Total timetable entries: ${newTimetables.length}`);
                console.log(`Total conflicts: ${totalConflicts}`);
                
                if (totalConflicts === 0) {
                    console.log(`\n🎉 SUCCESS: All timetables generated without conflicts!`);
                } else {
                    console.log(`\n⚠️ WARNING: ${totalConflicts} conflicts need attention`);
                }
                
            } catch (error) {
                console.log(`❌ Generation failed: ${error.message}`);
                console.log('Stack:', error.stack);
            }
        } else {
            console.log('📅 Timetables already exist. Analyzing conflicts...');
            
            // Analyze existing timetables for conflicts
            const teacherGroups = {};
            timetables.forEach(timetable => {
                if (!teacherGroups[timetable.teacherId]) {
                    teacherGroups[timetable.teacherId] = [];
                }
                teacherGroups[timetable.teacherId].push(timetable);
            });
            
            let totalConflicts = 0;
            for (const [teacherId, entries] of Object.entries(teacherGroups)) {
                const conflicts = findConflicts(entries);
                totalConflicts += conflicts.length;
                
                if (conflicts.length > 0) {
                    console.log(`❌ Teacher ${teacherId} has ${conflicts.length} conflicts`);
                }
            }
            
            console.log(`Total conflicts in existing timetables: ${totalConflicts}`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('Stack:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

// Helper function to find conflicts
function findConflicts(entries) {
    const conflicts = [];
    
    // Check for double booking (same time slot)
    const timeSlotMap = new Map();
    entries.forEach(entry => {
        const key = `${entry.timeSlotId}`;
        if (!timeSlotMap.has(key)) {
            timeSlotMap.set(key, []);
        }
        timeSlotMap.get(key).push(entry);
    });
    
    for (const [timeSlotId, slotEntries] of timeSlotMap.entries()) {
        if (slotEntries.length > 1) {
            conflicts.push({
                type: 'DOUBLE_BOOKING',
                message: `Teacher scheduled for ${slotEntries.length} classes at same time`
            });
        }
    }
    
    // Check for too many consecutive periods
    const dailyPeriods = {};
    entries.forEach(entry => {
        if (!dailyPeriods[entry.timeSlot.day]) {
            dailyPeriods[entry.timeSlot.day] = [];
        }
        dailyPeriods[entry.timeSlot.day].push(entry.timeSlot.period);
    });
    
    for (const [day, periods] of Object.entries(dailyPeriods)) {
        periods.sort((a, b) => a - b);
        let consecutiveCount = 1;
        
        for (let i = 1; i < periods.length; i++) {
            if (periods[i] === periods[i-1] + 1) {
                consecutiveCount++;
            } else {
                if (consecutiveCount > 2) {
                    conflicts.push({
                        type: 'TOO_MANY_CONSECUTIVE',
                        message: `Teacher has ${consecutiveCount} consecutive periods on ${day}`
                    });
                }
                consecutiveCount = 1;
            }
        }
        
        // Check final sequence
        if (consecutiveCount > 2) {
            conflicts.push({
                type: 'TOO_MANY_CONSECUTIVE',
                message: `Teacher has ${consecutiveCount} consecutive periods on ${day}`
            });
        }
    }
    
    return conflicts;
}

// Run the check and regenerate
checkSchoolsAndRegenerate();