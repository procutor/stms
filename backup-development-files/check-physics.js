const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPhysics() {
    try {
        console.log('Checking Physics modules in timetables...\n');
        
        // Check all physics-related modules
        const physicsModules = await prisma.module.findMany({
            where: {
                name: {
                    contains: 'PHYSICS'
                }
            },
            select: {
                id: true,
                name: true,
                category: true,
                totalHours: true,
                level: true
            }
        });
        
        console.log('Physics Modules in Database:');
        console.log('============================');
        physicsModules.forEach(module => {
            console.log(`${module.category.padEnd(12)} | ${module.name.padEnd(25)} | Hours: ${module.totalHours} | Level: ${module.level}`);
        });
        
        // Check trainer-class-module assignments for physics
        const physicsAssignments = await prisma.trainerClassModule.findMany({
            where: {
                module: {
                    name: {
                        contains: 'PHYSICS'
                    }
                }
            },
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
        
        console.log('\n\nPhysics Module Assignments:');
        console.log('===========================');
        physicsAssignments.forEach(assignment => {
            console.log(`${assignment.module.category.padEnd(12)} | ${assignment.module.name.padEnd(25)} | Class: ${assignment.class.name.padEnd(10)} | Trainer: ${assignment.trainer.name}`);
        });
        
        // Check current timetables for physics
        const physicsTimetables = await prisma.timetable.findMany({
            where: {
                module: {
                    name: {
                        contains: 'PHYSICS'
                    }
                }
            },
            include: {
                module: {
                    select: { name: true, category: true }
                },
                class: {
                    select: { name: true }
                },
                timeSlot: {
                    select: { day: true, period: true }
                },
                teacher: {
                    select: { name: true }
                }
            },
            orderBy: [
                { timeSlot: { day: 'asc' } },
                { timeSlot: { period: 'asc' } }
            ]
        });
        
        console.log('\n\nPhysics in Current Timetables:');
        console.log('=============================');
        physicsTimetables.forEach(entry => {
            console.log(`${entry.module.category.padEnd(12)} | ${entry.module.name.padEnd(25)} | ${entry.class.name.padEnd(10)} | ${entry.timeSlot.day}-P${entry.timeSlot.period} | ${entry.teacher.name}`);
        });
        
        // Summary
        console.log('\n\nSummary:');
        console.log('========');
        console.log(`Total physics modules in database: ${physicsModules.length}`);
        console.log(`Total physics assignments: ${physicsAssignments.length}`);
        console.log(`Total physics timetable entries: ${physicsTimetables.length}`);
        
        // Check for any physics modules that have assignments but no timetable entries
        const missingPhysics = [];
        for (const assignment of physicsAssignments) {
            const entries = physicsTimetables.filter(t => 
                t.moduleId === assignment.moduleId && 
                t.classId === assignment.classId
            );
            if (entries.length === 0) {
                missingPhysics.push({
                    module: assignment.module.name,
                    class: assignment.class.name,
                    trainer: assignment.trainer.name,
                    expectedHours: assignment.module.totalHours
                });
            }
        }
        
        if (missingPhysics.length > 0) {
            console.log('\n⚠️  Physics modules missing from timetables:');
            missingPhysics.forEach(item => {
                console.log(`- ${item.module} in ${item.class} (${item.trainer}) - Expected: ${item.expectedHours} hours`);
            });
        } else {
            console.log('\n✅ All physics modules are scheduled in timetables');
        }
        
        // Check day distribution for physics
        const dayDistribution = {};
        physicsTimetables.forEach(entry => {
            const day = entry.timeSlot.day;
            dayDistribution[day] = (dayDistribution[day] || 0) + 1;
        });
        
        console.log('\n\nPhysics Lessons by Day:');
        console.log('======================');
        Object.entries(dayDistribution).forEach(([day, count]) => {
            console.log(`${day.padEnd(10)}: ${count} lessons`);
        });
        
        // Check if Saturday is being used (it shouldn't be after our fix)
        if (dayDistribution['SATURDAY']) {
            console.log('\n⚠️  WARNING: Physics lessons found on Saturday! This should not happen after the fix.');
        } else {
            console.log('\n✅ No physics lessons on Saturday - fix is working correctly');
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkPhysics();