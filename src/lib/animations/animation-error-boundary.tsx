/**
 * Animation Error Boundary
 * Provides fallback content when animations fail
 */

import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface AnimationErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

interface AnimationErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showErrorDetails?: boolean;
}

class AnimationErrorBoundary extends Component<
  AnimationErrorBoundaryProps,
  AnimationErrorBoundaryState
> {
  constructor(props: AnimationErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): AnimationErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error for monitoring
    console.error('Animation Error Boundary caught an error:', error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Send to error tracking service in production
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      // Example: Send to error tracking service
      if ((window as any).gtag) {
        (window as any).gtag('event', 'exception', {
          description: `Animation Error: ${error.message}`,
          fatal: false
        });
      }
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="animation-error-fallback">
          <div className="error-content">
            <h3>Animation Unavailable</h3>
            <p>
              The animation content couldn't be loaded. 
              The page will continue to work normally.
            </p>
            
            {this.props.showErrorDetails && process.env.NODE_ENV === 'development' && (
              <details className="error-details">
                <summary>Error Details (Development Only)</summary>
                <pre>
                  {this.state.error?.message}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            
            <button 
              onClick={() => this.setState({ hasError: false })}
              className="retry-button"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook for handling animation errors in functional components
 */
export function useAnimationErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    setError(error);
    console.error('Animation error:', error);
    
    // Reset error after a delay
    setTimeout(() => setError(null), 5000);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError,
    clearError,
    hasError: error !== null
  };
}

/**
 * Higher-order component for wrapping animations with error boundaries
 */
export function withAnimationErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  const WrappedComponent = (props: P) => (
    <AnimationErrorBoundary fallback={fallback}>
      <Component {...props} />
    </AnimationErrorBoundary>
  );

  WrappedComponent.displayName = `withAnimationErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Safe animation wrapper that catches and handles animation failures
 */
interface SafeAnimationWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
  onError?: (error: Error) => void;
}

export function SafeAnimationWrapper({
  children,
  fallback,
  className = '',
  onError
}: SafeAnimationWrapperProps) {
  const { error, handleError, clearError } = useAnimationErrorHandler();

  React.useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  if (error) {
    return (
      <div className={`safe-animation-fallback ${className}`}>
        {fallback || (
          <div className="animation-fallback-content">
            <p>Animation content is temporarily unavailable.</p>
            <button onClick={clearError} className="retry-animation">
              Retry
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`safe-animation-wrapper ${className}`}>
      {children}
    </div>
  );
}

export default AnimationErrorBoundary;