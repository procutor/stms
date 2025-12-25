const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createGreenwoodAssignments() {
  try {
    // Get Greenwood Primary School
    const school = await prisma.school.findFirst({
      where: { name: 'Greenwood Primary School' }
    });

    if (!school) {
      console.log('Greenwood Primary School not found');
      return;
    }

    console.log(`Creating teacher-class-subject assignments for ${school.name}...`);

    // Get teachers
    const teachers = await prisma.user.findMany({
      where: {
        schoolId: school.id,
        role: 'TEACHER'
      }
    });

    // Get classes
    const classes = await prisma.class.findMany({
      where: { schoolId: school.id }
    });

    // Get subjects
    const subjects = await prisma.subject.findMany({
      where: { schoolId: school.id }
    });

    // Create teacher-subject mappings
    const teacherSubjectMap = {};
    teachers.forEach(teacher => {
      if (teacher.name.includes('Sarah')) { // Math teacher
        teacherSubjectMap[teacher.id] = subjects.filter(s => s.name === 'Mathematics');
      } else if (teacher.name.includes('David')) { // English teacher
        teacherSubjectMap[teacher.id] = subjects.filter(s => s.name === 'English');
      } else if (teacher.name.includes('Emily')) { // Science teacher
        teacherSubjectMap[teacher.id] = subjects.filter(s => s.name === 'Science');
      } else if (teacher.name.includes('Lisa')) { // Arts/PE teacher
        teacherSubjectMap[teacher.id] = subjects.filter(s => s.name === 'Art' || s.name === 'Physical Education');
      } else if (teacher.name.includes('John')) { // Social Studies teacher
        teacherSubjectMap[teacher.id] = subjects.filter(s => s.name === 'Social Studies');
      }
    });

    console.log('Teacher-Subject mappings:');
    Object.entries(teacherSubjectMap).forEach(([teacherId, subjectList]) => {
      const teacher = teachers.find(t => t.id === teacherId);
      console.log(`  ${teacher.name}: ${subjectList.map(s => s.name).join(', ')}`);
    });

    // Create assignments for all combinations
    const assignments = [];
    for (const teacher of teachers) {
      const teacherSubjects = teacherSubjectMap[teacher.id] || [];
      for (const subject of teacherSubjects) {
        for (const classItem of classes) {
          assignments.push({
            teacherId: teacher.id,
            classId: classItem.id,
            subjectId: subject.id,
            schoolId: school.id
          });
        }
      }
    }

    console.log(`\nCreating ${assignments.length} assignments...`);

    // Create assignments in batches
    const batchSize = 10;
    let createdCount = 0;
    
    for (let i = 0; i < assignments.length; i += batchSize) {
      const batch = assignments.slice(i, i + batchSize);
      try {
        const result = await prisma.teacherClassSubject.createMany({
          data: batch,
          skipDuplicates: true
        });
        createdCount += result.count;
        console.log(`✅ Created ${result.count} assignments in batch ${Math.floor(i/batchSize) + 1}`);
      } catch (error) {
        console.log(`❌ Error creating batch ${Math.floor(i/batchSize) + 1}:`, error.message);
      }
    }

    console.log(`\n📊 Total assignments created: ${createdCount}`);

    // Verify assignments
    const allAssignments = await prisma.teacherClassSubject.findMany({
      where: { schoolId: school.id },
      include: {
        teacher: { select: { name: true } },
        class: { select: { name: true } },
        subject: { select: { name: true } }
      }
    });

    console.log(`\n📋 Sample assignments:`);
    allAssignments.slice(0, 10).forEach(assignment => {
      console.log(`  ${assignment.teacher.name} -> ${assignment.class.name} (${assignment.subject.name})`);
    });
    
    if (allAssignments.length > 10) {
      console.log(`  ... and ${allAssignments.length - 10} more assignments`);
    }

    return allAssignments.length;

  } catch (error) {
    console.error('Error:', error);
    return 0;
  } finally {
    await prisma.$disconnect();
  }
}

createGreenwoodAssignments().then(count => {
  if (count > 0) {
    console.log('\n🎉 Assignment creation completed successfully!');
    console.log('The school can now generate timetables.');
  } else {
    console.log('\n❌ Assignment creation failed or no assignments were created.');
  }
}).catch(console.error);