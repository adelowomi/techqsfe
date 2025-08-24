"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import type { SeasonWithStats, Difficulty } from "~/lib/types";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface SeasonDashboardProps {
  season: SeasonWithStats;
  onBack: () => void;
}

interface DeckCardProps {
  difficulty: Difficulty;
  cardCount: number;
  seasonId: string;
  onDeckSelect: (difficulty: Difficulty) => void;
}

function DeckCard({ difficulty, cardCount, seasonId, onDeckSelect }: DeckCardProps) {
  const maxCards = 52;
  const percentage = (cardCount / maxCards) * 100;
  
  const getDifficultyColor = (difficulty: Difficulty) => {
    switch (difficulty) {
      case "EASY":
        return "bg-green-500";
      case "MEDIUM":
        return "bg-yellow-500";
      case "HARD":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getDifficultyBgColor = (difficulty: Difficulty) => {
    switch (difficulty) {
      case "EASY":
        return "bg-green-50 border-green-200";
      case "MEDIUM":
        return "bg-yellow-50 border-yellow-200";
      case "HARD":
        return "bg-red-50 border-red-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className={`rounded-lg border-2 p-6 ${getDifficultyBgColor(difficulty)}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-4 h-4 rounded-full ${getDifficultyColor(difficulty)}`}></div>
          <h3 className="text-lg font-semibold text-gray-900">
            {difficulty.charAt(0) + difficulty.slice(1).toLowerCase()} Deck
          </h3>
        </div>
        <span className="text-2xl font-bold text-gray-900">
          {cardCount}/{maxCards}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Cards Added</span>
          <span>{percentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getDifficultyColor(difficulty)}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>

      {/* Status */}
      <div className="mb-4">
        {cardCount === 0 && (
          <p className="text-sm text-gray-600">No cards added yet</p>
        )}
        {cardCount > 0 && cardCount < maxCards && (
          <p className="text-sm text-gray-600">
            {maxCards - cardCount} cards remaining
          </p>
        )}
        {cardCount === maxCards && (
          <p className="text-sm text-green-600 font-medium">Deck is full!</p>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <Link
          href={`/cards?season=${seasonId}&difficulty=${difficulty}`}
          className="w-full bg-white hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors border border-gray-300 text-center block"
        >
          Manage Cards
        </Link>
        {cardCount > 0 && (
          <Link
            href={`/game?season=${seasonId}&difficulty=${difficulty}`}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg font-medium transition-colors text-center block"
          >
            Draw Cards
          </Link>
        )}
      </div>
    </div>
  );
}

export function SeasonDashboard({ season, onBack }: SeasonDashboardProps) {
  const { data: seasonStats, isLoading: statsLoading } = api.analytics.getSeasonStats.useQuery(
    { seasonId: season.id },
    { enabled: !!season.id }
  );

  const handleDeckSelect = (difficulty: Difficulty) => {
    // This will be handled by the Link components in DeckCard
    console.log(`Selected ${difficulty} deck for season ${season.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
            title="Back to seasons"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{season.name}</h1>
            {season.description && (
              <p className="text-gray-600 mt-1">{season.description}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Created {formatDistanceToNow(new Date(season.createdAt))} ago
              {season.createdBy.name && ` by ${season.createdBy.name}`}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Link
            href={`/analytics?season=${season.id}`}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            View Analytics
          </Link>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Cards</p>
              <p className="text-2xl font-semibold text-gray-900">{season.totalCards}</p>
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
              <p className="text-sm font-medium text-gray-600">Total Attempts</p>
              <p className="text-2xl font-semibold text-gray-900">{season.totalAttempts}</p>
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
              <p className="text-2xl font-semibold text-gray-900">
                {statsLoading ? "..." : seasonStats ? `${seasonStats.overallSuccessRate.toFixed(1)}%` : "0%"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completion</p>
              <p className="text-2xl font-semibold text-gray-900">
                {((season.totalCards / 156) * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500">of 156 total cards</p>
            </div>
          </div>
        </div>
      </div>

      {/* Deck Overview */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Deck Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DeckCard
            difficulty="EASY"
            cardCount={season.easyDeckCount}
            seasonId={season.id}
            onDeckSelect={handleDeckSelect}
          />
          <DeckCard
            difficulty="MEDIUM"
            cardCount={season.mediumDeckCount}
            seasonId={season.id}
            onDeckSelect={handleDeckSelect}
          />
          <DeckCard
            difficulty="HARD"
            cardCount={season.hardDeckCount}
            seasonId={season.id}
            onDeckSelect={handleDeckSelect}
          />
        </div>
      </div>

      {/* Recent Activity */}
      {statsLoading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      ) : seasonStats && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Difficulty Breakdown</h3>
          <div className="space-y-4">
            {seasonStats.difficultyStats.map((stat) => (
              <div key={stat.difficulty} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    stat.difficulty === "EASY" ? "bg-green-500" :
                    stat.difficulty === "MEDIUM" ? "bg-yellow-500" : "bg-red-500"
                  }`}></div>
                  <span className="font-medium text-gray-900">
                    {stat.difficulty.charAt(0) + stat.difficulty.slice(1).toLowerCase()}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">
                    {stat.cardCount} cards • {stat.attemptCount} attempts
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {stat.successRate.toFixed(1)}% success rate
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}