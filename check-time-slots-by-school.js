const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTimeSlots() {
  try {
    const schools = await prisma.school.findMany();
    console.log('Time Slots Analysis by School:');
    
    for (const school of schools) {
      const timeSlots = await prisma.timeSlot.findMany({ where: { schoolId: school.id } });
      const classes = await prisma.class.findMany({ where: { schoolId: school.id } });
      const subjects = await prisma.subject.findMany({ where: { schoolId: school.id } });
      const modules = await prisma.module.findMany({ where: { schoolId: school.id } });
      
      console.log(`\n${school.name} (${school.type}):`);
      console.log(`  Time Slots: ${timeSlots.length}`);
      console.log(`  Classes: ${classes.length}`);
      console.log(`  Subjects: ${subjects.length}`);
      console.log(`  Modules: ${modules.length}`);
      
      if (timeSlots.length === 0) {
        console.log(`  ❌ NO TIME SLOTS - Cannot generate timetables`);
      } else {
        // Show sample time slots
        const sampleSlots = timeSlots.slice(0, 5);
        console.log(`  Sample time slots:`, sampleSlots.map(slot => `${slot.day} P${slot.period}`));
        if (timeSlots.length > 5) {
          console.log(`  ... and ${timeSlots.length - 5} more`);
        }
      }
      
      // Check for required data completeness
      const hasBasicData = classes.length > 0 && (subjects.length > 0 || modules.length > 0);
      const hasTimeSlots = timeSlots.length > 0;
      
      if (!hasBasicData) {
        console.log(`  ⚠️  Missing basic data (classes or subjects/modules)`);
      }
      if (!hasTimeSlots) {
        console.log(`  ⚠️  Missing time slots - required for timetable generation`);
      }
      
      console.log(`  Status: ${hasBasicData && hasTimeSlots ? '✅ Ready for generation' : '❌ Missing prerequisites'}`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTimeSlots();