'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Plus } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  onAuthRequired?: () => void;
}

export default function ChatInput({ onSendMessage, isLoading = false, onAuthRequired }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

 
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
       
      if (onAuthRequired) {
        onAuthRequired();
        return;
      }
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative flex items-end gap-3 bg-muted rounded-2xl p-3 border border-border focus-within:border-ring transition-colors">
      
            <button
              type="button"
              className="flex-shrink-0 p-2 hover:bg-accent rounded-lg transition-colors"
              aria-label="Attach file"
            >
              <Plus className="w-5 h-5 text-muted-foreground" />
            </button>

    
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              className="flex-1 min-h-[24px] max-h-[200px] resize-none bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
              rows={1}
              disabled={isLoading}
            />

            
            <div className="flex items-center gap-2">
           
              <button
                type="button"
                onClick={toggleRecording}
                className={`p-2 rounded-lg transition-colors ${
                  isRecording 
                    ? 'bg-destructive text-destructive-foreground' 
                    : 'hover:bg-accent text-muted-foreground'
                }`}
                aria-label={isRecording ? 'Stop recording' : 'Start recording'}
              >
                {isRecording ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>

              {/* Send button */}
              <button
                type="submit"
                disabled={!message.trim() || isLoading}
                className={`p-2 rounded-lg transition-colors ${
                  message.trim() && !isLoading
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
                aria-label="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </form>

 
        {isLoading && (
          <div className="flex items-center justify-center mt-3">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
