"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import type { Difficulty, Card } from "~/lib/types";

interface CardEditorProps {
  seasonId: string;
  difficulty: Difficulty;
  card?: Card | null;
  onCancel: () => void;
  onSuccess: () => void;
}

export function CardEditor({ seasonId, difficulty, card, onCancel, onSuccess }: CardEditorProps) {
  const [formData, setFormData] = useState({
    question: "",
    correctAnswer: "",
    cardNumber: 1,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get next available card number for new cards
  const { data: deckStatus } = api.card.getDeckStatus.useQuery({
    seasonId,
    difficulty,
  });

  // Mutations
  const createCard = api.card.create.useMutation({
    onSuccess: () => {
      onSuccess();
    },
    onError: (error) => {
      setErrors({ submit: error.message });
    },
  });

  const updateCard = api.card.update.useMutation({
    onSuccess: () => {
      onSuccess();
    },
    onError: (error) => {
      setErrors({ submit: error.message });
    },
  });

  // Initialize form data
  useEffect(() => {
    if (card) {
      setFormData({
        question: card.question,
        correctAnswer: card.correctAnswer,
        cardNumber: card.cardNumber,
      });
    } else if (deckStatus) {
      // For new cards, suggest the next available card number
      const nextCardNumber = deckStatus.totalCards + 1;
      setFormData(prev => ({
        ...prev,
        cardNumber: nextCardNumber <= 52 ? nextCardNumber : 1,
      }));
    }
  }, [card, deckStatus]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.question.trim()) {
      newErrors.question = "Question is required";
    } else if (formData.question.length > 2000) {
      newErrors.question = "Question must be less than 2000 characters";
    }

    if (!formData.correctAnswer.trim()) {
      newErrors.correctAnswer = "Correct answer is required";
    } else if (formData.correctAnswer.length > 1000) {
      newErrors.correctAnswer = "Answer must be less than 1000 characters";
    }

    if (formData.cardNumber < 1 || formData.cardNumber > 52) {
      newErrors.cardNumber = "Card number must be between 1 and 52";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      if (card) {
        // Update existing card
        await updateCard.mutateAsync({
          id: card.id,
          question: formData.question.trim(),
          correctAnswer: formData.correctAnswer.trim(),
        });
      } else {
        // Create new card
        await createCard.mutateAsync({
          seasonId,
          difficulty,
          cardNumber: formData.cardNumber,
          question: formData.question.trim(),
          correctAnswer: formData.correctAnswer.trim(),
        });
      }
    } catch (error) {
      // Error handling is done in the mutation callbacks
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const getDifficultyColor = (difficulty: Difficulty) => {
    switch (difficulty) {
      case "EASY":
        return "text-green-600";
      case "MEDIUM":
        return "text-yellow-600";
      case "HARD":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getDifficultyIcon = (difficulty: Difficulty) => {
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

  const isLoading = createCard.isPending || updateCard.isPending;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
            title="Cancel"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div>
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{getDifficultyIcon(difficulty)}</span>
              <h1 className="text-3xl font-bold text-gray-900">
                {card ? "Edit Card" : "Add New Card"}
              </h1>
            </div>
            <p className={`mt-1 ${getDifficultyColor(difficulty)} font-medium`}>
              {difficulty.charAt(0) + difficulty.slice(1).toLowerCase()} Difficulty
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Card Number (only for new cards) */}
          {!card && (
            <div>
              <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Card Number
              </label>
              <input
                type="number"
                id="cardNumber"
                min="1"
                max="52"
                value={formData.cardNumber}
                onChange={(e) => handleInputChange("cardNumber", parseInt(e.target.value) || 1)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.cardNumber ? "border-red-300" : "border-gray-300"
                }`}
                disabled={isLoading}
              />
              {errors.cardNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.cardNumber}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Choose a number between 1 and 52. Next available: {deckStatus ? deckStatus.totalCards + 1 : 1}
              </p>
            </div>
          )}

          {/* Question */}
          <div>
            <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
              Question
            </label>
            <textarea
              id="question"
              rows={4}
              value={formData.question}
              onChange={(e) => handleInputChange("question", e.target.value)}
              placeholder="Enter the technology question here..."
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-vertical ${
                errors.question ? "border-red-300" : "border-gray-300"
              }`}
              disabled={isLoading}
            />
            {errors.question && (
              <p className="mt-1 text-sm text-red-600">{errors.question}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              {formData.question.length}/2000 characters
            </p>
          </div>

          {/* Correct Answer */}
          <div>
            <label htmlFor="correctAnswer" className="block text-sm font-medium text-gray-700 mb-2">
              Correct Answer
            </label>
            <textarea
              id="correctAnswer"
              rows={3}
              value={formData.correctAnswer}
              onChange={(e) => handleInputChange("correctAnswer", e.target.value)}
              placeholder="Enter the correct answer here..."
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-vertical ${
                errors.correctAnswer ? "border-red-300" : "border-gray-300"
              }`}
              disabled={isLoading}
            />
            {errors.correctAnswer && (
              <p className="mt-1 text-sm text-red-600">{errors.correctAnswer}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              {formData.correctAnswer.length}/1000 characters
            </p>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              {isLoading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <span>{card ? "Update Card" : "Create Card"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Preview */}
      {(formData.question || formData.correctAnswer) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
            <div className="space-y-4">
              {formData.question && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Question:</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-900">{formData.question}</p>
                  </div>
                </div>
              )}
              {formData.correctAnswer && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Correct Answer:</h4>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-900">{formData.correctAnswer}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}