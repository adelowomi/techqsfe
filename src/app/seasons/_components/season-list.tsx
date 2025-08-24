"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import type { SeasonWithStats, Season } from "~/lib/types";
import { formatDistanceToNow } from "date-fns";

interface SeasonListProps {
  seasons: SeasonWithStats[];
  onSeasonSelect: (seasonId: string) => void;
  onSeasonCreate: () => void;
  onSeasonEdit: (season: Season) => void;
  onRefresh: () => void;
}

export function SeasonList({
  seasons,
  onSeasonSelect,
  onSeasonCreate,
  onSeasonEdit,
  onRefresh,
}: SeasonListProps) {
  const [deletingSeasonId, setDeletingSeasonId] = useState<string | null>(null);

  const deleteMutation = api.season.delete.useMutation({
    onSuccess: () => {
      setDeletingSeasonId(null);
      onRefresh();
    },
    onError: (error) => {
      console.error("Failed to delete season:", error);
      setDeletingSeasonId(null);
    },
  });

  const handleDelete = async (seasonId: string) => {
    if (confirm("Are you sure you want to delete this season? This action cannot be undone.")) {
      setDeletingSeasonId(seasonId);
      await deleteMutation.mutateAsync({ id: seasonId });
    }
  };

  const getDeckStatusColor = (count: number, total: number) => {
    if (total === 0) return "bg-gray-200";
    const percentage = (count / total) * 100;
    if (percentage < 25) return "bg-red-200";
    if (percentage < 50) return "bg-yellow-200";
    if (percentage < 75) return "bg-blue-200";
    return "bg-green-200";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">All Seasons</h2>
          <p className="text-gray-600">
            {seasons.length} season{seasons.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <button
          onClick={onSeasonCreate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Create New Season
        </button>
      </div>

      {/* Empty State */}
      {seasons.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No seasons</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first season.
          </p>
          <div className="mt-6">
            <button
              onClick={onSeasonCreate}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Create Season
            </button>
          </div>
        </div>
      )}

      {/* Seasons Grid */}
      {seasons.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {seasons.map((season) => (
            <div
              key={season.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {season.name}
                    </h3>
                    {season.description && (
                      <p className="text-sm text-gray-600 mb-2">
                        {season.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      Created {formatDistanceToNow(new Date(season.createdAt))} ago
                      {season.createdBy.name && ` by ${season.createdBy.name}`}
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => onSeasonEdit(season)}
                      className="text-gray-400 hover:text-gray-600 p-1"
                      title="Edit season"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(season.id)}
                      disabled={deletingSeasonId === season.id}
                      className="text-gray-400 hover:text-red-600 p-1 disabled:opacity-50"
                      title="Delete season"
                    >
                      {deletingSeasonId === season.id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></div>
                      ) : (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Statistics */}
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Cards:</span>
                    <span className="font-medium">{season.totalCards}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Attempts:</span>
                    <span className="font-medium">{season.totalAttempts}</span>
                  </div>
                </div>

                {/* Deck Status */}
                <div className="space-y-2 mb-4">
                  <h4 className="text-sm font-medium text-gray-700">Deck Status</h4>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Easy:</span>
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${getDeckStatusColor(season.easyDeckCount, 52)}`}></div>
                        <span>{season.easyDeckCount}/52</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Medium:</span>
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${getDeckStatusColor(season.mediumDeckCount, 52)}`}></div>
                        <span>{season.mediumDeckCount}/52</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Hard:</span>
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${getDeckStatusColor(season.hardDeckCount, 52)}`}></div>
                        <span>{season.hardDeckCount}/52</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <button
                  onClick={() => onSeasonSelect(season.id)}
                  className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  View Dashboard
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}