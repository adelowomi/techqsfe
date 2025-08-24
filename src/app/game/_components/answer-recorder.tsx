'use client';

import { useState, useEffect } from 'react';
import type { Card } from '~/lib/types';
import { LoadingSpinner, ValidationErrorMessage } from '~/app/_components';

interface AnswerRecorderProps {
  card: Card;
  contestantName: string;
  onSubmit: (data: { givenAnswer: string; isCorrect: boolean }) => void;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export function AnswerRecorder({ 
  card, 
  contestantName, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  error: externalError = null
}: AnswerRecorderProps) {
  const [givenAnswer, setGivenAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clear validation errors when external error changes
  useEffect(() => {
    if (externalError) {
      setValidationErrors([]);
    }
  }, [externalError]);

  // Auto-save draft to localStorage
  useEffect(() => {
    const draftKey = `answer-draft-${card.id}`;
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft && !givenAnswer) {
      try {
        const draft = JSON.parse(savedDraft);
        setGivenAnswer(draft.givenAnswer || '');
        setIsCorrect(draft.isCorrect ?? null);
      } catch {
        // Ignore invalid draft data
      }
    }
  }, [card.id, givenAnswer]);

  // Save draft when answer changes
  useEffect(() => {
    if (givenAnswer || isCorrect !== null) {
      const draftKey = `answer-draft-${card.id}`;
      localStorage.setItem(draftKey, JSON.stringify({
        givenAnswer,
        isCorrect,
        timestamp: Date.now(),
      }));
    }
  }, [givenAnswer, isCorrect, card.id]);

  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    const trimmedAnswer = givenAnswer.trim();
    if (!trimmedAnswer) {
      errors.push('Contestant answer is required');
    }
    
    if (trimmedAnswer.length > 1000) {
      errors.push('Answer must be less than 1000 characters');
    }

    if (isCorrect === null) {
      errors.push('Please mark the answer as correct or incorrect');
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);
    setIsSubmitting(true);

    try {
      await onSubmit({
        givenAnswer: givenAnswer.trim(),
        isCorrect: isCorrect!,
      });
      
      // Clear draft on successful submission
      const draftKey = `answer-draft-${card.id}`;
      localStorage.removeItem(draftKey);
    } catch (error) {
      // Error handling is done by parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setGivenAnswer(e.target.value);
    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const handleResultChange = (result: boolean) => {
    setIsCorrect(result);
    // Clear validation errors when user selects result
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

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

  const isFormDisabled = isLoading || isSubmitting;
  const canSubmit = givenAnswer.trim() && isCorrect !== null && !isFormDisabled;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Record Contestant Answer</h2>
        <p className="text-gray-600">
          Recording attempt for: <span className="font-semibold">{contestantName}</span>
        </p>
      </div>

      {/* Question Context */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-center gap-4 mb-4">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(card.difficulty)}`}>
            {card.difficulty}
          </span>
          <span className="text-gray-600">Card #{card.cardNumber}</span>
        </div>
        
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Question:</h3>
          <p className="text-xl text-gray-900 leading-relaxed">
            {card.question}
          </p>
        </div>

        {/* Show/Hide Correct Answer */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setShowCorrectAnswer(!showCorrectAnswer)}
            disabled={isFormDisabled}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {showCorrectAnswer ? 'Hide' : 'Show'} Correct Answer
          </button>
          
          {showCorrectAnswer && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-700 mb-1">Correct Answer:</p>
              <p className="text-blue-900">{card.correctAnswer}</p>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contestant Answer */}
        <div>
          <label htmlFor="givenAnswer" className="block text-sm font-medium text-gray-700 mb-2">
            Contestant's Answer
          </label>
          <textarea
            id="givenAnswer"
            value={givenAnswer}
            onChange={handleAnswerChange}
            placeholder="Enter the contestant's answer..."
            disabled={isFormDisabled}
            rows={4}
            className={`
              w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors
              ${validationErrors.some(e => e.includes('answer')) ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}
              ${isFormDisabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            `}
            maxLength={1000}
          />
          <div className="mt-1 flex justify-between items-center">
            <p className="text-sm text-gray-500">
              {givenAnswer.length}/1000 characters
            </p>
            {givenAnswer.length > 900 && (
              <p className="text-sm text-yellow-600">
                {1000 - givenAnswer.length} characters remaining
              </p>
            )}
          </div>
        </div>

        {/* Result Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Mark Answer As:
          </label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => handleResultChange(true)}
              disabled={isFormDisabled}
              className={`
                flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 border-2
                ${isCorrect === true
                  ? 'bg-green-100 border-green-500 text-green-700 shadow-sm'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-green-300 hover:bg-green-50'
                }
                ${isFormDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-center justify-center">
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Correct
              </div>
            </button>
            
            <button
              type="button"
              onClick={() => handleResultChange(false)}
              disabled={isFormDisabled}
              className={`
                flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 border-2
                ${isCorrect === false
                  ? 'bg-red-100 border-red-500 text-red-700 shadow-sm'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-red-300 hover:bg-red-50'
                }
                ${isFormDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-center justify-center">
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Incorrect
              </div>
            </button>
          </div>
        </div>

        {/* Error Messages */}
        {validationErrors.length > 0 && (
          <ValidationErrorMessage errors={validationErrors} />
        )}

        {externalError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-red-800 font-medium text-sm">Failed to record answer</p>
                <p className="text-red-700 text-sm mt-1">{externalError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isFormDisabled}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={!canSubmit}
            className={`
              flex-1 py-2 px-4 rounded-md font-medium transition-colors duration-200 flex items-center justify-center
              ${canSubmit
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" className="mr-2 border-white" />
                Recording...
              </>
            ) : (
              'Record Answer'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}