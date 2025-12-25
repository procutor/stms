const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Mock the @/lib imports since we can't use ES modules directly
const db = prisma;

// Simplified lesson preparation function
async function prepareLessonsForSchoolDebug(schoolId) {
    console.log('🔧 Debug: Starting lesson preparation...');
    
    const lessons = [];
    
    try {
        // Get teacher-class assignments
        const teacherClassSubjects = await db.teacherClassSubject.findMany({
            where: { schoolId },
            include: {
                teacher: true,
                subject: true,
                class: true
            }
        });
        
        console.log(`📚 Found ${teacherClassSubjects.length} teacher-class assignments`);
        
        // Process assignments
        for (const assignment of teacherClassSubjects) {
            if (!assignment.class || !assignment.subject || !assignment.teacher) {
                console.log('❌ Invalid assignment - missing relations');
                continue;
            }
            
            const level = assignment.class.level || assignment.subject.level || 'Unknown';
            console.log(`✅ Processing assignment: ${assignment.teacher.name} -> ${assignment.class.name} -> ${assignment.subject.name}`);
            
            // Create lessons based on periods per week
            for (let i = 0; i < assignment.subject.periodsPerWeek; i++) {
                lessons.push({
                    teacherId: assignment.teacherId,
                    subjectId: assignment.subjectId,
                    classId: assignment.classId,
                    lessonIndex: i + 1,
                    totalLessons: assignment.subject.periodsPerWeek,
                    lessonType: level.startsWith('S') ? 'SECONDARY' : 'PRIMARY',
                    priority: assignment.subject.periodsPerWeek,
                    preferredTime: 'ANY',
                    streamType: level.startsWith('S') ? 'SECONDARY' : 'PRIMARY',
                    level: level,
                    teacherName: assignment.teacher.name,
                    subjectName: assignment.subject.name,
                    className: assignment.class.name
                });
            }
        }
        
        // Get trainer-class module assignments
        const trainerClassModules = await db.trainerClassModule.findMany({
            where: { schoolId },
            include: {
                trainer: true,
                module: true,
                class: true
            }
        });
        
        console.log(`🎯 Found ${trainerClassModules.length} trainer-class module assignments`);
        
        for (const assignment of trainerClassModules) {
            if (!assignment.class || !assignment.module || !assignment.trainer) {
                console.log('❌ Invalid trainer assignment - missing relations');
                continue;
            }
            
            const level = assignment.module.level || 'Unknown';
            console.log(`✅ Processing trainer assignment: ${assignment.trainer.name} -> ${assignment.class.name} -> ${assignment.module.name}`);
            
            for (let i = 0; i < assignment.module.totalHours; i++) {
                lessons.push({
                    teacherId: assignment.trainerId,
                    moduleId: assignment.moduleId,
                    classId: assignment.classId,
                    lessonIndex: i + 1,
                    totalLessons: assignment.module.totalHours,
                    lessonType: 'TSS',
                    priority: 1, // Simplified
                    preferredTime: 'MORNING',
                    streamType: 'TSS',
                    level: level,
                    blockSize: assignment.module.blockSize || 1,
                    teacherName: assignment.trainer.name,
                    moduleName: assignment.module.name,
                    className: assignment.class.name
                });
            }
        }
        
        console.log(`📊 Total lessons prepared: ${lessons.length}`);
        
        // Validation
        const validation = {
            isValid: lessons.length > 0,
            errors: [],
            warnings: []
        };
        
        if (lessons.length === 0) {
            validation.errors.push('No lessons found. Please create teacher-class assignments first.');
        }
        
        return {
            lessons,
            validation,
            statistics: {
                total: lessons.length,
                byType: {
                    PRIMARY: lessons.filter(l => l.lessonType === 'PRIMARY').length,
                    SECONDARY: lessons.filter(l => l.lessonType === 'SECONDARY').length,
                    TSS: lessons.filter(l => l.lessonType === 'TSS').length
                }
            }
        };
        
    } catch (error) {
        console.error('❌ Lesson preparation error:', error.message);
        return {
            lessons: [],
            validation: {
                isValid: false,
                errors: [error.message],
                warnings: []
            },
            statistics: { total: 0 }
        };
    }
}

// Simplified timetable generation test
async function testTimetableGeneration() {
    try {
        console.log('🧪 Testing Timetable Generation...\n');
        
        // Get first approved school
        const school = await prisma.school.findFirst({
            where: { status: 'APPROVED' }
        });
        
        if (!school) {
            console.log('❌ No approved school found');
            return;
        }
        
        console.log(`📚 Testing with school: ${school.name}\n`);
        
        // Test lesson preparation
        const result = await prepareLessonsForSchoolDebug(school.id);
        
        console.log('\n📈 Results:');
        console.log(`Total lessons: ${result.lessons.length}`);
        console.log(`Validation: ${result.validation.isValid ? 'VALID' : 'INVALID'}`);
        
        if (!result.validation.isValid) {
            console.log('Errors:', result.validation.errors);
        }
        
        console.log('Statistics:', result.statistics);
        
        // Check time slots availability
        const timeSlots = await prisma.timeSlot.findMany({
            where: { schoolId: school.id, isActive: true }
        });
        
        const teachingPeriods = timeSlots.filter(s => !s.isBreak);
        console.log(`\n⏰ Available time slots: ${teachingPeriods.length}`);
        
        // Check if we have enough capacity
        const requiredSlots = result.lessons.length;
        const availableSlots = teachingPeriods.length;
        
        console.log(`Required slots: ${requiredSlots}`);
        console.log(`Available slots: ${availableSlots}`);
        
        if (requiredSlots > availableSlots) {
            console.log('❌ INSUFFICIENT TIME SLOTS - This will cause generation failure!');
            console.log(`Need ${requiredSlots - availableSlots} more slots`);
        } else {
            console.log('✅ Sufficient time slots available');
        }
        
        // Check for potential conflicts
        const teacherLessonCounts = {};
        result.lessons.forEach(lesson => {
            teacherLessonCounts[lesson.teacherId] = (teacherLessonCounts[lesson.teacherId] || 0) + 1;
        });
        
        console.log('\n👨‍🏫 Teacher workload:');
        Object.entries(teacherLessonCounts).forEach(([teacherId, count]) => {
            console.log(`  Teacher ${teacherId}: ${count} lessons`);
        });
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('Stack:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the test
testTimetableGeneration();