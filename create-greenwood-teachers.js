const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createGreenwoodTeachers() {
  try {
    // Get Greenwood Primary School
    const school = await prisma.school.findFirst({
      where: { name: 'Greenwood Primary School' }
    });

    if (!school) {
      console.log('Greenwood Primary School not found');
      return;
    }

    console.log(`Creating teachers for ${school.name}...`);

    // Create teachers
    const teachers = [
      {
        email: 'math.teacher@greenwood.edu',
        name: 'Mrs. Sarah Johnson',
        password: '$2b$10$rQZ3Q8QZ3Q8QZ3Q8QZ3Q8u', // password123
        role: 'TEACHER',
        schoolId: school.id,
        maxWeeklyHours: 30,
        teachingStreams: 'PRIMARY'
      },
      {
        email: 'english.teacher@greenwood.edu',
        name: 'Mr. David Smith',
        password: '$2b$10$rQZ3Q8QZ3Q8QZ3Q8QZ3Q8u', // password123
        role: 'TEACHER',
        schoolId: school.id,
        maxWeeklyHours: 25,
        teachingStreams: 'PRIMARY'
      },
      {
        email: 'science.teacher@greenwood.edu',
        name: 'Ms. Emily Brown',
        password: '$2b$10$rQZ3Q8QZ3Q8QZ3Q8QZ3Q8u', // password123
        role: 'TEACHER',
        schoolId: school.id,
        maxWeeklyHours: 20,
        teachingStreams: 'PRIMARY'
      },
      {
        email: 'arts.teacher@greenwood.edu',
        name: 'Mrs. Lisa Wilson',
        password: '$2b$10$rQZ3Q8QZ3Q8QZ3Q8QZ3Q8u', // password123
        role: 'TEACHER',
        schoolId: school.id,
        maxWeeklyHours: 15,
        teachingStreams: 'PRIMARY'
      },
      {
        email: 'general.teacher@greenwood.edu',
        name: 'Mr. John Davis',
        password: '$2b$10$rQZ3Q8QZ3Q8QZ3Q8QZ3Q8u', // password123
        role: 'TEACHER',
        schoolId: school.id,
        maxWeeklyHours: 25,
        teachingStreams: 'PRIMARY'
      }
    ];

    // Create the teachers
    const createdTeachers = [];
    for (const teacherData of teachers) {
      try {
        const teacher = await prisma.user.create({
          data: teacherData
        });
        createdTeachers.push(teacher);
        console.log(`✅ Created teacher: ${teacher.name}`);
      } catch (error) {
        console.log(`❌ Error creating teacher ${teacherData.name}:`, error.message);
      }
    }

    console.log(`\n📊 Created ${createdTeachers.length} teachers`);

    // Get all teachers to verify
    const allTeachers = await prisma.user.findMany({
      where: {
        schoolId: school.id,
        role: 'TEACHER'
      }
    });

    console.log(`\n📋 All teachers for ${school.name}:`);
    allTeachers.forEach(teacher => {
      console.log(`  - ${teacher.name} (${teacher.email})`);
    });

    return createdTeachers;

  } catch (error) {
    console.error('Error:', error);
    return [];
  } finally {
    await prisma.$disconnect();
  }
}

createGreenwoodTeachers().then(teachers => {
  if (teachers.length > 0) {
    console.log('\n🎉 Teacher creation completed successfully!');
    console.log('Now you can create teacher-class-subject assignments.');
  } else {
    console.log('\n❌ Teacher creation failed or no teachers were created.');
  }
}).catch(console.error);