"use client";

import { useState, useMemo } from "react";
import type { ContestantPerformance, Difficulty } from "~/lib/types";

interface PerformanceMetricsProps {
  contestantPerformance: ContestantPerformance[];
  isLoading?: boolean;
}

export function PerformanceMetrics({ contestantPerformance, isLoading }: PerformanceMetricsProps) {
  const [selectedContestant, setSelectedContestant] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "attempts" | "success">("success");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [minAttempts, setMinAttempts] = useState<number>(0);

  const filteredAndSortedContestants = useMemo(() => {
    let filtered = contestantPerformance.filter(contestant => 
      contestant.totalAttempts >= minAttempts
    );

    const sorted = [...filtered].sort((a, b) => {
      let aValue: number | string, bValue: number | string;
      
      switch (sortBy) {
        case "name":
          aValue = a.contestantName.toLowerCase();
          bValue = b.contestantName.toLowerCase();
          break;
        case "attempts":
          aValue = a.totalAttempts;
          bValue = b.totalAttempts;
          break;
        case "success":
          aValue = a.successRate;
          bValue = b.successRate;
          break;
        default:
          aValue = a.successRate;
          bValue = b.successRate;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "desc" ? bValue.localeCompare(aValue) : aValue.localeCompare(bValue);
      }
      
      return sortOrder === "desc" ? (bValue as number) - (aValue as number) : (aValue as number) - (bValue as number);
    });

    return sorted;
  }, [contestantPerformance, sortBy, sortOrder, minAttempts]);

  const overallStats = useMemo(() => {
    if (!contestantPerformance.length) return null;

    const totalAttempts = contestantPerformance.reduce((sum, c) => sum + c.totalAttempts, 0);
    const totalCorrect = contestantPerformance.reduce((sum, c) => sum + c.correctAttempts, 0);
    const avgSuccessRate = contestantPerformance.reduce((sum, c) => sum + c.successRate, 0) / contestantPerformance.length;

    const difficultyStats = { EASY: { attempts: 0, correct: 0 }, MEDIUM: { attempts: 0, correct: 0 }, HARD: { attempts: 0, correct: 0 } };
    
    contestantPerformance.forEach(contestant => {
      contestant.difficultyBreakdown.forEach(diff => {
        difficultyStats[diff.difficulty].attempts += diff.attempts;
        difficultyStats[diff.difficulty].correct += diff.correct;
      });
    });

    return {
      totalContestants: contestantPerformance.length,
      totalAttempts,
      totalCorrect,
      overallSuccessRate: totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0,
      avgSuccessRate: Math.round(avgSuccessRate),
      difficultyStats: Object.entries(difficultyStats).map(([difficulty, stats]) => ({
        difficulty: difficulty as Difficulty,
        attempts: stats.attempts,
        correct: stats.correct,
        successRate: stats.attempts > 0 ? Math.round((stats.correct / stats.attempts) * 100) : 0,
      })),
    };
  }, [contestantPerformance]);

  const selectedContestantData = useMemo(() => {
    if (!selectedContestant) return null;
    return contestantPerformance.find(c => c.contestantName === selectedContestant);
  }, [selectedContestant, contestantPerformance]);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
          ))}
        </div>
        <div className="bg-gray-200 h-96 rounded-lg"></div>
      </div>
    );
  }

  if (!contestantPerformance.length) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Performance Data</h3>
        <p className="text-gray-600">No contestant performance data available for this season.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Statistics */}
      {overallStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-blue-50 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">👥</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Total Contestants</p>
                <p className="text-2xl font-bold text-blue-900">{overallStats.totalContestants}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">🎯</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">Total Attempts</p>
                <p className="text-2xl font-bold text-green-900">{overallStats.totalAttempts}</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">📈</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-600">Overall Success</p>
                <p className="text-2xl font-bold text-purple-900">{overallStats.overallSuccessRate}%</p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">⭐</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-600">Avg Success Rate</p>
                <p className="text-2xl font-bold text-orange-900">{overallStats.avgSuccessRate}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-4">
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
              <option value="success">Success Rate</option>
              <option value="attempts">Total Attempts</option>
              <option value="name">Name</option>
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

          <div>
            <label htmlFor="min-attempts" className="block text-sm font-medium text-gray-700 mb-1">
              Min Attempts
            </label>
            <input
              id="min-attempts"
              type="number"
              min="0"
              value={minAttempts}
              onChange={(e) => setMinAttempts(parseInt(e.target.value) || 0)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm w-20"
            />
          </div>
        </div>

        <div className="text-sm text-gray-600">
          Showing {filteredAndSortedContestants.length} of {contestantPerformance.length} contestants
        </div>
      </div>

      {/* Difficulty Performance Overview */}
      {overallStats && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Difficulty Level</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {overallStats.difficultyStats.map((stat) => (
              <div key={stat.difficulty} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className={`font-medium capitalize ${
                    stat.difficulty === 'EASY' ? 'text-green-700' :
                    stat.difficulty === 'MEDIUM' ? 'text-yellow-700' :
                    'text-red-700'
                  }`}>
                    {stat.difficulty.toLowerCase()}
                  </h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    stat.difficulty === 'EASY' ? 'bg-green-100 text-green-800' :
                    stat.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {stat.successRate}%
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Attempts:</span>
                    <span className="font-medium">{stat.attempts}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Correct:</span>
                    <span className="font-medium">{stat.correct}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div
                      className={`h-2 rounded-full ${
                        stat.difficulty === 'EASY' ? 'bg-green-500' :
                        stat.difficulty === 'MEDIUM' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${stat.successRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contestant Performance Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Contestant Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contestant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Attempts
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Success Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Easy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Medium
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hard
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedContestants.map((contestant) => (
                <tr key={contestant.contestantName} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {contestant.contestantName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {contestant.contestantName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{contestant.totalAttempts}</div>
                    <div className="text-sm text-gray-500">{contestant.correctAttempts} correct</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`text-sm font-medium mr-2 ${
                        contestant.successRate >= 70 ? 'text-green-600' :
                        contestant.successRate >= 50 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {contestant.successRate}%
                      </span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            contestant.successRate >= 70 ? 'bg-green-500' :
                            contestant.successRate >= 50 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${contestant.successRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  {['EASY', 'MEDIUM', 'HARD'].map((difficulty) => {
                    const diffStat = contestant.difficultyBreakdown.find(d => d.difficulty === difficulty);
                    return (
                      <td key={difficulty} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {diffStat ? (
                          <div>
                            <div>{diffStat.correct}/{diffStat.attempts}</div>
                            <div className="text-xs text-gray-500">({diffStat.successRate}%)</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedContestant(
                        selectedContestant === contestant.contestantName ? null : contestant.contestantName
                      )}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      {selectedContestant === contestant.contestantName ? 'Hide Details' : 'View Details'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Contestant Details */}
      {selectedContestantData && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedContestantData.contestantName} - Detailed Performance
            </h3>
            <button
              onClick={() => setSelectedContestant(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Summary */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Performance Summary</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Attempts:</span>
                  <span className="font-medium">{selectedContestantData.totalAttempts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Correct Answers:</span>
                  <span className="font-medium">{selectedContestantData.correctAttempts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Success Rate:</span>
                  <span className={`font-medium ${
                    selectedContestantData.successRate >= 70 ? 'text-green-600' :
                    selectedContestantData.successRate >= 50 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {selectedContestantData.successRate}%
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Attempts */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Recent Attempts</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {selectedContestantData.recentAttempts.map((attempt, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        attempt.isCorrect ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <div>
                        <div className="text-sm font-medium">
                          {attempt.card.difficulty} Card #{attempt.card.cardNumber}
                        </div>
                        <div className="text-xs text-gray-600 truncate max-w-xs">
                          {attempt.card.question}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${
                        attempt.isCorrect ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {attempt.isCorrect ? 'Correct' : 'Incorrect'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(attempt.attemptedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}