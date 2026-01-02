import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { UserProfile, EducationEntry, WorkExperienceEntry } from '../lib/types';

export const useProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [educationEntries, setEducationEntries] = useState<EducationEntry[]>([]);
  const [workExperienceEntries, setWorkExperienceEntries] = useState<WorkExperienceEntry[]>([]);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);

  // Use ref to track current profile for use in updateProfile
  const profileRef = useRef<UserProfile | null>(null);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  // Load profile data
  const loadProfile = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profileData) {
        setProfile(null);
        setEducationEntries([]);
        setWorkExperienceEntries([]);
        setSignatureUrl(null);
        setLoading(false);
        return;
      }

      setProfile(profileData);

      const { data: educationData } = await supabase
        .from('education_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('display_order', { ascending: true });
      setEducationEntries(educationData || []);

      const { data: workData } = await supabase
        .from('work_experience_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('display_order', { ascending: true });
      setWorkExperienceEntries(workData || []);

      if (profileData.signature_url) {
        setSignatureUrl(profileData.signature_url);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }
    
    if (user) {
    loadProfile();
    } else {
      setProfile(null);
      setEducationEntries([]);
      setWorkExperienceEntries([]);
      setSignatureUrl(null);
      setLoading(false);
    }
  }, [user, authLoading, loadProfile]);


  // Update profile function - updates state immediately (optimistic update), then saves to database
  // This matches the pattern used in updateEducation for consistent behavior
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user) {
      return;
    }

    // Get current profile state to merge with updates
    const currentProfile = profileRef.current;
    
    // Merge updates with current profile
    const updatedProfile = currentProfile ? { ...currentProfile, ...updates } : (updates as UserProfile);
    
    // Update state IMMEDIATELY (optimistic update - same pattern as updateEducation)
    // This makes the form feel instant, just like the education section
    // IMPORTANT: Always do optimistic update, even for new profiles
    const githubUsername = user?.user_metadata?.user_name || '';
    const githubUrl = `https://github.com/${githubUsername}`;
    
    const optimisticProfile = currentProfile ? {
      ...currentProfile,
      ...updates,
      updated_at: new Date().toISOString(),
    } as UserProfile : {
      id: 'temp-id',
      user_id: user.id,
      name: updates.name || '',
      email: updates.email || '',
      phone: updates.phone || null,
      github_url: updates.github_url || githubUrl,
      location: updates.location || null,
      linkedin_url: updates.linkedin_url || null,
      portfolio_url: updates.portfolio_url || null,
      signature_url: updates.signature_url || null,
      generations_used: updates.generations_used ?? 0,
      generation_limit: updates.generation_limit ?? 10,
      generation_reset_date: updates.generation_reset_date || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as UserProfile;
    
    setProfile(optimisticProfile);

    // Convert empty strings to null for database
    // Only include fields that are explicitly in the updates to avoid overwriting with null
    const profileData: any = {
      user_id: user.id,
      name: updatedProfile.name || '',
      email: updatedProfile.email || '',
      phone: updatedProfile.phone || null,
      github_url: updatedProfile.github_url || githubUrl,
      generations_used: updatedProfile.generations_used ?? 0,
      generation_limit: updatedProfile.generation_limit ?? 10,
      updated_at: new Date().toISOString(),
    };
    
    // Only include optional fields if they were explicitly provided in updates
    if ('location' in updates) profileData.location = updatedProfile.location || null;
    if ('linkedin_url' in updates) profileData.linkedin_url = updatedProfile.linkedin_url || null;
    if ('portfolio_url' in updates) profileData.portfolio_url = updatedProfile.portfolio_url || null;
    if ('signature_url' in updates) profileData.signature_url = updatedProfile.signature_url || null;

    // Save to database asynchronously (happens in background)
    try {
      const { data, error: updateError } = await supabase
        .from('user_profiles')
        .upsert(profileData, {
          onConflict: 'user_id',
        })
        .select()
        .single();

      if (updateError) {
        console.error('Failed to update profile:', updateError);
        setError(updateError.message);
        // On error, reload profile from database to revert optimistic update
        if (user) {
          loadProfile();
        }
        return;
      }

      if (data) {
        // Update state with database response to ensure consistency (IDs, timestamps, etc.)
        setProfile(data);
      } else {
        console.error('Database upsert returned no data');
        setError('Failed to update profile: no data returned');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      // On error, reload profile from database to revert optimistic update
      if (user) {
        loadProfile();
      }
    }
  }, [user, loadProfile]);

  const updateEducation = useCallback(async (entries: EducationEntry[]) => {
    // Update state immediately
    setEducationEntries(entries);

    // Save to database asynchronously
    if (!user) return;

    try {
      const { error: deleteError } = await supabase
        .from('education_entries')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) {
        throw deleteError;
      }

      if (entries.length > 0) {
        // Don't include IDs when inserting - let database generate new ones
        // This prevents duplicate key errors from concurrent operations
        const entriesToInsert = entries.map((entry, index) => {
          const { id, created_at, ...entryWithoutIdAndTimestamp } = entry;
          return {
            ...entryWithoutIdAndTimestamp,
            user_id: user.id,
            display_order: index
          };
        });
        
        const { data, error: insertError } = await supabase
          .from('education_entries')
          .insert(entriesToInsert)
          .select();

        if (insertError) {
          throw insertError;
        }

        // Update state with the new IDs from database
        if (data) {
          setEducationEntries(data);
        }
      }
    } catch (err) {
      console.error('Error updating education:', err);
      setError(err instanceof Error ? err.message : 'Failed to update education');
    }
  }, [user]);

  const updateWorkExperience = useCallback(async (entries: WorkExperienceEntry[]) => {
    // Update state immediately
    setWorkExperienceEntries(entries);

    // Save to database asynchronously
    if (!user) return;

    try {
      const { error: deleteError } = await supabase
        .from('work_experience_entries')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      if (entries.length > 0) {
        // Don't include IDs when inserting - let database generate new ones
        // This prevents duplicate key errors from concurrent operations
        const entriesToInsert = entries.map((entry, index) => {
          const { id, created_at, ...entryWithoutIdAndTimestamp } = entry;
          return {
            ...entryWithoutIdAndTimestamp,
            user_id: user.id,
            display_order: index
          };
        });
        
        const { data, error: insertError } = await supabase
          .from('work_experience_entries')
          .insert(entriesToInsert)
          .select();

        if (insertError) throw insertError;

        // Update state with the new IDs from database
        if (data) {
          setWorkExperienceEntries(data);
        }
      }
    } catch (err) {
      console.error('Error updating work experience:', err);
      setError(err instanceof Error ? err.message : 'Failed to update work experience');
    }
  }, [user]);

  const updateSignatureUrl = useCallback((url: string | null) => {
    setSignatureUrl(url);
    // Convert null to undefined to match UserProfile type
    updateProfile({ signature_url: url || undefined });
  }, [updateProfile]);

  return {
    profile,
    educationEntries,
    workExperienceEntries,
    signatureUrl,
    loading,
    error,
    updateProfile,
    updateEducation,
    updateWorkExperience,
    updateSignatureUrl,
    reloadProfile: loadProfile,
  };
};