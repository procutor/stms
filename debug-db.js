const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugDatabase() {
    try {
        console.log('🔍 Checking database state...\n');

        // Check for teacher-class assignments
        const teacherClassSubjects = await prisma.teacherClassSubject.findMany({
            include: {
                teacher: { select: { name: true }},
                subject: { select: { name: true }},
                class: { select: { name: true }}
            }
        });
        
        console.log('📚 Teacher-Class-Subject assignments:', teacherClassSubjects.length);
        if (teacherClassSubjects.length > 0) {
            console.log('Sample assignment:', JSON.stringify(teacherClassSubjects[0], null, 2));
        }
        
        // Check for trainer-class modules
        const trainerClassModules = await prisma.trainerClassModule.findMany({
            include: {
                trainer: { select: { name: true }},
                module: { select: { name: true }},
                class: { select: { name: true }}
            }
        });
        
        console.log('\n🎓 Trainer-Class-Module assignments:', trainerClassModules.length);
        if (trainerClassModules.length > 0) {
            console.log('Sample assignment:', JSON.stringify(trainerClassModules[0], null, 2));
        }
        
        // Check classes
        const classes = await prisma.class.findMany({
            select: { id: true, name: true, level: true }
        });
        console.log('\n🏫 Total classes:', classes.length);
        if (classes.length > 0) {
            console.log('Sample classes:', classes.slice(0, 3));
        }
        
        // Check teachers
        const teachers = await prisma.user.findMany({
            where: { role: { in: ['TEACHER', 'TRAINER'] }},
            select: { id: true, name: true, role: true }
        });
        console.log('\n👨‍🏫 Total teachers/trainers:', teachers.length);
        if (teachers.length > 0) {
            console.log('Sample teachers:', teachers.slice(0, 3));
        }

        // Check subjects
        const subjects = await prisma.subject.findMany({
            select: { id: true, name: true, periodsPerWeek: true }
        });
        console.log('\n📖 Total subjects:', subjects.length);

        // Check modules
        const modules = await prisma.module.findMany({
            select: { id: true, name: true, totalHours: true, category: true }
        });
        console.log('🧩 Total modules:', modules.length);

        // Check time slots
        const timeSlots = await prisma.timeSlot.findMany({
            where: { isActive: true },
            select: { id: true, day: true, period: true, startTime: true, endTime: true }
        });
        console.log('⏰ Total time slots:', timeSlots.length);

        // Check existing timetables
        const timetables = await prisma.timetable.findMany({
            select: { id: true, classId: true, teacherId: true }
        });
        console.log('📅 Existing timetables:', timetables.length);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugDatabase();