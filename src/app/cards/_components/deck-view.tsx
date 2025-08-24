"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import type { Difficulty, CardWithUsage, DeckStatus } from "~/lib/types";
import { CardList } from "./card-list";
import { CardEditor } from "./card-editor";
import { CardView } from "./card-view";
import { 
  DeckLoadingState, 
  ErrorMessage, 
  NetworkErrorMessage,
  LoadingSpinner 
} from "~/app/_components";

interface DeckViewProps {
  seasonId: string;
  difficulty: Difficulty;
  onBack: () => void;
}

export function DeckView({ seasonId, difficulty, onBack }: DeckViewProps) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingCard, setEditingCard] = useState<CardWithUsage | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Fetch cards for this deck
  const { 
    data: cardsData, 
    isLoading: cardsLoading, 
    error: cardsError,
    refetch: refetchCards 
  } = api.card.getByDeck.useQuery({
    seasonId,
    difficulty,
    page: currentPage,
    limit: pageSize,
  }, {
    retry: (failureCount, error) => {
      if (error.data?.code === 'INTERNAL_SERVER_ERROR' && failureCount < 3) {
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Fetch deck status
  const { 
    data: deckStatus, 
    isLoading: statusLoading, 
    error: statusError,
    refetch: refetchStatus 
  } = api.card.getDeckStatus.useQuery({
    seasonId,
    difficulty,
  }, {
    retry: (failureCount, error) => {
      if (error.data?.code === 'INTERNAL_SERVER_ERROR' && failureCount < 3) {
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Fetch season info
  const { 
    data: season, 
    error: seasonError 
  } = api.season.getById.useQuery({ id: seasonId });

  const getDifficultyColor = (difficulty: Difficulty) => {
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

  const handleCardCreate = () => {
    setEditingCard(null);
    setShowEditor(true);
  };

  const handleCardEdit = (card: CardWithUsage) => {
    setEditingCard(card);
    setShowEditor(true);
  };

  const handleCardSelect = (cardId: string) => {
    setSelectedCardId(cardId);
  };

  const handleEditorClose = () => {
    setShowEditor(false);
    setEditingCard(null);
    void refetchCards();
    void refetchStatus();
  };

  const handleCardViewClose = () => {
    setSelectedCardId(null);
  };

  const handleRetryCards = () => {
    void refetchCards();
  };

  const handleRetryStatus = () => {
    void refetchStatus();
  };

  const maxCards = 52;
  const cardCount = deckStatus?.totalCards ?? 0;
  const usedCards = deckStatus?.usedCards ?? 0;
  const availableCards = deckStatus?.availableCards ?? 0;

  // Handle loading states
  if ((cardsLoading && !cardsData) || (statusLoading && !deckStatus)) {
    return <DeckLoadingState />;
  }

  // Handle errors
  if (seasonError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
            title="Back to season dashboard"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Deck View</h1>
        </div>
        <ErrorMessage
          title="Season Not Found"
          message="Unable to load season information. The season may have been deleted or you may not have access to it."
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  if (statusError && !deckStatus) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
            title="Back to season dashboard"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{getDifficultyIcon(difficulty)}</span>
              <h1 className="text-3xl font-bold text-gray-900">
                {difficulty.charAt(0) + difficulty.slice(1).toLowerCase()} Deck
              </h1>
            </div>
            {season && (
              <p className="text-gray-600 mt-1">
                Season: {season.name}
              </p>
            )}
          </div>
        </div>
        <NetworkErrorMessage onRetry={handleRetryStatus} />
      </div>
    );
  }

  if (showEditor) {
    return (
      <CardEditor
        seasonId={seasonId}
        difficulty={difficulty}
        card={editingCard}
        onCancel={handleEditorClose}
        onSuccess={handleEditorClose}
      />
    );
  }

  if (selectedCardId) {
    const selectedCard = cardsData?.cards?.find(card => card.id === selectedCardId);
    if (selectedCard) {
      return (
        <CardView
          card={selectedCard}
          onBack={handleCardViewClose}
          onEdit={() => handleCardEdit(selectedCard)}
        />
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
            title="Back to season dashboard"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{getDifficultyIcon(difficulty)}</span>
              <h1 className="text-3xl font-bold text-gray-900">
                {difficulty.charAt(0) + difficulty.slice(1).toLowerCase()} Deck
              </h1>
            </div>
            {season && (
              <p className="text-gray-600 mt-1">
                Season: {season.name}
              </p>
            )}
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleCardCreate}
            disabled={cardCount >= maxCards}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Add Card
          </button>
        </div>
      </div>

      {/* Deck Status Overview */}
      <div className={`rounded-lg border-2 p-6 ${getDifficultyColor(difficulty)}`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Total Cards */}
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {cardCount}/{maxCards}
            </div>
            <div className="text-sm text-gray-600">Total Cards</div>
          </div>

          {/* Used Cards */}
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {usedCards}
            </div>
            <div className="text-sm text-gray-600">Used Cards</div>
          </div>

          {/* Available Cards */}
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {availableCards}
            </div>
            <div className="text-sm text-gray-600">Available Cards</div>
          </div>

          {/* Usage Percentage */}
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {deckStatus ? `${deckStatus.usagePercentage.toFixed(1)}%` : "0%"}
            </div>
            <div className="text-sm text-gray-600">Usage Rate</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Deck Progress</span>
            <span>{((cardCount / maxCards) * 100).toFixed(1)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                difficulty === "EASY" ? "bg-green-500" :
                difficulty === "MEDIUM" ? "bg-yellow-500" : "bg-red-500"
              }`}
              style={{ width: `${(cardCount / maxCards) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Status Messages */}
        <div className="mt-4">
          {cardCount === 0 && (
            <div className="text-center py-4">
              <p className="text-gray-600">No cards in this deck yet</p>
              <p className="text-sm text-gray-500">Click "Add Card" to get started</p>
            </div>
          )}
          {cardCount > 0 && cardCount < maxCards && (
            <p className="text-sm text-gray-600 text-center">
              {maxCards - cardCount} cards remaining in this deck
            </p>
          )}
          {cardCount === maxCards && (
            <div className="text-center py-2">
              <p className="text-sm font-medium text-green-600">
                🎉 Deck is complete! All {maxCards} cards have been added.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Visual Deck Representation */}
      {cardCount > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Deck Visualization</h3>
          <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-13 gap-1">
            {Array.from({ length: maxCards }, (_, index) => {
              const cardNumber = index + 1;
              const hasCard = cardsData?.cards?.some(card => card.cardNumber === cardNumber);
              const card = cardsData?.cards?.find(card => card.cardNumber === cardNumber);
              const isUsed = card && card.usageCount > 0;
              
              return (
                <div
                  key={cardNumber}
                  className={`
                    aspect-[2/3] rounded border-2 flex items-center justify-center text-xs font-medium cursor-pointer transition-all
                    ${hasCard 
                      ? isUsed 
                        ? 'bg-gray-100 border-gray-300 text-gray-600' 
                        : `${getDifficultyColor(difficulty)} border-2`
                      : 'bg-gray-50 border-gray-200 text-gray-400'
                    }
                    hover:scale-105 hover:shadow-sm
                  `}
                  onClick={() => card && handleCardSelect(card.id)}
                  title={
                    hasCard 
                      ? `Card ${cardNumber}${isUsed ? ` (Used ${card.usageCount} times)` : ' (Unused)'}`
                      : `Empty slot ${cardNumber}`
                  }
                >
                  {cardNumber}
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className={`w-4 h-6 rounded border-2 ${getDifficultyColor(difficulty)}`}></div>
              <span className="text-gray-600">Available</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-6 rounded border-2 bg-gray-100 border-gray-300"></div>
              <span className="text-gray-600">Used</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-6 rounded border-2 bg-gray-50 border-gray-200"></div>
              <span className="text-gray-600">Empty</span>
            </div>
          </div>
        </div>
      )}

      {/* Card List */}
      {cardCount > 0 && (
        <>
          {cardsError && !cardsData ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <ErrorMessage
                title="Failed to Load Cards"
                message="Unable to load the card list. This might be due to a network issue."
                onRetry={handleRetryCards}
              />
            </div>
          ) : (
            <CardList
              cards={cardsData?.cards ?? []}
              isLoading={cardsLoading}
              pagination={cardsData?.pagination}
              onCardSelect={handleCardSelect}
              onCardEdit={handleCardEdit}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}
    </div>
  );
}