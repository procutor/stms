const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixTimeSlotCapacity() {
    try {
        console.log('🔧 Fixing Time Slot Capacity Issue...\n');
        
        // Get first approved school
        const school = await prisma.school.findFirst({
            where: { status: 'APPROVED' }
        });
        
        if (!school) {
            console.log('❌ No approved school found');
            return;
        }
        
        console.log(`📚 School: ${school.name}`);
        
        // Check current time slots
        const existingSlots = await prisma.timeSlot.findMany({
            where: { schoolId: school.id },
            orderBy: [{ day: 'asc' }, { period: 'asc' }]
        });
        
        const teachingPeriods = existingSlots.filter(s => !s.isBreak);
        console.log(`⏰ Current teaching periods: ${teachingPeriods.length}`);
        
        // Count lessons that need to be scheduled (using the same logic as debug script)
        const teacherClassSubjects = await prisma.teacherClassSubject.findMany({
            where: { schoolId: school.id },
            include: {
                subject: true
            }
        });
        
        const trainerClassModules = await prisma.trainerClassModule.findMany({
            where: { schoolId: school.id },
            include: {
                module: true
            }
        });
        
        let totalLessons = 0;
        teacherClassSubjects.forEach(assignment => {
            totalLessons += assignment.subject?.periodsPerWeek || 0;
        });
        
        trainerClassModules.forEach(assignment => {
            totalLessons += assignment.module?.totalHours || 0;
        });
        
        console.log(`📚 Total lessons to schedule: ${totalLessons}`);
        console.log(`📊 Capacity needed: ${totalLessons} slots`);
        console.log(`📊 Capacity available: ${teachingPeriods.length} slots`);
        console.log(`❌ Shortfall: ${totalLessons - teachingPeriods.length} slots`);
        
        if (totalLessons <= teachingPeriods.length) {
            console.log('✅ Capacity is sufficient - no action needed');
            return;
        }
        
        // Calculate how many more periods we need per day
        const additionalSlotsNeeded = totalLessons - teachingPeriods.length;
        const periodsPerDay = 5; // Monday to Friday
        const additionalPeriodsPerDay = Math.ceil(additionalSlotsNeeded / periodsPerDay);
        
        console.log(`\n🛠️ Solution: Add ${additionalPeriodsPerDay} more periods per day`);
        console.log(`📅 This will add ${additionalPeriodsPerDay * periodsPerDay} total slots`);
        
        // Generate new time slots
        const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
        const newSlots = [];
        
        // Start from period 11 onwards
        const startPeriod = 11;
        const endPeriod = 10 + additionalPeriodsPerDay;
        
        for (const day of days) {
            for (let period = startPeriod; period <= endPeriod; period++) {
                // Calculate times (45 minutes per period with 5 minute break)
                const baseHour = 14; // 2 PM start for additional periods
                const periodIndex = period - 10; // Period 11 = index 1
                const startHour = baseHour + Math.floor((periodIndex * 50) / 60);
                const startMinute = (periodIndex * 50) % 60;
                const endHour = startHour + Math.floor(45 / 60);
                const endMinute = (startMinute + 45) % 60;
                
                const startTime = new Date();
                startTime.setHours(startHour, startMinute, 0, 0);
                
                const endTime = new Date();
                endTime.setHours(endHour, endMinute, 0, 0);
                
                newSlots.push({
                    id: `slot-${day.toLowerCase()}-${period}`,
                    schoolId: school.id,
                    day: day,
                    period: period,
                    name: `Period ${period}`,
                    startTime: startTime,
                    endTime: endTime,
                    session: 'AFTERNOON',
                    isBreak: false,
                    isActive: true
                });
            }
        }
        
        console.log(`\n🆕 Creating ${newSlots.length} new time slots...`);
        
        // Create new time slots
        for (const slot of newSlots) {
            try {
                await prisma.timeSlot.create({
                    data: slot
                });
                console.log(`✅ Created ${slot.day} Period ${slot.period}`);
            } catch (error) {
                console.log(`❌ Failed to create ${slot.day} Period ${slot.period}: ${error.message}`);
            }
        }
        
        // Verify the fix
        const updatedSlots = await prisma.timeSlot.findMany({
            where: { schoolId: school.id, isActive: true }
        });
        
        const updatedTeachingPeriods = updatedSlots.filter(s => !s.isBreak);
        const newCapacity = updatedTeachingPeriods.length;
        
        console.log(`\n📊 After fix:`);
        console.log(`Total teaching periods: ${newCapacity}`);
        console.log(`Required lessons: ${totalLessons}`);
        console.log(`Capacity status: ${totalLessons <= newCapacity ? '✅ SUFFICIENT' : '❌ STILL INSUFFICIENT'}`);
        
        if (totalLessons <= newCapacity) {
            console.log('\n🎉 SUCCESS: Time slot capacity issue has been resolved!');
            console.log('📝 Timetable generation should now work without validation errors.');
        } else {
            console.log('\n⚠️ WARNING: Still insufficient capacity. Consider adding more periods.');
        }
        
    } catch (error) {
        console.error('❌ Error fixing time slots:', error.message);
        console.log('Stack:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the fix
fixTimeSlotCapacity();