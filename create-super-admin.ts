import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('Connected successfully');

    // Hash the password
    const hashedPassword = await bcrypt.hash('sEkamana@123', 12);
    console.log('Password hashed');

    // Check if super admin already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'damascenetugireyezu@gmail.com' }
    });

    if (existingUser) {
      console.log('Super Admin already exists:');
      console.log(`Email: ${existingUser.email}`);
      console.log(`Role: ${existingUser.role}`);
      return;
    }

    console.log('Creating super admin user...');
    // Create the super admin user
    const user = await prisma.user.create({
      data: {
        email: 'damascenetugireyezu@gmail.com',
        name: 'Super Administrator',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        isActive: true,
      }
    });

    console.log('User object:', user);
    console.log('Super Admin created/updated successfully:');
    console.log(`Email: ${user?.email}`);
    console.log(`Password: sEkamana@123`);
    console.log(`Role: ${user?.role}`);

  } catch (error) {
    console.error('Error creating super admin:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
  } finally {
    await prisma.$disconnect();
  }
}

main();