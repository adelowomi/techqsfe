/**
 * Landing Page Initialization
 * Orchestrates asset loading and progressive enhancement setup
 */

import { AssetLoader } from './asset-loader';
import { ProgressiveEnhancement } from './progressive-enhancement';
import { AnimationPreloader } from './lazy-loader';
import { FinalOptimizations } from './final-optimizations';

interface InitializationOptions {
  preloadCriticalAssets?: boolean;
  preloadBelowFoldComponents?: boolean;
  applyProgressiveEnhancement?: boolean;
  enablePerformanceMonitoring?: boolean;
}

class LandingPageInitializer {
  private static initialized = false;
  private static initializationPromise: Promise<void> | null = null;

  /**
   * Initialize the landing page with optimizations
   */
  static async initialize(options: InitializationOptions = {}): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    const {
      preloadCriticalAssets = true,
      preloadBelowFoldComponents = true,
      applyProgressiveEnhancement = true,
      enablePerformanceMonitoring = true
    } = options;

    this.initializationPromise = this.performInitialization({
      preloadCriticalAssets,
      preloadBelowFoldComponents,
      applyProgressiveEnhancement,
      enablePerformanceMonitoring
    });

    await this.initializationPromise;
    this.initialized = true;
  }

  private static async performInitialization(options: Required<InitializationOptions>): Promise<void> {
    const startTime = performance.now();

    try {
      // Apply all final optimizations first
      if (options.applyProgressiveEnhancement) {
        FinalOptimizations.applyOptimizations();
      }

      // Preload critical assets immediately
      const criticalAssetsPromise = options.preloadCriticalAssets 
        ? AssetLoader.preloadCriticalAssets()
        : Promise.resolve();

      // Start preloading below-fold components after a short delay
      const belowFoldPromise = options.preloadBelowFoldComponents
        ? this.delayedPreload(() => AnimationPreloader.preloadBelowFoldComponents(), 1000)
        : Promise.resolve();

      // Wait for critical assets
      await criticalAssetsPromise;

      // Load secondary assets
      await AssetLoader.lazyLoadSecondaryAssets();

      // Wait for below-fold preloading to complete
      await belowFoldPromise;

      const endTime = performance.now();
      const initTime = endTime - startTime;

      if (options.enablePerformanceMonitoring) {
        console.log(`Landing page initialization completed in ${initTime.toFixed(2)}ms`);
        this.logInitializationMetrics(initTime);
      }

    } catch (error) {
      console.error('Landing page initialization failed:', error);
      // Continue with degraded experience
    }
  }

  /**
   * Delay execution of a function
   */
  private static delayedPreload(fn: () => Promise<void>, delay: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(async () => {
        try {
          await fn();
          resolve();
        } catch (error) {
          console.warn('Delayed preload failed:', error);
          resolve(); // Don't fail the entire initialization
        }
      }, delay);
    });
  }

  /**
   * Log initialization metrics for monitoring
   */
  private static logInitializationMetrics(initTime: number): void {
    const featureSupport = ProgressiveEnhancement.getFeatureSupport();
    const config = ProgressiveEnhancement.getConfig();
    const assetStatus = AssetLoader.getLoadingStatus();

    const metrics = {
      initializationTime: initTime,
      featureSupport,
      enhancementConfig: config,
      assetsLoaded: Object.keys(assetStatus).length,
      assetsSuccessful: Object.values(assetStatus).filter(Boolean).length,
      timestamp: new Date().toISOString()
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.table(metrics);
    }

    // Could send to analytics service in production
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'landing_page_init', {
        custom_parameter: JSON.stringify(metrics)
      });
    }
  }

  /**
   * Check if initialization is complete
   */
  static isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Reset initialization state (useful for testing)
   */
  static reset(): void {
    this.initialized = false;
    this.initializationPromise = null;
  }

  /**
   * Get initialization status
   */
  static getStatus(): {
    initialized: boolean;
    inProgress: boolean;
    featureSupport: ReturnType<typeof ProgressiveEnhancement.getFeatureSupport>;
    config: ReturnType<typeof ProgressiveEnhancement.getConfig>;
  } {
    return {
      initialized: this.initialized,
      inProgress: this.initializationPromise !== null && !this.initialized,
      featureSupport: ProgressiveEnhancement.getFeatureSupport(),
      config: ProgressiveEnhancement.getConfig()
    };
  }
}

export { LandingPageInitializer };
export type { InitializationOptions };