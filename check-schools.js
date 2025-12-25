const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSchools() {
  try {
    const schools = await prisma.school.findMany();
    console.log('School Analysis:');
    for (const school of schools) {
      const classes = (await prisma.class.findMany({ where: { schoolId: school.id } })).length;
      const teachers = (await prisma.user.findMany({ where: { schoolId: school.id, role: 'TEACHER' } })).length;
      const timetables = (await prisma.timetable.findMany({ where: { schoolId: school.id } })).length;
      const assignments = (await prisma.trainerClassModule.findMany({ where: { schoolId: school.id } })).length;
      console.log(`${school.name} (${school.status}): classes=${classes}, teachers=${teachers}, timetables=${timetables}, assignments=${assignments}`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchools();