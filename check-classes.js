const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkClassAssignments() {
    try {
        console.log('🔍 Checking class assignments...\n');

        // Get all classes
        const classes = await prisma.class.findMany({
            select: { id: true, name: true, level: true }
        });

        // Get teacher-class-subject assignments
        const teacherClassSubjects = await prisma.teacherClassSubject.findMany({
            select: { classId: true }
        });

        // Get trainer-class-module assignments  
        const trainerClassModules = await prisma.trainerClassModule.findMany({
            select: { classId: true }
        });

        // Create sets of class IDs that have assignments
        const classesWithTeacherAssignments = new Set(teacherClassSubjects.map(a => a.classId));
        const classesWithTrainerAssignments = new Set(trainerClassModules.map(a => a.classId));

        console.log('📊 Classes and their assignments:\n');
        
        classes.forEach(cls => {
            const hasTeacherAssign = classesWithTeacherAssignments.has(cls.id);
            const hasTrainerAssign = classesWithTrainerAssignments.has(cls.id);
            const hasAnyAssign = hasTeacherAssign || hasTrainerAssign;
            
            const status = hasAnyAssign ? '✅ Has assignments' : '❌ No assignments';
            const type = hasTrainerAssign ? ' (TSS)' : hasTeacherAssign ? ' (Regular)' : '';
            
            console.log(`${cls.name} (${cls.level}) - ${status}${type}`);
        });

        const classesWithoutAssignments = classes.filter(cls => 
            !classesWithTeacherAssignments.has(cls.id) && !classesWithTrainerAssignments.has(cls.id)
        );

        console.log(`\n🚨 Classes without any assignments: ${classesWithoutAssignments.length}`);
        if (classesWithoutAssignments.length > 0) {
            console.log('These classes cannot have timetables generated:');
            classesWithoutAssignments.forEach(cls => {
                console.log(`  - ${cls.name} (${cls.level})`);
            });
        }

        const classesWithAssignments = classes.filter(cls => 
            classesWithTeacherAssignments.has(cls.id) || classesWithTrainerAssignments.has(cls.id)
        );

        console.log(`\n✅ Classes with assignments: ${classesWithAssignments.length}`);
        if (classesWithAssignments.length > 0) {
            console.log('These classes can have timetables generated:');
            classesWithAssignments.forEach(cls => {
                const type = classesWithTrainerAssignments.has(cls.id) ? 'TSS' : 'Regular';
                console.log(`  - ${cls.name} (${cls.level}) - ${type}`);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkClassAssignments();