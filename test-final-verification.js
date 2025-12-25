const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function finalVerification() {
  try {
    const schools = await prisma.school.findMany();
    console.log('=== FINAL VERIFICATION: School Features Status ===\n');
    
    for (const school of schools) {
      console.log(`${school.name} (${school.type}):`);
      
      // Get counts
      const timeSlots = await prisma.timeSlot.count({ where: { schoolId: school.id } });
      const classes = await prisma.class.count({ where: { schoolId: school.id } });
      const teachers = await prisma.user.count({ where: { schoolId: school.id, role: 'TEACHER' } });
      const trainers = await prisma.user.count({ where: { schoolId: school.id, role: 'TRAINER' } });
      const subjects = await prisma.subject.count({ where: { schoolId: school.id } });
      const modules = await prisma.module.count({ where: { schoolId: school.id } });
      const teacherAssignments = await prisma.teacherClassSubject.count({ where: { schoolId: school.id } });
      const trainerAssignments = await prisma.trainerClassModule.count({ where: { schoolId: school.id } });
      const timetables = await prisma.timetable.count({ where: { schoolId: school.id } });
      
      console.log(`  Time Slots: ${timeSlots}`);
      console.log(`  Classes: ${classes}`);
      console.log(`  Teachers: ${teachers}, Trainers: ${trainers}`);
      console.log(`  Subjects: ${subjects}, Modules: ${modules}`);
      console.log(`  Teacher Assignments: ${teacherAssignments}`);
      console.log(`  Trainer Assignments: ${trainerAssignments}`);
      console.log(`  Timetables Generated: ${timetables}`);
      
      // Check readiness
      const hasTimeSlots = timeSlots > 0;
      const hasClasses = classes > 0;
      const hasTeachersOrTrainers = teachers > 0 || trainers > 0;
      const hasAssignments = teacherAssignments > 0 || trainerAssignments > 0;
      const hasContent = subjects > 0 || modules > 0;
      
      const readyForGeneration = hasTimeSlots && hasClasses && hasTeachersOrTrainers && hasAssignments && hasContent;
      
      console.log(`  Prerequisites:`);
      console.log(`    ✅ Time Slots: ${hasTimeSlots ? 'Yes' : 'No'}`);
      console.log(`    ✅ Classes: ${hasClasses ? 'Yes' : 'No'}`);
      console.log(`    ✅ Teachers/Trainers: ${hasTeachersOrTrainers ? 'Yes' : 'No'}`);
      console.log(`    ✅ Assignments: ${hasAssignments ? 'Yes' : 'No'}`);
      console.log(`    ✅ Content (Subjects/Modules): ${hasContent ? 'Yes' : 'No'}`);
      
      if (readyForGeneration) {
        console.log(`    Status: ✅ READY FOR TIMETABLE GENERATION`);
      } else {
        console.log(`    Status: ❌ MISSING PREREQUISITES`);
      }
      
      if (timetables > 0) {
        console.log(`    Current Status: ✅ HAS TIMETABLES (${timetables})`);
      } else if (readyForGeneration) {
        console.log(`    Current Status: ⚠️ READY BUT NO TIMETABLES YET`);
      } else {
        console.log(`    Current Status: ❌ CANNOT GENERATE TIMETABLES`);
      }
      
      console.log('');
    }
    
    console.log('=== SUMMARY ===');
    const schoolsWithTimetables = await prisma.timetable.count();
    console.log(`Total timetables across all schools: ${schoolsWithTimetables}`);
    
    // Count schools ready for generation
    let readyCount = 0;
    for (const school of schools) {
      const timeSlots = await prisma.timeSlot.count({ where: { schoolId: school.id } });
      const classes = await prisma.class.count({ where: { schoolId: school.id } });
      const teachers = await prisma.user.count({ where: { schoolId: school.id, role: 'TEACHER' } });
      const trainers = await prisma.user.count({ where: { schoolId: school.id, role: 'TRAINER' } });
      const teacherAssignments = await prisma.teacherClassSubject.count({ where: { schoolId: school.id } });
      const trainerAssignments = await prisma.trainerClassModule.count({ where: { schoolId: school.id } });
      const subjects = await prisma.subject.count({ where: { schoolId: school.id } });
      const modules = await prisma.module.count({ where: { schoolId: school.id } });
      
      const hasTimeSlots = timeSlots > 0;
      const hasClasses = classes > 0;
      const hasTeachersOrTrainers = teachers > 0 || trainers > 0;
      const hasAssignments = teacherAssignments > 0 || trainerAssignments > 0;
      const hasContent = subjects > 0 || modules > 0;
      
      if (hasTimeSlots && hasClasses && hasTeachersOrTrainers && hasAssignments && hasContent) {
        readyCount++;
      }
    }
    
    console.log(`Schools ready for timetable generation: ${readyCount}/${schools.length}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

finalVerification();