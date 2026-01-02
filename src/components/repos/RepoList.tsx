import React from 'react';
import type { Repository } from '../../lib/types';

interface RepoListProps {
  repositories: Repository[];
  selectedRepoIds: string[];
  onToggleRepo: (repoId: string) => void;
}

export const RepoList: React.FC<RepoListProps> = ({
  repositories,
  selectedRepoIds,
  onToggleRepo,
}) => {
  return (
    <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-md p-4">
      {repositories.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No repositories available</p>
      ) : (
        repositories.map((repo) => (
          <label
            key={repo.id}
            className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-md cursor-pointer border border-transparent hover:border-gray-200"
          >
            <input
              type="checkbox"
              checked={selectedRepoIds.includes(repo.id)}
              onChange={() => onToggleRepo(repo.id)}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">{repo.name}</span>
                {repo.private && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                    Private
                  </span>
                )}
              </div>
              {repo.description && (
                <p className="text-sm text-gray-500 mt-1">{repo.description}</p>
              )}
            </div>
          </label>
        ))
      )}
    </div>
  );
};

