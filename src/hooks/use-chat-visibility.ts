'use client';

import { useState, useEffect } from 'react';

type VisibilityType = 'private' | 'public';

export function useChatVisibility({ 
  chatId, 
  initialVisibilityType 
}: { 
  chatId: string; 
  initialVisibilityType?: VisibilityType;
}) {
  const [visibilityType, setVisibilityType] = useState<VisibilityType>(
    initialVisibilityType || 'private'
  );

  useEffect(() => {
    // In a real implementation, you would save this to the database
    // For now, we'll just store it in localStorage
    const savedVisibility = localStorage.getItem(`chat-visibility-${chatId}`);
    if (savedVisibility) {
      setVisibilityType(savedVisibility as VisibilityType);
    }
  }, [chatId]);

  const updateVisibility = (newVisibility: VisibilityType) => {
    setVisibilityType(newVisibility);
    localStorage.setItem(`chat-visibility-${chatId}`, newVisibility);
    
    // In a real implementation, you would make an API call here
    // to update the chat visibility in the database
  };

  return {
    visibilityType,
    setVisibilityType: updateVisibility,
  };
}

