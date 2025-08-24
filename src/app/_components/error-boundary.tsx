'use client';

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} retry={this.retry} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error;
  retry: () => void;
}

function DefaultErrorFallback({ error, retry }: ErrorFallbackProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Something went wrong
        </h3>
        <p className="text-gray-600 mb-4">
          We encountered an unexpected error. Please try again.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <details className="text-left mb-4 p-3 bg-gray-100 rounded-lg text-sm">
            <summary className="cursor-pointer font-medium text-gray-700 mb-2">
              Error Details (Development)
            </summary>
            <pre className="whitespace-pre-wrap text-red-600 text-xs">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
        <button
          onClick={retry}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

// Specialized error fallbacks for different sections
export function GameErrorFallback({ error, retry }: ErrorFallbackProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 text-center">
      <div className="mb-4">
        <svg
          className="mx-auto h-10 w-10 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Game Error
      </h3>
      <p className="text-gray-600 mb-4">
        There was an issue with the game interface. This might be due to network connectivity or a temporary server issue.
      </p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={retry}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Retry Game
        </button>
        <button
          onClick={() => window.location.reload()}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
}

export function CardErrorFallback({ error, retry }: ErrorFallbackProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 text-center">
      <div className="mb-4">
        <svg
          className="mx-auto h-10 w-10 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Card Management Error
      </h3>
      <p className="text-gray-600 mb-4">
        Unable to load card data. This could be due to a network issue or server problem.
      </p>
      <button
        onClick={retry}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
      >
        Reload Cards
      </button>
    </div>
  );
}

export function AnalyticsErrorFallback({ error, retry }: ErrorFallbackProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 text-center">
      <div className="mb-4">
        <svg
          className="mx-auto h-10 w-10 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Analytics Error
      </h3>
      <p className="text-gray-600 mb-4">
        Failed to load analytics data. The statistics may be temporarily unavailable.
      </p>
      <button
        onClick={retry}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
      >
        Reload Analytics
      </button>
    </div>
  );
}