const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixConsecutiveConflicts() {
    try {
        console.log('🔧 Fixing Consecutive Period Conflicts...\n');
        
        // Get the first approved school
        const school = await prisma.school.findFirst({
            where: { status: 'APPROVED' }
        });
        
        if (!school) {
            console.log('❌ No approved school found');
            return;
        }
        
        console.log(`📚 School: ${school.name}`);
        
        // Get current timetables
        const timetables = await prisma.timetable.findMany({
            where: { schoolId: school.id },
            include: {
                teacher: { select: { name: true, id: true } },
                class: { select: { name: true } },
                subject: { select: { name: true } },
                module: { select: { name: true, category: true } },
                timeSlot: { select: { day: true, period: true } }
            }
        });
        
        console.log(`📅 Current timetables: ${timetables.length}`);
        
        // Clear existing timetables
        console.log('🗑️ Clearing existing timetables...');
        await prisma.timetable.deleteMany({
            where: { schoolId: school.id }
        });
        
        // Get available time slots
        const timeSlots = await prisma.timeSlot.findMany({
            where: { schoolId: school.id, isActive: true, isBreak: false },
            orderBy: [{ day: 'asc' }, { period: 'asc' }]
        });
        
        console.log(`⏰ Available time slots: ${timeSlots.length}`);
        
        // Get teachers with their assignments
        const teachers = await prisma.user.findMany({
            where: {
                schoolId: school.id,
                role: { in: ['TEACHER', 'TRAINER'] },
                isActive: true
            },
            include: {
                teacherClassSubjects: {
                    include: {
                        subject: true,
                        class: true
                    }
                },
                trainerClassModules: {
                    include: {
                        module: true,
                        class: true
                    }
                }
            }
        });
        
        // Enhanced scheduling with consecutive period limits
        const generatedTimetables = [];
        const usedTimeSlots = new Set();
        const teacherSchedules = {};
        
        for (const teacher of teachers) {
            console.log(`\n📝 Scheduling for: ${teacher.name}`);
            
            // Collect lessons
            const lessons = [];
            
            teacher.teacherClassSubjects.forEach(tcs => {
                for (let i = 0; i < tcs.subject.periodsPerWeek; i++) {
                    lessons.push({
                        type: 'subject',
                        teacherId: teacher.id,
                        subjectId: tcs.subjectId,
                        classId: tcs.classId,
                        teacherName: teacher.name,
                        subjectName: tcs.subject.name,
                        className: tcs.class.name,
                        priority: tcs.subject.periodsPerWeek
                    });
                }
            });
            
            teacher.trainerClassModules.forEach(tcm => {
                for (let i = 0; i < tcm.module.totalHours; i++) {
                    lessons.push({
                        type: 'module',
                        teacherId: teacher.id,
                        moduleId: tcm.moduleId,
                        classId: tcm.classId,
                        teacherName: teacher.name,
                        moduleName: tcm.module.name,
                        className: tcm.class.name,
                        priority: tcm.module.category === 'SPECIFIC' ? 3 : tcm.module.category === 'GENERAL' ? 2 : 1,
                        blockSize: tcm.module.blockSize || 1
                    });
                }
            });
            
            // Sort by priority
            lessons.sort((a, b) => b.priority - a.priority);
            
            console.log(`  Lessons to schedule: ${lessons.length}`);
            
            // Initialize schedule tracking
            teacherSchedules[teacher.id] = {
                dailyPeriods: {},
                assignedSlots: []
            };
            
            // Smart scheduling with consecutive period limits
            for (const lesson of lessons) {
                let scheduled = false;
                let attempts = 0;
                const maxAttempts = timeSlots.length;
                
                while (!scheduled && attempts < maxAttempts) {
                    attempts++;
                    
                    // Try different strategies
                    for (const timeSlot of timeSlots) {
                        const slotKey = `${timeSlot.day}-${timeSlot.period}`;
                        
                        // Skip if slot is used
                        if (usedTimeSlots.has(slotKey)) continue;
                        
                        // Check if teacher already has lesson at this time
                        const teacherDaySchedule = teacherSchedules[teacher.id].dailyPeriods[timeSlot.day] || [];
                        if (teacherDaySchedule.includes(timeSlot.period)) continue;
                        
                        // Check consecutive periods (max 2)
                        const consecutiveCount = getConsecutiveCount(teacherDaySchedule, timeSlot.period);
                        if (consecutiveCount >= 2) continue;
                        
                        // Schedule the lesson
                        generatedTimetables.push({
                            schoolId: school.id,
                            teacherId: lesson.teacherId,
                            classId: lesson.classId,
                            timeSlotId: timeSlot.id,
                            ...(lesson.type === 'subject' ? { subjectId: lesson.subjectId } : { moduleId: lesson.moduleId })
                        });
                        
                        // Mark slot as used
                        usedTimeSlots.add(slotKey);
                        
                        // Update teacher schedule
                        if (!teacherSchedules[teacher.id].dailyPeriods[timeSlot.day]) {
                            teacherSchedules[teacher.id].dailyPeriods[timeSlot.day] = [];
                        }
                        teacherSchedules[teacher.id].dailyPeriods[timeSlot.day].push(timeSlot.period);
                        
                        scheduled = true;
                        break;
                    }
                }
                
                if (!scheduled) {
                    console.log(`  ⚠️ Could not schedule: ${lesson.subjectName || lesson.moduleName}`);
                }
            }
        }
        
        // Save timetables
        console.log(`\n💾 Saving ${generatedTimetables.length} timetables...`);
        for (const timetable of generatedTimetables) {
            await prisma.timetable.create({ data: timetable });
        }
        
        // Verify results
        const savedTimetables = await prisma.timetable.findMany({
            where: { schoolId: school.id },
            include: {
                teacher: { select: { name: true } },
                timeSlot: { select: { day: true, period: true } }
            }
        });
        
        console.log(`\n📊 Results: ${savedTimetables.length} timetables saved`);
        
        // Check for remaining conflicts
        const conflicts = checkForConflicts(savedTimetables);
        
        if (conflicts.length === 0) {
            console.log('✅ All conflicts resolved!');
        } else {
            console.log(`❌ ${conflicts.length} conflicts remain:`);
            conflicts.forEach(conflict => {
                console.log(`  - ${conflict.type}: ${conflict.message}`);
            });
        }
        
        // Teacher summary
        console.log('\n👨‍🏫 Teacher Summary:');
        const teacherSummary = {};
        savedTimetables.forEach(timetable => {
            const name = timetable.teacher.name;
            if (!teacherSummary[name]) teacherSummary[name] = 0;
            teacherSummary[name]++;
        });
        
        Object.entries(teacherSummary).forEach(([name, count]) => {
            console.log(`  ${name}: ${count} lessons`);
        });
        
        console.log('\n🎉 Conflict resolution completed!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

// Helper functions
function getConsecutiveCount(periods, targetPeriod) {
    if (!periods.includes(targetPeriod)) return 0;
    
    let count = 1;
    let current = targetPeriod;
    
    // Count backwards
    while (periods.includes(current - 1)) {
        count++;
        current--;
    }
    
    // Count forwards
    current = targetPeriod;
    while (periods.includes(current + 1)) {
        count++;
        current++;
    }
    
    return count;
}

function checkForConflicts(timetables) {
    const conflicts = [];
    
    // Check consecutive periods
    const teacherSchedules = {};
    timetables.forEach(timetable => {
        const teacherId = timetable.teacherId;
        if (!teacherSchedules[teacherId]) {
            teacherSchedules[teacherId] = {};
        }
        const day = timetable.timeSlot.day;
        if (!teacherSchedules[teacherId][day]) {
            teacherSchedules[teacherId][day] = [];
        }
        teacherSchedules[teacherId][day].push(timetable.timeSlot.period);
    });
    
    for (const [teacherId, days] of Object.entries(teacherSchedules)) {
        for (const [day, periods] of Object.entries(days)) {
            periods.sort((a, b) => a - b);
            let consecutiveCount = 1;
            
            for (let i = 1; i < periods.length; i++) {
                if (periods[i] === periods[i-1] + 1) {
                    consecutiveCount++;
                } else {
                    if (consecutiveCount > 2) {
                        conflicts.push({
                            type: 'CONSECUTIVE_PERIODS',
                            message: `${consecutiveCount} consecutive periods on ${day}`
                        });
                    }
                    consecutiveCount = 1;
                }
            }
            
            if (consecutiveCount > 2) {
                conflicts.push({
                    type: 'CONSECUTIVE_PERIODS',
                    message: `${consecutiveCount} consecutive periods on ${day}`
                });
            }
        }
    }
    
    return conflicts;
}

// Run the fix
fixConsecutiveConflicts();