import React, { useState, useEffect } from 'react';
import { useProfile } from '../../hooks/useProfile';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../common/Input';

interface ContactFormProps {
  nameError?: string;
  emailError?: string;
  phoneError?: string;
  nameInputRef?: React.RefObject<HTMLInputElement>;
  emailInputRef?: React.RefObject<HTMLInputElement>;
  phoneInputRef?: React.RefObject<HTMLInputElement>;
  locationInputRef?: React.RefObject<HTMLInputElement>;
  linkedinInputRef?: React.RefObject<HTMLInputElement>;
  portfolioInputRef?: React.RefObject<HTMLInputElement>;
}

// Local state shape matching the profile fields we're editing
interface ContactFields {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin_url: string;
  portfolio_url: string;
}

export const ContactForm: React.FC<ContactFormProps> = ({
  nameError,
  emailError,
  phoneError,
  nameInputRef,
  emailInputRef,
  phoneInputRef,
  locationInputRef,
  linkedinInputRef,
  portfolioInputRef,
}) => {
  const { profile, updateProfile, loading } = useProfile();
  const { user } = useAuth();

  // Local state for all contact fields (same pattern as EducationForm)
  const [fields, setFields] = useState<ContactFields>({
    name: '',
    email: '',
    phone: '',
    location: '',
    linkedin_url: '',
    portfolio_url: '',
  });

  // Sync local state when profile loads from database (same as EducationForm)
  useEffect(() => {
    if (profile) {
      setFields({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        location: profile.location || '',
        linkedin_url: profile.linkedin_url || '',
        portfolio_url: profile.portfolio_url || '',
      });
    }
  }, [profile]);

  // Update local state only (no database calls while typing) - same as EducationForm
  const handleFieldChange = (field: keyof ContactFields, value: string) => {
    setFields(prev => ({ ...prev, [field]: value }));
  };

  // Save to database when user leaves a field (on blur) - same as EducationForm
  const handleFieldBlur = () => {
    updateProfile({
      name: fields.name,
      email: fields.email,
      phone: fields.phone,
      location: fields.location || undefined,
      linkedin_url: fields.linkedin_url || undefined,
      portfolio_url: fields.portfolio_url || undefined,
    });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const githubUrl = user?.user_metadata?.user_name 
    ? `https://github.com/${user.user_metadata.user_name}` 
    : profile?.github_url || '';

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">Contact Information</h2>

      <Input
        ref={nameInputRef}
        label="Full Name"
        type="text"
        required
        value={fields.name}
        onChange={(e) => handleFieldChange('name', e.target.value)}
        onBlur={handleFieldBlur}
        error={nameError}
      />

      <Input
        ref={emailInputRef}
        label="Email"
        type="email"
        required
        value={fields.email}
        onChange={(e) => handleFieldChange('email', e.target.value)}
        onBlur={handleFieldBlur}
        error={emailError}
      />

      <Input
        ref={phoneInputRef}
        label="Phone"
        type="tel"
        required
        value={fields.phone}
        onChange={(e) => handleFieldChange('phone', e.target.value)}
        onBlur={handleFieldBlur}
        error={phoneError}
      />

      <Input
        ref={locationInputRef}
        label="Location (City, State)"
        type="text"
        placeholder="e.g., San Francisco, CA"
        value={fields.location}
        onChange={(e) => handleFieldChange('location', e.target.value)}
        onBlur={handleFieldBlur}
      />

      <Input
        ref={linkedinInputRef}
        label="LinkedIn"
        type="url"
        placeholder="https://linkedin.com/in/yourprofile"
        value={fields.linkedin_url}
        onChange={(e) => handleFieldChange('linkedin_url', e.target.value)}
        onBlur={handleFieldBlur}
      />

      <Input
        label="GitHub"
        type="url"
        required
        readOnly
        value={githubUrl}
        className="bg-gray-100 cursor-not-allowed"
      />

      <Input
        ref={portfolioInputRef}
        label="Portfolio"
        type="url"
        placeholder="https://yourportfolio.com"
        value={fields.portfolio_url}
        onChange={(e) => handleFieldChange('portfolio_url', e.target.value)}
        onBlur={handleFieldBlur}
      />
    </div>
  );
};