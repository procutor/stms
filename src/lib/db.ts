import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => {
    return new PrismaClient({
        datasources: {
            db: {
                url: process.env.DATABASE_URL
            }
        },
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
}

export const db = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Helper to clean up prepared statements in serverless environments
export async function cleanConnection() {
    try {
        await db.$executeRaw`DEALLOCATE ALL`
    } catch (error) {
        // Ignore errors from DEALLOCATE ALL as prepared statements may not exist
    }
}
