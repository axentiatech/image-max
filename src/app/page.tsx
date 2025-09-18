'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/hooks/useAuth';
import { AppSidebar } from '@/components/appsidebar';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { generateUUID } from '@/lib/utils';
import ImageGeneration from '@/components/ImageGeneration';

interface GenerationState {
  batchId: string | null;
  prompt: string;
  images: Array<{
    id: string;
    provider: string;
    imageUrl: string | null;
    status: 'completed' | 'failed' | 'pending';
    error?: string;
  }>;
  isGenerating: boolean;
}

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [currentGeneration, setCurrentGeneration] = useState<GenerationState>({
    batchId: null,
    prompt: '',
    images: [],
    isGenerating: false,
  });
  const router = useRouter();
  const { user, isAuthenticated, isModalOpen, openAuthModal, closeAuthModal } = useAuth();

  const handleGenerateImages = async () => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    if (!prompt.trim()) {
      return;
    }

 
    const chatId = generateUUID();

    setCurrentGeneration({
      batchId: null,
      prompt: prompt,
      images: [],
      isGenerating: true,
    });

    try {
         const response = await fetch('/api/generate-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          chatId: chatId,
          userId: user?.id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setCurrentGeneration({
          batchId: result.batchId,
          prompt: prompt,
          images: result.images,
          isGenerating: false,
        });
        
       
      } else {
        setCurrentGeneration(prev => ({
          ...prev,
          isGenerating: false,
        })); 
        console.error('Generation failed:', result.error);
      }
    } catch (error) {
      console.error('Error generating images:', error);
      setCurrentGeneration(prev => ({
        ...prev,
        isGenerating: false,
      }));
    }
  };

  return (
    <div className="flex h-screen w-full">
      <AppSidebar user={user} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="h-4 w-px bg-sidebar-border" />
            <h1 className="text-lg font-semibold">ImageMax</h1>
          </div>
        </header>
        
        <div className="flex flex-1 flex-col gap-6 p-6 pt-0 max-w-6xl mx-auto w-full">
          {/* Main Input Section */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-medium mb-2">Describe Your Image</h2>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., A photorealistic image of an astronaut riding a horse on Mars"
                className="w-full h-32 p-4 border border-input rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                disabled={currentGeneration.isGenerating}
              />
            </div>
            
            <Button 
              onClick={handleGenerateImages}
              disabled={!prompt.trim() || currentGeneration.isGenerating}
              className="w-full h-12 text-base font-medium bg-green-600 hover:bg-green-700 text-white"
            >
              {currentGeneration.isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  Generate Across All Providers 🎨
                </>
              )}
            </Button>
          </div>

    
          {(currentGeneration.prompt || currentGeneration.isGenerating) && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Current Generation</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Prompt:</span>
                    <span className="text-sm text-foreground">&quot;{currentGeneration.prompt}&quot;</span>
                  </div>
                  
                  {currentGeneration.isGenerating ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Status:</span>
                      <span className="text-sm text-blue-600">Generating... (0/3 complete)</span>
                      <div className="flex-1 bg-muted rounded-full h-2 max-w-xs">
                        <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '30%' }}></div>
                      </div>
                    </div>
                  ) : currentGeneration.images.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Status:</span>
                      <span className="text-sm text-green-600">
                        Generating... ({currentGeneration.images.filter(img => img.status === 'completed').length}/3 complete)
                      </span>
                      <div className="flex-1 bg-muted rounded-full h-2 max-w-xs">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all duration-500" 
                          style={{ 
                            width: `${(currentGeneration.images.filter(img => img.status === 'completed').length / 3) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

      
              {currentGeneration.isGenerating ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['Midjourney', 'DALL-E', 'Stability'].map((provider, index) => (
                    <div key={provider} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{provider}</span>
                        <div className="w-4 h-4 border border-green-500 rounded-full bg-green-500"></div>
                      </div>
                      <div className="aspect-square bg-muted rounded-lg border border-border flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                          <p className="text-sm text-muted-foreground">Generating...</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : currentGeneration.images.length > 0 && currentGeneration.batchId && (
                <ImageGeneration 
                  images={currentGeneration.images} 
                  batchId={currentGeneration.batchId}
                />
              )}
            </div>
          )}

          
          {!currentGeneration.prompt && !currentGeneration.isGenerating && (
            <div className="flex flex-col items-center justify-center flex-1 text-center py-12">
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-2">
                  What are you planning to generate today?
                </h2>
                <p className="text-muted-foreground">
                  Bring your vision to life with multiple AI providers
                </p>
              </div>
            </div>
          )}
        </div>
      </SidebarInset>

      <AuthModal isOpen={isModalOpen} onClose={closeAuthModal} />
    </div>
  );
}
