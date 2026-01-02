import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGeneration } from '../hooks/useGeneration';
import { useProfile } from '../hooks/useProfile';
import { JobDescriptionInput } from '../components/generation/JobDescriptionInput';
import { GenerationControls } from '../components/generation/GenerationControls';
import { PreviewPanel } from '../components/generation/PreviewPanel';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export const GeneratePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, educationEntries, workExperienceEntries, signatureUrl, loading: profileLoading } = useProfile();
  const {
    resumeHtml,
    coverLetterHtml,
    loading: generationLoading,
    error: generationError,
    generate,
    clearGeneration,
  } = useGeneration();

  const [jobDescription, setJobDescription] = useState('');
  const [numProjects, setNumProjects] = useState(3);
  const [jobDescriptionError, setJobDescriptionError] = useState<string | null>(null);

  const [hasRepositories, setHasRepositories] = useState<boolean | null>(null);
  const [checkingRepos, setCheckingRepos] = useState(true);
  const [maxProjects, setMaxProjects] = useState<number>(5);

  useEffect(() => {
    // Check if user has selected repositories
    const checkRepositories = async () => {
      if (!user) {
        setCheckingRepos(false);
        return;
      }

      try {
        const { data: installation, error } = await supabase
          .from('github_installations')
          .select('access_type, selected_repo_ids')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Error checking repositories:', error);
          setHasRepositories(false);
        } else if (installation) {
          const hasRepos = installation.access_type === 'all' || 
            (installation.selected_repo_ids && installation.selected_repo_ids.length > 0);
          setHasRepositories(hasRepos);
          
          // Set max projects based on selected repos
          if (installation.access_type === 'all') {
            // Fetch repos to get the actual count
            try {
              const { data: { session } } = await supabase.auth.getSession();
              const githubToken = session?.provider_token;
              
              if (githubToken) {
                const response = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
                  headers: {
                    'Authorization': `Bearer ${githubToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                  },
                });
                
                if (response.ok) {
                  const repos = await response.json();
                  const repoCount = repos?.length || 100; // Default to 100 if API returns unexpected format
                  setMaxProjects(repoCount);
                  // Also cap numProjects if it exceeds the max
                  setNumProjects((prev) => prev > repoCount ? repoCount : prev);
                } else {
                  // Fallback to 100 if API call fails
                  setMaxProjects(100);
                }
              } else {
                // Fallback to 100 if no token
                setMaxProjects(100);
              }
            } catch (error) {
              console.error('Error fetching repo count:', error);
              // Fallback to 100 on error
              setMaxProjects(100);
            }
          } else if (installation.selected_repo_ids && installation.selected_repo_ids.length > 0) {
            // Use the number of selected repos as max
            const repoCount = installation.selected_repo_ids.length;
            setMaxProjects(repoCount);
            // Also cap numProjects if it exceeds the max
            setNumProjects((prev) => prev > repoCount ? repoCount : prev);
          }
          
          // Redirect to repos page if no repositories are selected
          if (!hasRepos) {
            navigate('/repos', { replace: true });
            return;
          }
        } else {
          setHasRepositories(false);
          // Redirect to repos page if no installation found
          navigate('/repos', { replace: true });
          return;
        }
      } catch (error) {
        console.error('Error checking repositories:', error);
        setHasRepositories(false);
        // Redirect to repos page on error
        navigate('/repos', { replace: true });
        return;
      } finally {
        setCheckingRepos(false);
      }
    };

    checkRepositories();
  }, [user, navigate]);

  const handleGenerate = async () => {
    if (!profile) {
      setJobDescriptionError('Please complete your profile first.');
      setTimeout(() => navigate('/form'), 2000);
      return;
    }

    if (!hasRepositories) {
      setJobDescriptionError('Please select repositories first. Redirecting to repository selection...');
      setTimeout(() => navigate('/repos'), 2000);
      return;
    }

    if (!jobDescription.trim()) {
      setJobDescriptionError('Please enter a job description');
      return;
    }

    // Validate required profile fields
    if (!profile.name || !profile.email || !profile.phone) {
      setJobDescriptionError('Please complete all required profile fields (name, email, phone).');
      setTimeout(() => navigate('/form'), 2000);
      return;
    }

    // Check if user has at least one education entry
    if (!educationEntries || educationEntries.length === 0) {
      setJobDescriptionError('Please add at least one education entry.');
      setTimeout(() => navigate('/form'), 2000);
      return;
    }

    setJobDescriptionError(null);

    if (!profile.user_id) {
      setJobDescriptionError('Profile not loaded. Please refresh the page.');
      return;
    }

    await generate(
      {
        job_description: jobDescription,
        num_projects: numProjects,
        font_size: 11,
      },
      profile,
      educationEntries,
      workExperienceEntries,
      signatureUrl
    );
  };

  const handleNewGeneration = () => {
    clearGeneration();
    setJobDescription('');
    setNumProjects(3);
    setJobDescriptionError(null);
  };

  if (profileLoading || checkingRepos) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
        <span className="ml-4">Loading...</span>
      </div>
    );
  }

  const hasGeneratedContent = resumeHtml && coverLetterHtml;
  const canGenerate = jobDescription.trim().length > 0 && !generationLoading && hasRepositories === true;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Generate Resume & Cover Letter</h1>
        <p className="text-gray-600">
          Describe the job you're applying for and let AI select your most relevant projects to create tailored application materials.
        </p>
      </div>

      {!hasGeneratedContent && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          <JobDescriptionInput
            value={jobDescription}
            onChange={(value) => {
              setJobDescription(value);
              setJobDescriptionError(null);
            }}
            error={jobDescriptionError || undefined}
          />

          <GenerationControls
            numProjects={numProjects}
            onNumProjectsChange={setNumProjects}
            onGenerate={handleGenerate}
            loading={generationLoading}
            disabled={!canGenerate}
            error={generationError || undefined}
            maxProjects={maxProjects}
          />

          {generationLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-600">Generating your resume and cover letter... This may take 20-30 seconds.</p>
            </div>
          )}
        </div>
      )}

      {hasGeneratedContent && (
        <PreviewPanel
          resumeHtml={resumeHtml}
          coverLetterHtml={coverLetterHtml}
          onEditForm={() => navigate('/form')}
          onEditRepos={() => navigate('/repos')}
          onNewGeneration={handleNewGeneration}
        />
      )}

      {generationError && !hasGeneratedContent && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{generationError}</p>
        </div>
      )}
    </div>
  );
};

