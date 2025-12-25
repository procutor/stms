const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function debugTeacherAssignments() {
  try {
    console.log('=== Teacher Assignment Analysis ===\n')

    // Get all teachers
    const teachers = await prisma.user.findMany({
      where: {
        role: { in: ['TEACHER', 'TRAINER'] }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })

    console.log(`Found ${teachers.length} teachers\n`)

    for (const teacher of teachers) {
      console.log(`--- Teacher: ${teacher.name} (${teacher.email}) ---`)

      // Check teacher subjects
      const teacherSubjects = await prisma.teacherSubject.findMany({
        where: { teacherId: teacher.id },
        include: { subject: true }
      })
      console.log(`Teacher Subjects: ${teacherSubjects.length}`)
      teacherSubjects.forEach(ts => {
        console.log(`  - ${ts.subject.name}`)
      })

      // Check trainer modules
      const trainerModules = await prisma.trainerModule.findMany({
        where: { trainerId: teacher.id },
        include: { module: true }
      })
      console.log(`Trainer Modules: ${trainerModules.length}`)
      trainerModules.forEach(tm => {
        console.log(`  - ${tm.module.name}`)
      })

      // Check teacher class subjects
      const teacherClassSubjects = await prisma.teacherClassSubject.findMany({
        where: { teacherId: teacher.id },
        include: { 
          class: true,
          subject: true
        }
      })
      console.log(`Teacher Class Subjects: ${teacherClassSubjects.length}`)
      teacherClassSubjects.forEach(tcs => {
        console.log(`  - ${tcs.subject.name} for Class ${tcs.class.name}`)
      })

      // Check trainer class modules
      const trainerClassModules = await prisma.trainerClassModule.findMany({
        where: { trainerId: teacher.id },
        include: { 
          class: true,
          module: true
        }
      })
      console.log(`Trainer Class Modules: ${trainerClassModules.length}`)
      trainerClassModules.forEach(tcm => {
        console.log(`  - ${tcm.module.name} for Class ${tcm.class.name}`)
      })

      // Check timetables
      const timetables = await prisma.timetable.findMany({
        where: { teacherId: teacher.id },
        include: {
          class: true,
          subject: true,
          module: true,
          timeSlot: true
        }
      })
      console.log(`Timetable Entries: ${timetables.length}`)
      timetables.forEach(t => {
        const subjectName = t.subject?.name || t.module?.name || 'Unknown'
        console.log(`  - ${subjectName} for Class ${t.class.name} on ${t.timeSlot.day} Period ${t.timeSlot.period}`)
      })

      const totalAssignments = teacherSubjects.length + trainerModules.length + 
                              teacherClassSubjects.length + trainerClassModules.length + 
                              timetables.length

      console.log(`Total Assignments: ${totalAssignments}`)
      console.log('')
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugTeacherAssignments()