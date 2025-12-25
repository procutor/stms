const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkGreenwood() {
  try {
    // Get Greenwood Primary School
    const school = await prisma.school.findFirst({
      where: { name: 'Greenwood Primary School' }
    });

    if (!school) {
      console.log('Greenwood Primary School not found');
      return;
    }

    console.log(`School: ${school.name} (${school.type})`);
    console.log(`School ID: ${school.id}`);

    // Get classes
    const classes = await prisma.class.findMany({ 
      where: { schoolId: school.id } 
    });
    console.log(`\nClasses (${classes.length}):`);
    classes.forEach(cls => {
      console.log(`  - ${cls.name} (${cls.level})`);
    });

    // Get teachers
    const teachers = await prisma.user.findMany({ 
      where: { 
        schoolId: school.id,
        role: 'TEACHER'
      } 
    });
    console.log(`\nTeachers (${teachers.length}):`);
    teachers.forEach(teacher => {
      console.log(`  - ${teacher.name} (${teacher.email})`);
    });

    // Get subjects
    const subjects = await prisma.subject.findMany({ 
      where: { schoolId: school.id } 
    });
    console.log(`\nSubjects (${subjects.length}):`);
    subjects.forEach(subject => {
      console.log(`  - ${subject.name} (${subject.level}) - ${subject.periodsPerWeek} periods/week`);
    });

    // Check existing assignments
    const existingAssignments = await prisma.teacherClassSubject.findMany({
      where: { schoolId: school.id },
      include: {
        teacher: { select: { name: true } },
        class: { select: { name: true } },
        subject: { select: { name: true } }
      }
    });

    console.log(`\nExisting Assignments (${existingAssignments.length}):`);
    existingAssignments.forEach(assignment => {
      console.log(`  - ${assignment.teacher.name} -> ${assignment.class.name} (${assignment.subject.name})`);
    });

    console.log(`\nStatus: ${teachers.length === 0 ? '❌ No teachers available' : '✅ Teachers available'}`);
    console.log(`Status: ${subjects.length === 0 ? '❌ No subjects available' : '✅ Subjects available'}`);
    console.log(`Status: ${existingAssignments.length === 0 ? '❌ No assignments created' : '✅ Has assignments'}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkGreenwood();