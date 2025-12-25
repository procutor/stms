const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkModules() {
    try {
        console.log('Checking modules and assignments...\n');
        
        // Check all modules
        const modules = await prisma.module.findMany({
            select: {
                id: true,
                name: true,
                category: true,
                totalHours: true,
                level: true
            },
            orderBy: [
                { category: 'asc' },
                { name: 'asc' }
            ]
        });
        
        console.log('All Modules:');
        console.log('=============');
        modules.forEach(module => {
            console.log(`${module.category.padEnd(12)} | ${module.name} | Hours: ${module.totalHours} | Level: ${module.level}`);
        });
        
        // Check trainer-class-module assignments
        const assignments = await prisma.trainerClassModule.findMany({
            include: {
                module: {
                    select: { name: true, category: true }
                },
                class: {
                    select: { name: true }
                },
                trainer: {
                    select: { name: true }
                }
            }
        });
        
        console.log('\n\nTrainer-Class-Module Assignments:');
        console.log('=================================');
        assignments.forEach(assignment => {
            console.log(`${assignment.module.category.padEnd(12)} | ${assignment.module.name} | Class: ${assignment.class.name} | Trainer: ${assignment.trainer.name}`);
        });
        
        // Check current timetables
        const timetables = await prisma.timetable.findMany({
            include: {
                module: {
                    select: { name: true, category: true }
                },
                class: {
                    select: { name: true }
                },
                timeSlot: {
                    select: { day: true, period: true }
                }
            }
        });
        
        console.log('\n\nCurrent Timetable Entries:');
        console.log('==========================');
        timetables.forEach(entry => {
            if (entry.module) {
                console.log(`${entry.module.category.padEnd(12)} | ${entry.module.name} | ${entry.class.name} | ${entry.timeSlot.day}-P${entry.timeSlot.period}`);
            }
        });
        
        // Check for missing lessons
        const expectedLessons = assignments.length;
        const actualTimetableEntries = timetables.filter(t => t.moduleId).length;
        
        console.log('\n\nSummary:');
        console.log('========');
        console.log(`Total module assignments: ${expectedLessons}`);
        console.log(`Timetable entries for modules: ${actualTimetableEntries}`);
        console.log(`Missing: ${expectedLessons - actualTimetableEntries}`);
        
        if (expectedLessons > actualTimetableEntries) {
            console.log('\nMissing modules in timetables:');
            assignments.forEach(assignment => {
                const hasTimetable = timetables.some(t => 
                    t.moduleId === assignment.moduleId && 
                    t.classId === assignment.classId
                );
                if (!hasTimetable) {
                    console.log(`- ${assignment.module.category} | ${assignment.module.name} | ${assignment.class.name}`);
                }
            });
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkModules();