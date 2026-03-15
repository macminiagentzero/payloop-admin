import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function POST() {
  // Auth check
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Add decline columns to Transaction table
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "declineCode" TEXT'
    )
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "declineReason" TEXT'
    )
    
    // Add card columns to Order table
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "cardType" TEXT'
    )
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "cardLast4" TEXT'
    )
    
    return NextResponse.json({ 
      success: true, 
      message: 'Migration complete: Added decline columns to Transaction and card columns to Order' 
    })
  } catch (error: any) {
    // Check if columns already exist
    if (error.code === '42701') {
      return NextResponse.json({ 
        success: true, 
        message: 'Columns already exist' 
      })
    }
    console.error('Migration error:', error)
    return NextResponse.json({ 
      error: 'Migration failed', 
      details: error.message 
    }, { status: 500 })
  }
}