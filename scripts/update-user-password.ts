import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'damascenetugireyezu@gmail.com';
  const plainPassword = 'sEkamana@123';
  
  const hashedPassword = await bcrypt.hash(plainPassword, 10);
  
  const user = await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  });
  
  console.log(`Updated password for user: ${email}`);
  console.log(`New hash: ${hashedPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
