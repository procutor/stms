const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        role: true,
        isActive: true
      }
    });

    console.log('Users in database:');
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role}) - Active: ${user.isActive}`);
    });

    if (users.length === 0) {
      console.log('No users found. Creating a test user...');

      const hashedPassword = await bcrypt.hash('password123', 12);

      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          password: hashedPassword,
          role: 'SCHOOL_ADMIN',
          isActive: true,
        }
      });

      console.log('Test user created:');
      console.log(`Email: ${user.email}`);
      console.log(`Password: password123`);
      console.log(`Role: ${user.role}`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();