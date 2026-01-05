const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getGikomeroData() {
  try {
    // Get GS GIKOMERO TSS school
    const school = await prisma.school.findFirst({
      where: { name: 'GS GIKOMERO TSS' }
    });
    
    console.log('=== GS GIKOMERO TSS DETAILED DATA ===');
    console.log('School:', school.name);
    console.log('Type:', school.type);
    
    // Get all trainer-class-module assignments
    const assignments = await prisma.trainerClassModule.findMany({
      where: { schoolId: school.id },
      include: {
        trainer: { select: { name: true } },
        class: { select: { name: true } },
        module: { select: { name: true } }
      },
      orderBy: [
        { trainer: { name: 'asc' } },
        { class: { name: 'asc' } },
        { module: { name: 'asc' } }
      ]
    });
    
    console.log('\n📚 TRAINER ASSIGNMENTS:');
    assignments.forEach(assignment => {
      console.log(`${assignment.trainer.name} -> ${assignment.class.name} (${assignment.module.name})`);
    });
    
    // Get classes
    const classes = await prisma.class.findMany({
      where: { schoolId: school.id },
      orderBy: { name: 'asc' }
    });
    
    console.log('\n🏫 CLASSES:');
    classes.forEach(cls => {
      console.log(`- ${cls.name}`);
    });
    
    // Get modules
    const modules = await prisma.module.findMany({
      where: { schoolId: school.id },
      orderBy: { name: 'asc' }
    });
    
    console.log('\n📖 MODULES:');
    modules.forEach(module => {
      console.log(`- ${module.name}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getGikomeroData();