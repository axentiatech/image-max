import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const batchId = params.id;

    const batch = await prisma.generationBatch.findUnique({
      where: { id: batchId },
      include: {
        generations: {
          orderBy: { createdAt: 'asc' }
        },
        chat: true
      }
    });

    if (!batch) {
      return NextResponse.json(
        { success: false, error: 'Batch not found' },
        { status: 404 }
      );
    }

     
    const transformedBatch = {
      id: batch.id,
      chatId: batch.chatId,
      prompt: batch.prompt,
      createdAt: batch.createdAt.toISOString(),
      images: batch.generations.map(gen => ({
        id: gen.id,
        provider: gen.model,
        imageUrl: gen.imageUrl,
        status: gen.status as 'completed' | 'failed' | 'pending',
        error: gen.errorMsg
      }))
    };

    return NextResponse.json({
      success: true,
      batch: transformedBatch
    });

  } catch (error) {
    console.error('Error fetching batch:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
