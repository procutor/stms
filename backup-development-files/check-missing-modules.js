const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkMissingModules() {
    try {
        console.log('Detailed analysis of missing modules...\n');
        
        // Get all trainer-class-module assignments with details
        const assignments = await prisma.trainerClassModule.findMany({
            include: {
                module: {
                    select: { 
                        id: true,
                        name: true, 
                        category: true,
                        totalHours: true,
                        level: true
                    }
                },
                class: {
                    select: { 
                        id: true,
                        name: true
                    }
                },
                trainer: {
                    select: { 
                        name: true
                    }
                }
            }
        });
        
        // Get all current timetable entries for modules
        const timetables = await prisma.timetable.findMany({
            where: {
                moduleId: { not: null }
            },
            include: {
                module: {
                    select: { 
                        id: true,
                        name: true, 
                        category: true,
                        totalHours: true
                    }
                },
                class: {
                    select: { 
                        id: true,
                        name: true
                    }
                },
                timeSlot: {
                    select: { 
                        day: true, 
                        period: true 
                    }
                }
            }
        });
        
        console.log('Assignments vs Timetables Analysis:');
        console.log('===================================\n');
        
        const missingModules = [];
        const overScheduled = [];
        
        // Check each assignment
        for (const assignment of assignments) {
            const expectedPeriods = assignment.module.totalHours;
            const actualTimetables = timetables.filter(t => 
                t.moduleId === assignment.moduleId && 
                t.classId === assignment.classId
            );
            
            const actualPeriods = actualTimetables.length;
            
            console.log(`${assignment.module.category.padEnd(12)} | ${assignment.module.name.padEnd(30)} | ${assignment.class.name.padEnd(10)} | Expected: ${expectedPeriods} | Actual: ${actualPeriods} | ${actualPeriods < expectedPeriods ? 'MISSING' : actualPeriods > expectedPeriods ? 'OVER' : 'OK'}`);
            
            if (actualPeriods < expectedPeriods) {
                missingModules.push({
                    assignment,
                    expected: expectedPeriods,
                    actual: actualPeriods,
                    missing: expectedPeriods - actualPeriods
                });
            } else if (actualPeriods > expectedPeriods) {
                overScheduled.push({
                    assignment,
                    expected: expectedPeriods,
                    actual: actualPeriods,
                    extra: actualPeriods - expectedPeriods
                });
            }
        }
        
        console.log('\n\nMISSING MODULES (Not enough periods scheduled):');
        console.log('=============================================');
        if (missingModules.length === 0) {
            console.log('✅ All modules have sufficient periods scheduled!');
        } else {
            missingModules.forEach(item => {
                console.log(`${item.assignment.module.category.padEnd(12)} | ${item.assignment.module.name.padEnd(30)} | ${item.assignment.class.name.padEnd(10)} | Missing: ${item.missing} periods`);
            });
        }
        
        console.log('\n\nOVER-SCHEDULED MODULES (Too many periods scheduled):');
        console.log('=================================================');
        if (overScheduled.length === 0) {
            console.log('✅ No modules are over-scheduled!');
        } else {
            overScheduled.forEach(item => {
                console.log(`${item.assignment.module.category.padEnd(12)} | ${item.assignment.module.name.padEnd(30)} | ${item.assignment.class.name.padEnd(10)} | Extra: ${item.extra} periods`);
            });
        }
        
        console.log('\n\nCOMPLEMENTARY MODULES DETAILED CHECK:');
        console.log('====================================');
        const complementaryAssignments = assignments.filter(a => a.module.category === 'COMPLEMENTARY');
        console.log(`Total complementary assignments: ${complementaryAssignments.length}`);
        
        const complementaryMissing = missingModules.filter(m => m.assignment.module.category === 'COMPLEMENTARY');
        console.log(`Complementary modules missing periods: ${complementaryMissing.length}`);
        
        if (complementaryMissing.length > 0) {
            console.log('\nMissing Complementary Modules:');
            complementaryMissing.forEach(item => {
                console.log(`- ${item.assignment.module.name} in ${item.assignment.class.name}: missing ${item.missing} periods (expected ${item.expected}, got ${item.actual})`);
            });
        }
        
        console.log('\n\nGENERAL MODULES DETAILED CHECK:');
        console.log('==============================');
        const generalAssignments = assignments.filter(a => a.module.category === 'GENERAL');
        console.log(`Total general assignments: ${generalAssignments.length}`);
        
        const generalMissing = missingModules.filter(m => m.assignment.module.category === 'GENERAL');
        console.log(`General modules missing periods: ${generalMissing.length}`);
        
        if (generalMissing.length > 0) {
            console.log('\nMissing General Modules:');
            generalMissing.forEach(item => {
                console.log(`- ${item.assignment.module.name} in ${item.assignment.class.name}: missing ${item.missing} periods (expected ${item.expected}, got ${item.actual})`);
            });
        }
        
        console.log('\n\nSUMMARY:');
        console.log('=======');
        console.log(`Total assignments: ${assignments.length}`);
        console.log(`Modules with missing periods: ${missingModules.length}`);
        console.log(`Modules over-scheduled: ${overScheduled.length}`);
        console.log(`Complementary modules missing: ${complementaryMissing.length}`);
        console.log(`General modules missing: ${generalMissing.length}`);
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkMissingModules();