import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

interface GenerateImagesRequest {
  prompt: string;
  chatId: string;
  userId: string;
}

interface ImageResult {
  id: string;
  provider: string;
  imageUrl: string | null;
  status: 'completed' | 'failed' | 'pending';
  error?: string;
}

interface GenerateImagesResponse {
  success: boolean;
  batchId: string;
  images: ImageResult[];
}

// Mock providers configuration
const PROVIDERS = [
  { name: 'midjourney', delay: 2000 },
  { name: 'dalle', delay: 3000 },
  { name: 'stability', delay: 4000 },
];

// Mock image generation function
async function mockImageGeneration(provider: string, delay: number): Promise<{ imageUrl: string; success: boolean; error?: string }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate occasional failures (10% chance)
      if (Math.random() < 0.1) {
        resolve({
          imageUrl: '',
          success: false,
          error: `Mock ${provider} service temporarily unavailable`
        });
      } else {
        resolve({
          imageUrl: 'https://aaxr3zh5x0.ufs.sh/f/VKo1Weu7HOuKcjeODcnb2YoPNKSWxHC78qjQ4VZF5nRkBDs9',
          success: true
        });
      }
    }, delay);
  });
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: GenerateImagesRequest = await request.json();
    const { prompt, chatId, userId } = body;

    if (!prompt || !chatId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: prompt, chatId, userId' },
        { status: 400 }
      );
    }

    
    let chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId: session.user.id,
      },
    });

    if (!chat) {
      // Create new chat with a title generated from the prompt
      const title = prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt;
      chat = await prisma.chat.create({
        data: {
          id: chatId,
          userId: session.user.id,
          title,
        },
      });
    }

    // Create generation batch
    const batch = await prisma.generationBatch.create({
      data: {
        chatId,
        userId: session.user.id,
        prompt,
      },
    });

    // Create image generation records
    const imageGenerations = await Promise.all(
      PROVIDERS.map(provider =>
        prisma.imageGeneration.create({
          data: {
            batchId: batch.id,
            userId: session.user.id,
            model: provider.name,
            status: 'pending',
          },
        })
      )
    );

    // Check if we're in mock mode
    const isMockMode = process.env.MOCK_IMAGES === 'true';

    if (true) {
      // Mock mode: simulate image generation with delays
      const results = await Promise.allSettled(
        PROVIDERS.map(async (provider, index) => {
          const generation = imageGenerations[index];
          const result = await mockImageGeneration(provider.name, provider.delay);
          
          if (result.success) {
            await prisma.imageGeneration.update({
              where: { id: generation.id },
              data: {
                status: 'completed',
                imageUrl: result.imageUrl,
                completedAt: new Date(),
              },
            });
            
            return {
              id: generation.id,
              provider: provider.name,
              imageUrl: result.imageUrl,
              status: 'completed' as const,
            };
          } else {
            await prisma.imageGeneration.update({
              where: { id: generation.id },
              data: {
                status: 'failed',
                errorMsg: result.error,
                completedAt: new Date(),
              },
            });
            
            return {
              id: generation.id,
              provider: provider.name,
              imageUrl: null,
              status: 'failed' as const,
              error: result.error,
            };
          }
        })
      );

      const images: ImageResult[] = results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            id: imageGenerations[index].id,
            provider: PROVIDERS[index].name,
            imageUrl: null,
            status: 'failed',
            error: 'Unexpected error occurred',
          };
        }
      });

      return NextResponse.json({
        success: true,
        batchId: batch.id,
        images,
      } as GenerateImagesResponse);
    } else {
      // Production mode: return pending status
      const images: ImageResult[] = imageGenerations.map(generation => ({
        id: generation.id,
        provider: generation.model,
        imageUrl: null,
        status: 'pending' as const,
      }));

      return NextResponse.json({
        success: true,
        batchId: batch.id,
        images,
      } as GenerateImagesResponse);
    }
  } catch (error) {
    console.error('Error generating images:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
