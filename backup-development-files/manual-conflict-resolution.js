const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function manualConflictResolution() {
    try {
        console.log('🔧 Manual Timetable Conflict Resolution...\n');
        
        // Get the first approved school
        const school = await prisma.school.findFirst({
            where: { status: 'APPROVED' }
        });
        
        if (!school) {
            console.log('❌ No approved school found');
            return;
        }
        
        console.log(`📚 School: ${school.name}`);
        
        // Find the specific teacher mentioned by user
        const targetTeacher = await prisma.user.findFirst({
            where: {
                schoolId: school.id,
                name: { contains: 'MUKAMUGEMA VIOLETTE' },
                role: { in: ['TEACHER', 'TRAINER'] }
            }
        });
        
        if (targetTeacher) {
            console.log(`👩‍🏫 Found target teacher: ${targetTeacher.name} (${targetTeacher.email})`);
        } else {
            console.log('👩‍🏫 Target teacher not found, checking all teachers...');
        }
        
        // Get all teachers
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
        
        console.log(`👨‍🏫 Total active teachers: ${teachers.length}`);
        
        // Clear all existing timetables for clean start
        console.log('\n🗑️ Clearing existing timetables...');
        const deletedCount = await prisma.timetable.deleteMany({
            where: { schoolId: school.id }
        });
        console.log(`Deleted ${deletedCount.count} existing timetable entries`);
        
        // Get available time slots
        const timeSlots = await prisma.timeSlot.findMany({
            where: { schoolId: school.id, isActive: true, isBreak: false },
            orderBy: [{ day: 'asc' }, { period: 'asc' }]
        });
        
        console.log(`⏰ Available time slots: ${timeSlots.length}`);
        
        // Manual timetable generation with conflict avoidance
        const generatedTimetables = [];
        const usedTimeSlots = new Set();
        const teacherSchedules = {};
        
        for (const teacher of teachers) {
            console.log(`\n📝 Processing teacher: ${teacher.name}`);
            
            // Collect all lessons for this teacher
            const lessons = [];
            
            // Add subject lessons
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
            
            // Add module lessons
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
            
            // Sort lessons by priority (higher first)
            lessons.sort((a, b) => b.priority - a.priority);
            
            console.log(`  Lessons to schedule: ${lessons.length}`);
            
            // Initialize teacher schedule tracking
            teacherSchedules[teacher.id] = {
                dailyPeriods: {},
                assignedSlots: []
            };
            
            // Schedule lessons with conflict avoidance
            for (const lesson of lessons) {
                let scheduled = false;
                let attempts = 0;
                const maxAttempts = timeSlots.length;
                
                while (!scheduled && attempts < maxAttempts) {
                    attempts++;
                    
                    // Try to find an available time slot
                    for (const timeSlot of timeSlots) {
                        const slotKey = `${timeSlot.day}-${timeSlot.period}`;
                        
                        // Skip if already used
                        if (usedTimeSlots.has(slotKey)) continue;
                        
                        // Check if teacher already has a lesson at this time
                        const teacherDaySchedule = teacherSchedules[teacher.id].dailyPeriods[timeSlot.day] || [];
                        if (teacherDaySchedule.includes(timeSlot.period)) continue;
                        
                        // Check consecutive periods limit (max 2)
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
                        teacherSchedules[teacher.id].assignedSlots.push({
                            day: timeSlot.day,
                            period: timeSlot.period,
                            lesson: lesson.subjectName || lesson.moduleName
                        });
                        
                        scheduled = true;
                        console.log(`  ✅ Scheduled ${lesson.subjectName || lesson.moduleName} for ${timeSlot.day} Period ${timeSlot.period}`);
                        break;
                    }
                    
                    // If no slot found, try to find alternative (this is a simplified approach)
                    if (!scheduled) {
                        console.log(`  ⚠️ Could not schedule lesson: ${lesson.subjectName || lesson.moduleName}`);
                        break;
                    }
                }
            }
        }
        
        // Save generated timetables to database
        console.log(`\n💾 Saving ${generatedTimetables.length} timetable entries...`);
        
        for (const timetable of generatedTimetables) {
            try {
                await prisma.timetable.create({
                    data: timetable
                });
            } catch (error) {
                console.log(`❌ Failed to save timetable entry: ${error.message}`);
            }
        }
        
        // Verify the results
        console.log('\n📊 Verification Results:');
        
        const savedTimetables = await prisma.timetable.findMany({
            where: { schoolId: school.id },
            include: {
                teacher: { select: { name: true } },
                class: { select: { name: true } },
                subject: { select: { name: true } },
                module: { select: { name: true } },
                timeSlot: { select: { day: true, period: true } }
            }
        });
        
        console.log(`Total saved timetables: ${savedTimetables.length}`);
        
        // Check for conflicts
        const conflicts = checkForConflicts(savedTimetables);
        
        if (conflicts.length === 0) {
            console.log('✅ No conflicts found!');
        } else {
            console.log(`❌ Found ${conflicts.length} conflicts:`);
            conflicts.forEach(conflict => {
                console.log(`  - ${conflict.type}: ${conflict.message}`);
            });
        }
        
        // Show teacher summary
        console.log('\n👨‍🏫 Teacher Summary:');
        const teacherSummary = {};
        savedTimetables.forEach(timetable => {
            const teacherName = timetable.teacher.name;
            if (!teacherSummary[teacherName]) {
                teacherSummary[teacherName] = 0;
            }
            teacherSummary[teacherName]++;
        });
        
        Object.entries(teacherSummary).forEach(([name, count]) => {
            console.log(`  ${name}: ${count} lessons`);
        });
        
        console.log('\n🎉 Manual timetable generation completed!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('Stack:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

// Helper function to check consecutive periods
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

// Helper function to check for conflicts
function checkForConflicts(timetables) {
    const conflicts = [];
    
    // Check for double booking
    const slotMap = new Map();
    timetables.forEach(timetable => {
        const key = `${timetable.timeSlot.day}-${timetable.timeSlot.period}`;
        if (!slotMap.has(key)) {
            slotMap.set(key, []);
        }
        slotMap.get(key).push(timetable);
    });
    
    for (const [slot, entries] of slotMap.entries()) {
        if (entries.length > 1) {
            conflicts.push({
                type: 'DOUBLE_BOOKING',
                message: `${entries.length} teachers scheduled for same time slot: ${slot}`
            });
        }
    }
    
    // Check for teacher conflicts
    const teacherMap = new Map();
    timetables.forEach(timetable => {
        const key = `${timetable.teacherId}-${timetable.timeSlot.day}-${timetable.timeSlot.period}`;
        if (teacherMap.has(key)) {
            conflicts.push({
                type: 'TEACHER_DOUBLE_BOOKING',
                message: `Teacher ${timetable.teacher.name} scheduled for multiple classes at ${slot}`
            });
        }
        teacherMap.set(key, timetable);
    });
    
    return conflicts;
}

// Run the manual conflict resolution
manualConflictResolution();