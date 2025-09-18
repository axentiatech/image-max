'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Download, Heart, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageGenerationProps {
  images: Array<{
    id: string;
    provider: string;
    imageUrl: string | null;
    status: 'completed' | 'failed' | 'pending';
    error?: string;
  }>;
  batchId: string;
}

export default function ImageGeneration({ images, batchId }: ImageGenerationProps) {
  const [imageStates, setImageStates] = useState(images);

  useEffect(() => {
    setImageStates(images);
  }, [images]);

  const handleDownload = (imageUrl: string, provider: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `generated-${provider}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRetry = async (imageId: string) => {
    // This would trigger a retry API call in a real implementation
    console.log('Retry generation for image:', imageId);
  };

  const handleFavorite = async (imageId: string) => {
    // This would add to favorites in a real implementation
    console.log('Add to favorites:', imageId);
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Generated {imageStates.filter(img => img.status === 'completed').length} of {imageStates.length} images
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {imageStates.map((image) => (
          <div key={image.id} className="relative group">
            <div className="aspect-square bg-muted rounded-lg overflow-hidden border border-border">
              {image.status === 'completed' && image.imageUrl ? (
                <div className="relative w-full h-full">
                  <Image
                    src={image.imageUrl}
                    alt={`Generated image by ${image.provider}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  
                  {/* Overlay with actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleDownload(image.imageUrl!, image.provider)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleFavorite(image.id)}
                    >
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : image.status === 'pending' ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Generating...</p>
                    <p className="text-xs text-muted-foreground capitalize">{image.provider}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-8 h-8 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-destructive text-sm">!</span>
                    </div>
                    <p className="text-sm text-destructive">Failed</p>
                    <p className="text-xs text-muted-foreground capitalize">{image.provider}</p>
                    {image.error && (
                      <p className="text-xs text-muted-foreground mt-1">{image.error}</p>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={() => handleRetry(image.id)}
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Retry
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Provider label */}
            <div className="absolute top-2 left-2">
              <span className="bg-background/80 backdrop-blur-sm text-xs px-2 py-1 rounded-md border border-border capitalize">
                {image.provider}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
