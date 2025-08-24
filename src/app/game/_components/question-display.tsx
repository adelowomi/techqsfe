'use client';

import type { Card } from '~/lib/types';

interface QuestionDisplayProps {
  card: Card;
  onStartAttempt: () => void;
}

export function QuestionDisplay({ card, onStartAttempt }: QuestionDisplayProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'HARD':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Question Drawn</h2>
        
        {/* Card Info */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(card.difficulty)}`}>
            {card.difficulty}
          </span>
          <span className="text-gray-600">
            Card #{card.cardNumber}
          </span>
          {card.usageCount > 0 && (
            <span className="text-gray-500 text-sm">
              Used {card.usageCount} time{card.usageCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Question Display */}
      <div className="bg-gray-50 rounded-lg p-8 mb-8">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Question:</h3>
          <p className="text-2xl text-gray-900 leading-relaxed font-medium">
            {card.question}
          </p>
        </div>
      </div>

      {/* Action Button */}
      <div className="text-center">
        <button
          onClick={onStartAttempt}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
        >
          Start Contestant Attempt
        </button>
      </div>

      {/* Card Metadata */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">Created:</span>{' '}
            {new Date(card.createdAt).toLocaleDateString()}
          </div>
          <div>
            <span className="font-medium">Last Used:</span>{' '}
            {card.lastUsed 
              ? new Date(card.lastUsed).toLocaleDateString()
              : 'Never'
            }
          </div>
        </div>
      </div>
    </div>
  );
}