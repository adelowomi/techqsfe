/**
 * Lazy Loading Utility for Animation Components
 * Handles lazy loading of below-the-fold animation content
 */

import React, { useEffect, useRef, useState } from 'react';
import { ProgressiveEnhancement } from './progressive-enhancement';

interface LazyLoadOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  fallback?: React.ReactNode;
  placeholder?: React.ReactNode;
}

interface LazyLoadState {
  isVisible: boolean;
  hasLoaded: boolean;
  isLoading: boolean;
  error?: Error;
}

/**
 * Hook for lazy loading animation components
 */
export function useLazyAnimation(options: LazyLoadOptions = {}) {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    triggerOnce = true,
    fallback = null,
    placeholder = null
  } = options;

  const [state, setState] = useState<LazyLoadState>({
    isVisible: false,
    hasLoaded: false,
    isLoading: false
  });

  const elementRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Check if IntersectionObserver is supported
    const featureSupport = ProgressiveEnhancement.getFeatureSupport();
    if (!featureSupport.intersectionObserver) {
      // Fallback: load immediately if no IntersectionObserver support
      setState(prev => ({ ...prev, isVisible: true, hasLoaded: true }));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          setState(prev => ({ 
            ...prev, 
            isVisible: true, 
            isLoading: true 
          }));

          // Simulate loading delay for smooth UX
          setTimeout(() => {
            setState(prev => ({ 
              ...prev, 
              hasLoaded: true, 
              isLoading: false 
            }));
          }, 100);

          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setState(prev => ({ ...prev, isVisible: false }));
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [threshold, rootMargin, triggerOnce]);

  return {
    ref: elementRef,
    isVisible: state.isVisible,
    hasLoaded: state.hasLoaded,
    isLoading: state.isLoading,
    shouldRender: state.isVisible || state.hasLoaded,
    fallback,
    placeholder
  };
}

/**
 * Lazy loading wrapper component for animations
 */
interface LazyAnimationWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  placeholder?: React.ReactNode;
  className?: string;
  options?: LazyLoadOptions;
}

export function LazyAnimationWrapper({
  children,
  fallback = null,
  placeholder = null,
  className = '',
  options = {}
}: LazyAnimationWrapperProps) {
  const { ref, shouldRender, isLoading, hasLoaded } = useLazyAnimation({
    fallback,
    placeholder,
    ...options
  });

  // Check if animations should be enabled
  const shouldAnimate = ProgressiveEnhancement.shouldEnableAnimations();

  return (
    <div 
      ref={ref as React.RefObject<HTMLDivElement>} 
      className={`lazy-animation-wrapper ${className}`}
      data-loaded={hasLoaded}
      data-loading={isLoading}
    >
      {shouldRender ? (
        shouldAnimate ? children : (fallback || children)
      ) : (
        placeholder || (
          <div className="animation-placeholder" style={{ minHeight: '200px' }}>
            <div className="placeholder-content">
              Loading animation...
            </div>
          </div>
        )
      )}
    </div>
  );
}

/**
 * Preload animation components that are likely to be needed
 */
export class AnimationPreloader {
  private static preloadedComponents = new Set<string>();

  static async preloadComponent(componentName: string): Promise<void> {
    if (this.preloadedComponents.has(componentName)) {
      return;
    }

    try {
      // Dynamic import based on component name
      switch (componentName) {
        case 'GameDemo':
          await import('./components/GameDemo');
          break;
        case 'FeatureShowcase':
          await import('./components/FeatureShowcase');
          break;
        case 'DeckShowcase':
          await import('./components/DeckShowcase');
          break;
        case 'ProgressChart':
          await import('./components/ProgressChart');
          break;
        case 'SeasonCard':
          await import('./components/SeasonCard');
          break;
        default:
          console.warn(`Unknown component for preloading: ${componentName}`);
          return;
      }

      this.preloadedComponents.add(componentName);
      console.log(`Preloaded animation component: ${componentName}`);
    } catch (error) {
      console.error(`Failed to preload component ${componentName}:`, error);
    }
  }

  static async preloadBelowFoldComponents(): Promise<void> {
    const componentsToPreload = [
      'GameDemo',
      'FeatureShowcase', 
      'DeckShowcase',
      'ProgressChart',
      'SeasonCard'
    ];

    const preloadPromises = componentsToPreload.map(component => 
      this.preloadComponent(component)
    );

    await Promise.allSettled(preloadPromises);
  }

  static isComponentPreloaded(componentName: string): boolean {
    return this.preloadedComponents.has(componentName);
  }
}

/**
 * Hook for managing animation loading states
 */
export function useAnimationLoader() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setLoading = (key: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: loading }));
  };

  const isLoading = (key: string) => loadingStates[key] ?? false;
  const isAnyLoading = Object.values(loadingStates).some(Boolean);

  return {
    setLoading,
    isLoading,
    isAnyLoading,
    loadingStates
  };
}