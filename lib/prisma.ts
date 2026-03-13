import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['query', 'error', 'warn'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Add missing columns on startup
async function migrateDatabase() {
  try {
    // Add cavv column to Transaction table if it doesn't exist
    await prisma.$executeRaw`ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "cavv" TEXT`
    console.log('>>> Migration: Transaction.cavv column ensured')
  } catch (error: any) {
    // Log but don't crash - column might already exist
    console.log('>>> Migration: Transaction.cavv -', error.message || 'skipped')
  }
}

// Run migration asynchronously without blocking startup
migrateDatabase().catch(err => {
  console.log('>>> Migration: Non-critical error -', err.message)
})