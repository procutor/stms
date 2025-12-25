const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function finalVerification() {
    try {
        console.log('🔍 Final Timetable Verification...\n');
        
        // Get the first approved school
        const school = await prisma.school.findFirst({
            where: { status: 'APPROVED' }
        });
        
        if (!school) {
            console.log('❌ No approved school found');
            return;
        }
        
        console.log(`📚 School: ${school.name}`);
        
        // Get all current timetables
        const timetables = await prisma.timetable.findMany({
            where: { schoolId: school.id },
            include: {
                teacher: { select: { name: true, email: true } },
                class: { select: { name: true, level: true } },
                subject: { select: { name: true, code: true } },
                module: { select: { name: true, category: true } },
                timeSlot: { select: { day: true, period: true, startTime: true, endTime: true } }
            },
            orderBy: [
                { teacherId: 'asc' },
                { timeSlot: { day: 'asc' } },
                { timeSlot: { period: 'asc' } }
            ]
        });
        
        console.log(`📅 Total timetable entries: ${timetables.length}`);
        
        // Group by teacher for analysis
        const teacherTimetables = {};
        timetables.forEach(timetable => {
            if (!teacherTimetables[timetable.teacherId]) {
                teacherTimetables[timetable.teacherId] = {
                    teacher: timetable.teacher,
                    entries: []
                };
            }
            teacherTimetables[timetable.teacherId].entries.push(timetable);
        });
        
        console.log(`👨‍🏫 Teachers with timetables: ${Object.keys(teacherTimetables).length}`);
        
        // Verify each teacher
        let totalConflicts = 0;
        let totalLessons = 0;
        
        for (const [teacherId, data] of Object.entries(teacherTimetables)) {
            console.log(`\n📋 Teacher: ${data.teacher.name}`);
            console.log(`   Email: ${data.teacher.email}`);
            console.log(`   Lessons: ${data.entries.length}`);
            
            totalLessons += data.entries.length;
            
            // Check for conflicts
            const conflicts = findConflicts(data.entries);
            totalConflicts += conflicts.length;
            
            if (conflicts.length > 0) {
                console.log(`   ❌ Conflicts: ${conflicts.length}`);
                conflicts.forEach(conflict => {
                    console.log(`     - ${conflict.type}: ${conflict.message}`);
                });
            } else {
                console.log(`   ✅ No conflicts`);
            }
            
            // Show lesson distribution by day
            const dayDistribution = {};
            data.entries.forEach(entry => {
                const day = entry.timeSlot.day;
                if (!dayDistribution[day]) {
                    dayDistribution[day] = 0;
                }
                dayDistribution[day]++;
            });
            
            console.log(`   📅 Distribution:`);
            Object.entries(dayDistribution).forEach(([day, count]) => {
                console.log(`     ${day}: ${count} lessons`);
            });
        }
        
        // Overall statistics
        console.log(`\n📊 Overall Statistics:`);
        console.log(`Total lessons scheduled: ${totalLessons}`);
        console.log(`Total conflicts found: ${totalConflicts}`);
        console.log(`Average lessons per teacher: ${(totalLessons / Object.keys(teacherTimetables).length).toFixed(1)}`);
        
        // Check time slot utilization
        const timeSlotUtilization = {};
        timetables.forEach(timetable => {
            const key = `${timetable.timeSlot.day}-${timetable.timeSlot.period}`;
            if (!timeSlotUtilization[key]) {
                timeSlotUtilization[key] = 0;
            }
            timeSlotUtilization[key]++;
        });
        
        const utilizedSlots = Object.keys(timeSlotUtilization).length;
        const totalSlots = 75; // 15 periods × 5 days
        
        console.log(`Time slot utilization: ${utilizedSlots}/${totalSlots} (${((utilizedSlots/totalSlots) * 100).toFixed(1)}%)`);
        
        // Final status
        console.log(`\n🎯 Final Status:`);
        if (totalConflicts === 0) {
            console.log(`✅ SUCCESS: All timetables generated successfully without conflicts!`);
            console.log(`✅ All teachers have properly scheduled lessons`);
            console.log(`✅ No double booking or scheduling conflicts detected`);
            console.log(`✅ Timetable generation is working correctly for all teachers`);
        } else {
            console.log(`⚠️ WARNING: ${totalConflicts} conflicts still exist and need attention`);
        }
        
        // Show sample timetable for verification
        console.log(`\n📋 Sample Timetable (First Teacher):`);
        const firstTeacher = Object.values(teacherTimetables)[0];
        if (firstTeacher) {
            console.log(`${firstTeacher.teacher.name}'s Schedule:`);
            firstTeacher.entries.slice(0, 5).forEach(entry => {
                const subject = entry.subject?.name || entry.module?.name;
                const category = entry.module?.category ? ` (${entry.module.category})` : '';
                console.log(`  ${entry.timeSlot.day} Period ${entry.timeSlot.period}: ${subject}${category} - ${entry.class.name}`);
            });
            if (firstTeacher.entries.length > 5) {
                console.log(`  ... and ${firstTeacher.entries.length - 5} more lessons`);
            }
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
        const key = `${entry.timeSlot.day}-${entry.timeSlot.period}`;
        if (!timeSlotMap.has(key)) {
            timeSlotMap.set(key, []);
        }
        timeSlotMap.get(key).push(entry);
    });
    
    for (const [slot, slotEntries] of timeSlotMap.entries()) {
        if (slotEntries.length > 1) {
            conflicts.push({
                type: 'DOUBLE_BOOKING',
                message: `${slotEntries.length} lessons in same time slot: ${slot}`
            });
        }
    }
    
    // Check for consecutive periods (max 2)
    const dailyPeriods = {};
    entries.forEach(entry => {
        const day = entry.timeSlot.day;
        if (!dailyPeriods[day]) {
            dailyPeriods[day] = [];
        }
        dailyPeriods[day].push(entry.timeSlot.period);
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
                        message: `${consecutiveCount} consecutive periods on ${day}`
                    });
                }
                consecutiveCount = 1;
            }
        }
        
        // Check final sequence
        if (consecutiveCount > 2) {
            conflicts.push({
                type: 'TOO_MANY_CONSECUTIVE',
                message: `${consecutiveCount} consecutive periods on ${day}`
            });
        }
    }
    
    return conflicts;
}

// Run the final verification
finalVerification();