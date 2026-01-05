import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSchoolTimeSlots(schoolId) {
  console.log(`🔍 CHECKING TIME SLOTS FOR SCHOOL: ${schoolId}`);
  
  try {
    const timeSlots = await prisma.timeSlot.findMany({
      where: { schoolId },
      orderBy: [
        { day: 'asc' },
        { period: 'asc' }
      ]
    });
    
    console.log(`\n📊 Found ${timeSlots.length} time slots:`);
    timeSlots.forEach((slot, index) => {
      console.log(`${index + 1}. Day: ${slot.day}, Period: ${slot.period}, Start: ${slot.startTime}, End: ${slot.endTime}`);
    });
    
    // Group by day to see structure
    const byDay = {};
    timeSlots.forEach(slot => {
      if (!byDay[slot.day]) byDay[slot.day] = [];
      byDay[slot.day].push(slot);
    });
    
    console.log(`\n📋 Time slots by day:`);
    Object.keys(byDay).sort().forEach(day => {
      console.log(`${day}: ${byDay[day].length} periods`);
      byDay[day].sort((a, b) => a.period - b.period).forEach(slot => {
        console.log(`  P${slot.period}: ${slot.startTime}-${slot.endTime}`);
      });
    });
    
  } catch (error) {
    console.error('❌ Error checking time slots:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get school ID from command line
const schoolId = process.argv[2];
if (!schoolId) {
  console.log('❌ Usage: node check-school-time-slots.js <schoolId>');
  process.exit(1);
}

checkSchoolTimeSlots(schoolId);