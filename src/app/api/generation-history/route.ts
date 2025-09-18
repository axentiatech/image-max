import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const endingBefore = searchParams.get('ending_before');

    const whereClause: {
      userId: string;
      id?: { lt: string };
    } = {
      userId: session.user.id,
    };

    if (endingBefore) {
      whereClause.id = {
        lt: endingBefore,
      };
    }

    const generationBatches = await prisma.generationBatch.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit + 1,  
      include: {
        generations: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    const hasMore = generationBatches.length > limit;
    const batchesToReturn = hasMore ? generationBatches.slice(0, limit) : generationBatches;

    return NextResponse.json({
      batches: batchesToReturn,
      hasMore,
    });
  } catch (error) {
    console.error('Error fetching generation history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
