import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Load checkout config for a funnel
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!await isAuthenticated()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const config = await prisma.checkoutConfig.findUnique({
      where: { funnelId: id },
      include: {
        funnel: {
          include: { steps: true },
        },
      },
    });

    if (!config) {
      // Return default config if none exists
      return NextResponse.json({
        blocks: [],
        styles: {},
        content: {},
        funnel: null,
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error loading checkout config:', error);
    return NextResponse.json(
      { error: 'Failed to load checkout config' },
      { status: 500 }
    );
  }
}

// PUT - Save checkout config
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!await isAuthenticated()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { blocks, styles, content } = body;

    // Upsert the config
    const config = await prisma.checkoutConfig.upsert({
      where: { funnelId: id },
      create: {
        funnelId: id,
        blocks: blocks || [],
        styles: styles || {},
        content: content || {},
      },
      update: {
        blocks: blocks || [],
        styles: styles || {},
        content: content || {},
      },
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error saving checkout config:', error);
    return NextResponse.json(
      { error: 'Failed to save checkout config' },
      { status: 500 }
    );
  }
}