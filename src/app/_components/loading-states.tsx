'use client';

import React from 'react';

// Generic loading spinner
export function LoadingSpinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]} ${className}`} />
  );
}

// Full page loading state
export function PageLoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

// Card loading skeleton
export function CardLoadingSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-6 w-6 bg-gray-200 rounded"></div>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
      <div className="mt-4 flex justify-between">
        <div className="h-8 bg-gray-200 rounded w-20"></div>
        <div className="h-8 bg-gray-200 rounded w-16"></div>
      </div>
    </div>
  );
}

// Deck view loading state
export function DeckLoadingState() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
      </div>

      {/* Status overview skeleton */}
      <div className="rounded-lg border-2 p-6 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="text-center">
              <div className="h-8 bg-gray-200 rounded w-16 mx-auto mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-20 mx-auto animate-pulse"></div>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <div className="h-4 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
          <div className="w-full bg-gray-200 rounded-full h-3 animate-pulse"></div>
        </div>
      </div>

      {/* Card grid skeleton */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="h-6 bg-gray-200 rounded w-40 mb-4 animate-pulse"></div>
        <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-13 gap-1">
          {Array.from({ length: 52 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Game loading state
export function GameLoadingState() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="text-center mb-6">
          <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-6 w-16 bg-gray-200 rounded"></div>
            <div className="h-4 w-20 bg-gray-200 rounded"></div>
          </div>
          <div className="text-center">
            <div className="h-6 bg-gray-200 rounded w-24 mx-auto mb-2"></div>
            <div className="h-16 bg-gray-200 rounded w-full"></div>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 h-12 bg-gray-200 rounded"></div>
          <div className="flex-1 h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}

// Analytics loading state
export function AnalyticsLoadingState() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
      
      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-20"></div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}

// Season list loading state
export function SeasonListLoadingState() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="h-6 bg-gray-200 rounded w-8 mx-auto mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-12 mx-auto"></div>
                </div>
                <div className="text-center">
                  <div className="h-6 bg-gray-200 rounded w-8 mx-auto mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-12 mx-auto"></div>
                </div>
                <div className="text-center">
                  <div className="h-6 bg-gray-200 rounded w-8 mx-auto mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-12 mx-auto"></div>
                </div>
              </div>
            </div>
            <div className="h-10 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Card list loading state
export function CardListLoadingState() {
  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200">
        <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
      </div>
      <div className="divide-y divide-gray-200">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-6 w-6 bg-gray-200 rounded"></div>
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-64 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Inline loading button state
export function LoadingButton({ 
  children, 
  isLoading, 
  disabled, 
  className = '',
  ...props 
}: {
  children: React.ReactNode;
  isLoading: boolean;
  disabled?: boolean;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      disabled={disabled || isLoading}
      className={`
        flex items-center justify-center transition-all duration-200
        ${disabled || isLoading ? 'cursor-not-allowed opacity-50' : ''}
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size="sm" className="mr-2" />
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
}