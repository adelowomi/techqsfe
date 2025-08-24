import { useEffect, useRef, useCallback, useState } from 'react';
import { animationManager, type AnimationOptions } from '../animations/optimized-animation-manager';
import { useResponsiveAnimation } from '../animations/responsive-controller';

export interface UseOptimizedAnimationOptions {
  enabled?: boolean;
  priority?: 'low' | 'medium' | 'high';
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export interface AnimationControls {
  start: (keyframes?: Keyframe[], options?: Partial<KeyframeAnimationOptions>) => Promise<void>;
  cancel: () => void;
  pause: () => void;
  resume: () => void;
  isActive: boolean;
  metrics: {
    activeAnimations: number;
    queuedAnimations: number;
    fps: number;
    memoryUsage: number;
    performanceTier: 'low' | 'medium' | 'high';
  };
}

export function useOptimizedAnimation(
  options: UseOptimizedAnimationOptions = {}
): [React.RefObject<HTMLElement | null>, AnimationControls] {
  const elementRef = useRef<HTMLElement>(null);
  const animationIdRef = useRef<string | null>(null);
  const cleanupTasksRef = useRef<Array<() => void>>([]);
  const [isActive, setIsActive] = useState(false);
  const [metrics, setMetrics] = useState(animationManager.getPerformanceMetrics());

  const {
    shouldEnableAnimations,
    getOptimalDuration,
    getOptimalStagger
  } = useResponsiveAnimation();

  const {
    enabled = shouldEnableAnimations,
    priority = 'medium',
    onComplete,
    onError
  } = options;

  // Update metrics periodically
  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(animationManager.getPerformanceMetrics());
    };

    const interval = setInterval(updateMetrics, 1000);
    return () => clearInterval(interval);
  }, []);

  // Generate unique animation ID
  const generateAnimationId = useCallback(() => {
    return `animation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Add cleanup task
  const addCleanupTask = useCallback((task: () => void) => {
    cleanupTasksRef.current.push(task);
    animationManager.addCleanupTask(task);
  }, []);

  // Start animation
  const start = useCallback(async (
    keyframes?: Keyframe[],
    animationOptions?: Partial<KeyframeAnimationOptions>
  ) => {
    if (!enabled || !elementRef.current) return;

    // Cancel existing animation
    if (animationIdRef.current) {
      animationManager.cancelAnimation(animationIdRef.current);
    }

    const animationId = generateAnimationId();
    animationIdRef.current = animationId;
    setIsActive(true);

    const defaultKeyframes: Keyframe[] = [
      { opacity: 0, transform: 'translateY(20px)' },
      { opacity: 1, transform: 'translateY(0px)' }
    ];

    const defaultOptions: KeyframeAnimationOptions = {
      duration: getOptimalDuration(600),
      easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      fill: 'forwards'
    };

    try {
      // Create optimized animation
      const animationConfig: AnimationOptions = {
        id: animationId,
        element: elementRef.current,
        duration: (() => {
          const duration = animationOptions?.duration || defaultOptions.duration;
          if (typeof duration === 'number') {
            return duration;
          }
          return parseFloat(String(duration)) || 600;
        })(),
        easing: animationOptions?.easing || defaultOptions.easing,
        delay: animationOptions?.delay || 0,
        priority,
        onComplete: () => {
          setIsActive(false);
          animationIdRef.current = null;
          onComplete?.();
        },
        onError: (error) => {
          setIsActive(false);
          animationIdRef.current = null;
          onError?.(error);
        },
        cleanup: () => {
          // Run component-specific cleanup tasks
          cleanupTasksRef.current.forEach(task => {
            try {
              task();
            } catch (error) {
              console.warn('Component cleanup task error:', error);
            }
          });
          cleanupTasksRef.current = [];
        }
      };

      // Apply keyframes to element before starting animation
      if (keyframes || defaultKeyframes) {
        const frames = keyframes || defaultKeyframes;
        const element = elementRef.current;
        
        // Set initial state
        if (frames.length > 0) {
          const initialFrame = frames[0] as any;
          Object.keys(initialFrame).forEach(property => {
            if (property !== 'offset') {
              (element.style as any)[property] = initialFrame[property];
            }
          });
        }
      }

      await animationManager.createAnimation(animationConfig);

    } catch (error) {
      setIsActive(false);
      animationIdRef.current = null;
      onError?.(error as Error);
    }
  }, [enabled, generateAnimationId, getOptimalDuration, priority, onComplete, onError]);

  // Cancel animation
  const cancel = useCallback(() => {
    if (animationIdRef.current) {
      animationManager.cancelAnimation(animationIdRef.current);
      setIsActive(false);
      animationIdRef.current = null;
    }
  }, []);

  // Pause animation
  const pause = useCallback(() => {
    if (animationIdRef.current) {
      animationManager.pauseAnimation(animationIdRef.current);
    }
  }, []);

  // Resume animation
  const resume = useCallback(() => {
    if (animationIdRef.current) {
      animationManager.resumeAnimation(animationIdRef.current);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationIdRef.current) {
        animationManager.cancelAnimation(animationIdRef.current);
      }
      
      // Run cleanup tasks
      cleanupTasksRef.current.forEach(task => {
        try {
          task();
        } catch (error) {
          console.warn('Unmount cleanup task error:', error);
        }
      });
    };
  }, []);

  const controls: AnimationControls = {
    start,
    cancel,
    pause,
    resume,
    isActive,
    metrics
  };

  return [elementRef, controls];
}

// Hook for batch animations with staggered timing
export function useStaggeredAnimations(
  count: number,
  options: UseOptimizedAnimationOptions & { stagger?: number } = {}
): Array<[React.RefObject<HTMLElement | null>, AnimationControls]> {
  const { stagger = 100, ...animationOptions } = options;
  const { getOptimalStagger } = useResponsiveAnimation();
  
  const animations = Array.from({ length: count }, () => 
    useOptimizedAnimation(animationOptions)
  );

  const startAll = useCallback(async (
    keyframes?: Keyframe[],
    animationOpts?: Partial<KeyframeAnimationOptions>
  ) => {
    const optimalStagger = getOptimalStagger(stagger);
    
    for (let i = 0; i < animations.length; i++) {
      const animation = animations[i];
      if (animation) {
        const [, controls] = animation;
        
        setTimeout(() => {
          controls.start(keyframes, animationOpts);
        }, i * optimalStagger);
      }
    }
  }, [animations, getOptimalStagger, stagger]);

  const cancelAll = useCallback(() => {
    animations.forEach((animation) => {
      if (animation) {
        const [, controls] = animation;
        controls.cancel();
      }
    });
  }, [animations]);

  // Add batch controls to first animation
  if (animations.length > 0 && animations[0]) {
    const [, firstControls] = animations[0];
    (firstControls as any).startAll = startAll;
    (firstControls as any).cancelAll = cancelAll;
  }

  return animations;
}

// Hook for scroll-triggered optimized animations
export function useScrollOptimizedAnimation(
  options: UseOptimizedAnimationOptions & {
    threshold?: number;
    rootMargin?: string;
    triggerOnce?: boolean;
  } = {}
): [React.RefObject<HTMLElement | null>, AnimationControls & { isVisible: boolean }] {
  const [elementRef, controls] = useOptimizedAnimation(options);
  const [isVisible, setIsVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const {
    threshold = 0.1,
    rootMargin = '50px',
    triggerOnce = true
  } = options;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setIsVisible(true);
          controls.start();
          
          if (triggerOnce) {
            observerRef.current?.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observerRef.current.observe(element);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [controls, threshold, rootMargin, triggerOnce]);

  return [elementRef, { ...controls, isVisible }];
}