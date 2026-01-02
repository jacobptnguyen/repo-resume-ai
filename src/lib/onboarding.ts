import { supabase } from './supabase';

export interface OnboardingStatus {
  isComplete: boolean;
  hasRepositories: boolean;
  hasCompleteProfile: boolean;
  hasEducation: boolean;
  nextStep?: 'repos' | 'form' | 'generate';
}

/**
 * Checks if a user has completed onboarding
 * Onboarding is complete when:
 * 1. User has selected repositories (github_installations exists with repos)
 * 2. User has complete profile (name, email, phone filled)
 * 3. User has at least one education entry with all required fields
 */
export async function checkOnboardingStatus(userId: string): Promise<OnboardingStatus> {
  try {
    // Check repositories
    const { data: installation, error: installationError } = await supabase
      .from('github_installations')
      .select('access_type, selected_repo_ids')
      .eq('user_id', userId)
      .maybeSingle();

    const hasRepositories = !installationError && installation && (
      installation.access_type === 'all' ||
      (installation.selected_repo_ids && Array.isArray(installation.selected_repo_ids) && installation.selected_repo_ids.length > 0)
    );

    // Check profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('name, email, phone')
      .eq('user_id', userId)
      .maybeSingle();

    const hasCompleteProfile = !profileError && profile && 
      profile.name?.trim() && 
      profile.email?.trim() && 
      profile.phone?.trim();

    // Check education entries
    const { data: educationEntries, error: educationError } = await supabase
      .from('education_entries')
      .select('university, degree, major, graduation_date')
      .eq('user_id', userId);

    const hasEducation = !educationError && 
      educationEntries && 
      educationEntries.length > 0 &&
      educationEntries.some(entry => 
        entry.university?.trim() && 
        entry.degree?.trim() && 
        entry.major?.trim() && 
        entry.graduation_date
      );

    const isComplete = hasRepositories && hasCompleteProfile && hasEducation;

    // Determine next step
    let nextStep: 'repos' | 'form' | 'generate' | undefined;
    if (isComplete) {
      nextStep = 'generate';
    } else if (!hasRepositories) {
      nextStep = 'repos';
    } else if (!hasCompleteProfile || !hasEducation) {
      nextStep = 'form';
    }

    return {
      isComplete,
      hasRepositories: !!hasRepositories,
      hasCompleteProfile: !!hasCompleteProfile,
      hasEducation: !!hasEducation,
      nextStep,
    };
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    // On error, assume onboarding is not complete and start from repos
    return {
      isComplete: false,
      hasRepositories: false,
      hasCompleteProfile: false,
      hasEducation: false,
      nextStep: 'repos',
    };
  }
}

