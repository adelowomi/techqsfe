"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import type { SeasonStats } from "~/lib/types";
import { UsageCharts } from "./usage-charts";
import { PerformanceMetrics } from "./performance-metrics";
import { DataExport } from "./data-export";

interface AnalyticsDashboardProps {
  initialSeasonId?: string;
}

export function AnalyticsDashboard({ initialSeasonId }: AnalyticsDashboardProps) {
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>(initialSeasonId || "");
  const [activeTab, setActiveTab] = useState<"overview" | "usage" | "performance" | "export">("overview");

  // Fetch available seasons for selection
  const { data: seasons } = api.season.getAll.useQuery();
  
  // Fetch season statistics
  const { data: seasonStats, isLoading: statsLoading } = api.analytics.getSeasonStats.useQuery(
    { seasonId: selectedSeasonId },
    { enabled: !!selectedSeasonId }
  );

  // Fetch card usage statistics
  const { data: cardUsage, isLoading: usageLoading } = api.analytics.getCardUsage.useQuery(
    { seasonId: selectedSeasonId },
    { enabled: !!selectedSeasonId }
  );

  // Fetch contestant performance
  const { data: contestantPerformance, isLoading: performanceLoading } = api.analytics.getContestantPerformance.useQuery(
    { seasonId: selectedSeasonId },
    { enabled: !!selectedSeasonId }
  );

  // Fetch real-time analytics
  const { data: realTimeData } = api.analytics.getRealTimeAnalytics.useQuery(
    { seasonId: selectedSeasonId },
    { 
      enabled: !!selectedSeasonId,
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  const handleSeasonChange = (seasonId: string) => {
    setSelectedSeasonId(seasonId);
  };

  if (!seasons?.length) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Seasons Available</h2>
          <p className="text-gray-600">
            Create a season first to view analytics data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Season Selection */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Analytics Dashboard</h2>
            <p className="text-sm text-gray-600">
              {realTimeData && (
                <>Last updated: {realTimeData.lastUpdated.toLocaleTimeString()}</>
              )}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <label htmlFor="season-select" className="text-sm font-medium text-gray-700">
              Season:
            </label>
            <select
              id="season-select"
              value={selectedSeasonId}
              onChange={(e) => handleSeasonChange(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select a season</option>
              {seasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedSeasonId && (
        <>
          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                {[
                  { id: "overview", label: "Overview", icon: "📊" },
                  { id: "usage", label: "Card Usage", icon: "🃏" },
                  { id: "performance", label: "Performance", icon: "🎯" },
                  { id: "export", label: "Export Data", icon: "📥" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {activeTab === "overview" && (
                <OverviewTab 
                  seasonStats={seasonStats} 
                  realTimeData={realTimeData}
                  isLoading={statsLoading} 
                />
              )}
              {activeTab === "usage" && (
                <UsageCharts 
                  cardUsageStats={cardUsage || []} 
                  isLoading={usageLoading}
                />
              )}
              {activeTab === "performance" && (
                <PerformanceMetrics 
                  contestantPerformance={contestantPerformance || []} 
                  isLoading={performanceLoading}
                />
              )}
              {activeTab === "export" && (
                <DataExport seasonId={selectedSeasonId} />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

interface OverviewTabProps {
  seasonStats?: SeasonStats;
  realTimeData?: any;
  isLoading: boolean;
}

function OverviewTab({ seasonStats, realTimeData, isLoading }: OverviewTabProps) {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
          ))}
        </div>
        <div className="bg-gray-200 h-64 rounded-lg"></div>
      </div>
    );
  }

  if (!seasonStats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No data available for this season.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-bold">📚</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Total Cards</p>
              <p className="text-2xl font-bold text-blue-900">{seasonStats.totalCards}</p>
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
              <p className="text-2xl font-bold text-green-900">{seasonStats.totalAttempts}</p>
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
              <p className="text-sm font-medium text-purple-600">Success Rate</p>
              <p className="text-2xl font-bold text-purple-900">{seasonStats.overallSuccessRate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-bold">👥</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-orange-600">Contestants</p>
              <p className="text-2xl font-bold text-orange-900">{realTimeData?.totalContestants || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Difficulty Breakdown */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Difficulty</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {seasonStats.difficultyStats.map((stat) => (
            <div key={stat.difficulty} className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900 capitalize">
                  {stat.difficulty.toLowerCase()}
                </h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  stat.difficulty === 'EASY' ? 'bg-green-100 text-green-800' :
                  stat.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {stat.cardCount} cards
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Attempts:</span>
                  <span className="font-medium">{stat.attemptCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Success Rate:</span>
                  <span className="font-medium">{stat.successRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
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

      {/* Most/Least Used Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Used Cards</h3>
          <div className="space-y-3">
            {seasonStats.mostUsedCards.slice(0, 5).map((card) => (
              <div key={card.cardId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      card.difficulty === 'EASY' ? 'bg-green-100 text-green-800' :
                      card.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {card.difficulty}
                    </span>
                    <span className="text-sm font-medium">Card #{card.cardNumber}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 truncate">{card.question}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">{card.usageCount}</p>
                  <p className="text-xs text-gray-500">uses</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Least Used Cards</h3>
          <div className="space-y-3">
            {seasonStats.leastUsedCards.slice(0, 5).map((card) => (
              <div key={card.cardId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      card.difficulty === 'EASY' ? 'bg-green-100 text-green-800' :
                      card.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {card.difficulty}
                    </span>
                    <span className="text-sm font-medium">Card #{card.cardNumber}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 truncate">{card.question}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">{card.usageCount}</p>
                  <p className="text-xs text-gray-500">uses</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {realTimeData?.recentActivity && realTimeData.recentActivity.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {realTimeData.recentActivity.slice(0, 10).map((activity: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    activity.isCorrect ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.contestantName}</p>
                    <p className="text-xs text-gray-600">
                      {activity.difficulty} Card #{activity.cardNumber}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${
                    activity.isCorrect ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {activity.isCorrect ? 'Correct' : 'Incorrect'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.attemptedAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}