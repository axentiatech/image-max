import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getProviders } from '@/services/imageProviders/providerFactory';

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

 

export async function POST(request: NextRequest) {
  try {
   
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
      
      const title = prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt;
      chat = await prisma.chat.create({
        data: {
          id: chatId,
          userId: session.user.id,
          title,
        },
      });
    }

    
    const batch = await prisma.generationBatch.create({
      data: {
        chatId,
        userId: session.user.id,
        prompt,
      },
    });

     // Get providers based on environment
     const providers = getProviders();

     // Create image generation records
     const imageGenerations = await Promise.all(
       providers.map(provider =>
         prisma.imageGeneration.create({
           data: {
             batchId: batch.id,
             userId: session.user.id,
             model: provider.getName(),
             status: 'pending',
           },
         })
       )
     );

     // Generate images using providers
     const results = await Promise.allSettled(
       providers.map(async (provider, index) => {
         const generation = imageGenerations[index];
         
         try {
           const result = await provider.generateImage(prompt);
           
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
               provider: provider.getName(),
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
               provider: provider.getName(),
               imageUrl: null,
               status: 'failed' as const,
               error: result.error,
             };
           }
         } catch (error: any) {
           await prisma.imageGeneration.update({
             where: { id: generation.id },
             data: {
               status: 'failed',
               errorMsg: error.message,
               completedAt: new Date(),
             },
           });
           
           return {
             id: generation.id,
             provider: provider.getName(),
             imageUrl: null,
             status: 'failed' as const,
             error: error.message,
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
           provider: providers[index].getName(),
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
  } catch (error) {
    console.error('Error generating images:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
