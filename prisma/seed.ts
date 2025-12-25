import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create Super Admin
  const superAdminPassword = await bcrypt.hash('sEkamana@123', 12)
  const superAdmin = await prisma.user.upsert({
    where: { email: 'damascenetugireyezu@gmail.com' },
    update: {},
    create: {
      email: 'damascenetugireyezu@gmail.com',
      name: 'Super Administrator',
      password: superAdminPassword,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  })

  console.log('✅ Super Admin created:', superAdmin.email)

  // Create sample schools for testing
  const schools = [
    {
      name: 'Greenwood Primary School',
      type: 'PRIMARY',
      email: 'admin@greenwoodprimary.edu',
      phone: '+1234567890',
      address: '123 Education Street, Learning City',
      status: 'APPROVED',
      admin: {
        name: 'Sarah Johnson',
        email: 'admin@greenwoodprimary.edu',
        password: 'school123'
      }
    },
    {
      name: 'Riverside Secondary School',
      type: 'SECONDARY',
      email: 'admin@riversidesecondary.edu',
      phone: '+1234567891',
      address: '456 Academy Avenue, Knowledge Town',
      status: 'APPROVED',
      admin: {
        name: 'Michael Brown',
        email: 'admin@riversidesecondary.edu',
        password: 'school123'
      }
    },
    {
      name: 'TechSkills TSS Institute',
      type: 'TSS',
      email: 'admin@techskills.edu',
      phone: '+1234567892',
      address: '789 Vocational Road, Skills City',
      status: 'APPROVED',
      admin: {
        name: 'David Wilson',
        email: 'admin@techskills.edu',
        password: 'school123'
      }
    }
  ]

  for (const schoolData of schools) {
    const school = await prisma.school.upsert({
      where: { email: schoolData.email },
      update: {},
      create: {
        name: schoolData.name,
        type: schoolData.type as any,
        email: schoolData.email,
        phone: schoolData.phone,
        address: schoolData.address,
        status: schoolData.status as any,
        approvedAt: new Date(),
      },
    })

    const adminPassword = await bcrypt.hash(schoolData.admin.password, 12)
    await prisma.user.upsert({
      where: { email: schoolData.admin.email },
      update: {},
      create: {
        email: schoolData.admin.email,
        name: schoolData.admin.name,
        password: adminPassword,
        role: 'SCHOOL_ADMIN',
        schoolId: school.id,
        isActive: true,
      },
    })

    console.log(`✅ School created: ${schoolData.name}`)

    // Create sample classes
    const classes = schoolData.type === 'PRIMARY' 
      ? ['P1', 'P2', 'P3', 'P4', 'P5']
      : schoolData.type === 'SECONDARY'
      ? ['S1', 'S2', 'S3', 'S4', 'S5', 'S6']
      : ['TSS1', 'TSS2', 'TSS3']

    for (const level of classes) {
      await prisma.class.upsert({
        where: {
          schoolId_level_stream: {
            schoolId: school.id,
            level: level,
            stream: ''
          }
        },
        update: {},
        create: {
          name: `Class ${level}`,
          level: level,
          stream: '',
          schoolId: school.id,
        },
      })
    }

    // Create sample subjects/modules
    if (schoolData.type === 'TSS') {
      const modules = [
        { name: 'Web Development', code: 'WD101', totalHours: 40, category: 'SPECIFIC' },
        { name: 'Database Management', code: 'DB101', totalHours: 30, category: 'SPECIFIC' },
        { name: 'Programming Fundamentals', code: 'PF101', totalHours: 35, category: 'GENERAL' },
        { name: 'Mathematics', code: 'MATH101', totalHours: 25, category: 'GENERAL' },
        { name: 'Communication Skills', code: 'COM101', totalHours: 20, category: 'COMPLEMENTARY' },
        { name: 'Entrepreneurship', code: 'ENT101', totalHours: 15, category: 'COMPLEMENTARY' },
      ]

      for (const moduleData of modules) {
        await prisma.module.upsert({
          where: {
            schoolId_name_level: {
              schoolId: school.id,
              name: moduleData.name,
              level: ''
            }
          },
          update: {},
          create: {
            name: moduleData.name,
            code: moduleData.code,
            level: '',
            totalHours: moduleData.totalHours,
            category: moduleData.category as any,
            schoolId: school.id,
          },
        })
      }
    } else {
      const subjects = [
        { name: 'Mathematics', code: 'MATH', periodsPerWeek: 6 },
        { name: 'English', code: 'ENG', periodsPerWeek: 5 },
        { name: 'Science', code: 'SCI', periodsPerWeek: 4 },
        { name: 'Social Studies', code: 'SS', periodsPerWeek: 3 },
        { name: 'Physical Education', code: 'PE', periodsPerWeek: 2 },
        { name: 'Art', code: 'ART', periodsPerWeek: 2 },
      ]

      for (const subjectData of subjects) {
        await prisma.subject.upsert({
          where: {
            schoolId_name_level: {
              schoolId: school.id,
              name: subjectData.name,
              level: ''
            }
          },
          update: {},
          create: {
            name: subjectData.name,
            code: subjectData.code,
            level: '',
            periodsPerWeek: subjectData.periodsPerWeek,
            schoolId: school.id,
          },
        })
      }
    }

    // Create sample time slots with exact structure
    const timeSlots: Array<{
      day: string
      period: number
      startTime: Date
      endTime: Date
      schoolId: string
      name: string
      session: string
      isBreak: boolean
      breakType?: string
    }> = []
    
    const days: string[] = [
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY'
    ]
    
    // Define the exact time structure
    const periodStructure = [
      // Morning periods
      { period: 1, start: '08:00', end: '08:40', session: 'MORNING', isBreak: false },
      { period: 2, start: '08:40', end: '09:20', session: 'MORNING', isBreak: false },
      { period: 3, start: '09:20', end: '10:00', session: 'MORNING', isBreak: false },
      // Morning break
      { period: 0, start: '10:00', end: '10:20', session: 'MORNING', isBreak: true, breakType: 'MORNING_BREAK', name: 'MORNING BREAK' },
      { period: 4, start: '10:20', end: '11:00', session: 'MORNING', isBreak: false },
      { period: 5, start: '11:00', end: '11:40', session: 'MORNING', isBreak: false },
      // Lunch break
      { period: 0, start: '11:40', end: '13:10', session: 'AFTERNOON', isBreak: true, breakType: 'LUNCH_BREAK', name: 'LUNCH BREAK' },
      { period: 6, start: '13:10', end: '13:50', session: 'AFTERNOON', isBreak: false },
      { period: 7, start: '13:50', end: '14:30', session: 'AFTERNOON', isBreak: false },
      { period: 8, start: '14:30', end: '15:10', session: 'AFTERNOON', isBreak: false },
      // Afternoon break
      { period: 0, start: '15:10', end: '15:30', session: 'AFTERNOON', isBreak: true, breakType: 'AFTERNOON_BREAK', name: 'AFTERNOON BREAK' },
      { period: 9, start: '15:30', end: '16:10', session: 'AFTERNOON', isBreak: false },
      { period: 10, start: '16:10', end: '16:50', session: 'AFTERNOON', isBreak: false },
      // End buffer
      { period: 0, start: '16:50', end: '16:55', session: 'AFTERNOON', isBreak: true, breakType: 'END_OF_DAY', name: 'END OF DAY' }
    ]
    
    for (const day of days) {
      for (const periodData of periodStructure) {
        const [startHour, startMin] = periodData.start.split(':').map(Number)
        const [endHour, endMin] = periodData.end.split(':').map(Number)
        
        const startTime = new Date()
        startTime.setHours(startHour, startMin, 0)
        
        const endTime = new Date()
        endTime.setHours(endHour, endMin, 0)

        timeSlots.push({
          day: day,
          period: periodData.period,
          startTime: startTime,
          endTime: endTime,
          schoolId: school.id,
          name: periodData.name || `P${periodData.period}`,
          session: periodData.session,
          isBreak: periodData.isBreak,
          breakType: periodData.breakType
        })
      }
    }

    await prisma.timeSlot.createMany({
      data: timeSlots
    })

    console.log(`✅ Time slots created for ${schoolData.name}`)
  }

  console.log('🎉 Seeding completed successfully!')
  console.log('\n📋 Login Credentials:')
  console.log('Super Admin: damascenetugireyezu@gmail.com / sEkamana@123')
  console.log('Greenwood Primary: admin@greenwoodprimary.edu / school123')
  console.log('Riverside Secondary: admin@riversidesecondary.edu / school123')
  console.log('TechSkills TSS: admin@techskills.edu / school123')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })