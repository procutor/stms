const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAndFixTimeSlots() {
    try {
        console.log('🔍 Checking time slots issue...\n');
        
        // Get first approved school
        const school = await prisma.school.findFirst({
            where: { status: 'APPROVED' }
        });
        
        if (!school) {
            console.log('❌ No approved school found');
            return;
        }
        
        console.log('📚 School:', school.name);
        
        // Check all time slots for this school
        const allTimeSlots = await prisma.timeSlot.findMany({
            where: { schoolId: school.id },
            orderBy: [{ day: 'asc' }, { period: 'asc' }]
        });
        
        console.log(`⏰ Total time slots: ${allTimeSlots.length}`);
        
        // Group by day
        const timeSlotsByDay = {};
        allTimeSlots.forEach(slot => {
            if (!timeSlotsByDay[slot.day]) {
                timeSlotsByDay[slot.day] = [];
            }
            timeSlotsByDay[slot.day].push(slot);
        });
        
        console.log('\n📅 Time slots by day:');
        Object.keys(timeSlotsByDay).forEach(day => {
            const periods = timeSlotsByDay[day].filter(s => !s.isBreak);
            const breaks = timeSlotsByDay[day].filter(s => s.isBreak);
            console.log(`${day}: ${periods.length} periods, ${breaks.length} breaks`);
        });
        
        // Check if we have enough time slots
        const teachingPeriods = allTimeSlots.filter(s => !s.isBreak);
        console.log(`\n📊 Teaching periods: ${teachingPeriods.length}`);
        console.log('Expected: 50 (10 periods × 5 days)');
        
        if (teachingPeriods.length < 50) {
            console.log('❌ INSUFFICIENT TIME SLOTS - This will cause validation failure!');
            console.log('Need to create more time slots for full week coverage');
            
            // Show what periods we have for Monday as example
            const mondaySlots = timeSlotsByDay['MONDAY'] || [];
            const mondayPeriods = mondaySlots.filter(s => !s.isBreak).map(s => s.period);
            console.log(`\n📋 Monday periods available: [${mondayPeriods.join(', ')}]`);
            
            return false;
        } else {
            console.log('✅ Sufficient time slots available');
            return true;
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        return false;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the check
checkAndFixTimeSlots();