export interface ImageResult {
  imageUrl: string | null;
  success: boolean;
  error?: string;
}

export interface ImageProvider {
  generateImage(prompt: string): Promise<ImageResult>;
  getName(): string;
}
