"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { SeasonList } from "./season-list";
import { SeasonForm } from "./season-form";
import { SeasonDashboard } from "./season-dashboard";
import type { Season } from "~/lib/types";

type ViewMode = "list" | "form" | "dashboard";

export function SeasonsPageClient() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);

  const { data: seasons, isLoading, refetch } = api.season.getAll.useQuery();

  const handleSeasonSelect = (seasonId: string) => {
    setSelectedSeasonId(seasonId);
    setViewMode("dashboard");
  };

  const handleSeasonCreate = () => {
    setEditingSeason(null);
    setViewMode("form");
  };

  const handleSeasonEdit = (season: Season) => {
    setEditingSeason(season);
    setViewMode("form");
  };

  const handleFormSuccess = () => {
    setViewMode("list");
    setEditingSeason(null);
    void refetch();
  };

  const handleFormCancel = () => {
    setViewMode("list");
    setEditingSeason(null);
  };

  const handleBackToList = () => {
    setViewMode("list");
    setSelectedSeasonId(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (viewMode === "form") {
    return (
      <SeasonForm
        season={editingSeason}
        onSuccess={handleFormSuccess}
        onCancel={handleFormCancel}
      />
    );
  }

  if (viewMode === "dashboard" && selectedSeasonId) {
    const selectedSeason = seasons?.find(s => s.id === selectedSeasonId);
    if (!selectedSeason) {
      setViewMode("list");
      return null;
    }

    return (
      <SeasonDashboard
        season={selectedSeason}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <SeasonList
      seasons={seasons || []}
      onSeasonSelect={handleSeasonSelect}
      onSeasonCreate={handleSeasonCreate}
      onSeasonEdit={handleSeasonEdit}
      onRefresh={() => void refetch()}
    />
  );
}