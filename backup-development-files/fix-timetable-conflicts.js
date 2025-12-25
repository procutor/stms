const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeAndFixConflicts() {
    try {
        console.log('🔍 Analyzing and Fixing Timetable Conflicts...\n');
        
        // Get first approved school
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
                teacher: { select: { name: true, id: true } },
                class: { select: { name: true } },
                subject: { select: { name: true } },
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
        
        // Group by teacher to analyze conflicts
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
        
        // Analyze conflicts for each teacher
        let totalConflicts = 0;
        let fixedConflicts = 0;
        const conflictReport = [];
        
        for (const [teacherId, data] of Object.entries(teacherTimetables)) {
            console.log(`\n🔍 Analyzing conflicts for ${data.teacher.name}:`);
            
            const conflicts = findTeacherConflicts(data.entries);
            totalConflicts += conflicts.length;
            
            if (conflicts.length > 0) {
                console.log(`❌ Found ${conflicts.length} conflicts:`);
                
                conflicts.forEach((conflict, index) => {
                    console.log(`  ${index + 1}. ${conflict.type}: ${conflict.message}`);
                    console.log(`     Teacher: ${conflict.teacherName}`);
                    console.log(`     Time: ${conflict.day} Period ${conflict.period}`);
                    console.log(`     Conflicting entries: ${conflict.entries.map(e => `${e.subjectName || e.moduleName} in ${e.className}`).join(', ')}`);
                });
                
                conflictReport.push({
                    teacherId,
                    teacherName: data.teacher.name,
                    conflicts
                });
            } else {
                console.log(`✅ No conflicts found`);
            }
        }
        
        console.log(`\n📊 Conflict Summary:`);
        console.log(`Total conflicts found: ${totalConflicts}`);
        
        if (totalConflicts > 0) {
            console.log(`\n🛠️ Attempting to fix conflicts...`);
            
            // Attempt to fix conflicts by regenerating affected timetables
            for (const report of conflictReport) {
                console.log(`\n🔧 Fixing conflicts for ${report.teacherName}...`);
                
                try {
                    // Clear existing timetable entries for this teacher
                    const deletedCount = await prisma.timetable.deleteMany({
                        where: {
                            teacherId: report.teacherId,
                            schoolId: school.id
                        }
                    });
                    
                    console.log(`🗑️ Cleared ${deletedCount.count} existing entries`);
                    
                    // Regenerate timetable for this teacher
                    const { generateTimetableForTeacher } = require('./src/lib/timetable-generator.ts');
                    
                    const result = await generateTimetableForTeacher(school.id, report.teacherId, {
                        regenerate: true
                    });
                    
                    if (result.success) {
                        console.log(`✅ Successfully regenerated timetable for ${report.teacherName}`);
                        console.log(`   New conflicts: ${result.conflicts.length}`);
                        fixedConflicts += Math.max(0, report.conflicts.length - result.conflicts.length);
                    } else {
                        console.log(`❌ Failed to regenerate timetable for ${report.teacherName}`);
                        console.log(`   Remaining conflicts: ${result.conflicts.length}`);
                    }
                    
                } catch (error) {
                    console.log(`❌ Error fixing ${report.teacherName}: ${error.message}`);
                }
            }
        }
        
        // Final verification
        console.log(`\n📋 Final Verification:`);
        
        const finalTimetables = await prisma.timetable.findMany({
            where: { schoolId: school.id },
            include: {
                teacher: { select: { name: true } },
                timeSlot: { select: { day: true, period: true } }
            }
        });
        
        let finalConflicts = 0;
        const finalTeacherTimetables = {};
        finalTimetables.forEach(timetable => {
            if (!finalTeacherTimetables[timetable.teacherId]) {
                finalTeacherTimetables[timetable.teacherId] = [];
            }
            finalTeacherTimetables[timetable.teacherId].push(timetable);
        });
        
        for (const [teacherId, entries] of Object.entries(finalTeacherTimetables)) {
            const conflicts = findTeacherConflicts(entries);
            finalConflicts += conflicts.length;
        }
        
        console.log(`Remaining conflicts after fix: ${finalConflicts}`);
        console.log(`Conflicts resolved: ${totalConflicts - finalConflicts}`);
        
        if (finalConflicts === 0) {
            console.log(`\n🎉 SUCCESS: All conflicts have been resolved!`);
        } else {
            console.log(`\n⚠️ WARNING: ${finalConflicts} conflicts remain. Manual intervention may be required.`);
        }
        
    } catch (error) {
        console.error('❌ Error analyzing conflicts:', error.message);
        console.log('Stack:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

// Helper function to find conflicts for a teacher
function findTeacherConflicts(entries) {
    const conflicts = [];
    const timeSlotMap = new Map();
    
    // Group by time slot
    entries.forEach(entry => {
        const key = `${entry.timeSlot.day}-${entry.timeSlot.period}`;
        if (!timeSlotMap.has(key)) {
            timeSlotMap.set(key, []);
        }
        timeSlotMap.get(key).push(entry);
    });
    
    // Check for conflicts
    for (const [timeSlot, slotEntries] of timeSlotMap.entries()) {
        if (slotEntries.length > 1) {
            // Multiple entries in same time slot = conflict
            const [day, period] = timeSlot.split('-');
            conflicts.push({
                type: 'DOUBLE_BOOKING',
                message: `Teacher scheduled for multiple classes`,
                teacherName: slotEntries[0].teacher.name,
                day,
                period: parseInt(period),
                entries: slotEntries
            });
        }
    }
    
    // Check for consecutive period violations
    const dailySchedule = new Map();
    entries.forEach(entry => {
        const day = entry.timeSlot.day;
        if (!dailySchedule.has(day)) {
            dailySchedule.set(day, []);
        }
        dailySchedule.get(day).push(entry.timeSlot.period);
    });
    
    for (const [day, periods] of dailySchedule.entries()) {
        periods.sort((a, b) => a - b);
        for (let i = 1; i < periods.length; i++) {
            if (periods[i] === periods[i-1] + 1) {
                // Found consecutive periods
                let count = 2;
                for (let j = i + 1; j < periods.length && periods[j] === periods[j-1] + 1; j++) {
                    count++;
                }
                if (count > 2) {
                    conflicts.push({
                        type: 'CONSECUTIVE_PERIODS',
                        message: `Teacher has ${count} consecutive periods`,
                        teacherName: entries[0].teacher.name,
                        day,
                        period: periods[i],
                        count
                    });
                }
            }
        }
    }
    
    return conflicts;
}

// Run the conflict analysis and fix
analyzeAndFixConflicts();