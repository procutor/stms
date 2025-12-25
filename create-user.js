const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 12);

    // Create a test user
    const user = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        name: 'Test Admin',
        password: hashedPassword,
        role: 'SCHOOL_ADMIN',
        isActive: true,
      }
    });

    console.log('User created successfully:');
    console.log(`Email: ${user.email}`);
    console.log(`Password: admin123`);
    console.log(`Role: ${user.role}`);

  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();