'use client';

import React from 'react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  type?: 'error' | 'warning' | 'info';
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function ErrorMessage({ 
  title, 
  message, 
  type = 'error', 
  onRetry, 
  onDismiss,
  className = '' 
}: ErrorMessageProps) {
  const getTypeStyles = () => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-red-50 border-red-200 text-red-800';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'error':
        return (
          <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'info':
        return (
          <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getTypeStyles()} ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className="text-sm font-medium mb-1">
              {title}
            </h3>
          )}
          <p className="text-sm">
            {message}
          </p>
          {(onRetry || onDismiss) && (
            <div className="mt-3 flex gap-2">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className={`
                    text-sm font-medium px-3 py-1 rounded transition-colors
                    ${type === 'error' ? 'text-red-700 hover:bg-red-100' : ''}
                    ${type === 'warning' ? 'text-yellow-700 hover:bg-yellow-100' : ''}
                    ${type === 'info' ? 'text-blue-700 hover:bg-blue-100' : ''}
                  `}
                >
                  Try Again
                </button>
              )}
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="text-sm font-medium text-gray-600 hover:text-gray-800 px-3 py-1 rounded transition-colors"
                >
                  Dismiss
                </button>
              )}
            </div>
          )}
        </div>
        {onDismiss && (
          <div className="flex-shrink-0 ml-3">
            <button
              onClick={onDismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Specialized error messages for common scenarios
export function NetworkErrorMessage({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorMessage
      title="Connection Error"
      message="Unable to connect to the server. Please check your internet connection and try again."
      type="error"
      onRetry={onRetry}
    />
  );
}

export function EmptyDeckMessage({ difficulty, onAddCard }: { difficulty: string; onAddCard?: () => void }) {
  return (
    <ErrorMessage
      title="Empty Deck"
      message={`The ${difficulty.toLowerCase()} deck has no cards available. Add some cards to start drawing.`}
      type="warning"
      onRetry={onAddCard}
    />
  );
}

export function DeckExhaustedMessage({ difficulty, onReset }: { difficulty: string; onReset?: () => void }) {
  return (
    <ErrorMessage
      title="Deck Exhausted"
      message={`All cards in the ${difficulty.toLowerCase()} deck have been used. You can reset the deck to reuse cards.`}
      type="info"
      onRetry={onReset}
    />
  );
}

export function ValidationErrorMessage({ errors }: { errors: string[] }) {
  return (
    <ErrorMessage
      title="Validation Error"
      message={errors.length === 1 ? errors[0]! : `Please fix the following issues: ${errors.join(', ')}`}
      type="error"
    />
  );
}

export function UnauthorizedErrorMessage() {
  return (
    <ErrorMessage
      title="Access Denied"
      message="You don't have permission to perform this action. Please contact an administrator if you believe this is an error."
      type="error"
    />
  );
}

export function ServerErrorMessage({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorMessage
      title="Server Error"
      message="An unexpected server error occurred. Please try again in a moment."
      type="error"
      onRetry={onRetry}
    />
  );
}

// Toast-style error message for temporary notifications
export function ToastErrorMessage({ 
  message, 
  isVisible, 
  onDismiss 
}: { 
  message: string; 
  isVisible: boolean; 
  onDismiss: () => void; 
}) {
  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm text-red-800">{message}</p>
          </div>
          <div className="flex-shrink-0 ml-3">
            <button
              onClick={onDismiss}
              className="text-red-400 hover:text-red-600 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}