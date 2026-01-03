import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { RepoSelector } from '../components/repos/RepoSelector';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import type { Repository, GitHubInstallation } from '../lib/types';

export const RepoSelectionPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [accessType, setAccessType] = useState<'all' | 'selected'>('selected');
  const [selectedRepoIds, setSelectedRepoIds] = useState<string[]>([]);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [repoError, setRepoError] = useState<string | null>(null);

  // Auto-redirect to sign-in when GitHub token error occurs
  useEffect(() => {
    if (repoError && (
      repoError.includes('GitHub token not available') ||
      repoError.includes('Please sign in again with GitHub') ||
      repoError.includes('Please sign in again') ||
      repoError.includes('GitHub access denied')
    )) {
      // Sign out to clear the session and redirect to login
      const redirectToSignIn = async () => {
        try {
          await signOut();
        } catch (error) {
          console.error('Error signing out:', error);
        } finally {
          navigate('/', { replace: true });
        }
      };
      
      // Small delay to show the error message briefly before redirecting
      const timeoutId = setTimeout(() => {
        redirectToSignIn();
      }, 1500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [repoError, navigate, signOut]);

  // Fetch repositories from GitHub API
  useEffect(() => {
    const fetchRepositories = async () => {
      if (!user) {
        setLoadingRepos(false);
        return;
      }

      try {
        // Get the GitHub token from Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        const githubToken = session?.provider_token;

        if (!githubToken) {
          setRepoError('GitHub token not available. Please sign in again with GitHub.');
          setLoadingRepos(false);
          return;
        }

        // Fetch repositories from GitHub API
        const response = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
          headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error('GitHub access denied. Please sign in again and grant repository access.');
          } else if (response.status === 429) {
            throw new Error('GitHub API rate limit exceeded. Please try again in a few minutes.');
          } else {
            throw new Error(`Failed to load repositories (${response.status}). Please try again.`);
          }
        }

        const repos = await response.json();

        if (!repos || repos.length === 0) {
          setRepoError('No repositories found in your GitHub account.');
          setRepositories([]);
          setLoadingRepos(false);
          return;
        }

        // Transform GitHub API response to match your Repository type
        const transformedRepos: Repository[] = repos.map((repo: any) => ({
          id: repo.id.toString(),
          name: repo.name,
          description: repo.description || '',
          full_name: repo.full_name,
          html_url: repo.html_url,
          private: repo.private,
        }));

        setRepositories(transformedRepos);
        setRepoError(null);
      } catch (error) {
        console.error('Error fetching repositories:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load repositories. Please try refreshing the page.';
        setRepoError(errorMessage);
        setRepositories([]);
      } finally {
        setLoadingRepos(false);
      }
    };

    fetchRepositories();
  }, [user]);

  // Load existing installation if it exists
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
          setAccessType(data.access_type);
          setSelectedRepoIds(data.selected_repo_ids || []);
        }
      } catch (error) {
        console.error('Error loading installation:', error);
      }
    };

    loadInstallation();
  }, [user]);

  const handleToggleRepo = (repoId: string) => {
    setSelectedRepoIds((prev) =>
      prev.includes(repoId)
        ? prev.filter((id) => id !== repoId)
        : [...prev, repoId]
    );
  };

  const handleContinue = async () => {
    if (!user) return;

    const reposSelected = accessType === 'all' || selectedRepoIds.length > 0;
    if (!reposSelected) {
      setRepoError('Please select at least one repository or grant access to all repositories.');
      return;
    }

    setLoading(true);
    setRepoError(null);

    try {
      // Get the GitHub token from session
      const { data: { session } } = await supabase.auth.getSession();
      const githubToken = session?.provider_token;

      if (!githubToken) {
        setRepoError('GitHub token not available. Please sign in again.');
        setLoading(false);
        return;
      }

      const installationData: Partial<GitHubInstallation> = {
        user_id: user.id,
        installation_id: user.id, // Using user.id as identifier
        access_type: accessType,
        selected_repo_ids: accessType === 'selected' ? selectedRepoIds : undefined,
        access_token: githubToken, // Real GitHub token
        token_expires_at: null, // GitHub tokens from OAuth don't expire by default
      };

      // Upsert the installation
      const { error } = await supabase
        .from('github_installations')
        .upsert(installationData, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      navigate('/form');
    } catch (error) {
      console.error('Error saving repository selection:', error);
      setRepoError('Failed to save repository selection. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingRepos) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
          <span className="ml-4">Loading repositories...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Select Repositories</h1>
        <p className="text-gray-600">
          Choose which repositories RepoResume.ai can analyze to generate your resume.
        </p>
      </div>

      {repoError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-600">{repoError}</p>
        </div>
      )}

      {repositories.length === 0 && !loadingRepos && !repoError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-4">
          <p className="text-yellow-800">
            No repositories found. Make sure you have repositories in your GitHub account.
          </p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <RepoSelector
          accessType={accessType}
          onAccessTypeChange={setAccessType}
          repositories={repositories}
          selectedRepoIds={selectedRepoIds}
          onToggleRepo={handleToggleRepo}
        />
      </div>

      <div className="mt-4 flex justify-end">
        <Button
          onClick={handleContinue}
          disabled={loading || (accessType === 'selected' && selectedRepoIds.length === 0)}
          variant="primary"
          className="px-8 py-3"
        >
          {loading ? (
            <span className="flex items-center space-x-2">
              <LoadingSpinner size="sm" />
              <span>Saving...</span>
            </span>
          ) : (
            'Continue'
          )}
        </Button>
      </div>
    </div>
  );
};

