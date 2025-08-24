/**
 * Progressive Enhancement for Animation Features
 * Provides fallbacks and graceful degradation for animation components
 */

interface FeatureSupport {
  webAnimations: boolean;
  intersectionObserver: boolean;
  cssTransforms: boolean;
  reducedMotion: boolean;
  touchDevice: boolean;
  lowEndDevice: boolean;
}

interface EnhancementConfig {
  enableAnimations: boolean;
  useGPUAcceleration: boolean;
  complexAnimations: boolean;
  autoplayAnimations: boolean;
  highQualityAnimations: boolean;
}

class ProgressiveEnhancement {
  private static instance: ProgressiveEnhancement;
  private featureSupport: FeatureSupport;
  private config: EnhancementConfig;

  private constructor() {
    this.featureSupport = this.detectFeatureSupport();
    this.config = this.generateConfig();
  }

  static getInstance(): ProgressiveEnhancement {
    if (!ProgressiveEnhancement.instance) {
      ProgressiveEnhancement.instance = new ProgressiveEnhancement();
    }
    return ProgressiveEnhancement.instance;
  }

  /**
   * Detect browser and device feature support
   */
  private detectFeatureSupport(): FeatureSupport {
    const support: FeatureSupport = {
      webAnimations: typeof window !== 'undefined' && 'animate' in document.createElement('div'),
      intersectionObserver: typeof window !== 'undefined' && 'IntersectionObserver' in window,
      cssTransforms: typeof window !== 'undefined' && 'transform' in document.createElement('div').style,
      reducedMotion: typeof window !== 'undefined' && 
        window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      touchDevice: typeof window !== 'undefined' && 
        ('ontouchstart' in window || navigator.maxTouchPoints > 0),
      lowEndDevice: this.detectLowEndDevice()
    };

    return support;
  }

  /**
   * Detect if device is low-end based on available metrics
   */
  private detectLowEndDevice(): boolean {
    if (typeof window === 'undefined') return false;

    // Check for device memory API
    const navigator = window.navigator as any;
    if (navigator.deviceMemory && navigator.deviceMemory < 4) {
      return true;
    }

    // Check for hardware concurrency (CPU cores)
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
      return true;
    }

    // Check connection speed
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')) {
      return true;
    }

    return false;
  }

  /**
   * Generate configuration based on feature support
   */
  private generateConfig(): EnhancementConfig {
    const { webAnimations, reducedMotion, lowEndDevice, touchDevice } = this.featureSupport;

    return {
      enableAnimations: webAnimations && !reducedMotion,
      useGPUAcceleration: !lowEndDevice && webAnimations,
      complexAnimations: !lowEndDevice && !reducedMotion && webAnimations,
      autoplayAnimations: !reducedMotion && !lowEndDevice,
      highQualityAnimations: !lowEndDevice && !touchDevice && !reducedMotion
    };
  }

  /**
   * Get current enhancement configuration
   */
  static getConfig(): EnhancementConfig {
    return ProgressiveEnhancement.getInstance().config;
  }

  /**
   * Get feature support information
   */
  static getFeatureSupport(): FeatureSupport {
    return ProgressiveEnhancement.getInstance().featureSupport;
  }

  /**
   * Check if animations should be enabled
   */
  static shouldEnableAnimations(): boolean {
    return ProgressiveEnhancement.getInstance().config.enableAnimations;
  }

  /**
   * Check if complex animations should be used
   */
  static shouldUseComplexAnimations(): boolean {
    return ProgressiveEnhancement.getInstance().config.complexAnimations;
  }

  /**
   * Check if GPU acceleration should be used
   */
  static shouldUseGPUAcceleration(): boolean {
    return ProgressiveEnhancement.getInstance().config.useGPUAcceleration;
  }

  /**
   * Get appropriate animation duration based on device capabilities
   */
  static getOptimalAnimationDuration(baseDuration: number): number {
    const config = ProgressiveEnhancement.getInstance().config;
    
    if (!config.enableAnimations) return 0;
    if (config.highQualityAnimations) return baseDuration;
    if (config.complexAnimations) return baseDuration * 0.8;
    
    return baseDuration * 0.5;
  }

  /**
   * Get CSS class names for progressive enhancement
   */
  static getEnhancementClasses(): string[] {
    const { featureSupport, config } = ProgressiveEnhancement.getInstance();
    const classes: string[] = [];

    if (config.enableAnimations) classes.push('animations-enabled');
    if (config.useGPUAcceleration) classes.push('gpu-acceleration');
    if (config.complexAnimations) classes.push('complex-animations');
    if (featureSupport.touchDevice) classes.push('touch-device');
    if (featureSupport.lowEndDevice) classes.push('low-end-device');
    if (featureSupport.reducedMotion) classes.push('reduced-motion');

    return classes;
  }

  /**
   * Apply progressive enhancement classes to document
   */
  static applyEnhancementClasses(): void {
    if (typeof document === 'undefined') return;

    const classes = ProgressiveEnhancement.getEnhancementClasses();
    document.documentElement.classList.add(...classes);
  }

  /**
   * Create fallback content for animations
   */
  static createFallbackContent(animatedContent: React.ReactNode, fallbackContent: React.ReactNode): React.ReactNode {
    const shouldAnimate = ProgressiveEnhancement.shouldEnableAnimations();
    return shouldAnimate ? animatedContent : fallbackContent;
  }

  /**
   * Get intersection observer options based on device capabilities
   */
  static getIntersectionObserverOptions(): IntersectionObserverInit {
    const config = ProgressiveEnhancement.getInstance().config;
    
    return {
      threshold: config.highQualityAnimations ? [0, 0.25, 0.5, 0.75, 1] : [0, 0.5, 1],
      rootMargin: config.complexAnimations ? '50px' : '100px'
    };
  }
}

export { ProgressiveEnhancement };
export type { FeatureSupport, EnhancementConfig };