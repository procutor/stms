const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAPIGeneration() {
    try {
        console.log('🔍 Testing API timetable generation...\n');
        
        // Get first approved school
        const school = await prisma.school.findFirst({
            where: { status: 'APPROVED' },
            include: {
                users: {
                    where: { role: 'SCHOOL_ADMIN', isActive: true }
                }
            }
        });
        
        if (!school) {
            console.log('❌ No approved school found');
            return;
        }
        
        console.log('📚 School:', school.name);
        console.log('👤 School Admin:', school.users[0]?.email || 'None found');
        
        if (!school.users[0]) {
            console.log('❌ No school admin found for this school');
            return;
        }
        
        // Test the lesson preparation function directly
        console.log('\n🔧 Testing lesson preparation...');
        
        try {
            // Import and test the lesson preparation
            const { prepareLessonsForSchool } = require('./src/lib/lesson-preparation.ts');
            const result = await prepareLessonsForSchool(school.id);
            
            console.log('✅ Lesson preparation successful');
            console.log(`📊 Total lessons: ${result.lessons.length}`);
            console.log(`🔍 Validation: ${result.validation.isValid ? 'VALID' : 'INVALID'}`);
            
            if (!result.validation.isValid) {
                console.log('❌ Validation errors:', result.validation.errors);
                console.log('⚠️ Validation warnings:', result.validation.warnings);
            }
            
            console.log('\n📈 Statistics:', JSON.stringify(result.statistics, null, 2));
            
        } catch (error) {
            console.log('❌ Lesson preparation failed:', error.message);
            console.log('Stack trace:', error.stack);
        }
        
        // Test the timetable generator
        console.log('\n🎯 Testing timetable generator...');
        
        try {
            const { generateTimetableForClass } = require('./src/lib/timetable-generator.ts');
            
            // Get a class with assignments
            const classes = await prisma.class.findMany({
                where: { schoolId: school.id },
                take: 1
            });
            
            if (classes.length === 0) {
                console.log('❌ No classes found');
                return;
            }
            
            const classId = classes[0].id;
            console.log(`🏫 Testing with class: ${classes[0].name}`);
            
            const result = await generateTimetableForClass(school.id, classId, { regenerate: true });
            
            console.log(`🎯 Generation result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
            console.log(`⚠️ Conflicts: ${result.conflicts.length}`);
            
            if (result.conflicts.length > 0) {
                console.log('Conflict details:');
                result.conflicts.forEach((conflict, index) => {
                    console.log(`  ${index + 1}. ${conflict.type}: ${conflict.message}`);
                });
            }
            
        } catch (error) {
            console.log('❌ Timetable generation failed:', error.message);
            console.log('Stack trace:', error.stack);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('Stack:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

testAPIGeneration();