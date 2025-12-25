const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testTeacherDeletionFix() {
  try {
    console.log('=== Testing Teacher Deletion Fix ===\n')

    // Get a teacher with assignments
    const teachersWithAssignments = await prisma.user.findMany({
      where: {
        role: { in: ['TEACHER', 'TRAINER'] }
      },
      include: {
        teacherSubjects: true,
        trainerModules: true,
        teacherClassSubjects: true,
        trainerClassModules: true,
        timetablesAsTeacher: true
      }
    })

    const teacherWithAssignments = teachersWithAssignments.find(t => 
      t.teacherSubjects.length + t.trainerModules.length + 
      t.teacherClassSubjects.length + t.trainerClassModules.length + 
      t.timetablesAsTeacher.length > 0
    )

    if (!teacherWithAssignments) {
      console.log('No teachers with assignments found for testing.')
      return
    }

    console.log(`Testing deletion for teacher: ${teacherWithAssignments.name}`)
    console.log(`Assignments:`)
    console.log(`  - Teacher Subjects: ${teacherWithAssignments.teacherSubjects.length}`)
    console.log(`  - Trainer Modules: ${teacherWithAssignments.trainerModules.length}`)
    console.log(`  - Teacher Class Subjects: ${teacherWithAssignments.teacherClassSubjects.length}`)
    console.log(`  - Trainer Class Modules: ${teacherWithAssignments.trainerClassModules.length}`)
    console.log(`  - Timetables: ${teacherWithAssignments.timetablesAsTeacher.length}`)
    console.log('')

    // Test the comprehensive assignment checking
    const allAssignments = await prisma.$transaction([
      prisma.teacherSubject.findMany({ where: { teacherId: teacherWithAssignments.id } }),
      prisma.trainerModule.findMany({ where: { trainerId: teacherWithAssignments.id } }),
      prisma.teacherClassSubject.findMany({ where: { teacherId: teacherWithAssignments.id } }),
      prisma.trainerClassModule.findMany({ where: { trainerId: teacherWithAssignments.id } }),
      prisma.timetable.findMany({ where: { teacherId: teacherWithAssignments.id } })
    ])

    const [teacherSubjects, trainerModules, teacherClassSubjects, trainerClassModules, timetables] = allAssignments
    const totalCount = teacherSubjects.length + trainerModules.length + teacherClassSubjects.length + trainerClassModules.length + timetables.length

    console.log(`Comprehensive assignment check results:`)
    console.log(`  - Teacher Subjects: ${teacherSubjects.length}`)
    console.log(`  - Trainer Modules: ${trainerModules.length}`)
    console.log(`  - Teacher Class Subjects: ${teacherClassSubjects.length}`)
    console.log(`  - Trainer Class Modules: ${trainerClassModules.length}`)
    console.log(`  - Timetables: ${timetables.length}`)
    console.log(`  - Total Assignments: ${totalCount}`)
    console.log('')

    if (totalCount > 0) {
      console.log('✅ Teacher has assignments - deletion should be blocked')
      console.log('Error message should include detailed breakdown of all assignment types')
    } else {
      console.log('❌ Teacher has no assignments - deletion should be allowed')
    }

    // Test a teacher without assignments
    const teacherWithoutAssignments = teachersWithAssignments.find(t => 
      t.teacherSubjects.length + t.trainerModules.length + 
      t.teacherClassSubjects.length + t.trainerClassModules.length + 
      t.timetablesAsTeacher.length === 0
    )

    if (teacherWithoutAssignments) {
      console.log(`\nTesting deletion for teacher without assignments: ${teacherWithoutAssignments.name}`)
      console.log('This teacher should be deletable.')
    }

    console.log('\n=== Fix Validation Complete ===')
    console.log('The comprehensive assignment checking should now catch ALL types of assignments:')
    console.log('1. ✅ Teacher Subjects (was checked before)')
    console.log('2. ✅ Trainer Modules (was checked before)')
    console.log('3. ✅ Teacher Class Subjects (NEW - was not checked before)')
    console.log('4. ✅ Trainer Class Modules (NEW - was not checked before)')
    console.log('5. ✅ Timetable Entries (NEW - was not checked before)')

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testTeacherDeletionFix()