import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    const chats = await prisma.chat.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit + 1, // Take one extra to check if there are more
    });

    const hasMore = chats.length > limit;
    const chatsToReturn = hasMore ? chats.slice(0, limit) : chats;

    return NextResponse.json({
      chats: chatsToReturn,
      hasMore,
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

