import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for auth state to be set and validate it
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Step 2: Validate the session by calling getUser()
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.error('OAuth callback - session invalid:', userError);
          // Session is invalid, clear it and redirect to login
          await supabase.auth.signOut({ scope: 'local' });
          navigate('/');
          return;
        }
        
        // Auto-create user_profiles record immediately after login
        // This is CRITICAL - the app depends on this profile existing
        const githubUsername = user.user_metadata?.user_name || '';
        const githubUrl = githubUsername ? `https://github.com/${githubUsername}` : 'https://github.com';
        const userName = user.user_metadata?.full_name || user.user_metadata?.name || '';
        const userEmail = user.email || '';

        // Ensure all required fields have valid values (NOT NULL constraints)
        // Start with empty strings instead of placeholders so users MUST fill them in
        const profileData = {
          user_id: user.id,
          email: userEmail, // Use actual email from OAuth
          name: userName, // Use actual name from OAuth
          github_url: githubUrl,
          phone: '', // Empty - user MUST fill this in form
          linkedin_url: null,
          signature_url: null,
          location: null,
          portfolio_url: null,
          generations_used: 0,
          generation_limit: 10,
          generation_reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        };

        // Retry logic: try up to 3 times with exponential backoff
        let profileCreated = false;
        let lastError = null;
        
        for (let attempt = 1; attempt <= 3; attempt++) {
          const { data: upsertedProfile, error: profileError } = await supabase
            .from('user_profiles')
            .upsert(profileData, {
              onConflict: 'user_id',
            })
            .select()
            .single();

          if (profileError) {
            console.error(`Profile creation attempt ${attempt} failed:`, profileError);
            lastError = profileError;
            
            // Wait before retrying (exponential backoff: 500ms, 1000ms, 2000ms)
            if (attempt < 3) {
              await new Promise(resolve => setTimeout(resolve, 500 * attempt));
              continue;
            }
          } else if (upsertedProfile) {
            // Verify the profile was actually created by querying it
            const { data: verifiedProfile, error: verifyError } = await supabase
              .from('user_profiles')
              .select('id, user_id')
              .eq('user_id', user.id)
              .single();

            if (verifyError || !verifiedProfile) {
              console.error('Profile created but verification failed:', verifyError);
              lastError = verifyError || new Error('Profile verification failed');
              if (attempt < 3) {
                await new Promise(resolve => setTimeout(resolve, 500 * attempt));
                continue;
              }
            } else {
              profileCreated = true;
              break;
            }
          }
        }

        if (!profileCreated) {
          const errorMessage = lastError?.message || 'Failed to create user profile after multiple attempts';
          console.error('Profile creation failed:', errorMessage);
          setError(`Failed to create your profile: ${errorMessage}. Please try logging in again or contact support.`);
          // Don't redirect - show error to user
          return;
        }

        // Always redirect to repos page first
        navigate('/repos', { replace: true });
      } else {
        navigate('/');
      }
    };

    checkAuth();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile Creation Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => {
              supabase.auth.signOut().then(() => {
                navigate('/');
              });
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="lg" />
      </div>
    </div>
  );
};