import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGitHub = async () => {
    // Uses dynamic window.location.origin - works in both dev and production
    // IMPORTANT: Make sure to configure callback URLs in:
    // 1. Supabase Dashboard → Authentication → Providers → GitHub → Redirect URL
    // 2. GitHub OAuth App → Authorization callback URL
    // Both should include: http://localhost:3000/auth/callback (dev) and https://your-app.vercel.app/auth/callback (production)
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
      // Sign out from Supabase with both scopes to fully clear session
      const { error: localError } = await supabase.auth.signOut({ scope: 'local' });
      if (localError) {
        console.error('Error signing out locally:', localError);
      }

      const { error: globalError } = await supabase.auth.signOut({ scope: 'global' });
      if (globalError) {
        console.error('Error signing out globally:', globalError);
      }

      // Clear all browser storage
      localStorage.clear();
      sessionStorage.clear();

      // Clear all cookies
      document.cookie.split(";").forEach((c) => {
        const eqPos = c.indexOf("=");
        const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      });

      // Redirect to the app's login page
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