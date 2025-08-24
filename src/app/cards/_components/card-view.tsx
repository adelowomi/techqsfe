"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import type { CardWithUsage } from "~/lib/types";
import { formatDistanceToNow, format } from "date-fns";

interface CardViewProps {
  card: CardWithUsage;
  onBack: () => void;
  onEdit: () => void;
}

export function CardView({ card, onBack, onEdit }: CardViewProps) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch recent attempts for this card
  const { data: attempts, isLoading: attemptsLoading } = api.game.getAttemptHistory.useQuery({
    cardId: card.id,
    limit: 10,
  });

  // Delete mutation
  const deleteCard = api.card.delete.useMutation({
    onSuccess: () => {
      onBack();
    },
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "EASY":
        return "text-green-600 bg-green-50 border-green-200";
      case "MEDIUM":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "HARD":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case "EASY":
        return "🟢";
      case "MEDIUM":
        return "🟡";
      case "HARD":
        return "🔴";
      default:
        return "⚪";
    }
  };

  const getUsageStatusColor = (usageCount: number) => {
    if (usageCount === 0) return "bg-gray-100 text-gray-600";
    if (usageCount <= 2) return "bg-green-100 text-green-700";
    if (usageCount <= 5) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  const getSuccessRateColor = (successRate: number) => {
    if (successRate >= 80) return "text-green-600";
    if (successRate >= 60) return "text-yellow-600";
    if (successRate >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const handleDelete = async () => {
    try {
      await deleteCard.mutateAsync({ id: card.id });
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
            title="Back to deck"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{getDifficultyIcon(card.difficulty)}</span>
              <h1 className="text-3xl font-bold text-gray-900">
                Card #{card.cardNumber}
              </h1>
              <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getDifficultyColor(card.difficulty)}`}>
                {card.difficulty.charAt(0) + card.difficulty.slice(1).toLowerCase()}
              </span>
            </div>
            <p className="text-gray-600 mt-1">
              Created {formatDistanceToNow(new Date(card.createdAt))} ago
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={onEdit}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Edit Card
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Card Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getUsageStatusColor(card.usageCount)}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Times Used</p>
              <p className="text-2xl font-semibold text-gray-900">{card.usageCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Attempts</p>
              <p className="text-2xl font-semibold text-gray-900">{card.totalAttempts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Correct Answers</p>
              <p className="text-2xl font-semibold text-gray-900">{card.correctAttempts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className={`text-2xl font-semibold ${getSuccessRateColor(card.successRate)}`}>
                {card.totalAttempts > 0 ? `${card.successRate.toFixed(1)}%` : "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Question and Answer */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Question</h3>
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <p className="text-gray-900 text-lg leading-relaxed">{card.question}</p>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Correct Answer</h3>
            <button
              onClick={() => setShowAnswer(!showAnswer)}
              className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
            >
              {showAnswer ? "Hide Answer" : "Show Answer"}
            </button>
          </div>

          {showAnswer && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <p className="text-green-900 text-lg leading-relaxed">{card.correctAnswer}</p>
            </div>
          )}
        </div>
      </div>

      {/* Usage History */}
      {card.lastUsed && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Last Used</p>
                <p className="text-gray-900">
                  {format(new Date(card.lastUsed), "PPP 'at' p")}
                </p>
                <p className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(card.lastUsed))} ago
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Usage Frequency</p>
                <p className="text-gray-900">
                  {card.usageCount} {card.usageCount === 1 ? "time" : "times"}
                </p>
                {card.usageCount > 0 && (
                  <p className="text-sm text-gray-500">
                    Average: {(card.totalAttempts / card.usageCount).toFixed(1)} attempts per use
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Attempts */}
      {card.totalAttempts > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Attempts ({card.totalAttempts} total)
            </h3>
            
            {attemptsLoading ? (
              <div className="animate-pulse space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : attempts && attempts.data.length > 0 ? (
              <div className="space-y-3">
                {attempts.data.map((attempt) => (
                  <div key={attempt.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="font-medium text-gray-900">{attempt.contestantName}</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            attempt.isCorrect 
                              ? "bg-green-100 text-green-700" 
                              : "bg-red-100 text-red-700"
                          }`}>
                            {attempt.isCorrect ? "Correct" : "Incorrect"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          Answer: "{attempt.givenAnswer}"
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(attempt.attemptedAt), "PPP 'at' p")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-4">No attempts recorded yet</p>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Card</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete Card #{card.cardNumber}? This action cannot be undone and will also delete all associated attempt records.
            </p>
            <div className="flex items-center justify-end space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                disabled={deleteCard.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteCard.isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                {deleteCard.isPending && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                <span>Delete Card</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}