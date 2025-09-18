'use client';

import { useState, useEffect } from 'react';
import { authClient } from '@/lib/auth-client';

export function useAuth() {
  const [session, setSession] = useState<{ user: any } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
  
    const getSession = async () => {
      try {
        const { data } = await authClient.getSession();
        setSession(data);
      } catch (error) {
        console.error('Error getting session:', error);
        setSession(null);
      } finally {
        setIsLoading(false);
      }
    };

    getSession();

 
    const unsubscribe = authClient.useSession.subscribe((newSession) => {
      setSession(newSession.data);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const openAuthModal = () => setIsModalOpen(true);
  const closeAuthModal = () => setIsModalOpen(false);

  const signOut = async () => {
    try {
      await authClient.signOut();
      setSession(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return {
    user: session?.user || null,
    isAuthenticated: !!session?.user,
    isLoading,
    isModalOpen,
    openAuthModal,
    closeAuthModal,
    signOut,
  };
}