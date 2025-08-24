// Optimized animation manager with memory cleanup and performance monitoring

import { PerformanceMonitor } from './performance-monitor';
import type { PerformanceError } from './types';

export interface AnimationOptions {
  id: string;
  element: HTMLElement;
  duration: number;
  easing?: string;
  delay?: number;
  onComplete?: () => void;
  onError?: (error: Error) => void;
  priority?: 'low' | 'medium' | 'high';
  cleanup?: () => void;
}

export interface AnimationState {
  id: string;
  animation: Animation | null;
  element: HTMLElement;
  isActive: boolean;
  startTime: number;
  cleanup?: () => void;
}

export class OptimizedAnimationManager {
  private static instance: OptimizedAnimationManager;
  private performanceMonitor: PerformanceMonitor;
  private activeAnimations: Map<string, AnimationState> = new Map();
  private animationQueue: Array<AnimationOptions> = [];
  private isProcessingQueue: boolean = false;
  private cleanupTasks: Set<() => void> = new Set();
  private rafId: number | null = null;
  private performanceTier: 'low' | 'medium' | 'high' = 'medium';
  private maxConcurrentAnimations: number = 5;

  private constructor() {
    this.performanceMonitor = new PerformanceMonitor();
    this.performanceTier = this.performanceMonitor.getPerformanceTier();
    this.maxConcurrentAnimations = this.getMaxConcurrentAnimations();
    
    this.setupPerformanceMonitoring();
    this.startCleanupCycle();
  }

  static getInstance(): OptimizedAnimationManager {
    if (!OptimizedAnimationManager.instance) {
      OptimizedAnimationManager.instance = new OptimizedAnimationManager();
    }
    return OptimizedAnimationManager.instance;
  }

  private setupPerformanceMonitoring(): void {
    this.performanceMonitor.startMonitoring();
    
    this.performanceMonitor.onPerformanceIssue('animation-manager', (error: PerformanceError) => {
      this.handlePerformanceIssue(error);
    });
  }

  private handlePerformanceIssue(error: PerformanceError): void {
    switch (error.type) {
      case 'low-fps':
        this.reduceAnimationComplexity();
        break;
      case 'high-memory':
        this.performMemoryCleanup();
        break;
      case 'gpu-unavailable':
        this.disableGPUAcceleration();
        break;
    }
  }

  private reduceAnimationComplexity(): void {
    // Cancel low-priority animations
    const lowPriorityAnimations = Array.from(this.activeAnimations.values())
      .filter(state => state.animation && this.getAnimationPriority(state.id) === 'low');
    
    lowPriorityAnimations.forEach(state => {
      this.cancelAnimation(state.id);
    });

    // Reduce max concurrent animations
    this.maxConcurrentAnimations = Math.max(1, Math.floor(this.maxConcurrentAnimations * 0.7));
  }

  private performMemoryCleanup(): void {
    // Force cleanup of completed animations
    this.cleanupCompletedAnimations();
    
    // Clear animation queue if too large
    if (this.animationQueue.length > 10) {
      this.animationQueue = this.animationQueue.slice(-5); // Keep only last 5
    }
    
    // Run all cleanup tasks
    this.runCleanupTasks();
    
    // Force garbage collection if available
    this.performanceMonitor.forceGarbageCollection();
  }

  private disableGPUAcceleration(): void {
    this.activeAnimations.forEach(state => {
      if (state.element) {
        PerformanceMonitor.removeAnimationOptimizations(state.element);
      }
    });
  }

  private getMaxConcurrentAnimations(): number {
    const tierLimits = {
      low: 2,
      medium: 5,
      high: 10
    };
    return tierLimits[this.performanceTier];
  }

  private getAnimationPriority(animationId: string): 'low' | 'medium' | 'high' {
    // Extract priority from animation options or default to medium
    const queuedAnimation = this.animationQueue.find(opt => opt.id === animationId);
    return queuedAnimation?.priority || 'medium';
  }

  /**
   * Creates and starts an animation with performance optimizations
   */
  async createAnimation(options: AnimationOptions): Promise<void> {
    const { id, element, duration, easing = 'ease', delay = 0, onComplete, onError, cleanup } = options;

    // Check if we can start immediately or need to queue
    if (this.activeAnimations.size >= this.maxConcurrentAnimations) {
      this.queueAnimation(options);
      return;
    }

    try {
      // Optimize element for animation
      PerformanceMonitor.optimizeElementForAnimation(element);

      // Register with performance monitor
      if (!this.performanceMonitor.registerAnimation(id)) {
        this.queueAnimation(options);
        return;
      }

      // Create animation state
      const animationState: AnimationState = {
        id,
        animation: null,
        element,
        isActive: true,
        startTime: performance.now(),
        cleanup
      };

      this.activeAnimations.set(id, animationState);

      // Create the actual animation
      const keyframes = this.generateOptimizedKeyframes(element);
      const animationOptions: KeyframeAnimationOptions = {
        duration: this.getOptimizedDuration(duration),
        easing,
        delay,
        fill: 'forwards'
      };

      const animation = element.animate(keyframes, animationOptions);
      animationState.animation = animation;

      // Handle animation completion
      animation.addEventListener('finish', () => {
        this.handleAnimationComplete(id, onComplete);
      });

      // Handle animation errors
      animation.addEventListener('cancel', () => {
        this.handleAnimationError(id, new Error('Animation was cancelled'), onError);
      });

    } catch (error) {
      this.handleAnimationError(id, error as Error, onError);
    }
  }

  /**
   * Cancels an active animation
   */
  cancelAnimation(id: string): void {
    const animationState = this.activeAnimations.get(id);
    if (!animationState) return;

    if (animationState.animation) {
      animationState.animation.cancel();
    }

    this.cleanupAnimation(id);
  }

  /**
   * Pauses an active animation
   */
  pauseAnimation(id: string): void {
    const animationState = this.activeAnimations.get(id);
    if (animationState?.animation) {
      animationState.animation.pause();
    }
  }

  /**
   * Resumes a paused animation
   */
  resumeAnimation(id: string): void {
    const animationState = this.activeAnimations.get(id);
    if (animationState?.animation) {
      animationState.animation.play();
    }
  }

  /**
   * Gets the current state of an animation
   */
  getAnimationState(id: string): AnimationState | undefined {
    return this.activeAnimations.get(id);
  }

  /**
   * Gets performance metrics
   */
  getPerformanceMetrics() {
    return {
      activeAnimations: this.activeAnimations.size,
      queuedAnimations: this.animationQueue.length,
      fps: this.performanceMonitor.getCurrentFPS(),
      memoryUsage: this.performanceMonitor.getCurrentMemoryUsage(),
      performanceTier: this.performanceTier,
      maxConcurrentAnimations: this.maxConcurrentAnimations
    };
  }

  private queueAnimation(options: AnimationOptions): void {
    // Sort by priority
    const priority = options.priority || 'medium';
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    
    const insertIndex = this.animationQueue.findIndex(
      queued => priorityOrder[queued.priority || 'medium'] > priorityOrder[priority]
    );
    
    if (insertIndex === -1) {
      this.animationQueue.push(options);
    } else {
      this.animationQueue.splice(insertIndex, 0, options);
    }

    this.processQueue();
  }

  private processQueue(): void {
    if (this.isProcessingQueue || this.animationQueue.length === 0) return;
    
    this.isProcessingQueue = true;
    
    const processNext = () => {
      while (
        this.animationQueue.length > 0 && 
        this.activeAnimations.size < this.maxConcurrentAnimations
      ) {
        const options = this.animationQueue.shift();
        if (options) {
          this.createAnimation(options).catch(error => {
            console.warn('Queued animation error:', error);
          });
        }
      }
      
      if (this.animationQueue.length > 0) {
        requestAnimationFrame(processNext);
      } else {
        this.isProcessingQueue = false;
      }
    };
    
    requestAnimationFrame(processNext);
  }

  private handleAnimationComplete(id: string, onComplete?: () => void): void {
    try {
      onComplete?.();
    } catch (error) {
      console.warn('Animation completion callback error:', error);
    }
    
    this.cleanupAnimation(id);
    this.processQueue(); // Process any queued animations
  }

  private handleAnimationError(id: string, error: Error, onError?: (error: Error) => void): void {
    try {
      onError?.(error);
    } catch (callbackError) {
      console.warn('Animation error callback error:', callbackError);
    }
    
    this.cleanupAnimation(id);
    this.processQueue(); // Process any queued animations
  }

  private cleanupAnimation(id: string): void {
    const animationState = this.activeAnimations.get(id);
    if (!animationState) return;

    // Run custom cleanup
    if (animationState.cleanup) {
      try {
        animationState.cleanup();
      } catch (error) {
        console.warn('Animation cleanup error:', error);
      }
    }

    // Remove animation optimizations
    if (animationState.element) {
      PerformanceMonitor.removeAnimationOptimizations(animationState.element);
    }

    // Unregister from performance monitor
    this.performanceMonitor.unregisterAnimation(id);

    // Remove from active animations
    this.activeAnimations.delete(id);
  }

  private generateOptimizedKeyframes(element: HTMLElement): Keyframe[] {
    // Generate basic fade-in keyframes as default
    // This can be extended based on animation type
    return [
      { opacity: 0, transform: 'translateY(20px)' },
      { opacity: 1, transform: 'translateY(0px)' }
    ];
  }

  private getOptimizedDuration(baseDuration: number): number {
    // Adjust duration based on performance tier
    const multipliers = {
      low: 0.7,
      medium: 0.85,
      high: 1
    };
    
    return Math.round(baseDuration * multipliers[this.performanceTier]);
  }

  private startCleanupCycle(): void {
    const cleanup = () => {
      this.cleanupCompletedAnimations();
      this.runCleanupTasks();
      
      // Schedule next cleanup
      setTimeout(cleanup, 5000); // Every 5 seconds
    };
    
    setTimeout(cleanup, 5000);
  }

  private cleanupCompletedAnimations(): void {
    const completedAnimations = Array.from(this.activeAnimations.entries())
      .filter(([_, state]) => {
        return !state.isActive || 
               (state.animation && state.animation.playState === 'finished');
      });

    completedAnimations.forEach(([id]) => {
      this.cleanupAnimation(id);
    });
  }

  private runCleanupTasks(): void {
    this.cleanupTasks.forEach(task => {
      try {
        task();
      } catch (error) {
        console.warn('Cleanup task error:', error);
      }
    });
    this.cleanupTasks.clear();
  }

  /**
   * Adds a cleanup task to be run during cleanup cycles
   */
  addCleanupTask(task: () => void): void {
    this.cleanupTasks.add(task);
  }

  /**
   * Destroys the animation manager and cleans up all resources
   */
  destroy(): void {
    // Cancel all active animations
    this.activeAnimations.forEach((_, id) => {
      this.cancelAnimation(id);
    });

    // Clear queue
    this.animationQueue = [];

    // Stop performance monitoring
    this.performanceMonitor.stopMonitoring();

    // Run final cleanup
    this.runCleanupTasks();

    // Cancel RAF if running
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}

// Export singleton instance
export const animationManager = OptimizedAnimationManager.getInstance();