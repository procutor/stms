const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fetch = require('node-fetch');

const prisma = new PrismaClient();

async function testAuthAndAPI() {
  console.log('Testing authentication and API access...\n');
  
  try {
    // Get a school admin user
    const schoolAdmin = await prisma.user.findFirst({
      where: { role: 'SCHOOL_ADMIN' },
      include: { school: true }
    });
    
    const trainer = await prisma.user.findFirst({
      where: { role: 'TRAINER' },
      include: { school: true }
    });
    
    const module = await prisma.module.findFirst();
    
    if (!schoolAdmin || !trainer || !module) {
      console.log('Missing required data for testing');
      return;
    }
    
    console.log('Test users:');
    console.log(`School Admin: ${schoolAdmin.email} (${schoolAdmin.school?.name})`);
    console.log(`Trainer: ${trainer.email} (${trainer.school?.name})`);
    console.log(`Module: ${module.name} (${module.code})`);
    
    // Test login
    console.log('\nTesting login...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        csrfToken: 'test', // This would normally come from the page
        email: schoolAdmin.email,
        password: 'admin123' // We need to check what the actual password is
      })
    });
    
    console.log('Login response status:', loginResponse.status);
    
    // Check if the school admin has a known password
    const adminWithPassword = await prisma.user.findUnique({
      where: { id: schoolAdmin.id },
      select: { email: true, password: true }
    });
    
    console.log('Admin password hash exists:', !!adminWithPassword.password);
    
    // Let's try with a common test password
    const testPasswords = ['admin123', 'password', '123456', 'test123'];
    
    for (const password of testPasswords) {
      const isValid = await bcrypt.compare(password, adminWithPassword.password);
      if (isValid) {
        console.log(`✓ Found valid password: ${password}`);
        break;
      }
    }
    
    // Test the API endpoint directly
    console.log('\nTesting API endpoint...');
    const apiResponse = await fetch('http://localhost:3000/api/trainer-modules', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        teacherId: trainer.id,
        moduleId: module.id
      })
    });
    
    console.log('API response status:', apiResponse.status);
    const apiError = await apiResponse.text();
    console.log('API response:', apiError);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAuthAndAPI()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });