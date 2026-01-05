const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugGikomeroSlots() {
  try {
    console.log('=== DEBUGGING GS GIKOMERO TIME SLOTS ===\n');
    
    // Find GS GIKOMERO TSS
    const school = await prisma.school.findFirst({
      where: { 
        OR: [
          { name: 'GS GIKOMERO TSS' },
          { name: 'gikomero' }
        ]
      }
    });
    
    if (!school) {
      console.log('❌ GS GIKOMERO TSS not found');
      return;
    }
    
    console.log(`✅ Found school: ${school.name} (ID: ${school.id})\n`);
    
    // Check ALL time slots for this school (first 10 to see structure)
    const timeSlots = await prisma.timeSlot.findMany({
      where: {
        schoolId: school.id
      },
      take: 10
    });
    
    console.log(`📅 Found ${timeSlots.length} time slots for school (showing first 10):\n`);
    
    timeSlots.forEach((slot, index) => {
      console.log(`Slot ${index + 1}:`);
      console.log(`  ID: ${slot.id}`);
      console.log(`  Day: "${slot.day}" (type: ${typeof slot.day})`);
      console.log(`  Period: ${slot.periodNumber}`);
      console.log(`  Start: ${slot.startTime}`);
      console.log(`  End: ${slot.endTime}`);
      console.log(`  School ID: ${slot.schoolId}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error debugging time slots:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugGikomeroSlots();