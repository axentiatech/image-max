/**
 * Image processing utilities for base64 handling
 */

export interface Base64ImageData {
  data: string; // Base64 encoded image data
  format: string; // Image format (png, jpeg, etc.)
  mimeType: string; // MIME type
}

export interface DecodedImageResult {
  success: boolean;
  buffer?: Buffer;
  mimeType?: string;
  format?: string;
  error?: string;
}

/**
 * Decode base64 image data to Buffer
 */
export function decodeBase64Image(base64Data: string): DecodedImageResult {
  try {
    // Remove data URL prefix if present (e.g., "data:image/png;base64,")
    const base64String = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
    
    // Validate base64 string
    if (!isValidBase64(base64String)) {
      return {
        success: false,
        error: 'Invalid base64 string',
      };
    }

    // Decode base64 to buffer
    const buffer = Buffer.from(base64String, 'base64');
    
    // Detect image format from buffer
    const format = detectImageFormat(buffer);
    const mimeType = getMimeTypeFromFormat(format);

    return {
      success: true,
      buffer,
      mimeType,
      format,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to decode base64 image',
    };
  }
}

/**
 * Validate if string is valid base64
 */
function isValidBase64(str: string): boolean {
  try {
    // Check if string contains only valid base64 characters
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(str)) {
      return false;
    }
    
    // Try to decode and re-encode to validate
    const decoded = Buffer.from(str, 'base64');
    const reencoded = decoded.toString('base64');
    
    // Remove padding for comparison
    const normalizedStr = str.replace(/=+$/, '');
    const normalizedReencoded = reencoded.replace(/=+$/, '');
    
    return normalizedStr === normalizedReencoded;
  } catch {
    return false;
  }
}

/**
 * Detect image format from buffer header
 */
function detectImageFormat(buffer: Buffer): string {
  // Check file signatures (magic numbers)
  if (buffer.length < 4) {
    return 'unknown';
  }

  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return 'png';
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'jpeg';
  }

  // GIF: 47 49 46 38
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return 'gif';
  }

  // WebP: 52 49 46 46 ... 57 45 42 50
  if (buffer.length >= 12 && 
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
    return 'webp';
  }

  return 'unknown';
}

/**
 * Get MIME type from image format
 */
function getMimeTypeFromFormat(format: string): string {
  const mimeTypes: Record<string, string> = {
    'png': 'image/png',
    'jpeg': 'image/jpeg',
    'jpg': 'image/jpeg',
    'gif': 'image/gif',
    'webp': 'image/webp',
  };

  return mimeTypes[format.toLowerCase()] || 'image/png';
}

/**
 * Extract image data from DALL-E API response
 * Handles different response formats that might contain base64 data
 */
export function extractImageFromDalleResponse(responseData: any): DecodedImageResult {
  try {
    // Handle different possible response structures
    let base64Data: string | null = null;

    // Case 1: Direct base64 data in response
    if (typeof responseData === 'string') {
      base64Data = responseData;
    }
    // Case 2: Base64 data in data field
    else if (responseData.data && typeof responseData.data === 'string') {
      base64Data = responseData.data;
    }
    // Case 3: Base64 data in nested structure
    else if (responseData.data && responseData.data[0] && responseData.data[0].b64_json) {
      base64Data = responseData.data[0].b64_json;
    }
    // Case 4: Base64 data in image field
    else if (responseData.image && typeof responseData.image === 'string') {
      base64Data = responseData.image;
    }

    if (!base64Data) {
      return {
        success: false,
        error: 'No base64 image data found in response',
      };
    }

    return decodeBase64Image(base64Data);
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to extract image from DALL-E response',
    };
  }
}

/**
 * Validate image buffer size
 */
export function validateImageSize(buffer: Buffer, maxSizeMB: number = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return buffer.length <= maxSizeBytes;
}
