// Create time slots for GS Gikomero
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const timeSlots = [
  // MONDAY - FRIDAY schedule (same for all weekdays)
  // Morning session
  { day: 'MONDAY', period: 1, name: 'P1', startTime: '07:30', endTime: '08:15', session: 'MORNING' },
  { day: 'MONDAY', period: 2, name: 'P2', startTime: '08:15', endTime: '09:00', session: 'MORNING' },
  { day: 'MONDAY', period: 3, name: 'P3', startTime: '09:15', endTime: '10:00', session: 'MORNING' },
  { day: 'MONDAY', period: 4, name: 'P4', startTime: '10:00', endTime: '10:45', session: 'MORNING' },
  { day: 'MONDAY', period: 5, name: 'BREAK', startTime: '10:45', endTime: '11:15', session: 'MORNING', isBreak: true, breakType: 'MORNING_BREAK' },
  { day: 'MONDAY', period: 6, name: 'P5', startTime: '11:15', endTime: '12:00', session: 'MORNING' },
  { day: 'MONDAY', period: 7, name: 'P6', startTime: '12:00', endTime: '12:45', session: 'MORNING' },
  { day: 'MONDAY', period: 8, name: 'P7', startTime: '12:45', endTime: '13:30', session: 'MORNING' },
  
  // Afternoon session
  { day: 'MONDAY', period: 9, name: 'P8', startTime: '14:00', endTime: '14:45', session: 'AFTERNOON' },
  { day: 'MONDAY', period: 10, name: 'P9', startTime: '14:45', endTime: '15:30', session: 'AFTERNOON' },
  
  // TUESDAY
  { day: 'TUESDAY', period: 1, name: 'P1', startTime: '07:30', endTime: '08:15', session: 'MORNING' },
  { day: 'TUESDAY', period: 2, name: 'P2', startTime: '08:15', endTime: '09:00', session: 'MORNING' },
  { day: 'TUESDAY', period: 3, name: 'P3', startTime: '09:15', endTime: '10:00', session: 'MORNING' },
  { day: 'TUESDAY', period: 4, name: 'P4', startTime: '10:00', endTime: '10:45', session: 'MORNING' },
  { day: 'TUESDAY', period: 5, name: 'BREAK', startTime: '10:45', endTime: '11:15', session: 'MORNING', isBreak: true, breakType: 'MORNING_BREAK' },
  { day: 'TUESDAY', period: 6, name: 'P5', startTime: '11:15', endTime: '12:00', session: 'MORNING' },
  { day: 'TUESDAY', period: 7, name: 'P6', startTime: '12:00', endTime: '12:45', session: 'MORNING' },
  { day: 'TUESDAY', period: 8, name: 'P7', startTime: '12:45', endTime: '13:30', session: 'MORNING' },
  { day: 'TUESDAY', period: 9, name: 'P8', startTime: '14:00', endTime: '14:45', session: 'AFTERNOON' },
  { day: 'TUESDAY', period: 10, name: 'P9', startTime: '14:45', endTime: '15:30', session: 'AFTERNOON' },
  
  // WEDNESDAY
  { day: 'WEDNESDAY', period: 1, name: 'P1', startTime: '07:30', endTime: '08:15', session: 'MORNING' },
  { day: 'WEDNESDAY', period: 2, name: 'P2', startTime: '08:15', endTime: '09:00', session: 'MORNING' },
  { day: 'WEDNESDAY', period: 3, name: 'P3', startTime: '09:15', endTime: '10:00', session: 'MORNING' },
  { day: 'WEDNESDAY', period: 4, name: 'P4', startTime: '10:00', endTime: '10:45', session: 'MORNING' },
  { day: 'WEDNESDAY', period: 5, name: 'BREAK', startTime: '10:45', endTime: '11:15', session: 'MORNING', isBreak: true, breakType: 'MORNING_BREAK' },
  { day: 'WEDNESDAY', period: 6, name: 'P5', startTime: '11:15', endTime: '12:00', session: 'MORNING' },
  { day: 'WEDNESDAY', period: 7, name: 'P6', startTime: '12:00', endTime: '12:45', session: 'MORNING' },
  { day: 'WEDNESDAY', period: 8, name: 'P7', startTime: '12:45', endTime: '13:30', session: 'MORNING' },
  { day: 'WEDNESDAY', period: 9, name: 'P8', startTime: '14:00', endTime: '14:45', session: 'AFTERNOON' },
  { day: 'WEDNESDAY', period: 10, name: 'P9', startTime: '14:45', endTime: '15:30', session: 'AFTERNOON' },
  
  // THURSDAY
  { day: 'THURSDAY', period: 1, name: 'P1', startTime: '07:30', endTime: '08:15', session: 'MORNING' },
  { day: 'THURSDAY', period: 2, name: 'P2', startTime: '08:15', endTime: '09:00', session: 'MORNING' },
  { day: 'THURSDAY', period: 3, name: 'P3', startTime: '09:15', endTime: '10:00', session: 'MORNING' },
  { day: 'THURSDAY', period: 4, name: 'P4', startTime: '10:00', endTime: '10:45', session: 'MORNING' },
  { day: 'THURSDAY', period: 5, name: 'BREAK', startTime: '10:45', endTime: '11:15', session: 'MORNING', isBreak: true, breakType: 'MORNING_BREAK' },
  { day: 'THURSDAY', period: 6, name: 'P5', startTime: '11:15', endTime: '12:00', session: 'MORNING' },
  { day: 'THURSDAY', period: 7, name: 'P6', startTime: '12:00', endTime: '12:45', session: 'MORNING' },
  { day: 'THURSDAY', period: 8, name: 'P7', startTime: '12:45', endTime: '13:30', session: 'MORNING' },
  { day: 'THURSDAY', period: 9, name: 'P8', startTime: '14:00', endTime: '14:45', session: 'AFTERNOON' },
  { day: 'THURSDAY', period: 10, name: 'P9', startTime: '14:45', endTime: '15:30', session: 'AFTERNOON' },
  
  // FRIDAY
  { day: 'FRIDAY', period: 1, name: 'P1', startTime: '07:30', endTime: '08:15', session: 'MORNING' },
  { day: 'FRIDAY', period: 2, name: 'P2', startTime: '08:15', endTime: '09:00', session: 'MORNING' },
  { day: 'FRIDAY', period: 3, name: 'P3', startTime: '09:15', endTime: '10:00', session: 'MORNING' },
  { day: 'FRIDAY', period: 4, name: 'P4', startTime: '10:00', endTime: '10:45', session: 'MORNING' },
  { day: 'FRIDAY', period: 5, name: 'BREAK', startTime: '10:45', endTime: '11:15', session: 'MORNING', isBreak: true, breakType: 'MORNING_BREAK' },
  { day: 'FRIDAY', period: 6, name: 'P5', startTime: '11:15', endTime: '12:00', session: 'MORNING' },
  { day: 'FRIDAY', period: 7, name: 'P6', startTime: '12:00', endTime: '12:45', session: 'MORNING' },
  { day: 'FRIDAY', period: 8, name: 'P7', startTime: '12:45', endTime: '13:30', session: 'MORNING' },
  { day: 'FRIDAY', period: 9, name: 'P8', startTime: '14:00', endTime: '14:45', session: 'AFTERNOON' },
  { day: 'FRIDAY', period: 10, name: 'P9', startTime: '14:45', endTime: '15:30', session: 'AFTERNOON' }
];

async function createTimeSlots() {
  try {
    console.log('🔍 Finding GS Gikomero school...');
    
    // Find the school
    const school = await prisma.school.findFirst({
      where: {
        name: {
          contains: 'GS Gikomero',
          mode: 'insensitive'
        }
      }
    });

    if (!school) {
      console.log('❌ GS Gikomero school not found!');
      return;
    }

    console.log(`✅ Found school: ${school.name} (ID: ${school.id})`);
    
    // Check existing time slots
    const existingSlots = await prisma.timeSlot.findMany({
      where: { schoolId: school.id }
    });
    
    console.log(`📋 Found ${existingSlots.length} existing time slots for this school`);
    
    if (existingSlots.length > 0) {
      console.log('⚠️  Existing time slots found. Deleting them first...');
      await prisma.timeSlot.deleteMany({
        where: { schoolId: school.id }
      });
      console.log('✅ Deleted existing time slots');
    }

    // Create new time slots
    console.log('🚀 Creating new time slots...');
    
    const slotsToCreate = timeSlots.map(slot => ({
      ...slot,
      schoolId: school.id,
      startTime: new Date(`2024-01-01T${slot.startTime}:00.000Z`),
      endTime: new Date(`2024-01-01T${slot.endTime}:00.000Z`)
    }));

    const createdSlots = await prisma.timeSlot.createMany({
      data: slotsToCreate
    });

    console.log(`✅ Successfully created ${createdSlots.count} time slots for GS Gikomero!`);
    
    // Verify creation
    const verificationSlots = await prisma.timeSlot.findMany({
      where: { schoolId: school.id },
      orderBy: [
        { day: 'asc' },
        { period: 'asc' }
      ]
    });

    console.log('\n📊 Time Slots Summary:');
    const dayGroups = verificationSlots.reduce((acc, slot) => {
      if (!acc[slot.day]) acc[slot.day] = [];
      acc[slot.day].push(slot);
      return acc;
    }, {});

    Object.entries(dayGroups).forEach(([day, slots]) => {
      const teachingPeriods = slots.filter(s => !s.isBreak).length;
      const breakPeriods = slots.filter(s => s.isBreak).length;
      console.log(`   ${day}: ${teachingPeriods} teaching periods, ${breakPeriods} breaks`);
    });

    console.log('\n🎉 GS Gikomero time slots setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error creating time slots:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTimeSlots();