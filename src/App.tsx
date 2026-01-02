import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useProfile } from './hooks/useProfile';
import { supabase } from './lib/supabase';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { Layout } from './components/layout/Layout';

// Placeholder page components (will be created next)
const LoginPage = React.lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const AuthCallbackPage = React.lazy(() => import('./pages/AuthCallbackPage').then(m => ({ default: m.AuthCallbackPage })));
const RepoSelectionPage = React.lazy(() => import('./pages/RepoSelectionPage').then(m => ({ default: m.RepoSelectionPage })));
const FormPage = React.lazy(() => import('./pages/FormPage').then(m => ({ default: m.FormPage })));
const GeneratePage = React.lazy(() => import('./pages/GeneratePage').then(m => ({ default: m.GeneratePage })));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const TermsOfService = React.lazy(() => import('./pages/TermsOfService').then(m => ({ default: m.TermsOfService })));

const ProtectedRoute: React.FC<{ children: React.ReactNode; requireProfile?: boolean }> = ({ 
  children, 
  requireProfile = false 
}) => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Redirect to login if user is logged out
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Show loading while checking profile (if required)
  if (requireProfile && profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Redirect to login if profile is required but doesn't exist
  if (requireProfile && !profile) {
    // Sign out and redirect to login
    supabase.auth.signOut().then(() => {
      window.location.href = '/';
    });
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Redirecting to login...</p>
      </div>
    );
  }

  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <BrowserRouter>
      <React.Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route
            path="/repos"
            element={
              <ProtectedRoute>
                <RepoSelectionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/form"
            element={
              <ProtectedRoute requireProfile={false}>
                <FormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/generate"
            element={
              <ProtectedRoute requireProfile={true}>
                <GeneratePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute requireProfile={true}>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </React.Suspense>
    </BrowserRouter>
  );
}

export default App;

