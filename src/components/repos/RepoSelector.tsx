import React from 'react';
import { RepoList } from './RepoList';
import type { Repository } from '../../lib/types';

interface RepoSelectorProps {
  accessType: 'all' | 'selected';
  onAccessTypeChange: (type: 'all' | 'selected') => void;
  repositories: Repository[];
  selectedRepoIds: string[];
  onToggleRepo: (repoId: string) => void;
}

export const RepoSelector: React.FC<RepoSelectorProps> = ({
  accessType,
  onAccessTypeChange,
  repositories,
  selectedRepoIds,
  onToggleRepo,
}) => {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <label className="flex items-start space-x-3 p-4 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50">
          <input
            type="radio"
            name="accessType"
            value="all"
            checked={accessType === 'all'}
            onChange={() => onAccessTypeChange('all')}
            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
          />
          <div>
            <div className="text-sm font-medium text-gray-900">Grant access to all repositories</div>
            <div className="text-sm text-gray-500 mt-1">
              Allow RepoResume.ai to access all of your repositories (public and private)
            </div>
          </div>
        </label>

        <label className="flex items-start space-x-3 p-4 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50">
          <input
            type="radio"
            name="accessType"
            value="selected"
            checked={accessType === 'selected'}
            onChange={() => onAccessTypeChange('selected')}
            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
          />
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-900">Select specific repositories</div>
            <div className="text-sm text-gray-500 mt-1">
              Choose which repositories RepoResume.ai can access
            </div>
          </div>
        </label>
      </div>

      {accessType === 'selected' && (
        <div className="mt-4">
          <RepoList
            repositories={repositories}
            selectedRepoIds={selectedRepoIds}
            onToggleRepo={onToggleRepo}
          />
        </div>
      )}
    </div>
  );
};

