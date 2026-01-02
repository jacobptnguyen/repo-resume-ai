import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { supabase } from '../lib/supabase';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import type { GitHubInstallation } from '../lib/types';
import { Trash2, Edit } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const [installation, setInstallation] = useState<GitHubInstallation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInstallation = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('github_installations')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (data && !error) {
          setInstallation(data);
        }
      } catch (error) {
        console.error('Error loading installation:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInstallation();
  }, [user]);

  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    setDeleting(true);
    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session. Please sign in again.');
      }

      // Call the Vercel function to delete the account
      // The function handles: signature deletion, data deletion via RPC, and auth user deletion
      // In development, use localhost:3000 (Vercel dev server)
      // In production, use relative URL (same domain)
      const apiUrl = window.location.hostname === 'localhost'
        ? 'http://localhost:3000/api/delete-account'
        : '/api/delete-account';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          user_id: user.id,
        }),
      });

      // Check if response is OK before trying to parse JSON
      if (!response.ok) {
        // Read response as text first (can only read body once)
        const textResponse = await response.text();
        let errorMessage = 'Failed to delete account. Please try again or contact support.';
        
        try {
          // Try to parse as JSON
          const errorData = JSON.parse(textResponse);
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          // If JSON parsing fails, response might be HTML (404 page)
          console.error('Delete account API error (non-JSON response):', response.status, response.statusText);
          
          if (response.status === 404) {
            errorMessage = 'Delete account endpoint not found. Please contact support.';
          } else {
            errorMessage = `Server error (${response.status}): ${response.statusText}`;
          }
        }
        throw new Error(errorMessage);
      }

      // Parse JSON only if response is OK
      const data = await response.json();

      // Account deleted successfully - clear local storage and redirect
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    } catch (error) {
      console.error('Error deleting account:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete account. Please try again or contact support.');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (profileLoading || loading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const resetDate = profile.generation_reset_date
    ? formatDate(profile.generation_reset_date)
    : 'Not set';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account and repository access.</p>
      </div>

      {/* Generation Usage */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Generation Usage</h2>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Generations Used:</span>
            <span className="font-semibold text-gray-900">
              {profile.generations_used} of {profile.generation_limit}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Resets On:</span>
            <span className="text-gray-900">{resetDate}</span>
          </div>
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${(profile.generations_used / profile.generation_limit) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Profile Management */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Manage your profile information, education, work experience, and signature.
            </p>
            <Button
              onClick={() => navigate('/form')}
              variant="secondary"
              className="flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Profile</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Repository Access */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">GitHub Repository Access</h2>
        {installation ? (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Access Type:</span>
              <span className="font-semibold text-gray-900 capitalize">{installation.access_type}</span>
            </div>
            {installation.access_type === 'selected' && installation.selected_repo_ids && (
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Selected Repositories:</span>
                <span className="text-gray-900">{installation.selected_repo_ids.length}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-600">No repository access configured.</p>
        )}
        <div className="mt-4">
          <Button
            onClick={() => navigate('/repos')}
            variant="secondary"
          >
            Modify Repository Access
          </Button>
        </div>
      </div>

      {/* Account Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Account</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Email: {profile.email || user?.email}
            </p>
            <p className="text-sm text-gray-600">
              GitHub: {profile.github_url || 'Not set'}
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={async () => {
                try {
                  await signOut();
                  // signOut() handles redirect via window.location.href
                } catch (error) {
                  console.error('Error signing out:', error);
                }
              }}
              variant="secondary"
            >
              Sign Out
            </Button>
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              variant="danger"
              className="flex items-center space-x-2"
              disabled={deleting}
            >
              <Trash2 className="w-4 h-4" />
              <span>{deleting ? 'Deleting...' : 'Delete Account'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Delete Account</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete your account? This action cannot be undone. 
              All your data including profile, education, work experience, and generated resumes will be permanently deleted.
            </p>
            <div className="flex space-x-3 justify-end">
              <Button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleting(false);
                }}
                variant="secondary"
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteAccount}
                variant="danger"
                disabled={deleting}
                className="flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deleting ? 'Deleting...' : 'Yes, Delete Account'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

