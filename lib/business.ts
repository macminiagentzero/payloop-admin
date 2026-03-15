import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

/**
 * Get the current business context
 * 
 * Priority:
 * 1. Business ID from cookie (user selected)
 * 2. Default business (slug: 'default')
 * 3. First available business
 * 4. null if no businesses exist
 */
export async function getCurrentBusinessId(): Promise<string | null> {
  try {
    // Try to get from cookie first (user's selection)
    const cookieStore = await cookies()
    const cookieBusinessId = cookieStore.get('businessId')?.value
    
    if (cookieBusinessId) {
      // Verify this business still exists
      const business = await prisma.business.findFirst({
        where: { 
          id: cookieBusinessId,
          isActive: true 
        },
        select: { id: true }
      })
      
      if (business) {
        return business.id
      }
    }
    
    // Fall back to default business
    const defaultBusiness = await prisma.business.findFirst({
      where: { slug: 'default', isActive: true },
      select: { id: true }
    })
    
    if (defaultBusiness) {
      return defaultBusiness.id
    }
    
    // Fall back to first active business
    const firstBusiness = await prisma.business.findFirst({
      where: { isActive: true },
      select: { id: true }
    })
    
    return firstBusiness?.id || null
  } catch (error: any) {
    // If Business table doesn't exist (P2021), return null
    // This allows the app to work before migration is run
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      console.log('Business table not found - returning null (run migration first)')
      return null
    }
    console.error('Error getting current business:', error)
    return null
  }
}

/**
 * Get or create the default business
 * Used during migration and first-run setup
 */
export async function getOrCreateDefaultBusiness(): Promise<string> {
  try {
    let business = await prisma.business.findFirst({
      where: { slug: 'default' }
    })
    
    if (!business) {
      business = await prisma.business.create({
        data: {
          name: 'Default Business',
          slug: 'default',
          isActive: true
        }
      })
    }
    
    return business.id
  } catch (error: any) {
    // If table doesn't exist, throw a helpful error
    if (error.code === 'P2021') {
      throw new Error('Business table does not exist. Run the migration first.')
    }
    throw error
  }
}

/**
 * Middleware to ensure business context exists
 * Returns businessId or throws error
 */
export async function requireBusiness(): Promise<string> {
  const businessId = await getCurrentBusinessId()
  
  if (!businessId) {
    throw new Error('No business context found. Please run migration first.')
  }
  
  return businessId
}

/**
 * Add businessId to Prisma query where clause
 */
export function withBusiness<T extends object>(query: T, businessId: string): T & { businessId: string } {
  return {
    ...query,
    businessId
  }
}

/**
 * Create Prisma data with businessId
 */
export function createWithBusiness<T extends object>(data: T, businessId: string): T & { businessId: string } {
  return {
    ...data,
    businessId
  }
}