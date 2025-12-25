const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabaseStructure() {
    try {
        console.log('🔍 Checking database structure for timetable generation...\n');
        
        // Get first approved school
        const school = await prisma.school.findFirst({
            where: { status: 'APPROVED' }
        });
        
        if (!school) {
            console.log('❌ No approved school found');
            return;
        }
        
        console.log('📚 School:', school.name);
        
        // Check raw teacher-class assignments
        console.log('\n📊 Raw teacher-class assignments:');
        const rawAssignments = await prisma.teacherClassSubject.findMany({
            where: { schoolId: school.id },
            take: 3
        });
        
        if (rawAssignments.length > 0) {
            console.log('Fields:', Object.keys(rawAssignments[0]));
            console.log('Sample:', JSON.stringify(rawAssignments[0], null, 2));
        } else {
            console.log('No teacher-class assignments found');
        }
        
        // Check with includes
        console.log('\n🔗 Teacher-class assignments with relations:');
        const assignments = await prisma.teacherClassSubject.findMany({
            where: { schoolId: school.id },
            include: {
                teacher: true,
                subject: true,
                class: true
            },
            take: 3
        });
        
        if (assignments.length > 0) {
            console.log('Sample with relations:', JSON.stringify(assignments[0], null, 2));
        } else {
            console.log('No assignments with relations found');
        }
        
        // Check if teachers exist
        console.log('\n👨‍🏫 Active teachers:');
        const teachers = await prisma.user.findMany({
            where: { 
                schoolId: school.id,
                role: 'TEACHER',
                isActive: true 
            },
            take: 3
        });
        console.log(`Found ${teachers.length} teachers`);
        if (teachers.length > 0) {
            console.log('Sample:', JSON.stringify(teachers[0], null, 2));
        }
        
        // Check if classes exist
        console.log('\n🏫 Classes:');
        const classes = await prisma.class.findMany({
            where: { schoolId: school.id },
            take: 3
        });
        console.log(`Found ${classes.length} classes`);
        if (classes.length > 0) {
            console.log('Sample:', JSON.stringify(classes[0], null, 2));
        }
        
        // Check if subjects exist
        console.log('\n📚 Subjects:');
        const subjects = await prisma.subject.findMany({
            where: { schoolId: school.id },
            take: 3
        });
        console.log(`Found ${subjects.length} subjects`);
        if (subjects.length > 0) {
            console.log('Sample:', JSON.stringify(subjects[0], null, 2));
        }
        
        // Check trainer-class modules
        console.log('\n🎯 Trainer-class modules:');
        const trainerAssignments = await prisma.trainerClassModule.findMany({
            where: { schoolId: school.id },
            include: {
                trainer: true,
                module: true,
                class: true
            },
            take: 3
        });
        
        if (trainerAssignments.length > 0) {
            console.log('Sample trainer assignment:', JSON.stringify(trainerAssignments[0], null, 2));
        } else {
            console.log('No trainer assignments found');
        }
        
        // Check time slots
        console.log('\n⏰ Time slots:');
        const timeSlots = await prisma.timeSlot.findMany({
            where: { schoolId: school.id, isActive: true },
            take: 5
        });
        console.log(`Found ${timeSlots.length} time slots`);
        if (timeSlots.length > 0) {
            console.log('Sample:', JSON.stringify(timeSlots[0], null, 2));
        }
        
        // Now test the actual validation
        console.log('\n🧪 Testing validation logic...');
        
        try {
            // Test if we can create lessons from assignments
            const testLessons = [];
            
            for (const assignment of assignments) {
                if (!assignment.class || !assignment.subject || !assignment.teacher) {
                    console.log('❌ Missing relation in assignment:', {
                        hasClass: !!assignment.class,
                        hasSubject: !!assignment.subject,
                        hasTeacher: !!assignment.teacher
                    });
                    continue;
                }
                
                const level = assignment.class.level || assignment.subject.level || 'Unknown';
                console.log('✅ Assignment valid:', {
                    classLevel: assignment.class.level,
                    subjectLevel: assignment.subject.level,
                    determinedLevel: level
                });
                
                for (let i = 0; i < assignment.subject.periodsPerWeek; i++) {
                    testLessons.push({
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
            
            console.log(`✅ Successfully created ${testLessons.length} test lessons`);
            
        } catch (error) {
            console.log('❌ Validation failed:', error.message);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('Stack:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

checkDatabaseStructure();