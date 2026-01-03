import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let lastUserId: string | null = null;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setUser(session?.user ?? null);
        lastUserId = session?.user?.id ?? null;
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUserId = session?.user?.id ?? null;

      // Don't process auth state changes if we're on the callback page
      if (window.location.pathname === '/auth/callback') {
        return;
      }

      // Only update state if the user ID actually changed
      // This prevents unnecessary re-renders when focus returns but the user is the same
      if (lastUserId !== currentUserId) {
        lastUserId = currentUserId;
        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } else if (mounted) {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGitHub = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'read:user user:email repo',
      },
    });

    if (error) {
      console.error('Error signing in with GitHub:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error: localError } = await supabase.auth.signOut({ scope: 'local' });
      if (localError) {
        console.error('Error signing out locally:', localError);
      }

      const { error: globalError } = await supabase.auth.signOut({ scope: 'global' });
      if (globalError) {
        console.error('Error signing out globally:', globalError);
      }

      localStorage.clear();
      sessionStorage.clear();

      document.cookie.split(";").forEach((c) => {
        const eqPos = c.indexOf("=");
        const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      });

      window.location.href = '/';
    } catch (err) {
      console.error('Logout error:', err);
      throw err;
    }
  };

  return {
    user,
    loading,
    signInWithGitHub,
    signOut,
  };
};