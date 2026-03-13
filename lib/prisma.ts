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
    
    // Add pausedAt and cancelledAt to Subscription table
    await prisma.$executeRaw`ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "pausedAt" TIMESTAMP`
    await prisma.$executeRaw`ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP`
    
    // Add billing interval columns to Subscription table
    await prisma.$executeRaw`ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "billingInterval" INTEGER DEFAULT 1`
    await prisma.$executeRaw`ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "billingIntervalUnit" TEXT DEFAULT 'month'`
    
    console.log('>>> Migration: All columns ensured')
  } catch (error: any) {
    // Log but don't crash - columns might already exist
    console.log('>>> Migration: Non-critical error -', error.message || 'skipped')
  }
}

// Run migration asynchronously without blocking startup
migrateDatabase().catch(err => {
  console.log('>>> Migration: Non-critical error -', err.message)
})

// Also export a function to check subscription count
export async function getSubscriptionCount() {
  try {
    const count = await prisma.subscription.count()
    console.log('>>> Subscription count:', count)
    return count
  } catch (error: any) {
    console.error('>>> Error counting subscriptions:', error.message)
    return 0
  }
}