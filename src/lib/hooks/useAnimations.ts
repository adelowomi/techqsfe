// React hook for animation utilities

import { useEffect, useRef, useCallback } from 'react';
import { 
  ScrollAnimationController, 
  PerformanceMonitor, 
  AccessibilityHandler,
  CardPhysics 
} from '../animations';
import type { AnimationType, CardElement } from '../animations/types';

export function useAnimations() {
  const scrollController = useRef<ScrollAnimationController | null>(null);
  const performanceMonitor = useRef<PerformanceMonitor | null>(null);
  const accessibilityHandler = useRef<AccessibilityHandler | null>(null);

  useEffect(() => {
    // Initialize controllers
    scrollController.current = new ScrollAnimationController();
    performanceMonitor.current = new PerformanceMonitor();
    accessibilityHandler.current = AccessibilityHandler.getInstance();

    // Start performance monitoring
    performanceMonitor.current.startMonitoring();

    // Setup accessibility
    accessibilityHandler.current.respectMotionPreferences();
    accessibilityHandler.current.ensureKeyboardNavigation();
    accessibilityHandler.current.provideAlternativeContent();

    // Cleanup on unmount
    return () => {
      scrollController.current?.destroy();
      performanceMonitor.current?.stopMonitoring();
    };
  }, []);

  const registerScrollAnimation = useCallback((element: Element, config: any) => {
    scrollController.current?.registerAnimation(element, config);
  }, []);

  const createFadeInAnimation = useCallback((element: Element, options?: any) => {
    scrollController.current?.createFadeInAnimation(element, options);
  }, []);

  const createSlideInAnimation = useCallback((element: Element, direction?: any, options?: any) => {
    scrollController.current?.createSlideInAnimation(element, direction, options);
  }, []);

  const createStaggeredAnimation = useCallback((elements: Element[], type?: any, delay?: number) => {
    scrollController.current?.createStaggeredAnimation(elements, type, delay);
  }, []);

  const animateCards = useCallback((cards: CardElement[], type: AnimationType) => {
    switch (type) {
      case 'shuffle':
        return CardPhysics.shuffle(cards);
      case 'deal':
        return CardPhysics.deal(cards, []);
      case 'flip':
        return cards.map(card => CardPhysics.flip(card));
      case 'stack':
        return CardPhysics.stack(cards);
      case 'hover':
        return cards.map(card => CardPhysics.hover(card));
      default:
        return [];
    }
  }, []);

  const optimizeForGPU = useCallback((element: HTMLElement) => {
    CardPhysics.optimizeForGPU(element);
  }, []);

  const removeGPUOptimization = useCallback((element: HTMLElement) => {
    CardPhysics.removeGPUOptimization(element);
  }, []);

  const getCurrentFPS = useCallback(() => {
    return performanceMonitor.current?.getCurrentFPS() || 60;
  }, []);

  const getPerformanceTier = useCallback(() => {
    return performanceMonitor.current?.getPerformanceTier() || 'medium';
  }, []);

  const isReducedMotionPreferred = useCallback(() => {
    return accessibilityHandler.current?.isReducedMotionPreferred() || false;
  }, []);

  const createAnimationDescription = useCallback((element: HTMLElement, type: string, description?: string) => {
    accessibilityHandler.current?.createAnimationDescription(element, type, description);
  }, []);

  return {
    // Scroll animations
    registerScrollAnimation,
    createFadeInAnimation,
    createSlideInAnimation,
    createStaggeredAnimation,
    
    // Card animations
    animateCards,
    optimizeForGPU,
    removeGPUOptimization,
    
    // Performance monitoring
    getCurrentFPS,
    getPerformanceTier,
    
    // Accessibility
    isReducedMotionPreferred,
    createAnimationDescription,
  };
}