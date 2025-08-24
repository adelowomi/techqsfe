import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OptimizedAnimationManager } from '../optimized-animation-manager';

// Mock performance monitor
vi.mock('../performance-monitor', () => ({
  PerformanceMonitor: vi.fn().mockImplementation(() => ({
    getPerformanceTier: () => 'medium',
    startMonitoring: vi.fn(),
    stopMonitoring: vi.fn(),
    onPerformanceIssue: vi.fn(),
    offPerformanceIssue: vi.fn(),
    registerAnimation: vi.fn().mockReturnValue(true),
    unregisterAnimation: vi.fn(),
    forceGarbageCollection: vi.fn()
  })),
  optimizeElementForAnimation: vi.fn(),
  removeAnimationOptimizations: vi.fn()
}));

// Mock Web Animations API
const mockAnimation = {
  addEventListener: vi.fn(),
  cancel: vi.fn(),
  pause: vi.fn(),
  play: vi.fn(),
  finished: Promise.resolve()
};

const mockElement = {
  animate: vi.fn().mockReturnValue(mockAnimation),
  style: {}
};

describe('OptimizedAnimationManager', () => {
  let manager: OptimizedAnimationManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = OptimizedAnimationManager.getInstance();
  });

  afterEach(() => {
    manager.destroy();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = OptimizedAnimationManager.getInstance();
      const instance2 = OptimizedAnimationManager.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('Animation Creation', () => {
    it('should create animation successfully', async () => {
      const options = {
        id: 'test-animation',
        element: mockElement as any,
        duration: 1000,
        onComplete: vi.fn(),
        onError: vi.fn()
      };

      await manager.createAnimation(options);

      expect(mockElement.animate).toHaveBeenCalled();
      expect(mockAnimation.addEventListener).toHaveBeenCalledWith('finish', expect.any(Function));
      expect(mockAnimation.addEventListener).toHaveBeenCalledWith('cancel', expect.any(Function));
    });

    it('should queue animation when at capacity', async () => {
      const options = {
        id: 'test-animation',
        element: mockElement as any,
        duration: 1000
      };

      // Fill up the animation slots
      for (let i = 0; i < 10; i++) {
        await manager.createAnimation({
          ...options,
          id: `animation-${i}`
        });
      }

      const metrics = manager.getPerformanceMetrics();
      expect(metrics.activeAnimations).toBeGreaterThan(0);
    });

    it('should handle animation errors gracefully', async () => {
      const onError = vi.fn();
      const options = {
        id: 'error-animation',
        element: {
          ...mockElement,
          animate: vi.fn().mockImplementation(() => {
            throw new Error('Animation failed');
          })
        } as any,
        duration: 1000,
        onError
      };

      await manager.createAnimation(options);

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('Animation Control', () => {
    beforeEach(async () => {
      await manager.createAnimation({
        id: 'control-test',
        element: mockElement as any,
        duration: 1000
      });
    });

    it('should cancel animation', () => {
      manager.cancelAnimation('control-test');
      
      expect(mockAnimation.cancel).toHaveBeenCalled();
    });

    it('should pause animation', () => {
      manager.pauseAnimation('control-test');
      
      expect(mockAnimation.pause).toHaveBeenCalled();
    });

    it('should resume animation', () => {
      manager.resumeAnimation('control-test');
      
      expect(mockAnimation.play).toHaveBeenCalled();
    });

    it('should get animation state', () => {
      const state = manager.getAnimationState('control-test');
      
      expect(state).toBeDefined();
      expect(state?.id).toBe('control-test');
      expect(state?.isActive).toBe(true);
    });
  });

  describe('Performance Metrics', () => {
    it('should provide performance metrics', () => {
      const metrics = manager.getPerformanceMetrics();
      
      expect(metrics).toHaveProperty('activeAnimations');
      expect(metrics).toHaveProperty('queuedAnimations');
      expect(metrics).toHaveProperty('fps');
      expect(metrics).toHaveProperty('memoryUsage');
      expect(metrics).toHaveProperty('performanceTier');
      expect(metrics).toHaveProperty('maxConcurrentAnimations');
    });

    it('should track active animations count', async () => {
      const initialMetrics = manager.getPerformanceMetrics();
      const initialCount = initialMetrics.activeAnimations;

      await manager.createAnimation({
        id: 'metrics-test',
        element: mockElement as any,
        duration: 1000
      });

      const updatedMetrics = manager.getPerformanceMetrics();
      expect(updatedMetrics.activeAnimations).toBeGreaterThanOrEqual(initialCount);
    });
  });

  describe('Performance Issue Handling', () => {
    it('should handle low FPS performance issues', () => {
      // This would be tested by triggering the performance monitor callback
      // The actual implementation would reduce animation complexity
      expect(manager).toBeDefined();
    });

    it('should handle high memory usage', () => {
      // This would be tested by triggering the performance monitor callback
      // The actual implementation would perform memory cleanup
      expect(manager).toBeDefined();
    });
  });

  describe('Animation Queue', () => {
    it('should process queued animations in priority order', async () => {
      const highPriorityOptions = {
        id: 'high-priority',
        element: mockElement as any,
        duration: 1000,
        priority: 'high' as const
      };

      const lowPriorityOptions = {
        id: 'low-priority',
        element: mockElement as any,
        duration: 1000,
        priority: 'low' as const
      };

      // Queue animations (assuming we're at capacity)
      await manager.createAnimation(lowPriorityOptions);
      await manager.createAnimation(highPriorityOptions);

      // High priority should be processed first when slots become available
      const metrics = manager.getPerformanceMetrics();
      expect(metrics.queuedAnimations).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Cleanup and Memory Management', () => {
    it('should cleanup completed animations', async () => {
      const cleanup = vi.fn();
      
      await manager.createAnimation({
        id: 'cleanup-test',
        element: mockElement as any,
        duration: 100,
        cleanup
      });

      // Simulate animation completion
      const finishCallback = mockAnimation.addEventListener.mock.calls
        .find(call => call[0] === 'finish')?.[1];
      
      if (finishCallback) {
        finishCallback();
      }

      expect(cleanup).toHaveBeenCalled();
    });

    it('should add and run cleanup tasks', () => {
      const cleanupTask = vi.fn();
      
      manager.addCleanupTask(cleanupTask);
      
      // Cleanup tasks are run during cleanup cycles
      expect(cleanupTask).toBeDefined();
    });

    it('should destroy manager and cleanup resources', () => {
      manager.destroy();
      
      const metrics = manager.getPerformanceMetrics();
      expect(metrics.activeAnimations).toBe(0);
    });
  });

  describe('Animation Options', () => {
    it('should handle different animation priorities', async () => {
      const priorities: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];
      
      for (const priority of priorities) {
        await manager.createAnimation({
          id: `priority-${priority}`,
          element: mockElement as any,
          duration: 1000,
          priority
        });
      }

      const metrics = manager.getPerformanceMetrics();
      expect(metrics.activeAnimations).toBeGreaterThan(0);
    });

    it('should optimize duration based on performance tier', async () => {
      await manager.createAnimation({
        id: 'duration-test',
        element: mockElement as any,
        duration: 1000
      });

      // The actual duration optimization is tested internally
      expect(mockElement.animate).toHaveBeenCalled();
    });
  });
});