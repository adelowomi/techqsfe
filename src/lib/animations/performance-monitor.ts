// Performance monitoring for animations

import type { PerformanceError } from './types';

export class PerformanceMonitor {
  private frameCount: number = 0;
  private lastTime: number = 0;
  private fps: number = 60;
  private memoryUsage: number = 0;
  private isMonitoring: boolean = false;
  private callbacks: Map<string, (error: PerformanceError) => void> = new Map();
  private rafId: number | null = null;
  private performanceTier: 'low' | 'medium' | 'high' = 'medium';
  private activeAnimations: Set<string> = new Set();
  private animationQueue: Array<() => void> = [];
  private isProcessingQueue: boolean = false;

  // Performance thresholds
  private readonly FPS_THRESHOLD = 30;
  private readonly MEMORY_THRESHOLD = 50 * 1024 * 1024; // 50MB
  private readonly MAX_CONCURRENT_ANIMATIONS = {
    low: 2,
    medium: 5,
    high: 10
  };

  constructor() {
    this.measureFrame = this.measureFrame.bind(this);
    this.processAnimationQueue = this.processAnimationQueue.bind(this);
    this.performanceTier = this.getPerformanceTier();
  }

  /**
   * Starts performance monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.lastTime = performance.now();
    this.frameCount = 0;
    this.measureFrame();
  }

  /**
   * Stops performance monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Registers a callback for performance issues
   */
  onPerformanceIssue(id: string, callback: (error: PerformanceError) => void): void {
    this.callbacks.set(id, callback);
  }

  /**
   * Unregisters a performance callback
   */
  offPerformanceIssue(id: string): void {
    this.callbacks.delete(id);
  }

  /**
   * Gets current FPS
   */
  getCurrentFPS(): number {
    return this.fps;
  }

  /**
   * Gets current memory usage (if available)
   */
  getCurrentMemoryUsage(): number {
    return this.memoryUsage;
  }

  /**
   * Checks if GPU acceleration is available
   */
  isGPUAccelerated(): boolean {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  }

  /**
   * Gets device performance tier
   */
  getPerformanceTier(): 'low' | 'medium' | 'high' {
    const hardwareConcurrency = navigator.hardwareConcurrency || 2;
    const memory = (navigator as any).deviceMemory || 4;
    
    if (hardwareConcurrency >= 8 && memory >= 8) {
      return 'high';
    } else if (hardwareConcurrency >= 4 && memory >= 4) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Measures frame rate and triggers callbacks if needed
   */
  private measureFrame(): void {
    if (!this.isMonitoring) return;

    const currentTime = performance.now();
    this.frameCount++;

    // Calculate FPS every second
    if (currentTime - this.lastTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
      this.frameCount = 0;
      this.lastTime = currentTime;

      // Check for low FPS
      if (this.fps < this.FPS_THRESHOLD) {
        this.triggerPerformanceIssue({
          type: 'low-fps',
          threshold: this.FPS_THRESHOLD,
          current: this.fps
        });
      }

      // Check memory usage if available
      this.checkMemoryUsage();
    }

    this.rafId = requestAnimationFrame(this.measureFrame);
  }

  /**
   * Checks memory usage and triggers callback if needed
   */
  private checkMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.memoryUsage = memory.usedJSHeapSize;

      if (this.memoryUsage > this.MEMORY_THRESHOLD) {
        this.triggerPerformanceIssue({
          type: 'high-memory',
          threshold: this.MEMORY_THRESHOLD,
          current: this.memoryUsage
        });
      }
    }
  }

  /**
   * Triggers performance issue callbacks
   */
  private triggerPerformanceIssue(error: PerformanceError): void {
    this.callbacks.forEach(callback => {
      try {
        callback(error);
      } catch (err) {
        console.warn('Performance callback error:', err);
      }
    });
  }

  /**
   * Optimizes animations based on performance
   */
  static optimizeForPerformance(tier: 'low' | 'medium' | 'high'): {
    reduceAnimations: boolean;
    disableParticles: boolean;
    lowerQuality: boolean;
    maxConcurrentAnimations: number;
  } {
    switch (tier) {
      case 'low':
        return {
          reduceAnimations: true,
          disableParticles: true,
          lowerQuality: true,
          maxConcurrentAnimations: 2
        };
      case 'medium':
        return {
          reduceAnimations: false,
          disableParticles: false,
          lowerQuality: false,
          maxConcurrentAnimations: 5
        };
      case 'high':
      default:
        return {
          reduceAnimations: false,
          disableParticles: false,
          lowerQuality: false,
          maxConcurrentAnimations: 10
        };
    }
  }

  /**
   * Debounces animation triggers to prevent performance issues
   */
  static debounceAnimation(
    fn: Function,
    delay: number = 16
  ): (...args: any[]) => void {
    let timeoutId: number;
    
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => fn.apply(null, args), delay);
    };
  }

  /**
   * Throttles animation updates using requestAnimationFrame
   */
  static throttleAnimation(fn: Function): (...args: any[]) => void {
    let rafId: number | null = null;
    
    return (...args: any[]) => {
      if (rafId) return;
      
      rafId = requestAnimationFrame(() => {
        fn.apply(null, args);
        rafId = null;
      });
    };
  }

  /**
   * Registers an active animation
   */
  registerAnimation(id: string): boolean {
    const maxConcurrent = this.MAX_CONCURRENT_ANIMATIONS[this.performanceTier];
    
    if (this.activeAnimations.size >= maxConcurrent) {
      return false; // Too many animations running
    }
    
    this.activeAnimations.add(id);
    return true;
  }

  /**
   * Unregisters an active animation
   */
  unregisterAnimation(id: string): void {
    this.activeAnimations.delete(id);
    
    // Process queued animations if space is available
    if (!this.isProcessingQueue && this.animationQueue.length > 0) {
      this.processAnimationQueue();
    }
  }

  /**
   * Queues an animation for later execution
   */
  queueAnimation(animationFn: () => void): void {
    this.animationQueue.push(animationFn);
    
    if (!this.isProcessingQueue) {
      this.processAnimationQueue();
    }
  }

  /**
   * Processes the animation queue
   */
  private processAnimationQueue(): void {
    if (this.isProcessingQueue || this.animationQueue.length === 0) return;
    
    this.isProcessingQueue = true;
    
    const processNext = () => {
      const maxConcurrent = this.MAX_CONCURRENT_ANIMATIONS[this.performanceTier];
      
      while (
        this.animationQueue.length > 0 && 
        this.activeAnimations.size < maxConcurrent
      ) {
        const animationFn = this.animationQueue.shift();
        if (animationFn) {
          try {
            animationFn();
          } catch (error) {
            console.warn('Queued animation error:', error);
          }
        }
      }
      
      if (this.animationQueue.length > 0) {
        // Check again in next frame
        requestAnimationFrame(processNext);
      } else {
        this.isProcessingQueue = false;
      }
    };
    
    requestAnimationFrame(processNext);
  }

  /**
   * Gets the number of active animations
   */
  getActiveAnimationCount(): number {
    return this.activeAnimations.size;
  }

  /**
   * Gets the number of queued animations
   */
  getQueuedAnimationCount(): number {
    return this.animationQueue.length;
  }

  /**
   * Clears all queued animations
   */
  clearAnimationQueue(): void {
    this.animationQueue = [];
    this.isProcessingQueue = false;
  }

  /**
   * Forces garbage collection if available (for testing)
   */
  forceGarbageCollection(): void {
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }
  }

  /**
   * Optimizes DOM for animations
   */
  static optimizeElementForAnimation(element: HTMLElement): void {
    // Enable GPU acceleration
    element.style.willChange = 'transform, opacity';
    element.style.transform = 'translateZ(0)';
    element.style.backfaceVisibility = 'hidden';
    
    // Optimize rendering
    element.style.contain = 'layout style paint';
  }

  /**
   * Removes animation optimizations from DOM element
   */
  static removeAnimationOptimizations(element: HTMLElement): void {
    element.style.willChange = 'auto';
    element.style.transform = '';
    element.style.backfaceVisibility = '';
    element.style.contain = '';
  }

  /**
   * Creates a memory-efficient animation cleanup function
   */
  static createAnimationCleanup(): {
    addCleanupTask: (task: () => void) => void;
    cleanup: () => void;
  } {
    const cleanupTasks: Array<() => void> = [];
    
    return {
      addCleanupTask: (task: () => void) => {
        cleanupTasks.push(task);
      },
      cleanup: () => {
        cleanupTasks.forEach(task => {
          try {
            task();
          } catch (error) {
            console.warn('Cleanup task error:', error);
          }
        });
        cleanupTasks.length = 0; // Clear array efficiently
      }
    };
  }

  /**
   * Batches DOM updates for better performance
   */
  static batchDOMUpdates(updates: Array<() => void>): void {
    requestAnimationFrame(() => {
      updates.forEach(update => {
        try {
          update();
        } catch (error) {
          console.warn('Batched DOM update error:', error);
        }
      });
    });
  }

  /**
   * Creates a performance-aware animation scheduler
   */
  static createAnimationScheduler(performanceTier: 'low' | 'medium' | 'high') {
    const frameInterval = performanceTier === 'low' ? 2 : 1; // Skip frames on low-end devices
    let frameCount = 0;
    
    return (callback: () => void) => {
      const scheduleFrame = () => {
        frameCount++;
        
        if (frameCount % frameInterval === 0) {
          callback();
        }
        
        requestAnimationFrame(scheduleFrame);
      };
      
      requestAnimationFrame(scheduleFrame);
    };
  }
}