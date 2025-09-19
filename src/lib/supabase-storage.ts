import { createClient } from '@supabase/supabase-js';

 
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const bucketName = process.env.SUPABASE_BUCKET_NAME || 'imagemax';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables: SUPABASE_URL and SUPABASE_SERVICE_KEY are required');
}


const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  fileName?: string;
}

 
export async function uploadImageToSupabase(
  imageBuffer: Buffer,
  fileName: string,
  contentType: string = 'image/png'
): Promise<UploadResult> {
  try {
    console.log(`📝 Uploading ${fileName} to Supabase Storage...`);
    console.log(`📊 Image size: ${imageBuffer.length} bytes`);

   
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, imageBuffer, {
        contentType,
        cacheControl: '3600',
        upsert: false,  
      });

    if (error) {
      console.error('❌ Upload failed:', error.message);
      
      
      if (error.message.includes('Bucket not found')) {
        console.error(`💡 Tip: Make sure you have created a bucket named "${bucketName}" in your Supabase Storage dashboard`);
      }
      
      return {
        success: false,
        error: error.message,
      };
    }

    console.log('✅ Upload successful!');
    console.log(`📋 Upload details: ${data.path}`);

     
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    console.log(`🔗 Public URL: ${publicUrlData.publicUrl}`);

    return {
      success: true,
      url: publicUrlData.publicUrl,
      fileName: data.path,
    };
  } catch (error: any) {
    console.error('❌ Unexpected upload error:', error);
    return {
      success: false,
      error: error.message || 'Upload failed',
    };
  }
}

 
export function generateUniqueFileName(prefix: string = 'image', extension: string = 'png'): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const randomId = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${randomId}.${extension}`;
}
 