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
    await prisma.$executeRaw`
      ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "declineCode" TEXT
    `
    await prisma.$executeRaw`
      ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "declineReason" TEXT
    `
    
    return NextResponse.json({ 
      success: true, 
      message: 'Migration complete: Added declineCode and declineReason columns to Transaction table' 
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