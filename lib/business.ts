import { prisma } from '@/lib/prisma'

/**
 * Get the current business context
 * 
 * For now, returns the default business (single-tenant setup)
 * In the future, this will get the business from session/cookie
 * 
 * Returns null if Business table doesn't exist (pre-migration)
 */
export async function getCurrentBusinessId(): Promise<string | null> {
  try {
    // Try to get the default business
    // This will fail gracefully if the Business table doesn't exist yet
    const business = await prisma.business.findFirst({
      where: { slug: 'default' },
      select: { id: true }
    })
    
    return business?.id || null
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