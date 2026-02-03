import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]
  const newPassword = process.argv[3] || 'password123'

  if (!email) {
    console.log('Usage: npx ts-node scripts/update-user-password.ts <email> [newPassword]')
    console.log('Example: npx ts-node scripts/update-user-password.ts admin@school.com mynewpassword')
    process.exit(1)
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10)

  const user = await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
    select: { id: true, email: true, name: true, role: true }
  })

  console.log(`✅ Password updated for user: ${user.email}`)
  console.log(`   Name: ${user.name}`)
  console.log(`   Role: ${user.role}`)
  console.log(`   New password: ${newPassword}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
