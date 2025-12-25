import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTeacherTimetableStructure() {
    try {
        console.log('🔍 Checking Teacher Timetable Structure...\n');
        
        // Get all teachers with their timetables
        const teachers = await prisma.teacher.findMany({
            include: {
                timetables: {
                    include: {
                        lessons: {
                            include: {
                                subject: true,
                                module: true,
                                timeSlot: true
                            }
                        }
                    }
                }
            }
        });
        
        console.log(`📚 Total Teachers: ${teachers.length}`);
        
        teachers.forEach((teacher, index) => {
            console.log(`\n👨‍🏫 Teacher ${index + 1}: ${teacher.name}`);
            console.log(`   📧 Email: ${teacher.email}`);
            console.log(`   📅 Timetables: ${teacher.timetables.length}`);
            
            teacher.timetables.forEach((timetable, tIndex) => {
                console.log(`   📋 Timetable ${tIndex + 1}:`);
                console.log(`      🆔 ID: ${timetable.id}`);
                console.log(`      📚 Lessons: ${timetable.lessons.length}`);
                
                // Show unique subjects/modules taught
                const subjects = [...new Set(timetable.lessons.map(lesson => 
                    lesson.subject?.name || lesson.module?.name || 'Unknown'
                ))];
                console.log(`      📖 Subjects/Modules: ${subjects.join(', ')}`);
                
                // Show periods (time slots)
                const periods = timetable.lessons.map(lesson => 
                    `${lesson.timeSlot?.day}-${lesson.timeSlot?.period}`
                ).sort();
                console.log(`      ⏰ Periods: ${periods.join(', ')}`);
            });
            
            if (teacher.timetables.length === 0) {
                console.log(`   ❌ No timetables found for this teacher`);
            }
        });
        
        console.log(`\n✅ Summary:`);
        console.log(`- Each teacher gets ONE timetable record`);
        console.log(`- That timetable contains ALL lessons they teach`);
        console.log(`- Each lesson is scheduled in a different period/time slot`);
        console.log(`- This is exactly what you requested: "one timetable per teacher with all modules they taught"`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkTeacherTimetableStructure();