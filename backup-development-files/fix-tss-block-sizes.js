// Fix TSS module block sizes according to requirements
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixTSSBlockSizes() {
    console.log('🔧 Fixing TSS Module Block Sizes...\n')

    try {
        // Get all schools
        const schools = await prisma.school.findMany()

        for (const school of schools) {
            console.log(`📚 Processing school: ${school.name}`)

            // Get all modules for this school
            const modules = await prisma.module.findMany({
                where: { schoolId: school.id }
            })

            for (const module of modules) {
                const oldBlockSize = module.blockSize || 1
                let newBlockSize = oldBlockSize

                // ENFORCE BLOCK SIZE RULES:
                // - SPECIFIC modules → block_size >= 2
                // - GENERAL modules → block_size >= 2  
                // - COMPLEMENTARY modules → block_size >= 2
                
                if (module.category === 'SPECIFIC' || 
                    module.category === 'GENERAL' || 
                    module.category === 'COMPLEMENTARY') {
                    newBlockSize = 2 // All TSS modules require 2 consecutive periods
                }

                if (newBlockSize !== oldBlockSize) {
                    await prisma.module.update({
                        where: { id: module.id },
                        data: { blockSize: newBlockSize }
                    })
                    console.log(`  ✅ Updated ${module.name} (${module.category}): ${oldBlockSize} → ${newBlockSize}`)
                } else {
                    console.log(`  ℹ️  ${module.name} (${module.category}): already ${oldBlockSize}`)
                }
            }
        }

        console.log('\n✅ TSS block sizes updated successfully!')

        // Verify the changes
        console.log('\n📋 Verification - TSS Modules After Fix:')
        const allModules = await prisma.module.findMany()
        
        allModules.forEach(module => {
            const blockSize = module.blockSize || 1
            const status = blockSize >= 2 ? '✅' : '❌'
            console.log(`${status} ${module.name} (${module.category}): blockSize = ${blockSize}`)
        })

    } catch (error) {
        console.error('❌ Error fixing TSS block sizes:', error)
    } finally {
        await prisma.$disconnect()
    }
}

// Run the fix
fixTSSBlockSizes()