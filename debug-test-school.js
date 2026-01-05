const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findTestSchool() {
  try {
    const schools = await prisma.school.findMany();
    console.log('All Schools:');
    schools.forEach(school => {
      console.log(`${school.id}: ${school.name} (${school.status}) - ${school.email}`);
    });
    
    const testSchool = schools.find(s => s.name === 'Test School');
    if (testSchool) {
      console.log('\nTest School Details:');
      console.log('ID:', testSchool.id);
      console.log('Status:', testSchool.status);
      
      const timeSlots = await prisma.timeSlot.findMany({
        where: { schoolId: testSchool.id }
      });
      
      console.log(`\nTime slots for Test School: ${timeSlots.length}`);
      timeSlots.forEach(slot => {
        console.log(`${slot.day}: Period ${slot.period} - ${slot.startTime} to ${slot.endTime}`);
      });
    } else {
      console.log('Test School not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findTestSchool();