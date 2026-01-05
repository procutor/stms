const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkGikomeroTimeSlots() {
  try {
    console.log('=== CHECKING TIME SLOTS FOR GS GIKOMERO TSS ===\n');
    
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
    
    // Find L4 ELTA class
    const targetClass = await prisma.class.findFirst({
      where: {
        schoolId: school.id,
        name: 'L4 ELTA'
      }
    });
    
    if (!targetClass) {
      console.log('❌ L4 ELTA class not found');
      return;
    }
    
    console.log(`✅ Found class: ${targetClass.name} (ID: ${targetClass.id})\n`);
    
    // Check time slots for this specific class
    const timeSlots = await prisma.timeSlot.findMany({
      where: {
        schoolId: school.id
      },
      orderBy: [
        { day: 'asc' },
        { startTime: 'asc' }
      ]
    });
    
    console.log(`📅 Found ${timeSlots.length} time slots for school:\n`);
    
    // Group by day
    const slotsByDay = timeSlots.reduce((acc, slot) => {
      if (!acc[slot.day]) {
        acc[slot.day] = [];
      }
      acc[slot.day].push(slot);
      return acc;
    }, {});
    
    const daysOrder = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
    
    for (const day of daysOrder) {
      if (slotsByDay[day]) {
        console.log(`📆 ${day}:`);
        slotsByDay[day].forEach(slot => {
          console.log(`   ${slot.startTime} - ${slot.endTime} (${slot.periodNumber})`);
        });
        console.log('');
      }
    }
    
    // Check for assignments for L4 ELTA
    const assignments = await prisma.teacherClassAssignment.findMany({
      where: {
        classId: targetClass.id
      },
      include: {
        teacher: true,
        subject: true
      }
    });
    
    console.log(`👨‍🏫 Teacher assignments for L4 ELTA: ${assignments.length}`);
    assignments.forEach(assignment => {
      console.log(`   - ${assignment.subject.name} with ${assignment.teacher.name}`);
    });
    
  } catch (error) {
    console.error('Error checking time slots:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkGikomeroTimeSlots();