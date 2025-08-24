/**
 * Final Animation Optimizations
 * Comprehensive optimization system for landing page animations
 */

import { ProgressiveEnhancement } from './progressive-enhancement';
import { CrossBrowserSupport } from './cross-browser-support';
import { generateAnimationCSSProperties } from './animation-timing';

interface OptimizationConfig {
  enableGPUAcceleration: boolean;
  useWebAnimations: boolean;
  enableIntersectionObserver: boolean;
  respectReducedMotion: boolean;
  optimizeForMobile: boolean;
  enablePerformanceMonitoring: boolean;
}

class FinalOptimizations {
  private static instance: FinalOptimizations;
  private config: OptimizationConfig;
  private performanceMetrics: {
    animationFrameRate: number;
    memoryUsage: number;
    lastFrameTime: number;
    droppedFrames: number;
  };

  private constructor() {
    this.config = this.generateOptimizationConfig();
    this.performanceMetrics = {
      animationFrameRate: 60,
      memoryUsage: 0,
      lastFrameTime: performance.now(),
      droppedFrames: 0
    };
  }

  static getInstance(): FinalOptimizations {
    if (!FinalOptimizations.instance) {
      FinalOptimizations.instance = new FinalOptimizations();
    }
    return FinalOptimizations.instance;
  }

  /**
   * Generate optimization configuration based on device and browser capabilities
   */
  private generateOptimizationConfig(): OptimizationConfig {
    const featureSupport = ProgressiveEnhancement.getFeatureSupport();
    const browserSupport = CrossBrowserSupport.getSupport();
    const enhancementConfig = ProgressiveEnhancement.getConfig();

    return {
      enableGPUAcceleration: enhancementConfig.useGPUAcceleration && browserSupport.cssTransforms,
      useWebAnimations: browserSupport.webAnimations && enhancementConfig.enableAnimations,
      enableIntersectionObserver: browserSupport.intersectionObserver,
      respectReducedMotion: featureSupport.reducedMotion,
      optimizeForMobile: featureSupport.touchDevice || featureSupport.lowEndDevice,
      enablePerformanceMonitoring: !featureSupport.lowEndDevice
    };
  }

  /**
   * Apply all final optimizations to the page
   */
  static applyOptimizations(): void {
    const optimizer = FinalOptimizations.getInstance();
    
    // Apply browser compatibility classes
    CrossBrowserSupport.applyBrowserClasses();
    
    // Apply progressive enhancement classes
    ProgressiveEnhancement.applyEnhancementClasses();
    
    // Set up CSS custom properties for animations
    optimizer.setupAnimationCSSProperties();
    
    // Initialize performance monitoring
    if (optimizer.config.enablePerformanceMonitoring) {
      optimizer.initializePerformanceMonitoring();
    }
    
    // Apply GPU acceleration optimizations
    if (optimizer.config.enableGPUAcceleration) {
      optimizer.enableGPUAcceleration();
    }
    
    // Set up responsive animation adjustments
    optimizer.setupResponsiveAnimations();
    
    console.log('Final animation optimizations applied');
  }

  /**
   * Set up CSS custom properties for dynamic animation control
   */
  private setupAnimationCSSProperties(): void {
    if (typeof document === 'undefined') return;

    const deviceType = this.getDeviceType();
    const cssProperties = generateAnimationCSSProperties(deviceType);
    
    // Apply CSS custom properties to document root
    Object.entries(cssProperties).forEach(([property, value]) => {
      document.documentElement.style.setProperty(property, value);
    });

    // Add reduced motion overrides if needed
    if (this.config.respectReducedMotion) {
      document.documentElement.style.setProperty('--animation-duration-fast', '0.01ms');
      document.documentElement.style.setProperty('--animation-duration-normal', '0.01ms');
      document.documentElement.style.setProperty('--animation-duration-slow', '0.01ms');
    }
  }

  /**
   * Get device type for optimization purposes
   */
  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    if (typeof window === 'undefined') return 'desktop';

    const width = window.innerWidth;
    if (width <= 768) return 'mobile';
    if (width <= 1024) return 'tablet';
    return 'desktop';
  }

  /**
   * Enable GPU acceleration for animation elements
   */
  private enableGPUAcceleration(): void {
    if (typeof document === 'undefined') return;

    const style = document.createElement('style');
    style.textContent = `
      .gpu-accelerated,
      .card-animation,
      .hero-animation,
      .feature-animation {
        transform: translateZ(0);
        will-change: transform;
        backface-visibility: hidden;
      }
      
      .animation-complete {
        will-change: auto;
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * Set up responsive animation adjustments
   */
  private setupResponsiveAnimations(): void {
    if (typeof window === 'undefined') return;

    const updateAnimations = () => {
      const deviceType = this.getDeviceType();
      const cssProperties = generateAnimationCSSProperties(deviceType);
      
      Object.entries(cssProperties).forEach(([property, value]) => {
        document.documentElement.style.setProperty(property, value);
      });
    };

    // Update on resize
    window.addEventListener('resize', updateAnimations);
    
    // Update on orientation change
    window.addEventListener('orientationchange', () => {
      setTimeout(updateAnimations, 100); // Delay to ensure new dimensions are available
    });
  }

  /**
   * Initialize performance monitoring
   */
  private initializePerformanceMonitoring(): void {
    if (typeof window === 'undefined') return;

    let frameCount = 0;
    let lastTime = performance.now();

    const monitorPerformance = (currentTime: number) => {
      frameCount++;
      
      if (currentTime - lastTime >= 1000) {
        this.performanceMetrics.animationFrameRate = frameCount;
        
        // Check for performance issues
        if (frameCount < 30) {
          this.handleLowPerformance();
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      // Monitor memory usage if available
      if ((performance as any).memory) {
        this.performanceMetrics.memoryUsage = (performance as any).memory.usedJSHeapSize;
      }
      
      requestAnimationFrame(monitorPerformance);
    };

    requestAnimationFrame(monitorPerformance);
  }

  /**
   * Handle low performance situations
   */
  private handleLowPerformance(): void {
    console.warn('Low animation performance detected, applying optimizations');
    
    // Reduce animation complexity
    document.documentElement.classList.add('low-performance-mode');
    
    // Disable complex animations
    const complexAnimations = document.querySelectorAll('.complex-animation');
    complexAnimations.forEach(element => {
      element.classList.add('animation-disabled');
    });
    
    // Reduce animation durations
    document.documentElement.style.setProperty('--animation-duration-multiplier', '0.5');
  }

  /**
   * Get current performance metrics
   */
  static getPerformanceMetrics() {
    return FinalOptimizations.getInstance().performanceMetrics;
  }

  /**
   * Get optimization configuration
   */
  static getConfig(): OptimizationConfig {
    return FinalOptimizations.getInstance().config;
  }

  /**
   * Cleanup optimizations (useful for testing)
   */
  static cleanup(): void {
    if (typeof document === 'undefined') return;

    // Remove added classes
    const classesToRemove = [
      'animations-enabled', 'gpu-acceleration', 'complex-animations',
      'touch-device', 'low-end-device', 'reduced-motion',
      'web-animations', 'css-transforms', 'css-transitions',
      'intersection-observer', 'css-custom-properties',
      'css-grid', 'flexbox', 'chrome', 'firefox', 'safari', 'edge'
    ];
    
    document.documentElement.classList.remove(...classesToRemove);
    
    // Reset CSS custom properties
    const propertiesToReset = [
      '--animation-duration-fast', '--animation-duration-normal', '--animation-duration-slow',
      '--animation-duration-card-flip', '--animation-duration-card-shuffle', '--animation-duration-hero',
      '--animation-stagger-cards', '--animation-stagger-features',
      '--animation-easing-card', '--animation-easing-smooth', '--animation-easing-spring'
    ];
    
    propertiesToReset.forEach(property => {
      document.documentElement.style.removeProperty(property);
    });
  }
}

export { FinalOptimizations };
export type { OptimizationConfig };