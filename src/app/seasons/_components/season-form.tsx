"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import type { Season } from "~/lib/types";

interface SeasonFormProps {
  season?: Season | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function SeasonForm({ season, onSuccess, onCancel }: SeasonFormProps) {
  const [name, setName] = useState(season?.name || "");
  const [description, setDescription] = useState(season?.description || "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = api.season.create.useMutation({
    onSuccess: () => {
      onSuccess();
    },
    onError: (error) => {
      setErrors({ general: error.message });
    },
  });

  const updateMutation = api.season.update.useMutation({
    onSuccess: () => {
      onSuccess();
    },
    onError: (error) => {
      setErrors({ general: error.message });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Basic validation
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = "Season name is required";
    }
    if (name.length > 100) {
      newErrors.name = "Season name must be less than 100 characters";
    }
    if (description.length > 500) {
      newErrors.description = "Description must be less than 500 characters";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const data = {
      name: name.trim(),
      description: description.trim() || undefined,
    };

    if (season) {
      await updateMutation.mutateAsync({
        id: season.id,
        ...data,
      });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {season ? "Edit Season" : "Create New Season"}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {season 
              ? "Update the season information below."
              : "Create a new season with three difficulty decks (Easy, Medium, Hard)."
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{errors.general}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Season Name *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.name ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="e.g., Season 1, Spring 2024, etc."
              maxLength={100}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              {name.length}/100 characters
            </p>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.description ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="Optional description for this season..."
              maxLength={500}
              disabled={isLoading}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              {description.length}/500 characters
            </p>
          </div>

          {!season && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-800">
                    Creating a new season will automatically set up three empty card decks: Easy, Medium, and Hard. 
                    Each deck can hold up to 52 cards.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center"
            >
              {isLoading && (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              )}
              {season ? "Update Season" : "Create Season"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}