// Test script to verify consecutive double periods enforcement
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testConsecutiveDoublePeriods() {
    console.log('🧪 Testing Consecutive Double Periods Enforcement...\n')

    try {
        // Get a school with data
        const schools = await prisma.school.findMany({
            include: {
                classes: true,
                subjects: true,
                modules: true
            }
        })

        if (schools.length === 0) {
            console.log('❌ No schools found in database')
            return
        }

        const school = schools[0]
        console.log(`📚 Testing with school: ${school.name}`)

        // Test 1: Check TSS modules have blockSize >= 2
        const tssModules = await prisma.module.findMany({
            where: { schoolId: school.id }
        })

        console.log('\n📋 TSS Modules Block Size Analysis:')
        tssModules.forEach(module => {
            const blockSize = module.blockSize || 1
            const status = blockSize >= 2 ? '✅' : '❌'
            console.log(`${status} ${module.name} (${module.category}): blockSize = ${blockSize}`)
        })

        // Test 2: Check Mathematics and Physics subjects
        const subjects = await prisma.subject.findMany({
            where: { schoolId: school.id }
        })

        console.log('\n📋 General Education Subjects Analysis:')
        subjects.forEach(subject => {
            const subjectName = subject.name.toLowerCase()
            const isMathOrPhysics = subjectName.includes('mathematics') || subjectName.includes('physics')
            const periodsPerWeek = subject.periodsPerWeek
            
            if (isMathOrPhysics) {
                console.log(`🎯 ${subject.name}: ${periodsPerWeek} periods per week (should use double periods)`)
            } else {
                console.log(`📝 ${subject.name}: ${periodsPerWeek} periods per week`)
            }
        })

        // Test 3: Check lesson preparation logic
        console.log('\n🔧 Testing Lesson Preparation Logic:')
        
        // Test the lesson preparation service
        const { prepareLessonsForSchool } = require('./src/lib/lesson-preparation')
        
        if (prepareLessonsForSchool) {
            const { lessons, statistics, validation } = await prepareLessonsForSchool(school.id)
            
            console.log(`📊 Total lessons prepared: ${lessons.length}`)
            console.log(`📈 Lesson statistics:`, statistics)
            
            // Analyze block sizes
            const blockSizeAnalysis = {}
            lessons.forEach(lesson => {
                const key = `${lesson.lessonType}-${lesson.moduleCategory || 'N/A'}`
                if (!blockSizeAnalysis[key]) {
                    blockSizeAnalysis[key] = { count: 0, blockSizes: new Set() }
                }
                blockSizeAnalysis[key].count++
                blockSizeAnalysis[key].blockSizes.add(lesson.blockSize || 1)
            })
            
            console.log('\n📋 Block Size Analysis by Lesson Type:')
            Object.entries(blockSizeAnalysis).forEach(([key, data]) => {
                console.log(`${key}: ${data.count} lessons, block sizes: ${[...data.blockSizes].join(', ')}`)
            })
        }

        console.log('\n✅ Test completed successfully!')
        
    } catch (error) {
        console.error('❌ Test failed:', error)
    } finally {
        await prisma.$disconnect()
    }
}

// Run the test
testConsecutiveDoublePeriods()