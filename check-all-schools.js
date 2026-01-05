import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== CHECKING ALL SCHOOLS IN DATABASE ===\n');
  
  try {
    const schools = await prisma.school.findMany({
      orderBy: { createdAt: 'asc' }
    });
    
    console.log(`Found ${schools.length} schools in database:\n`);
    
    if (schools.length === 0) {
      console.log('❌ No schools found in database');
    } else {
      schools.forEach((school, index) => {
        console.log(`${index + 1}. ${school.name}`);
        console.log(`   ID: ${school.id}`);
        console.log(`   Code: ${school.code || 'N/A'}`);
        console.log(`   Status: ${school.status || 'N/A'}`);
        console.log(`   Created: ${school.createdAt}`);
        console.log('');
      });
      
      // Look for GS Gikomero TSS specifically
      const gikomeroTSS = schools.find(school => 
        school.name.toLowerCase().includes('gikomero') && 
        school.name.toLowerCase().includes('tss')
      );
      
      if (gikomeroTSS) {
        console.log('✅ GS Gikomero TSS found!');
        console.log('   Now checking for L4 ELTA class...');
        
        // Check for L4 ELTA class in this school
        const classes = await prisma.class.findMany({
          where: { schoolId: gikomeroTSS.id }
        });
        
        console.log(`\nClasses in ${gikomeroTSS.name}:`);
        classes.forEach(cls => {
          console.log(`- ${cls.name} (Level: ${cls.level})`);
        });
        
        const l4Elta = classes.find(cls => 
          cls.name.toLowerCase().includes('l4') && 
          cls.name.toLowerCase().includes('elta')
        );
        
        if (l4Elta) {
          console.log('\n✅ L4 ELTA class found!');
        } else {
          console.log('\n❌ L4 ELTA class not found in GS Gikomero TSS');
          console.log('Available classes: ' + classes.map(c => c.name).join(', '));
        }
        
      } else {
        console.log('❌ GS Gikomero TSS school not found');
        console.log('Available schools: ' + schools.map(s => s.name).join(', '));
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking schools:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();