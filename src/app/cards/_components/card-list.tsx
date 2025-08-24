"use client";

import { useState } from "react";
import type { CardWithUsage, PaginatedResponse } from "~/lib/types";
import { formatDistanceToNow } from "date-fns";
import { CardListLoadingState } from "~/app/_components";

interface CardListProps {
  cards: CardWithUsage[];
  isLoading: boolean;
  pagination?: PaginatedResponse<CardWithUsage>["pagination"];
  onCardSelect: (cardId: string) => void;
  onCardEdit: (card: CardWithUsage) => void;
  onPageChange: (page: number) => void;
}

export function CardList({ 
  cards, 
  isLoading, 
  pagination, 
  onCardSelect, 
  onCardEdit, 
  onPageChange 
}: CardListProps) {
  const [sortBy, setSortBy] = useState<"cardNumber" | "usageCount" | "successRate" | "lastUsed">("cardNumber");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const sortedCards = [...cards].sort((a, b) => {
    let aValue: number | Date | null;
    let bValue: number | Date | null;

    switch (sortBy) {
      case "cardNumber":
        aValue = a.cardNumber;
        bValue = b.cardNumber;
        break;
      case "usageCount":
        aValue = a.usageCount;
        bValue = b.usageCount;
        break;
      case "successRate":
        aValue = a.successRate;
        bValue = b.successRate;
        break;
      case "lastUsed":
        aValue = a.lastUsed;
        bValue = b.lastUsed;
        break;
      default:
        return 0;
    }

    if (aValue === null && bValue === null) return 0;
    if (aValue === null) return 1;
    if (bValue === null) return -1;

    if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
    if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const getSortIcon = (field: typeof sortBy) => {
    if (sortBy !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return sortOrder === "asc" ? (
      <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
      </svg>
    );
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

  if (isLoading) {
    return <CardListLoadingState />;
  }

  if (cards.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No cards yet</h3>
          <p className="text-gray-600">Start building your deck by adding the first card.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Cards ({pagination?.total ?? cards.length})
          </h3>
          
          {/* Sort Controls */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <div className="flex space-x-1">
              <button
                onClick={() => handleSort("cardNumber")}
                className={`px-3 py-1 text-sm rounded-lg flex items-center space-x-1 ${
                  sortBy === "cardNumber" 
                    ? "bg-indigo-100 text-indigo-700" 
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <span>Number</span>
                {getSortIcon("cardNumber")}
              </button>
              <button
                onClick={() => handleSort("usageCount")}
                className={`px-3 py-1 text-sm rounded-lg flex items-center space-x-1 ${
                  sortBy === "usageCount" 
                    ? "bg-indigo-100 text-indigo-700" 
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <span>Usage</span>
                {getSortIcon("usageCount")}
              </button>
              <button
                onClick={() => handleSort("successRate")}
                className={`px-3 py-1 text-sm rounded-lg flex items-center space-x-1 ${
                  sortBy === "successRate" 
                    ? "bg-indigo-100 text-indigo-700" 
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <span>Success</span>
                {getSortIcon("successRate")}
              </button>
            </div>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedCards.map((card) => (
            <div
              key={card.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onCardSelect(card.id)}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-gray-900">#{card.cardNumber}</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getUsageStatusColor(card.usageCount)}`}>
                    {card.usageCount === 0 ? "Unused" : `Used ${card.usageCount}x`}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCardEdit(card);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded"
                  title="Edit card"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>

              {/* Question Preview */}
              <div className="mb-3">
                <p className="text-sm text-gray-900 line-clamp-3">
                  {card.question}
                </p>
              </div>

              {/* Stats */}
              <div className="space-y-2">
                {card.totalAttempts > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Success Rate:</span>
                    <span className={`font-medium ${getSuccessRateColor(card.successRate)}`}>
                      {card.successRate.toFixed(1)}% ({card.correctAttempts}/{card.totalAttempts})
                    </span>
                  </div>
                )}
                
                {card.lastUsed && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Last Used:</span>
                    <span className="text-gray-900">
                      {formatDistanceToNow(new Date(card.lastUsed))} ago
                    </span>
                  </div>
                )}
                
                {!card.lastUsed && card.usageCount === 0 && (
                  <div className="text-sm text-gray-500 italic">
                    Never used
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
              {pagination.total} cards
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={!pagination.hasPrev}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, pagination.page - 2) + i;
                  if (pageNum > pagination.totalPages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => onPageChange(pageNum)}
                      className={`px-3 py-2 text-sm rounded-lg ${
                        pageNum === pagination.page
                          ? "bg-indigo-600 text-white"
                          : "border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={!pagination.hasNext}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}