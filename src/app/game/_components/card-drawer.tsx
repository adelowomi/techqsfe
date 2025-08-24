'use client';

import { useState, useEffect } from 'react';
import { api } from '~/trpc/react';
import type { Card, Difficulty, DeckStatus } from '~/lib/types';
import { 
  LoadingSpinner, 
  ErrorMessage, 
  EmptyDeckMessage, 
  DeckExhaustedMessage,
  NetworkErrorMessage 
} from '~/app/_components';

interface CardDrawerProps {
  seasonId: string;
  difficulty: Difficulty;
  onCardDrawn: (card: Card) => void;
  isLoading?: boolean;
}

export function CardDrawer({ seasonId, difficulty, onCardDrawn, isLoading = false }: CardDrawerProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [optimisticDeckStatus, setOptimisticDeckStatus] = useState<DeckStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get deck status to show available cards
  const { 
    data: deckStatus, 
    refetch: refetchDeckStatus, 
    isLoading: deckStatusLoading,
    error: deckStatusError 
  } = api.card.getDeckStatus.useQuery({
    seasonId,
    difficulty,
  }, {
    retry: (failureCount, error) => {
      // Retry up to 3 times for network errors
      if (error.data?.code === 'INTERNAL_SERVER_ERROR' && failureCount < 3) {
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Draw random card mutation
  const drawCardMutation = api.card.drawRandom.useMutation({
    onMutate: () => {
      // Optimistic update - decrease available cards immediately
      if (deckStatus) {
        const newAvailableCards = Math.max(0, deckStatus.availableCards - 1);
        const newUsedCards = deckStatus.usedCards + 1;
        const newUsagePercentage = deckStatus.totalCards > 0 
          ? (newUsedCards / deckStatus.totalCards) * 100 
          : 0;
        
        setOptimisticDeckStatus({
          ...deckStatus,
          availableCards: newAvailableCards,
          usedCards: newUsedCards,
          usagePercentage: newUsagePercentage,
        });
      }
    },
    onSuccess: (card) => {
      setIsDrawing(false);
      setError(null);
      onCardDrawn(card);
      // Reset optimistic state and refetch actual data
      setOptimisticDeckStatus(null);
      void refetchDeckStatus();
    },
    onError: (error) => {
      setIsDrawing(false);
      // Reset optimistic state on error
      setOptimisticDeckStatus(null);
      
      // Set user-friendly error message
      if (error.data?.code === 'BAD_REQUEST') {
        setError(error.message);
      } else if (error.data?.code === 'INTERNAL_SERVER_ERROR') {
        setError('Server error occurred. Please try again.');
      } else {
        setError('Failed to draw card. Please check your connection and try again.');
      }
    },
  });

  // Clear error when component unmounts or props change
  useEffect(() => {
    setError(null);
  }, [seasonId, difficulty]);

  const handleDrawCard = async () => {
    if (isDrawing || isLoading) return;
    
    setIsDrawing(true);
    setError(null);
    
    drawCardMutation.mutate({
      seasonId,
      difficulty,
    });
  };

  const handleRetryDeckStatus = () => {
    void refetchDeckStatus();
  };

  const handleDismissError = () => {
    setError(null);
  };

  const getDifficultyColor = (difficulty: Difficulty) => {
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

  // Use optimistic state if available, otherwise use actual data
  const displayDeckStatus = optimisticDeckStatus || deckStatus;
  const canDrawCard = displayDeckStatus && displayDeckStatus.availableCards > 0;

  // Handle loading state
  if (deckStatusLoading && !deckStatus) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Loading deck status...</p>
        </div>
      </div>
    );
  }

  // Handle deck status error
  if (deckStatusError && !deckStatus) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Card Drawer</h2>
          <div className="mb-6">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(difficulty)}`}>
              {difficulty} Deck
            </span>
          </div>
        </div>
        <NetworkErrorMessage onRetry={handleRetryDeckStatus} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Card Drawer</h2>
        
        {/* Difficulty Badge */}
        <div className="mb-6">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(difficulty)}`}>
            {difficulty} Deck
          </span>
        </div>

        {/* Deck Status */}
        {displayDeckStatus && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">{displayDeckStatus.totalCards}</div>
                <div className="text-sm text-gray-600">Total Cards</div>
              </div>
              <div>
                <div className={`text-2xl font-bold ${optimisticDeckStatus ? 'text-blue-400' : 'text-blue-600'} transition-colors`}>
                  {displayDeckStatus.availableCards}
                </div>
                <div className="text-sm text-gray-600">Available</div>
              </div>
              <div>
                <div className={`text-2xl font-bold ${optimisticDeckStatus ? 'text-gray-400' : 'text-gray-500'} transition-colors`}>
                  {displayDeckStatus.usedCards}
                </div>
                <div className="text-sm text-gray-600">Used</div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Deck Usage</span>
                <span>{displayDeckStatus.usagePercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    optimisticDeckStatus ? 'bg-blue-400' : 'bg-blue-600'
                  }`}
                  style={{ width: `${displayDeckStatus.usagePercentage}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Draw Card Button */}
        <div className="mb-4">
          <button
            onClick={handleDrawCard}
            disabled={!canDrawCard || isDrawing || isLoading}
            className={`
              px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200
              ${canDrawCard && !isDrawing && !isLoading
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {isDrawing ? (
              <div className="flex items-center justify-center">
                <LoadingSpinner size="sm" className="mr-2 border-white" />
                Drawing Card...
              </div>
            ) : (
              'Draw Random Card'
            )}
          </button>
        </div>

        {/* Error Messages */}
        {error && (
          <div className="mb-4">
            <ErrorMessage
              message={error}
              onRetry={() => handleDrawCard()}
              onDismiss={handleDismissError}
            />
          </div>
        )}

        {/* Status Messages */}
        {!canDrawCard && displayDeckStatus && displayDeckStatus.totalCards === 0 && (
          <div className="mb-4">
            <EmptyDeckMessage difficulty={difficulty} />
          </div>
        )}

        {!canDrawCard && displayDeckStatus && displayDeckStatus.totalCards > 0 && displayDeckStatus.availableCards === 0 && (
          <div className="mb-4">
            <DeckExhaustedMessage difficulty={difficulty} />
          </div>
        )}
      </div>
    </div>
  );
}