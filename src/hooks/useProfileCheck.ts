import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export const useProfileCheck = () => {
  const { user, loading: authLoading } = useAuth();
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkProfile = async () => {
      if (authLoading) {
        return;
      }

      if (!user) {
        setHasProfile(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 = no rows returned, which is expected if profile doesn't exist
          console.error('Error checking profile:', error);
          setHasProfile(false);
        } else {
          setHasProfile(!!data);
        }
      } catch (err) {
        console.error('Error checking profile:', err);
        setHasProfile(false);
      } finally {
        setLoading(false);
      }
    };

    checkProfile();
  }, [user, authLoading]);

  return { hasProfile, loading: loading || authLoading };
};

