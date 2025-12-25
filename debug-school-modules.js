const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function debugSchoolModules() {
    try {
        console.log('=== DEBUGGING SCHOOL MODULES ===\n')
        
        // Get all schools and their modules
        const schools = await prisma.school.findMany({
            include: {
                modules: {
                    include: {
                        _count: {
                            select: {
                                trainers: true,
                                timetables: true
                            }
                        }
                    }
                }
            }
        })
        
        console.log('Schools and their modules:')
        schools.forEach(school => {
            console.log(`\nSchool: ${school.name} (ID: ${school.id})`)
            console.log(`Modules count: ${school.modules.length}`)
            
            if (school.modules.length > 0) {
                const levels = [...new Set(school.modules.map(m => m.level).filter(l => l && l.trim() !== ''))]
                console.log(`Available levels: ${levels.sort().join(', ')}`)
                
                console.log('Sample modules:')
                school.modules.slice(0, 3).forEach(module => {
                    console.log(`  - ${module.name} (${module.code}) - Level: "${module.level}" - Trade: "${module.trade || 'None'}"`)
                })
            } else {
                console.log('  No modules found for this school')
            }
        })
        
        // Check teachers and their school assignments
        console.log('\n=== TEACHERS AND SCHOOLS ===')
        const teachers = await prisma.teacher.findMany({
            include: {
                school: true,
                _count: {
                    select: {
                        trainerModules: true
                    }
                }
            }
        })
        
        console.log('Teachers with school info:')
        teachers.forEach(teacher => {
            console.log(`- ${teacher.name} (${teacher.email})`)
            console.log(`  School: ${teacher.school?.name || 'No school'} (ID: ${teacher.schoolId || 'None'})`)
            console.log(`  Active: ${teacher.isActive}`)
            console.log(`  Trainer assignments: ${teacher._count.trainerModules}`)
        })
        
    } catch (error) {
        console.error('Error debugging school modules:', error)
    } finally {
        await prisma.$disconnect()
    }
}

debugSchoolModules()