import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { GenerationRequest, GenerationResponse, SelectedProject, ExtractedSkills } from '../lib/types';
import type { UserProfile, EducationEntry, WorkExperienceEntry } from '../lib/types';

interface GenerationCache {
  selectedProjects: SelectedProject[];
  extractedSkills: ExtractedSkills;
  coverLetterContent: string; // HTML string
  jobDescription: string;
}

export const useGeneration = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumeHtml, setResumeHtml] = useState<string | null>(null);
  const [coverLetterHtml, setCoverLetterHtml] = useState<string | null>(null);
  const [selectedProjects, setSelectedProjects] = useState<SelectedProject[]>([]);
  const [extractedSkills, setExtractedSkills] = useState<ExtractedSkills>({
    languages: [],
    frameworks: [],
    tools: [],
  });
  const [_cache, setCache] = useState<GenerationCache | null>(null);

  const generate = useCallback(async (
    request: Omit<GenerationRequest, 'user_id'>,
    _profile: UserProfile,
    _educationEntries: EducationEntry[],
    _workExperienceEntries: WorkExperienceEntry[],
    _signatureUrl?: string | null
  ) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Check if session exists and get token
      let { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        const errorMsg = 'No auth token available. Please log in again.';
        setError(errorMsg);
        setLoading(false);
        return;
      }

      // Step 1: Decode JWT payload to check expiry (don't verify signature, just decode)
      let tokenExpired = false;
      let tokenAge = null;
      try {
        const tokenParts = session.access_token.split('.');
        if (tokenParts.length === 3) {
          // Decode base64 payload (second part)
          const payload = JSON.parse(atob(tokenParts[1].replace(/-/g, '+').replace(/_/g, '/')));
          const now = Math.floor(Date.now() / 1000);
          const exp = payload.exp;
          const iat = payload.iat;
          
          tokenExpired = exp ? now >= exp : false;
        }
      } catch (decodeError) {
        // Continue anyway - let API handle validation
      }

      // Step 4: Refresh token if expired or close to expiring (< 5 minutes)
      if (tokenExpired) {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshData.session) {
          console.error('Failed to refresh session:', refreshError);
          setError('Your session has expired. Please log in again.');
          setLoading(false);
          return;
        }
        
        session = refreshData.session;
      } else if (session.expires_at) {
        // Check if token expires in less than 5 minutes
        const expiresIn = session.expires_at - Math.floor(Date.now() / 1000);
        if (expiresIn < 300 && expiresIn > 0) { // Less than 5 minutes but not expired
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (!refreshError && refreshData.session) {
            session = refreshData.session;
          }
        }
      }

      // Call Vercel serverless function
      // In development, use localhost:3000 (Vercel dev server)
      // In production, use relative URL (same domain)
      const apiUrl = window.location.hostname === 'localhost'
        ? 'http://localhost:3000/api/generate-resume-and-cover-letter'
        : '/api/generate-resume-and-cover-letter';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          user_id: user.id,
          job_description: request.job_description,
          num_projects: request.num_projects,
          font_size: request.font_size,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      // Check if data contains an error (API returns errors in data.error even on 200 status)
      if (data && typeof data === 'object' && 'error' in data) {
        const errorData = data as any;
        let errorMessage = errorData.error || 'Failed to generate resume';
        
        // Check for specific error types and make them user-friendly
        if (errorMessage.includes('rate limit') || errorMessage.includes('429') || errorMessage.includes('used all')) {
          // Keep the rate limit message as-is (it's already user-friendly from API)
        } else if (errorMessage.includes('GitHub') || errorMessage.includes('repository') || errorMessage.includes('No GitHub repositories')) {
          errorMessage = 'Unable to access your GitHub repositories. Please check your repository access settings in Settings.';
        } else if (errorMessage.includes('OpenAI') || errorMessage.includes('API key') || errorMessage.includes('API error')) {
          errorMessage = 'AI generation service is temporarily unavailable. Please try again in a moment.';
        } else if (errorMessage.includes('Missing required fields')) {
          errorMessage = 'Please fill in all required fields.';
        }

        throw new Error(errorMessage);
      }

      const generationResponse = data as GenerationResponse;

      if (!generationResponse || !generationResponse.resume_html || !generationResponse.cover_letter_html) {
        throw new Error('Invalid response from generation service. Please try again.');
      }

      setSelectedProjects(generationResponse.selected_projects);
      setExtractedSkills(generationResponse.extracted_skills);
      setResumeHtml(generationResponse.resume_html);
      setCoverLetterHtml(generationResponse.cover_letter_html);

      // Cache the generation data for regeneration
      setCache({
        selectedProjects: generationResponse.selected_projects,
        extractedSkills: generationResponse.extracted_skills,
        coverLetterContent: generationResponse.cover_letter_html, // HTML string
        jobDescription: request.job_description,
      });
    } catch (err) {
      console.error('Error generating resume:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate resume. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);


  const clearGeneration = useCallback(() => {
    setResumeHtml(null);
    setCoverLetterHtml(null);
    setSelectedProjects([]);
    setExtractedSkills({ languages: [], frameworks: [], tools: [] });
    setCache(null);
    setError(null);
  }, []);

  return {
    resumeHtml,
    coverLetterHtml,
    selectedProjects,
    extractedSkills,
    loading,
    error,
    generate,
    clearGeneration,
  };
};

