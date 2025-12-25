const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createTestData() {
    try {
        console.log('🧪 Creating Test Data for Timetable Generation...\n')
        
        // Get first approved school
        const school = await prisma.school.findFirst({
            where: { status: 'APPROVED' }
        })
        
        if (!school) {
            console.log('❌ No approved school found.')
            return
        }
        
        console.log(`📚 Using school: ${school.name} (${school.id})\n`)
        
        // Create test teachers
        console.log('👥 Creating test teachers...')
        const teachers = await Promise.all([
            prisma.user.create({
                data: {
                    email: 'teacher1@test.com',
                    name: 'John Smith',
                    password: 'password123',
                    role: 'TEACHER',
                    schoolId: school.id,
                    isActive: true
                }
            }),
            prisma.user.create({
                data: {
                    email: 'teacher2@test.com',
                    name: 'Jane Doe',
                    password: 'password123',
                    role: 'TEACHER',
                    schoolId: school.id,
                    isActive: true
                }
            }),
            prisma.user.create({
                data: {
                    email: 'trainer1@test.com',
                    name: 'Bob Wilson',
                    password: 'password123',
                    role: 'TRAINER',
                    schoolId: school.id,
                    isActive: true
                }
            })
        ])
        
        console.log(`   ✅ Created ${teachers.length} teachers`)
        
        // Get classes and subjects
        const classes = await prisma.class.findMany({
            where: { schoolId: school.id }
        })
        
        const subjects = await prisma.subject.findMany({
            where: { schoolId: school.id }
        })
        
        console.log(`\n📚 Found ${classes.length} classes and ${subjects.length} subjects`)
        
        // Create teacher-class-subject assignments
        console.log('\n📋 Creating teacher-class-subject assignments...')
        const assignments = []
        
        // Assign first teacher to some classes and subjects
        for (let i = 0; i < Math.min(3, classes.length); i++) {
            for (let j = 0; j < Math.min(2, subjects.length); j++) {
                try {
                    const assignment = await prisma.teacherClassSubject.create({
                        data: {
                            teacherId: teachers[0].id,
                            classId: classes[i].id,
                            subjectId: subjects[j].id,
                            schoolId: school.id
                        }
                    })
                    assignments.push(assignment)
                } catch (error) {
                    // Skip if already exists
                }
            }
        }
        
        // Assign second teacher to other classes
        for (let i = 2; i < Math.min(5, classes.length); i++) {
            for (let j = 1; j < Math.min(3, subjects.length); j++) {
                try {
                    const assignment = await prisma.teacherClassSubject.create({
                        data: {
                            teacherId: teachers[1].id,
                            classId: classes[i].id,
                            subjectId: subjects[j].id,
                            schoolId: school.id
                        }
                    })
                    assignments.push(assignment)
                } catch (error) {
                    // Skip if already exists
                }
            }
        }
        
        console.log(`   ✅ Created ${assignments.length} teacher-class-subject assignments`)
        
        // Create TSS modules for testing
        console.log('\n🔧 Creating TSS modules...')
        const tssModules = await Promise.all([
            prisma.module.create({
                data: {
                    name: 'Mathematics TSS',
                    code: 'MATH-TSS',
                    level: 'L3',
                    trade: 'Mathematics',
                    totalHours: 4,
                    category: 'SPECIFIC',
                    blockSize: 2,
                    schoolId: school.id
                }
            }),
            prisma.module.create({
                data: {
                    name: 'English TSS',
                    code: 'ENG-TSS',
                    level: 'L3',
                    trade: 'English',
                    totalHours: 3,
                    category: 'GENERAL',
                    blockSize: 1,
                    schoolId: school.id
                }
            }),
            prisma.module.create({
                data: {
                    name: 'Computer Skills TSS',
                    code: 'COMP-TSS',
                    level: 'L4',
                    trade: 'ICT',
                    totalHours: 2,
                    category: 'COMPLEMENTARY',
                    blockSize: 1,
                    schoolId: school.id
                }
            })
        ])
        
        console.log(`   ✅ Created ${tssModules.length} TSS modules`)
        
        // Create trainer-class-module assignments
        console.log('\n👨‍🏫 Creating trainer-class-module assignments...')
        const moduleAssignments = []
        
        for (let i = 0; i < Math.min(3, classes.length); i++) {
            for (let j = 0; j < Math.min(2, tssModules.length); j++) {
                try {
                    const assignment = await prisma.trainerClassModule.create({
                        data: {
                            trainerId: teachers[2].id,
                            classId: classes[i].id,
                            moduleId: tssModules[j].id,
                            schoolId: school.id
                        }
                    })
                    moduleAssignments.push(assignment)
                } catch (error) {
                    // Skip if already exists
                }
            }
        }
        
        console.log(`   ✅ Created ${moduleAssignments.length} trainer-class-module assignments`)
        
        console.log('\n🎉 Test Data Creation Complete!')
        console.log('\n📋 Summary:')
        console.log(`   Teachers: ${teachers.length}`)
        console.log(`   Teacher-Class-Subject assignments: ${assignments.length}`)
        console.log(`   TSS Modules: ${tssModules.length}`)
        console.log(`   Trainer-Class-Module assignments: ${moduleAssignments.length}`)
        console.log(`   Total assignments: ${assignments.length + moduleAssignments.length}`)
        
        console.log('\n✅ Ready for timetable generation testing!')
        console.log('\n🔍 You can now test:')
        console.log('   1. Full school generation')
        console.log('   2. Class-specific generation')
        console.log('   3. Teacher-specific generation')
        console.log('   4. TSS priority scheduling')
        console.log('   5. Consecutive period constraints')
        console.log('   6. Block scheduling for TSS modules')
        
    } catch (error) {
        console.error('❌ Test data creation failed:', error)
    } finally {
        await prisma.$disconnect()
    }
}

// Run the test
createTestData()