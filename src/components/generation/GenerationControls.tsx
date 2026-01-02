import React from 'react';
import { Button } from '../common/Button';

interface GenerationControlsProps {
  numProjects: number;
  onNumProjectsChange: (value: number) => void;
  onGenerate: () => void;
  loading: boolean;
  disabled: boolean;
  error?: string;
  maxProjects?: number;
}

export const GenerationControls: React.FC<GenerationControlsProps> = ({
  numProjects,
  onNumProjectsChange,
  onGenerate,
  loading,
  disabled,
  error,
  maxProjects = 5,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Number of Projects
        </label>
        <select
          value={numProjects}
          onChange={(e) => onNumProjectsChange(parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {Array.from({ length: maxProjects }, (_, i) => i + 1).map((num) => (
            <option key={num} value={num}>
              {num}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <Button
        onClick={onGenerate}
        disabled={disabled || loading}
        variant="primary"
        className="w-full py-3"
      >
        {loading ? 'Generating...' : 'Generate Resume'}
      </Button>
    </div>
  );
};

