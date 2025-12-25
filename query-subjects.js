const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Find L5 ELTA class
  const l5EltaClass = await prisma.class.findFirst({
    where: {
      name: 'L5 ELTA'
    },
    select: {
      id: true,
      name: true,
      level: true,
      stream: true
    }
  });

  console.log('L5 ELTA class:', l5EltaClass);

  if (l5EltaClass) {
    // Find trainer class modules for this class
    const trainerClassModules = await prisma.trainerClassModule.findMany({
      where: {
        classId: l5EltaClass.id
      },
      include: {
        module: true
      }
    });

    console.log('Modules assigned to L5 ELTA:', trainerClassModules.map(tcm => ({
      moduleName: tcm.module.name,
      totalHours: tcm.module.totalHours
    })));

    const totalPeriods = trainerClassModules.reduce((sum, tcm) => sum + tcm.module.totalHours, 0);
    console.log('Total periods per week for L5 ELTA:', totalPeriods);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });