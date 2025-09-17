'use client';

import { useState, useRef, useEffect } from 'react';
import ChatInput from '@/components/ChatInput';
import MessageBubble from '@/components/MessageBubble';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, isLoading: authLoading, isModalOpen, openAuthModal, closeAuthModal } = useAuth();

   useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

     
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `I received your message: "${content}". This is a simulated AI response. In a real implementation, you would integrate with an AI service like OpenAI, Anthropic, or your own AI model.`,
        role: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
   
      <header className="border-b border-border p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">AI Chat Assistant</h1>
          {isAuthenticated && user && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {user.image && (
                  <img 
                    src={user.image} 
                    alt={user.name || 'User'} 
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="text-sm text-foreground">{user.name || user.email}</span>
              </div>
            </div>
          )}
        </div>
      </header>

 
      <main className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-2">
                  What's on the agenda today?
                </h2>
                <p className="text-muted-foreground">
                  Start a conversation with your AI assistant
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
      </main>

    
      <ChatInput 
        onSendMessage={handleSendMessage} 
        isLoading={isLoading}
        onAuthRequired={!isAuthenticated ? openAuthModal : undefined}
      />

      
      <AuthModal isOpen={isModalOpen} onClose={closeAuthModal} />
    </div>
  );
}
