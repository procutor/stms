const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkGenerationIssues() {
    try {
        console.log('🔍 Checking for timetable generation issues...\n');
        
        // Get first approved school
        const school = await prisma.school.findFirst({
            where: { status: 'APPROVED' }
        });
        
        if (!school) {
            console.log('❌ No approved school found');
            return;
        }
        
        console.log('📚 School:', school.name);
        
        // Check time slots
        const timeSlots = await prisma.timeSlot.findMany({
            where: { schoolId: school.id, isActive: true }
        });
        console.log('⏰ Time slots:', timeSlots.length);
        
        // Check assignments
        const teacherAssignments = await prisma.teacherClassSubject.findMany({
            where: { schoolId: school.id }
        });
        const trainerAssignments = await prisma.trainerClassModule.findMany({
            where: { schoolId: school.id }
        });
        
        console.log('👥 Teacher assignments:', teacherAssignments.length);
        console.log('🎯 Trainer assignments:', trainerAssignments.length);
        
        // Check existing timetables
        const timetables = await prisma.timetable.findMany({
            where: { schoolId: school.id }
        });
        console.log('📅 Existing timetables:', timetables.length);
        
        // Test lesson preparation manually
        try {
            console.log('\n🔧 Testing lesson preparation...');
            
            // Manual lesson preparation
            const lessons = [];
            
            // Process Teacher-Class-Subject assignments
            for (const assignment of teacherAssignments) {
                const level = assignment.class.level || assignment.subject.level || 'Unknown';
                
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
            
            // Process Trainer-Class-Module assignments
            for (const assignment of trainerAssignments) {
                const level = assignment.module.level || 'Unknown';
                
                for (let i = 0; i < assignment.module.totalHours; i++) {
                    lessons.push({
                        teacherId: assignment.trainerId,
                        moduleId: assignment.moduleId,
                        classId: assignment.classId,
                        lessonIndex: i + 1,
                        totalLessons: assignment.module.totalHours,
                        lessonType: 'TSS',
                        priority: 1, // Simplified priority
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
            
            console.log('✅ Manual lesson preparation successful');
            console.log('📊 Total lessons prepared:', lessons.length);
            
            // Check for validation issues
            if (lessons.length === 0) {
                console.log('❌ No lessons prepared - this could cause generation failure');
            }
            
            // Check if we have time slots
            if (timeSlots.length === 0) {
                console.log('❌ No time slots found - this will cause generation failure');
            }
            
            // Check if teachers exist
            const teachers = await prisma.user.findMany({
                where: {
                    schoolId: school.id,
                    role: { in: ['TEACHER', 'TRAINER'] },
                    isActive: true
                }
            });
            console.log('👨‍🏫 Active teachers:', teachers.length);
            
            // Check if classes exist
            const classes = await prisma.class.findMany({
                where: { schoolId: school.id }
            });
            console.log('🏫 Classes:', classes.length);
            
        } catch (error) {
            console.log('❌ Lesson preparation failed:', error.message);
            console.log('Stack trace:', error.stack);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('Stack trace:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

checkGenerationIssues();