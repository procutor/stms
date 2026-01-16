const { PrismaClient } = require('@prisma/client');
const { generateTimetable } = require('./src/lib/timetable-generator.ts');

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
        
        // Import and run the generator
        console.log('Generating new timetables...');
        const result = await generateTimetable(school.id);
        
        if (result.success) {
            console.log('✅ Timetable generation completed successfully!');
            console.log(`Conflicts: ${result.conflicts.length}`);
            
            if (result.conflicts.length > 0) {
                console.log('\nConflicts found:');
                result.conflicts.forEach((conflict, index) => {
                    console.log(`${index + 1}. ${conflict.message}`);
                });
            }
        } else {
            console.log('❌ Timetable generation failed');
            console.log('Conflicts:', result.conflicts);
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

regenerateTimetables();