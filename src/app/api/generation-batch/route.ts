import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('id');

    if (!batchId) {
      return NextResponse.json(
        { error: 'Generation batch ID is required' },
        { status: 400 }
      );
    }

  
    const batch = await prisma.generationBatch.findFirst({
      where: {
        id: batchId,
        userId: session.user.id,
      },
    });

    if (!batch) {
      return NextResponse.json(
        { error: 'Generation batch not found' },
        { status: 404 }
      );
    }

 
    await prisma.generationBatch.delete({
      where: {
        id: batchId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting generation batch:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
