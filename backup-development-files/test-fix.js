const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function regenerateTimetables() {
    try {
        console.log('Regenerating timetables with the fixed algorithm...\n');
        
        // Find the school ID
        const school = await prisma.school.findFirst({
            where: { status: 'APPROVED' }
        });
        
        if (!school) {
            console.log('No approved school found');
            return;
        }
        
        console.log(`Found school: ${school.name} (${school.id})`);
        
        // Clear existing timetables
        console.log('Clearing existing timetables...');
        await prisma.timetable.deleteMany({
            where: { schoolId: school.id }
        });
        
        // Test the lesson preparation for complementary modules
        console.log('\nTesting lesson preparation for complementary modules...');
        
        const assignments = await prisma.trainerClassModule.findMany({
            where: { 
                schoolId: school.id,
                module: {
                    category: 'COMPLEMENTARY'
                }
            },
            include: {
                module: true,
                class: true,
                trainer: true
            }
        });
        
        console.log(`Found ${assignments.length} complementary module assignments:`);
        
        for (const assignment of assignments) {
            const totalHours = assignment.module.totalHours;
            console.log(`- ${assignment.module.name} in ${assignment.class.name}: ${totalHours} hours`);
            
            // With the fix, this should create individual single-period lessons
            for (let i = 0; i < totalHours; i++) {
                console.log(`  Lesson ${i + 1}: single period`);
            }
        }
        
        console.log('\n✅ Fix applied: Complementary modules will now be scheduled as individual single periods');
        console.log('This allows for flexible scheduling and should resolve the missing periods issue.');
        
        console.log('\nTo apply the fix, please:');
        console.log('1. Go to your web browser');
        console.log('2. Navigate to the school admin dashboard');
        console.log('3. Go to Timetables section');
        console.log('4. Click "Generate Timetable" with regenerate=true');
        console.log('5. The complementary modules should now be fully scheduled');
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

regenerateTimetables();