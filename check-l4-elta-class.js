import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkL4EltaClass() {
  try {
    console.log("=== CHECKING L4 ELTA CLASS ===");
    
    // Find the school first
    const school = await prisma.school.findFirst({
      where: {
        name: "GS Gikomero",
        type: "TSS"
      }
    });

    if (!school) {
      console.log("❌ GS Gikomero TSS school not found");
      return;
    }

    console.log(`✅ Found school: ${school.name} (${school.type}) - ID: ${school.id}`);

    // Check if L4 ELTA class exists
    const l4EltaClass = await prisma.class.findFirst({
      where: {
        name: "L4 ELTA",
        schoolId: school.id
      }
    });

    if (!l4EltaClass) {
      console.log("❌ L4 ELTA class not found for GS Gikomero TSS");
      
      // Show all classes in the school
      const allClasses = await prisma.class.findMany({
        where: {
          schoolId: school.id
        },
        orderBy: {
          name: 'asc'
        }
      });
      
      console.log("\n📋 All classes in GS Gikomero TSS:");
      allClasses.forEach(cls => {
        console.log(`  - ${cls.name} (Level: ${cls.level})`);
      });
      
      return;
    }

    console.log(`✅ Found L4 ELTA class - ID: ${l4EltaClass.id}, Level: ${l4EltaClass.level}`);

    // Check for any timetable entries for this class
    const timetables = await prisma.timetable.findMany({
      where: {
        classId: l4EltaClass.id
      }
    });

    console.log(`📊 Timetable entries for L4 ELTA: ${timetables.length}`);
    
    if (timetables.length > 0) {
      console.log("First few timetable entries:");
      timetables.slice(0, 5).forEach((entry, index) => {
        console.log(`  ${index + 1}. ${entry.day} ${entry.timeSlot} - Teacher: ${entry.teacherId}, Subject: ${entry.subjectId}`);
      });
    }

  } catch (error) {
    console.error("❌ Error checking L4 ELTA class:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkL4EltaClass();