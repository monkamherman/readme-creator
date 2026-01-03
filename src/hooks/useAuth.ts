import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuthService, type AuthUser } from '@/lib/services/auth.service';
import type { Session } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        
        if (session?.user) {
          // Defer Supabase calls with setTimeout
          setTimeout(async () => {
            const authUser = await AuthService.getCurrentUser();
            setUser(authUser);
            setLoading(false);
          }, 0);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const authUser = await AuthService.getCurrentUser();
        setUser(authUser);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, password: string, name?: string) => {
    return AuthService.signUp(email, password, name);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    return AuthService.signIn(email, password);
  }, []);

  const signOut = useCallback(async () => {
    await AuthService.signOut();
    setUser(null);
    setSession(null);
  }, []);

  const hasRole = useCallback(async (role: 'admin' | 'moderator' | 'user' | 'rider' | 'store') => {
    return AuthService.hasRole(role);
  }, []);

  return {
    user,
    session,
    loading,
    isAuthenticated: !!session,
    signUp,
    signIn,
    signOut,
    hasRole,
  };
}
