'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '~/trpc/react';
import { CardDrawer, QuestionDisplay, ContestantForm, AnswerRecorder } from './_components';
import { MainLayout } from '~/app/_components/main-layout';
import { 
  ErrorBoundary, 
  GameErrorFallback, 
  GameLoadingState, 
  ErrorMessage,
  ToastErrorMessage 
} from '~/app/_components';
import type { Card, Difficulty } from '~/lib/types';

type GameStep = 'select-deck' | 'draw-card' | 'show-question' | 'contestant-info' | 'record-answer' | 'complete';

export default function GamePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<GameStep>('select-deck');
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('EASY');
  const [drawnCard, setDrawnCard] = useState<Card | null>(null);
  const [contestantName, setContestantName] = useState<string>('');
  const [recordError, setRecordError] = useState<string | null>(null);
  const [showErrorToast, setShowErrorToast] = useState(false);

  // Get all seasons for selection
  const { 
    data: seasons, 
    isLoading: seasonsLoading, 
    error: seasonsError 
  } = api.season.getAll.useQuery(undefined, {
    retry: (failureCount, error) => {
      if (error.data?.code === 'INTERNAL_SERVER_ERROR' && failureCount < 3) {
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Record attempt mutation
  const recordAttemptMutation = api.game.recordAttempt.useMutation({
    onSuccess: () => {
      setCurrentStep('complete');
      setRecordError(null);
    },
    onError: (error) => {
      let errorMessage = 'Failed to record attempt. Please try again.';
      
      if (error.data?.code === 'BAD_REQUEST') {
        errorMessage = error.message;
      } else if (error.data?.code === 'UNAUTHORIZED') {
        errorMessage = 'You are not authorized to record attempts.';
      } else if (error.data?.code === 'INTERNAL_SERVER_ERROR') {
        errorMessage = 'Server error occurred. Please try again in a moment.';
      }
      
      setRecordError(errorMessage);
      setShowErrorToast(true);
    },
  });

  const handleSeasonSelect = (seasonId: string) => {
    setSelectedSeasonId(seasonId);
    setCurrentStep('draw-card');
  };

  const handleDifficultySelect = (difficulty: Difficulty) => {
    setSelectedDifficulty(difficulty);
  };

  const handleCardDrawn = (card: Card) => {
    setDrawnCard(card);
    setCurrentStep('show-question');
  };

  const handleStartAttempt = () => {
    setCurrentStep('contestant-info');
  };

  const handleContestantSubmit = (name: string) => {
    setContestantName(name);
    setCurrentStep('record-answer');
  };

  const handleAnswerSubmit = (data: { givenAnswer: string; isCorrect: boolean }) => {
    if (!drawnCard) return;

    setRecordError(null);
    recordAttemptMutation.mutate({
      cardId: drawnCard.id,
      contestantName,
      givenAnswer: data.givenAnswer,
      isCorrect: data.isCorrect,
    });
  };

  const handleStartNewGame = () => {
    setCurrentStep('select-deck');
    setSelectedSeasonId('');
    setSelectedDifficulty('EASY');
    setDrawnCard(null);
    setContestantName('');
    setRecordError(null);
    setShowErrorToast(false);
  };

  const handleDismissErrorToast = () => {
    setShowErrorToast(false);
  };

  const handleGoBack = () => {
    switch (currentStep) {
      case 'draw-card':
        setCurrentStep('select-deck');
        break;
      case 'show-question':
        setCurrentStep('draw-card');
        break;
      case 'contestant-info':
        setCurrentStep('show-question');
        break;
      case 'record-answer':
        setCurrentStep('contestant-info');
        break;
      default:
        break;
    }
  };

  const selectedSeason = seasons?.find(s => s.id === selectedSeasonId);

  // Handle loading state
  if (seasonsLoading) {
    return (
      <MainLayout>
        <GameLoadingState />
      </MainLayout>
    );
  }

  // Handle seasons error
  if (seasonsError) {
    return (
      <MainLayout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Game Show</h1>
            <p className="text-gray-600">Digital Card Deck System</p>
          </div>
          <ErrorMessage
            title="Failed to Load Seasons"
            message="Unable to load available seasons. Please check your connection and try again."
            onRetry={() => window.location.reload()}
          />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <ErrorBoundary fallback={GameErrorFallback}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Error Toast */}
          <ToastErrorMessage
            message={recordError || ''}
            isVisible={showErrorToast}
            onDismiss={handleDismissErrorToast}
          />

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Game Show</h1>
            <p className="text-gray-600">Digital Card Deck System</p>
          </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {['select-deck', 'draw-card', 'show-question', 'contestant-info', 'record-answer', 'complete'].map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${currentStep === step 
                    ? 'bg-blue-600 text-white' 
                    : index < ['select-deck', 'draw-card', 'show-question', 'contestant-info', 'record-answer', 'complete'].indexOf(currentStep)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }
                `}>
                  {index + 1}
                </div>
                {index < 5 && (
                  <div className={`w-12 h-1 mx-2 ${
                    index < ['select-deck', 'draw-card', 'show-question', 'contestant-info', 'record-answer', 'complete'].indexOf(currentStep)
                      ? 'bg-green-600'
                      : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Back Button */}
        {currentStep !== 'select-deck' && currentStep !== 'complete' && (
          <div className="mb-6">
            <button
              onClick={handleGoBack}
              className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          </div>
        )}

        {/* Step Content */}
        <div className="space-y-8">
          {currentStep === 'select-deck' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Select Season and Difficulty</h2>
              
              {/* Season Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Choose Season:
                </label>
                <div className="grid gap-3">
                  {seasons?.map((season) => (
                    <button
                      key={season.id}
                      onClick={() => handleSeasonSelect(season.id)}
                      className={`
                        p-4 text-left border rounded-lg transition-colors duration-200
                        ${selectedSeasonId === season.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                        }
                      `}
                    >
                      <div className="font-medium text-gray-900">{season.name}</div>
                      {season.description && (
                        <div className="text-sm text-gray-600 mt-1">{season.description}</div>
                      )}
                      <div className="text-sm text-gray-500 mt-2">
                        Total Cards: {season.totalCards} | Total Attempts: {season.totalAttempts}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty Selection */}
              {selectedSeasonId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Choose Difficulty:
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['EASY', 'MEDIUM', 'HARD'] as const).map((difficulty) => (
                      <button
                        key={difficulty}
                        onClick={() => {
                          handleDifficultySelect(difficulty);
                          setCurrentStep('draw-card');
                        }}
                        className={`
                          p-4 text-center border rounded-lg font-medium transition-colors duration-200
                          ${difficulty === 'EASY' ? 'border-green-300 hover:bg-green-50' :
                            difficulty === 'MEDIUM' ? 'border-yellow-300 hover:bg-yellow-50' :
                            'border-red-300 hover:bg-red-50'
                          }
                        `}
                      >
                        {difficulty}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 'draw-card' && selectedSeasonId && (
            <div>
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedSeason?.name} - {selectedDifficulty} Deck
                </h3>
              </div>
              <CardDrawer
                seasonId={selectedSeasonId}
                difficulty={selectedDifficulty}
                onCardDrawn={handleCardDrawn}
              />
            </div>
          )}

          {currentStep === 'show-question' && drawnCard && (
            <QuestionDisplay
              card={drawnCard}
              onStartAttempt={handleStartAttempt}
            />
          )}

          {currentStep === 'contestant-info' && (
            <ContestantForm
              onSubmit={handleContestantSubmit}
              isLoading={recordAttemptMutation.isPending}
            />
          )}

          {currentStep === 'record-answer' && drawnCard && (
            <AnswerRecorder
              card={drawnCard}
              contestantName={contestantName}
              onSubmit={handleAnswerSubmit}
              onCancel={() => setCurrentStep('contestant-info')}
              isLoading={recordAttemptMutation.isPending}
              error={recordError}
            />
          )}

          {currentStep === 'complete' && (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Attempt Recorded!</h2>
                <p className="text-gray-600">
                  The contestant's answer has been successfully recorded.
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleStartNewGame}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  Start New Game
                </button>
                
                <button
                  onClick={() => router.push('/cards')}
                  className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  View Cards & Analytics
                </button>
              </div>
            </div>
          )}
        </div>
        </div>
      </ErrorBoundary>
    </MainLayout>
  );
}