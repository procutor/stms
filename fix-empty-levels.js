const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixEmptyLevels() {
    try {
        console.log('=== FIXING EMPTY LEVELS ===\n')
        
        // Find modules with empty levels
        const modulesWithEmptyLevels = await prisma.module.findMany({
            where: {
                OR: [
                    { level: '' },
                    { level: null }
                ]
            },
            include: {
                school: true
            }
        })
        
        console.log(`Found ${modulesWithEmptyLevels.length} modules with empty levels:`)
        modulesWithEmptyLevels.forEach(module => {
            console.log(`- ${module.name} (${module.code}) - School: ${module.school?.name || 'Unknown'}`)
        })
        
        if (modulesWithEmptyLevels.length === 0) {
            console.log('No modules with empty levels found.')
            return
        }
        
        // Group by school and assign default levels
        const schoolsWithEmptyLevels = [...new Set(modulesWithEmptyLevels.map(m => m.schoolId))]
        
        for (const schoolId of schoolsWithEmptyLevels) {
            console.log(`\nFixing modules for school: ${schoolId}`)
            
            const schoolModules = modulesWithEmptyLevels.filter(m => m.schoolId === schoolId)
            
            // Assign levels based on module type
            for (let i = 0; i < schoolModules.length; i++) {
                const module = schoolModules[i]
                let newLevel = 'L3' // Default
                
                // Assign different levels based on module name/code pattern
                if (module.name.toLowerCase().includes('advanced') || module.code.includes('501')) {
                    newLevel = 'L5'
                } else if (module.name.toLowerCase().includes('intermediate') || module.code.includes('401')) {
                    newLevel = 'L4'
                } else if (module.code.includes('101') || module.code.includes('301')) {
                    newLevel = 'L3'
                }
                
                console.log(`  Updating ${module.name}: "" -> "${newLevel}"`)
                
                await prisma.module.update({
                    where: { id: module.id },
                    data: { level: newLevel }
                })
            }
        }
        
        console.log('\n=== VERIFICATION ===')
        
        // Check the results
        const fixedModules = await prisma.module.findMany({
            where: {
                schoolId: {
                    in: schoolsWithEmptyLevels
                }
            }
        })
        
        const levelsBySchool = {}
        fixedModules.forEach(module => {
            if (!levelsBySchool[module.schoolId]) {
                levelsBySchool[module.schoolId] = []
            }
            levelsBySchool[module.schoolId].push(module.level)
        })
        
        Object.entries(levelsBySchool).forEach(([schoolId, levels]) => {
            const uniqueLevels = [...new Set(levels)].sort()
            console.log(`School ${schoolId}: ${uniqueLevels.join(', ')}`)
        })
        
        console.log('\n✅ Empty levels have been fixed!')
        
    } catch (error) {
        console.error('Error fixing empty levels:', error)
    } finally {
        await prisma.$disconnect()
    }
}

fixEmptyLevels()