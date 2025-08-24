'use client';

import { useState } from 'react';

interface ContestantFormProps {
  onSubmit: (contestantName: string) => void;
  isLoading?: boolean;
}

export function ContestantForm({ onSubmit, isLoading = false }: ContestantFormProps) {
  const [contestantName, setContestantName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate contestant name
    const trimmedName = contestantName.trim();
    if (!trimmedName) {
      setError('Contestant name is required');
      return;
    }
    
    if (trimmedName.length > 100) {
      setError('Contestant name must be less than 100 characters');
      return;
    }

    setError('');
    onSubmit(trimmedName);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContestantName(e.target.value);
    if (error) {
      setError('');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Contestant Information</h2>
        <p className="text-gray-600">Enter the contestant's name to begin the attempt</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="contestantName" className="block text-sm font-medium text-gray-700 mb-2">
            Contestant Name
          </label>
          <input
            type="text"
            id="contestantName"
            value={contestantName}
            onChange={handleNameChange}
            placeholder="Enter contestant name..."
            disabled={isLoading}
            className={`
              w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              ${error ? 'border-red-300' : 'border-gray-300'}
              ${isLoading ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            `}
            maxLength={100}
          />
          {error && (
            <p className="mt-1 text-sm text-red-600">{error}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            {contestantName.length}/100 characters
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isLoading || !contestantName.trim()}
            className={`
              flex-1 py-2 px-4 rounded-md font-medium transition-colors duration-200
              ${!isLoading && contestantName.trim()
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Processing...
              </div>
            ) : (
              'Continue'
            )}
          </button>
        </div>
      </form>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              Make sure the contestant name is spelled correctly. This will be used for tracking their performance and cannot be changed after submission.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}