const { PrismaClient } = require('@prisma/client')
const { generateTimetable, generateTimetableForClass, generateTimetableForTeacher } = require('./src/lib/timetable-generator.ts')

const prisma = new PrismaClient()

async function testTimetableGeneration() {
    try {
        console.log('🧪 Testing Automatic Timetable Generation Logic...\n')
        
        // Get first approved school
        const school = await prisma.school.findFirst({
            where: { status: 'APPROVED' }
        })
        
        if (!school) {
            console.log('❌ No approved school found. Please approve a school first.')
            return
        }
        
        console.log(`📚 Testing with school: ${school.name} (${school.id})\n`)
        
        // Test 1: Check time slots structure (40-minute periods)
        console.log('⏰ Test 1: Checking 40-minute period structure...')
        const timeSlots = await prisma.timeSlot.findMany({
            where: { schoolId: school.id, isActive: true },
            orderBy: [{ day: 'asc' }, { period: 'asc' }]
        })
        
        const periods = timeSlots.filter(ts => ts.period > 0 && !ts.isBreak)
        console.log(`   Found ${periods.length} teaching periods (expected: 50 for 5 days × 10 periods)`)
        
        // Check a sample period duration
        const samplePeriod = periods.find(p => p.day === 'MONDAY' && p.period === 1)
        if (samplePeriod) {
            const duration = (samplePeriod.endTime - samplePeriod.startTime) / (1000 * 60) // minutes
            console.log(`   Period 1 duration: ${duration} minutes (expected: 40)`)
            if (duration === 40) {
                console.log('   ✅ 40-minute periods confirmed')
            } else {
                console.log('   ❌ Period duration mismatch')
            }
        }
        
        // Test 2: Check TSS modules and their categories
        console.log('\n📋 Test 2: Checking TSS modules and categories...')
        const modules = await prisma.module.findMany({
            where: { schoolId: school.id }
        })
        
        const tssModules = modules.filter(m => ['L3', 'L4', 'L5'].includes(m.level || ''))
        console.log(`   Found ${tssModules.length} TSS modules`)
        
        const categories = { SPECIFIC: 0, GENERAL: 0, COMPLEMENTARY: 0 }
        tssModules.forEach(module => {
            if (categories.hasOwnProperty(module.category)) {
                categories[module.category]++
            }
        })
        
        console.log('   TSS Module Categories:')
        console.log(`     SPECIFIC: ${categories.SPECIFIC}`)
        console.log(`     GENERAL: ${categories.GENERAL}`)
        console.log(`     COMPLEMENTARY: ${categories.COMPLEMENTARY}`)
        
        // Test 3: Check teacher-class assignments
        console.log('\n👥 Test 3: Checking teacher-class assignments...')
        const teacherClassAssignments = await prisma.teacherClassSubject.findMany({
            where: { schoolId: school.id },
            include: {
                teacher: { select: { name: true } },
                class: { select: { name: true, level: true } },
                subject: { select: { name: true, periodsPerWeek: true } }
            }
        })
        
        const trainerClassAssignments = await prisma.trainerClassModule.findMany({
            where: { schoolId: school.id },
            include: {
                trainer: { select: { name: true } },
                class: { select: { name: true, level: true } },
                module: { select: { name: true, totalHours: true, category: true, blockSize: true } }
            }
        })
        
        console.log(`   Teacher-Class-Subject assignments: ${teacherClassAssignments.length}`)
        console.log(`   Trainer-Class-Module assignments: ${trainerClassAssignments.length}`)
        
        // Test 4: Test class-based generation
        if (teacherClassAssignments.length > 0 || trainerClassAssignments.length > 0) {
            console.log('\n🎯 Test 4: Testing class-based timetable generation...')
            
            const sampleClassId = teacherClassAssignments[0]?.classId || trainerClassAssignments[0]?.classId
            if (sampleClassId) {
                try {
                    const result = await generateTimetableForClass(school.id, sampleClassId, { regenerate: true })
                    console.log(`   Class-based generation: ${result.success ? '✅ Success' : '❌ Failed'}`)
                    if (!result.success) {
                        console.log(`   Conflicts: ${result.conflicts.length}`)
                        result.conflicts.forEach((conflict, index) => {
                            console.log(`     ${index + 1}. ${conflict.message}`)
                        })
                    }
                } catch (error) {
                    console.log(`   Class-based generation error: ${error.message}`)
                }
            }
        }
        
        // Test 5: Test teacher-based generation
        const allAssignments = [...teacherClassAssignments, ...trainerClassAssignments]
        if (allAssignments.length > 0) {
            console.log('\n👨‍🏫 Test 5: Testing teacher-based timetable generation...')
            
            const sampleTeacherId = allAssignments[0]?.teacherId || allAssignments[0]?.trainerId
            if (sampleTeacherId) {
                try {
                    const result = await generateTimetableForTeacher(school.id, sampleTeacherId, { regenerate: true })
                    console.log(`   Teacher-based generation: ${result.success ? '✅ Success' : '❌ Failed'}`)
                    if (!result.success) {
                        console.log(`   Conflicts: ${result.conflicts.length}`)
                        result.conflicts.forEach((conflict, index) => {
                            console.log(`     ${index + 1}. ${conflict.message}`)
                        })
                    }
                } catch (error) {
                    console.log(`   Teacher-based generation error: ${error.message}`)
                }
            }
        }
        
        // Test 6: Verify generated timetables
        console.log('\n📅 Test 6: Verifying generated timetables...')
        const timetables = await prisma.timetable.findMany({
            where: { schoolId: school.id },
            include: {
                timeSlot: { select: { day: true, period: true, startTime: true, endTime: true } },
                class: { select: { name: true } },
                teacher: { select: { name: true } },
                subject: { select: { name: true } },
                module: { select: { name: true, category: true } }
            }
        })
        
        console.log(`   Generated ${timetables.length} timetable entries`)
        
        // Check for TSS priority in morning periods
        const tssTimetables = timetables.filter(t => t.module && t.module.category)
        const morningTSS = tssTimetables.filter(t => {
            const period = t.timeSlot.period
            return period >= 1 && period <= 5 // Morning periods
        })
        
        console.log(`   TSS lessons in morning periods: ${morningTSS.length}/${tssTimetables.length}`)
        
        // Test 7: Check consecutive periods rule
        console.log('\n⏱️ Test 7: Checking consecutive periods rule (< 2 consecutive)...')
        const teacherSchedules = new Map()
        timetables.forEach(timetable => {
            const teacherId = timetable.teacherId
            if (!teacherSchedules.has(teacherId)) {
                teacherSchedules.set(teacherId, [])
            }
            teacherSchedules.get(teacherId).push({
                day: timetable.timeSlot.day,
                period: timetable.timeSlot.period
            })
        })
        
        let violationCount = 0
        teacherSchedules.forEach((schedule, teacherId) => {
            const dailySchedule = new Map()
            schedule.forEach(lesson => {
                if (!dailySchedule.has(lesson.day)) {
                    dailySchedule.set(lesson.day, [])
                }
                dailySchedule.get(lesson.day).push(lesson.period)
            })
            
            dailySchedule.forEach(periods => {
                periods.sort((a, b) => a - b)
                for (let i = 1; i < periods.length; i++) {
                    if (periods[i] === periods[i-1] + 1) {
                        // Found consecutive periods, count the sequence
                        let count = 2
                        for (let j = i + 1; j < periods.length && periods[j] === periods[j-1] + 1; j++) {
                            count++
                        }
                        if (count > 2) {
                            violationCount++
                            console.log(`   ⚠️ Teacher ${teacherId}: ${count} consecutive periods on ${schedule[0]?.day}`)
                            break
                        }
                    }
                }
            })
        })
        
        if (violationCount === 0) {
            console.log('   ✅ No consecutive period violations found')
        } else {
            console.log(`   ❌ Found ${violationCount} consecutive period violations`)
        }
        
        console.log('\n🎉 Timetable Generation Testing Complete!')
        
    } catch (error) {
        console.error('❌ Test failed:', error)
    } finally {
        await prisma.$disconnect()
    }
}

// Run the test
testTimetableGeneration()