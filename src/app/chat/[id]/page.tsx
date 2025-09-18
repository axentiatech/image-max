'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ChatInput from '@/components/ChatInput';
import MessageBubble from '@/components/MessageBubble';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/hooks/useAuth';
import { AppSidebar } from '@/components/appsidebar';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { generateUUID } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  imageGeneration?: {
    batchId: string;
    images: Array<{
      id: string;
      provider: string;
      imageUrl: string | null;
      status: 'completed' | 'failed' | 'pending';
      error?: string;
    }>;
  };
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatTitle, setChatTitle] = useState<string>('New Chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isModalOpen, openAuthModal, closeAuthModal } = useAuth();
  
  const chatId = params.id as string;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load chat data when component mounts
  useEffect(() => {
    const loadChat = async () => {
      if (!isAuthenticated || !chatId) return;

      try {
        const response = await fetch(`/api/chat?id=${chatId}`);
        if (response.ok) {
          const data = await response.json();
          const chat = data.chat;
          
          if (chat) {
            setChatTitle(chat.title);
            
            // Convert generation batches to messages
            const chatMessages: Message[] = [];
            chat.generations.forEach((batch: any) => {
              // Add user message
              chatMessages.push({
                id: `user-${batch.id}`,
                content: batch.prompt,
                role: 'user',
                timestamp: new Date(batch.createdAt),
              });
              
              // Add assistant message with image generation
              chatMessages.push({
                id: `assistant-${batch.id}`,
                content: `I've generated images for your prompt: "${batch.prompt}". Here are the results from different AI providers:`,
                role: 'assistant',
                timestamp: new Date(batch.createdAt),
                imageGeneration: {
                  batchId: batch.id,
                  images: batch.generations.map((gen: any) => ({
                    id: gen.id,
                    provider: gen.model,
                    imageUrl: gen.imageUrl,
                    status: gen.status,
                    error: gen.errorMsg,
                  })),
                },
              });
            });
            
            setMessages(chatMessages);
          }
        }
      } catch (error) {
        console.error('Error loading chat:', error);
      }
    };

    loadChat();
  }, [isAuthenticated, chatId]);

  const handleSendMessage = async (content: string) => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Call the image generation API - this will create the chat if it doesn't exist
      const response = await fetch('/api/generate-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: content,
          chatId: chatId,
          userId: user?.id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `I've generated images for your prompt: "${content}". Here are the results from different AI providers:`,
          role: 'assistant',
          timestamp: new Date(),
          imageGeneration: {
            batchId: result.batchId,
            images: result.images,
          },
        };
        
        setMessages(prev => [...prev, aiMessage]);
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `Sorry, I encountered an error while generating images: ${result.error || 'Unknown error'}`,
          role: 'assistant',
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error generating images:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error while generating images. Please try again.',
        role: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
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
            <h1 className="text-lg font-semibold">{chatTitle}</h1>
          </div>
        </header>
        
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="mb-8">
                    <h2 className="text-2xl font-semibold text-foreground mb-2">
                      Start a new conversation
                    </h2>
                    <p className="text-muted-foreground">
                      Send a message to begin generating images
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>

          <ChatInput 
            onSendMessage={handleSendMessage} 
            isLoading={isLoading}
            onAuthRequired={!isAuthenticated ? openAuthModal : undefined}
          />
        </div>
      </SidebarInset>

      <AuthModal isOpen={isModalOpen} onClose={closeAuthModal} />
    </div>
  );
}
