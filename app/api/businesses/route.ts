import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

// GET - List all businesses
export async function GET() {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const businesses = await prisma.business.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        customDomain: true,
        shopifyDomain: true,
        logoUrl: true,
        primaryColor: true,
        accentColor: true,
        isActive: true,
        createdAt: true
      }
    })

    return NextResponse.json(businesses)
  } catch (error) {
    console.error('Error fetching businesses:', error)
    return NextResponse.json({ error: 'Failed to fetch businesses' }, { status: 500 })
  }
}

// POST - Create new business
export async function POST(request: NextRequest) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { 
      name, 
      slug, 
      customDomain, 
      shopifyDomain,
      shopifyStorefrontToken,
      shopifyAdminToken,
      shopifyWebhookSecret,
      primaryColor,
      accentColor,
      logoUrl 
    } = body

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      )
    }

    // Validate slug format (lowercase, alphanumeric, hyphens)
    const slugRegex = /^[a-z0-9-]+$/
    if (!slugRegex.test(slug)) {
      return NextResponse.json(
        { error: 'Slug must be lowercase alphanumeric with hyphens only' },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const existingSlug = await prisma.business.findUnique({
      where: { slug }
    })

    if (existingSlug) {
      return NextResponse.json(
        { error: 'A business with this slug already exists' },
        { status: 400 }
      )
    }

    // Check if customDomain already exists (if provided)
    if (customDomain) {
      const existingDomain = await prisma.business.findFirst({
        where: { customDomain }
      })

      if (existingDomain) {
        return NextResponse.json(
          { error: 'A business with this custom domain already exists' },
          { status: 400 }
        )
      }
    }

    // Auto-generate default domain
    const defaultDomain = `${slug}.checkout.mypayloop.co`

    // Check if defaultDomain already exists
    const existingDefaultDomain = await prisma.business.findUnique({
      where: { defaultDomain }
    })

    if (existingDefaultDomain) {
      return NextResponse.json(
        { error: 'A business with this slug already exists' },
        { status: 400 }
      )
    }

    // Create the business
    const business = await prisma.business.create({
      data: {
        name,
        slug,
        defaultDomain, // Auto-generated
        customDomain: customDomain || null,
        shopifyDomain: shopifyDomain || null,
        shopifyStorefrontToken: shopifyStorefrontToken || null,
        shopifyAdminToken: shopifyAdminToken || null,
        shopifyWebhookSecret: shopifyWebhookSecret || null,
        primaryColor: primaryColor || '#4F46E5',
        accentColor: accentColor || '#7C3AED',
        logoUrl: logoUrl || null,
        isActive: true
      }
    })

    return NextResponse.json(business)
  } catch (error) {
    console.error('Error creating business:', error)
    return NextResponse.json({ error: 'Failed to create business' }, { status: 500 })
  }
}

// PATCH - Update business
export async function PATCH(request: NextRequest) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, name, slug, customDomain, shopifyDomain, shopifyStorefrontToken, shopifyAdminToken, shopifyWebhookSecret, primaryColor, accentColor, logoUrl, isActive } = body

    if (!id) {
      return NextResponse.json({ error: 'Business ID is required' }, { status: 400 })
    }

    // Check if business exists
    const existing = await prisma.business.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Check slug uniqueness if changing
    if (slug && slug !== existing.slug) {
      const slugRegex = /^[a-z0-9-]+$/
      if (!slugRegex.test(slug)) {
        return NextResponse.json(
          { error: 'Slug must be lowercase alphanumeric with hyphens only' },
          { status: 400 }
        )
      }

      const existingSlug = await prisma.business.findUnique({ where: { slug } })
      if (existingSlug) {
        return NextResponse.json(
          { error: 'A business with this slug already exists' },
          { status: 400 }
        )
      }
    }

    // Check domain uniqueness if changing
    if (customDomain && customDomain !== existing.customDomain) {
      const existingDomain = await prisma.business.findFirst({
        where: { customDomain, id: { not: id } }
      })
      if (existingDomain) {
        return NextResponse.json(
          { error: 'A business with this custom domain already exists' },
          { status: 400 }
        )
      }
    }

    // Build update data
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (slug !== undefined) updateData.slug = slug
    if (customDomain !== undefined) updateData.customDomain = customDomain || null
    if (shopifyDomain !== undefined) updateData.shopifyDomain = shopifyDomain || null
    if (shopifyStorefrontToken !== undefined) updateData.shopifyStorefrontToken = shopifyStorefrontToken || null
    if (shopifyAdminToken !== undefined) updateData.shopifyAdminToken = shopifyAdminToken || null
    if (shopifyWebhookSecret !== undefined) updateData.shopifyWebhookSecret = shopifyWebhookSecret || null
    if (primaryColor !== undefined) updateData.primaryColor = primaryColor
    if (accentColor !== undefined) updateData.accentColor = accentColor
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl || null
    if (isActive !== undefined) updateData.isActive = isActive

    // Update the business
    const business = await prisma.business.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(business)
  } catch (error) {
    console.error('Error updating business:', error)
    return NextResponse.json({ error: 'Failed to update business' }, { status: 500 })
  }
}

// DELETE - Delete business (with confirmation)
export async function DELETE(request: NextRequest) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const confirmation = searchParams.get('confirmation')

    if (!id) {
      return NextResponse.json({ error: 'Business ID is required' }, { status: 400 })
    }

    // Require confirmation
    if (confirmation !== 'DELETE') {
      return NextResponse.json({ 
        error: 'Confirmation required. Please type DELETE to confirm.',
        requiresConfirmation: true 
      }, { status: 400 })
    }

    // Check if business exists
    const existing = await prisma.business.findUnique({ 
      where: { id },
      include: {
        _count: {
          select: {
            orders: true,
            subscriptions: true,
            customers: true
          }
        }
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Prevent deleting the default business
    if (existing.slug === 'default') {
      return NextResponse.json({ 
        error: 'Cannot delete the default business' 
      }, { status: 400 })
    }

    // Delete the business (cascade will delete related data)
    await prisma.business.delete({ where: { id } })

    return NextResponse.json({ 
      success: true,
      message: `Deleted business "${existing.name}" with ${existing._count.orders} orders, ${existing._count.subscriptions} subscriptions, ${existing._count.customers} customers`
    })
  } catch (error) {
    console.error('Error deleting business:', error)
    return NextResponse.json({ error: 'Failed to delete business' }, { status: 500 })
  }
}