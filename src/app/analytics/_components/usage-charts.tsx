"use client";

import { useState, useMemo } from "react";
import type { CardUsageStats, Difficulty } from "~/lib/types";

interface UsageChartsProps {
  cardUsageStats: CardUsageStats[];
  isLoading?: boolean;
}

export function UsageCharts({ cardUsageStats, isLoading }: UsageChartsProps) {
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | "ALL">("ALL");
  const [sortBy, setSortBy] = useState<"usage" | "success" | "attempts">("usage");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const filteredAndSortedCards = useMemo(() => {
    let filtered = cardUsageStats;
    
    // Apply difficulty filter
    if (difficultyFilter !== "ALL") {
      filtered = filtered.filter(card => card.difficulty === difficultyFilter);
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let aValue: number, bValue: number;
      
      switch (sortBy) {
        case "usage":
          aValue = a.usageCount;
          bValue = b.usageCount;
          break;
        case "success":
          aValue = a.successRate;
          bValue = b.successRate;
          break;
        case "attempts":
          aValue = a.totalAttempts;
          bValue = b.totalAttempts;
          break;
        default:
          aValue = a.usageCount;
          bValue = b.usageCount;
      }

      return sortOrder === "desc" ? bValue - aValue : aValue - bValue;
    });

    return sorted;
  }, [cardUsageStats, difficultyFilter, sortBy, sortOrder]);

  const usageDistribution = useMemo(() => {
    const distribution = { EASY: 0, MEDIUM: 0, HARD: 0 };
    cardUsageStats.forEach(card => {
      distribution[card.difficulty] += card.usageCount;
    });
    return distribution;
  }, [cardUsageStats]);

  const successRateByDifficulty = useMemo(() => {
    const stats = { EASY: { total: 0, correct: 0 }, MEDIUM: { total: 0, correct: 0 }, HARD: { total: 0, correct: 0 } };
    
    cardUsageStats.forEach(card => {
      stats[card.difficulty].total += card.totalAttempts;
      stats[card.difficulty].correct += card.correctAttempts;
    });

    return {
      EASY: stats.EASY.total > 0 ? Math.round((stats.EASY.correct / stats.EASY.total) * 100) : 0,
      MEDIUM: stats.MEDIUM.total > 0 ? Math.round((stats.MEDIUM.correct / stats.MEDIUM.total) * 100) : 0,
      HARD: stats.HARD.total > 0 ? Math.round((stats.HARD.correct / stats.HARD.total) * 100) : 0,
    };
  }, [cardUsageStats]);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-200 h-64 rounded-lg"></div>
          <div className="bg-gray-200 h-64 rounded-lg"></div>
        </div>
        <div className="bg-gray-200 h-96 rounded-lg"></div>
      </div>
    );
  }

  if (!cardUsageStats.length) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Usage Data</h3>
        <p className="text-gray-600">No card usage data available for this season.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-4">
          <div>
            <label htmlFor="difficulty-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Difficulty
            </label>
            <select
              id="difficulty-filter"
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value as Difficulty | "ALL")}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            >
              <option value="ALL">All Difficulties</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            >
              <option value="usage">Usage Count</option>
              <option value="success">Success Rate</option>
              <option value="attempts">Total Attempts</option>
            </select>
          </div>

          <div>
            <label htmlFor="sort-order" className="block text-sm font-medium text-gray-700 mb-1">
              Order
            </label>
            <select
              id="sort-order"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            >
              <option value="desc">High to Low</option>
              <option value="asc">Low to High</option>
            </select>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          Showing {filteredAndSortedCards.length} of {cardUsageStats.length} cards
        </div>
      </div>

      {/* Summary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Distribution by Difficulty</h3>
          <div className="space-y-4">
            {Object.entries(usageDistribution).map(([difficulty, count]) => {
              const total = Object.values(usageDistribution).reduce((sum, val) => sum + val, 0);
              const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
              
              return (
                <div key={difficulty} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className={`px-2 py-1 rounded text-sm font-medium ${
                      difficulty === 'EASY' ? 'bg-green-100 text-green-800' :
                      difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {difficulty}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {count} uses ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        difficulty === 'EASY' ? 'bg-green-500' :
                        difficulty === 'MEDIUM' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Success Rate by Difficulty */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Success Rate by Difficulty</h3>
          <div className="space-y-4">
            {Object.entries(successRateByDifficulty).map(([difficulty, rate]) => (
              <div key={difficulty} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    difficulty === 'EASY' ? 'bg-green-100 text-green-800' :
                    difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {difficulty}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{rate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      rate >= 70 ? 'bg-green-500' :
                      rate >= 50 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${rate}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Card List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Card Usage Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Card
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Question
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attempts
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Success Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Used
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedCards.map((card) => (
                <tr key={card.cardId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        card.difficulty === 'EASY' ? 'bg-green-100 text-green-800' :
                        card.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {card.difficulty}
                      </span>
                      <span className="text-sm font-medium text-gray-900">#{card.cardNumber}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate" title={card.question}>
                      {card.question}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900 mr-2">{card.usageCount}</span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ 
                            width: `${Math.min((card.usageCount / Math.max(...cardUsageStats.map(c => c.usageCount))) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{card.totalAttempts}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`text-sm font-medium mr-2 ${
                        card.successRate >= 70 ? 'text-green-600' :
                        card.successRate >= 50 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {card.successRate}%
                      </span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            card.successRate >= 70 ? 'bg-green-500' :
                            card.successRate >= 50 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${card.successRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {card.lastUsed ? new Date(card.lastUsed).toLocaleDateString() : 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}