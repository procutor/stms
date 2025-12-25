const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testDatabaseSetup() {
    try {
        console.log('🧪 Testing Database Setup and Data Validation...\n')
        
        // Test 1: Check if we have any schools
        const schools = await prisma.school.findMany()
        console.log(`📚 Found ${schools.length} schools in database`)
        
        if (schools.length === 0) {
            console.log('❌ No schools found. Please create a school first.')
            return
        }
        
        const approvedSchools = schools.filter(s => s.status === 'APPROVED')
        console.log(`   Approved schools: ${approvedSchools.length}`)
        
        if (approvedSchools.length === 0) {
            console.log('❌ No approved schools found. Please approve a school first.')
            return
        }
        
        const school = approvedSchools[0]
        console.log(`✅ Using school: ${school.name} (${school.id})\n`)
        
        // Test 2: Check time slots structure
        console.log('⏰ Test 1: Checking time slots structure...')
        const timeSlots = await prisma.timeSlot.findMany({
            where: { schoolId: school.id, isActive: true },
            orderBy: [{ day: 'asc' }, { period: 'asc' }]
        })
        
        console.log(`   Total time slots: ${timeSlots.length}`)
        
        const periods = timeSlots.filter(ts => ts.period > 0 && !ts.isBreak)
        const breaks = timeSlots.filter(ts => ts.isBreak)
        
        console.log(`   Teaching periods: ${periods.length}`)
        console.log(`   Breaks: ${breaks.length}`)
        
        // Check if we have the expected 10 periods per day for 5 days = 50 periods
        if (periods.length >= 40) { // At least some periods
            console.log('   ✅ Time slots structure looks good')
        } else {
            console.log('   ❌ Not enough time slots found')
        }
        
        // Test 3: Check classes
        console.log('\n🏫 Test 2: Checking classes...')
        const classes = await prisma.class.findMany({
            where: { schoolId: school.id }
        })
        console.log(`   Found ${classes.length} classes`)
        
        if (classes.length > 0) {
            console.log('   Sample classes:')
            classes.slice(0, 5).forEach(cls => {
                console.log(`     - ${cls.name} (Level: ${cls.level})`)
            })
        }
        
        // Test 4: Check subjects
        console.log('\n📖 Test 3: Checking subjects...')
        const subjects = await prisma.subject.findMany({
            where: { schoolId: school.id }
        })
        console.log(`   Found ${subjects.length} subjects`)
        
        // Test 5: Check modules (TSS)
        console.log('\n🔧 Test 4: Checking TSS modules...')
        const modules = await prisma.module.findMany({
            where: { schoolId: school.id }
        })
        console.log(`   Found ${modules.length} modules`)
        
        const tssModules = modules.filter(m => ['L3', 'L4', 'L5'].includes(m.level || ''))
        console.log(`   TSS modules: ${tssModules.length}`)
        
        if (tssModules.length > 0) {
            const categories = { SPECIFIC: 0, GENERAL: 0, COMPLEMENTARY: 0 }
            tssModules.forEach(module => {
                if (categories.hasOwnProperty(module.category)) {
                    categories[module.category]++
                }
            })
            
            console.log('   TSS Categories:')
            console.log(`     SPECIFIC: ${categories.SPECIFIC}`)
            console.log(`     GENERAL: ${categories.GENERAL}`)
            console.log(`     COMPLEMENTARY: ${categories.COMPLEMENTARY}`)
            
            // Check for blockSize field
            const modulesWithBlockSize = tssModules.filter(m => m.blockSize !== null && m.blockSize !== undefined)
            console.log(`   Modules with blockSize: ${modulesWithBlockSize.length}`)
        }
        
        // Test 6: Check teachers/trainers
        console.log('\n👥 Test 5: Checking teachers and trainers...')
        const teachers = await prisma.user.findMany({
            where: { 
                schoolId: school.id,
                role: { in: ['TEACHER', 'TRAINER'] },
                isActive: true
            }
        })
        console.log(`   Found ${teachers.length} active teachers/trainers`)
        
        // Test 7: Check assignments
        console.log('\n📋 Test 6: Checking assignments...')
        const teacherClassSubjects = await prisma.teacherClassSubject.findMany({
            where: { schoolId: school.id }
        })
        console.log(`   Teacher-Class-Subject assignments: ${teacherClassSubjects.length}`)
        
        const trainerClassModules = await prisma.trainerClassModule.findMany({
            where: { schoolId: school.id }
        })
        console.log(`   Trainer-Class-Module assignments: ${trainerClassModules.length}`)
        
        const totalAssignments = teacherClassSubjects.length + trainerClassModules.length
        if (totalAssignments > 0) {
            console.log('   ✅ Found assignments - ready for timetable generation')
        } else {
            console.log('   ❌ No assignments found - need to create teacher-class assignments first')
        }
        
        // Test 8: Check existing timetables
        console.log('\n📅 Test 7: Checking existing timetables...')
        const timetables = await prisma.timetable.findMany({
            where: { schoolId: school.id }
        })
        console.log(`   Existing timetable entries: ${timetables.length}`)
        
        if (timetables.length > 0) {
            console.log('   Sample timetable entries:')
            timetables.slice(0, 3).forEach(timetable => {
                console.log(`     - ${timetable.classId} / ${timetable.teacherId} / ${timetable.timeSlotId}`)
            })
        }
        
        // Test 9: Validate 40-minute periods
        console.log('\n⏱️ Test 8: Validating 40-minute periods...')
        if (periods.length > 0) {
            const samplePeriod = periods.find(p => p.day === 'MONDAY' && p.period === 1)
            if (samplePeriod) {
                const startTime = new Date(samplePeriod.startTime)
                const endTime = new Date(samplePeriod.endTime)
                const durationMinutes = (endTime - startTime) / (1000 * 60)
                console.log(`   Period 1 duration: ${durationMinutes} minutes`)
                
                if (durationMinutes === 40) {
                    console.log('   ✅ 40-minute periods confirmed')
                } else {
                    console.log(`   ⚠️ Expected 40 minutes, got ${durationMinutes} minutes`)
                }
            }
        }
        
        console.log('\n🎉 Database Setup Testing Complete!')
        console.log('\n📋 Summary:')
        console.log(`   School: ${school.name}`)
        console.log(`   Classes: ${classes.length}`)
        console.log(`   Subjects: ${subjects.length}`)
        console.log(`   TSS Modules: ${tssModules.length}`)
        console.log(`   Teachers: ${teachers.length}`)
        console.log(`   Assignments: ${totalAssignments}`)
        console.log(`   Time Slots: ${periods.length} periods + ${breaks.length} breaks`)
        
        if (totalAssignments > 0 && periods.length >= 40) {
            console.log('\n✅ Ready for timetable generation!')
            console.log('   Use the API endpoints to generate timetables:')
            console.log('   - POST /api/generate (full school)')
            console.log('   - POST /api/generate with classId (class-specific)')
            console.log('   - POST /api/generate with teacherId (teacher-specific)')
        } else {
            console.log('\n❌ Not ready for timetable generation')
            if (totalAssignments === 0) console.log('   - Need to create teacher-class assignments')
            if (periods.length < 40) console.log('   - Need to set up time slots')
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error)
    } finally {
        await prisma.$disconnect()
    }
}

// Run the test
testDatabaseSetup()