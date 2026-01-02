import React from 'react';
import { Textarea } from '../common/Textarea';

interface JobDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export const JobDescriptionInput: React.FC<JobDescriptionInputProps> = ({
  value,
  onChange,
  error,
}) => {
  return (
    <div className="w-full">
      <Textarea
        label="Job Description"
        placeholder="Describe the job you're applying for..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        rows={10}
        showCharCount={false}
        className={error ? 'border-red-500' : ''}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

