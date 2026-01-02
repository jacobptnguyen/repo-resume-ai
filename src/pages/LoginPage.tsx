import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Github } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Button } from '../components/common/Button';

export const LoginPage: React.FC = () => {
  const { user, loading, signInWithGitHub } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect if we're sure the user is authenticated
    // Wait for loading to complete AND verify user exists
    if (!loading && user) {
      // Double-check the session is valid before redirecting
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user && session.user.id === user.id) {
          // Always redirect to repos page first
          navigate('/repos', { replace: true });
        }
      });
    }
  }, [user, loading, navigate]);

  const handleSignIn = async () => {
    try {
      await signInWithGitHub();
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">RepoResume.ai</h1>
          <p className="text-gray-600 text-lg">
            AI-powered resumes from your GitHub projects
          </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={handleSignIn}
            variant="primary"
            className="w-full flex items-center justify-center space-x-2 py-3"
          >
            <Github className="w-5 h-5" />
            <span>Sign in with GitHub</span>
          </Button>

          <p className="text-sm text-gray-500 text-center mt-6">
            By signing in, you agree to analyze your GitHub repositories to generate personalized resumes and cover letters.
          </p>

          <div className="flex justify-center space-x-4 mt-4 text-xs text-gray-500">
            <Link to="/privacy" className="hover:text-gray-700 transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-gray-700 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

