import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get a single funnel
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!await isAuthenticated()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const funnel = await prisma.funnel.findUnique({
      where: { id },
      include: {
        steps: {
          orderBy: { order: 'asc' },
        },
        checkoutConfig: true,
      },
    });

    if (!funnel) {
      return NextResponse.json({ error: 'Funnel not found' }, { status: 404 });
    }

    return NextResponse.json(funnel);
  } catch (error) {
    console.error('Error loading funnel:', error);
    return NextResponse.json(
      { error: 'Failed to load funnel' },
      { status: 500 }
    );
  }
}

// PUT - Update a funnel
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
    const { name, slug, storeId, customDomain, isActive, isDefault } = body;

    const funnel = await prisma.funnel.update({
      where: { id },
      data: {
        name,
        slug,
        storeId,
        customDomain,
        isActive,
        isDefault,
      },
      include: {
        steps: true,
        checkoutConfig: true,
      },
    });

    return NextResponse.json(funnel);
  } catch (error) {
    console.error('Error updating funnel:', error);
    return NextResponse.json(
      { error: 'Failed to update funnel' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a funnel
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!await isAuthenticated()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Delete funnel (cascade will delete steps and config)
    await prisma.funnel.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting funnel:', error);
    return NextResponse.json(
      { error: 'Failed to delete funnel' },
      { status: 500 }
    );
  }
}