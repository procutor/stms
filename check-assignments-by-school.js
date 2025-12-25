const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAssignments() {
  try {
    const schools = await prisma.school.findMany();
    console.log('Teacher/Trainer Assignments Analysis by School:');
    
    for (const school of schools) {
      console.log(`\n${school.name} (${school.type}):`);
      
      // Get all classes for this school
      const classes = await prisma.class.findMany({ where: { schoolId: school.id } });
      console.log(`  Classes: ${classes.length}`);
      
      // Get teacher-class-subject assignments (for Primary/Secondary)
      const teacherClassSubjects = await prisma.teacherClassSubject.findMany({ 
        where: { schoolId: school.id },
        include: {
          teacher: { select: { name: true } },
          class: { select: { name: true } },
          subject: { select: { name: true } }
        }
      });
      
      // Get trainer-class-module assignments (for TSS)
      const trainerClassModules = await prisma.trainerClassModule.findMany({ 
        where: { schoolId: school.id },
        include: {
          trainer: { select: { name: true } },
          class: { select: { name: true } },
          module: { select: { name: true } }
        }
      });
      
      console.log(`  Teacher-Class-Subject Assignments: ${teacherClassSubjects.length}`);
      console.log(`  Trainer-Class-Module Assignments: ${trainerClassModules.length}`);
      
      if (school.type === 'PRIMARY') {
        if (teacherClassSubjects.length === 0) {
          console.log(`  ❌ No teacher assignments - Primary school needs teacher-class-subject assignments`);
        } else {
          console.log(`  ✅ Has teacher assignments for timetable generation`);
          // Show sample
          const sample = teacherClassSubjects.slice(0, 3);
          sample.forEach(assignment => {
            console.log(`    ${assignment.teacher.name} -> ${assignment.class.name} (${assignment.subject.name})`);
          });
          if (teacherClassSubjects.length > 3) {
            console.log(`    ... and ${teacherClassSubjects.length - 3} more assignments`);
          }
        }
      } else if (school.type.includes('TSS')) {
        if (trainerClassModules.length === 0) {
          console.log(`  ❌ No trainer assignments - TSS school needs trainer-class-module assignments`);
        } else {
          console.log(`  ✅ Has trainer assignments for timetable generation`);
          // Show sample
          const sample = trainerClassModules.slice(0, 3);
          sample.forEach(assignment => {
            console.log(`    ${assignment.trainer.name} -> ${assignment.class.name} (${assignment.module.name})`);
          });
          if (trainerClassModules.length > 3) {
            console.log(`    ... and ${trainerClassModules.length - 3} more assignments`);
          }
        }
      }
      
      // Check timetables
      const timetables = await prisma.timetable.findMany({ where: { schoolId: school.id } });
      console.log(`  Timetables Generated: ${timetables.length}`);
      
      // Overall status
      const hasTimeSlots = (await prisma.timeSlot.findMany({ where: { schoolId: school.id } })).length > 0;
      const hasAssignments = teacherClassSubjects.length > 0 || trainerClassModules.length > 0;
      
      if (!hasTimeSlots) {
        console.log(`  Status: ❌ Missing time slots`);
      } else if (!hasAssignments) {
        console.log(`  Status: ❌ Missing teacher/trainer assignments`);
      } else if (timetables.length === 0) {
        console.log(`  Status: ⚠️  Ready for generation but no timetables yet`);
      } else {
        console.log(`  Status: ✅ Has timetables generated`);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAssignments();