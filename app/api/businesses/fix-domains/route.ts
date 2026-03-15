import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

// Fix old defaultDomain values to use mypayloop.co
export async function POST() {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Find businesses with old defaultDomain pattern
    const businesses = await prisma.business.findMany({
      where: {
        OR: [
          { defaultDomain: { contains: '.onrender.com' } },
          { defaultDomain: { contains: 'payloop.onrender' } }
        ]
      }
    })

    const updates = []
    
    for (const business of businesses) {
      // Fix: {slug}.checkout.payloop.onrender.com → {slug}.checkout.mypayloop.co
      let newDomain = business.defaultDomain!
      
      // Remove old patterns
      newDomain = newDomain.replace('.checkout.payloop.onrender.com', '.checkout.mypayloop.co')
      newDomain = newDomain.replace('.onrender.com', '.mypayloop.co')
      
      await prisma.business.update({
        where: { id: business.id },
        data: { defaultDomain: newDomain }
      })
      
      updates.push({ 
        id: business.id, 
        name: business.name, 
        old: business.defaultDomain, 
        new: newDomain 
      })
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updates.length} businesses`,
      updates
    })
  } catch (error) {
    console.error('Error fixing domains:', error)
    return NextResponse.json({ error: 'Failed to fix domains' }, { status: 500 })
  }
}