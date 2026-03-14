import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - List all funnels
export async function GET() {
  try {
    if (!await isAuthenticated()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const funnels = await prisma.funnel.findMany({
      include: {
        steps: {
          orderBy: { order: 'asc' },
        },
        checkoutConfig: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(funnels);
  } catch (error) {
    console.error('Error loading funnels:', error);
    return NextResponse.json(
      { error: 'Failed to load funnels' },
      { status: 500 }
    );
  }
}

// POST - Create a new funnel
export async function POST(request: NextRequest) {
  try {
    if (!await isAuthenticated()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, storeId, customDomain } = body;

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existing = await prisma.funnel.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A funnel with this slug already exists' },
        { status: 400 }
      );
    }

    // Create funnel with default steps
    const funnel = await prisma.funnel.create({
      data: {
        name,
        slug,
        storeId,
        customDomain,
        steps: {
          create: [
            { type: 'checkout', name: 'Checkout Page', order: 0 },
            { type: 'thankyou', name: 'Thank You Page', order: 1 },
          ],
        },
        checkoutConfig: {
          create: {
            blocks: [],
            styles: {},
            content: {},
          },
        },
      },
      include: {
        steps: true,
        checkoutConfig: true,
      },
    });

    return NextResponse.json(funnel);
  } catch (error) {
    console.error('Error creating funnel:', error);
    return NextResponse.json(
      { error: 'Failed to create funnel' },
      { status: 500 }
    );
  }
}