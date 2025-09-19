import { ImageProvider, ImageResult } from './index';
import { extractImageFromDalleResponse, DecodedImageResult } from '@/lib/image-utils';
import { uploadImageToSupabase, generateUniqueFileName } from '@/lib/supabase-storage';

export class DalleProvider implements ImageProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.baseUrl = 'https://api.openai.com/v1/images/generations';
    
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
  }

  async generateImage(prompt: string): Promise<ImageResult> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'dall-e-2',
          prompt: prompt,
          n: 1,
          size: '1024x1024',
          response_format: 'b64_json',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`DALL-E API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
       
      if (data.data && data.data.length > 0 && data.data[0].b64_json) {
        console.log('📥 Received base64 response from DALL-E');
        
        
        const decodedResult: DecodedImageResult = extractImageFromDalleResponse(data);
        
        if (!decodedResult.success || !decodedResult.buffer) {
          return {
            imageUrl: null,
            success: false,
            error: decodedResult.error || 'Failed to decode base64 image'
          };
        }

    
        const fileName = generateUniqueFileName('dalle', decodedResult.format || 'png');
        
        // Upload to Supabase
        const uploadResult = await uploadImageToSupabase(
          decodedResult.buffer,
          fileName,
          decodedResult.mimeType || 'image/png'
        );

        if (!uploadResult.success) {
          return {
            imageUrl: null,
            success: false,
            error: uploadResult.error || 'Failed to upload image to Supabase'
          };
        }

        console.log('✅ Image uploaded to Supabase successfully');
        return {
          imageUrl: uploadResult.url!,
          success: true
        };
      } 
      // Fallback: Handle URL response (if response_format is not supported)
      else if (data.data && data.data.length > 0 && data.data[0].url) {
        console.log('📥 Received URL response from DALL-E (fallback)');
        return {
          imageUrl: data.data[0].url,
          success: true
        };
      } else {
        return {
          imageUrl: null,
          success: false,
          error: 'No image data returned from DALL-E API'
        };
      }
    } catch (error: any) {
      console.error('❌ DALL-E generation error:', error);
      return {
        imageUrl: null,
        success: false,
        error: error.message || 'DALL-E generation failed'
      };
    }
  }

  getName(): string {
    return 'dalle';
  }
}
