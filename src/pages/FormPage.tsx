import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ContactForm } from '../components/form/ContactForm';
import { EducationForm, type EducationFormHandle } from '../components/form/EducationForm';
import { WorkExperienceForm } from '../components/form/WorkExperienceForm';
import { SignatureUpload } from '../components/form/SignatureUpload';
import { Button } from '../components/common/Button';
import { useProfile } from '../hooks/useProfile';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import type { UserProfile } from '../lib/types';

interface FieldErrors {
  name?: string;
  email?: string;
  phone?: string;
  education?: string;
}

export const FormPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, educationEntries, loading, reloadProfile, updateProfile, signatureUrl } = useProfile();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isValidating, setIsValidating] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const linkedinInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);
  const educationSectionRef = useRef<HTMLDivElement>(null);
  const educationFormRef = useRef<EducationFormHandle>(null);

  // Validation Strategy:
  // - When LOADING: Validate against DB (profile state) - form is syncing from database
  // - When SUBMITTING: Validate against refs - check what user actually typed in inputs

  // Scroll to and focus the first error field
  const scrollToFirstError = (errors: FieldErrors) => {
    // Find the first error field
    if (errors.name && nameInputRef.current) {
      nameInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => nameInputRef.current?.focus(), 100);
      return;
    }
    if (errors.email && emailInputRef.current) {
      emailInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => emailInputRef.current?.focus(), 100);
      return;
    }
    if (errors.phone && phoneInputRef.current) {
      phoneInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => phoneInputRef.current?.focus(), 100);
      return;
    }
    if (errors.education && educationSectionRef.current) {
      educationSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
  };

  const handleContinue = async () => {
    // Clear previous errors
    setFieldErrors({});
    setIsValidating(true);

    try {
      // When submitting: Validate against the refs (what user actually typed)
      // This ensures we check current input values, not database values
      const errors: FieldErrors = {};

      // Validate required contact fields from current input values (refs)
      // This checks what the user actually typed, not what's in state or DB
      const nameValue = nameInputRef.current?.value?.trim() || '';
      const emailValue = emailInputRef.current?.value?.trim() || '';
      const phoneValue = phoneInputRef.current?.value?.trim() || '';
      const locationValue = locationInputRef.current?.value?.trim() || '';
      const linkedinValue = linkedinInputRef.current?.value?.trim() || '';
      const portfolioValue = portfolioInputRef.current?.value?.trim() || '';

      if (!nameValue) {
        errors.name = 'Please enter your name.';
      }

      if (!emailValue) {
        errors.email = 'Please enter your email address.';
      }

      if (!phoneValue) {
        errors.phone = 'Please enter your phone number.';
      }

      // Save all contact fields using ref values before continuing
      // Only include fields with values to avoid overwriting existing data with empty strings
      if (profile?.user_id) {
        const updates: Partial<UserProfile> = {
          name: nameValue,
          email: emailValue,
          phone: phoneValue, // Required field - always include
        };
        
        // Only include optional fields if they have values
        if (locationValue) updates.location = locationValue;
        if (linkedinValue) updates.linkedin_url = linkedinValue;
        if (portfolioValue) updates.portfolio_url = portfolioValue;
        if (signatureUrl) updates.signature_url = signatureUrl;
        
        await updateProfile(updates);
      }

      // Validate education entries from current form state (what user typed)
      // This checks the actual values in the form, not what's in the database
      let currentEducationEntries: typeof educationEntries = [];
      if (educationFormRef.current) {
        currentEducationEntries = educationFormRef.current.getCurrentEntries();
      }

      // Check if user has at least one valid education entry (with required fields)
      // Validate against current form state (what user actually typed)
      const validEducationEntries = currentEducationEntries?.filter(
        entry => entry.university?.trim() && entry.degree?.trim() && entry.graduation_date && entry.major?.trim()
      ) || [];
      
      if (validEducationEntries.length === 0) {
        errors.education = 'Please add at least one education entry with all required fields (School Name, Degree Type, Major, Graduation Date).';
      }

      // Save education entries using current form values before continuing
      if (educationFormRef.current && validEducationEntries.length > 0) {
        await educationFormRef.current.saveCurrentEntries();
      }

      // If there are errors, set them and scroll to first error
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setIsValidating(false);
        // Use setTimeout to ensure state updates and DOM is ready
        setTimeout(() => scrollToFirstError(errors), 0);
        return;
      }

      // All validations passed, profile is already saved (via optimistic updates on blur)
      // Just navigate to generate page
      navigate('/generate');
    } finally {
      setIsValidating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Profile</h1>
        <p className="text-gray-600">Fill out your information to generate personalized resumes and cover letters.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-8">
        <ContactForm 
          nameError={fieldErrors.name}
          emailError={fieldErrors.email}
          phoneError={fieldErrors.phone}
          nameInputRef={nameInputRef}
          emailInputRef={emailInputRef}
          phoneInputRef={phoneInputRef}
          locationInputRef={locationInputRef}
          linkedinInputRef={linkedinInputRef}
          portfolioInputRef={portfolioInputRef}
        />

        <div className="border-t border-gray-200 pt-8" ref={educationSectionRef}>
          {fieldErrors.education && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">{fieldErrors.education}</p>
            </div>
          )}
          <EducationForm ref={educationFormRef} />
        </div>

        <div className="border-t border-gray-200 pt-8">
          <WorkExperienceForm />
        </div>

        <div className="border-t border-gray-200 pt-8">
          <SignatureUpload />
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleContinue}
          variant="primary"
          className="px-8 py-3"
          disabled={isValidating}
        >
          Submit
        </Button>
      </div>
    </div>
  );
};