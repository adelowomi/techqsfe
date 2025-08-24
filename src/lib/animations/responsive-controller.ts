// Responsive animation controller for mobile and device optimizations

import React from "react";

export interface DeviceCapabilities {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  hasTouch: boolean;
  supportsHover: boolean;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  reducedMotion: boolean;
  connectionSpeed: 'slow' | 'fast' | 'unknown';
}

export interface ResponsiveAnimationConfig {
  mobile: {
    enabled: boolean;
    complexity: 'minimal' | 'reduced' | 'full';
    duration: number;
    stagger: number;
    touchAreaSize: number;
  };
  tablet: {
    enabled: boolean;
    complexity: 'minimal' | 'reduced' | 'full';
    duration: number;
    stagger: number;
    touchAreaSize: number;
  };
  desktop: {
    enabled: boolean;
    complexity: 'minimal' | 'reduced' | 'full';
    duration: number;
    stagger: number;
    hoverEffects: boolean;
  };
}

export class ResponsiveAnimationController {
  private static instance: ResponsiveAnimationController;
  private deviceCapabilities: DeviceCapabilities;
  private animationConfig: ResponsiveAnimationConfig;
  private mediaQueryListeners: MediaQueryList[] = [];

  private constructor() {
    this.deviceCapabilities = this.detectDeviceCapabilities();
    this.animationConfig = this.getDefaultConfig();
    this.setupMediaQueryListeners();
  }

  static getInstance(): ResponsiveAnimationController {
    if (!ResponsiveAnimationController.instance) {
      ResponsiveAnimationController.instance = new ResponsiveAnimationController();
    }
    return ResponsiveAnimationController.instance;
  }

  private detectDeviceCapabilities(): DeviceCapabilities {
    const screenWidth = window.innerWidth;
    const isMobile = screenWidth <= 768;
    const isTablet = screenWidth > 768 && screenWidth <= 1024;
    const isDesktop = screenWidth > 1024;
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const supportsHover = window.matchMedia('(hover: hover)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Detect connection speed (simplified)
    const connection = (navigator as any).connection;
    let connectionSpeed: 'slow' | 'fast' | 'unknown' = 'unknown';
    if (connection) {
      const effectiveType = connection.effectiveType;
      connectionSpeed = ['slow-2g', '2g', '3g'].includes(effectiveType) ? 'slow' : 'fast';
    }

    return {
      isMobile,
      isTablet,
      isDesktop,
      hasTouch,
      supportsHover,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      pixelRatio: window.devicePixelRatio || 1,
      reducedMotion,
      connectionSpeed
    };
  }

  private getDefaultConfig(): ResponsiveAnimationConfig {
    return {
      mobile: {
        enabled: !this.deviceCapabilities.reducedMotion,
        complexity: this.deviceCapabilities.connectionSpeed === 'slow' ? 'minimal' : 'reduced',
        duration: 300,
        stagger: 50,
        touchAreaSize: 44 // Minimum touch target size in pixels
      },
      tablet: {
        enabled: !this.deviceCapabilities.reducedMotion,
        complexity: 'reduced',
        duration: 400,
        stagger: 75,
        touchAreaSize: 44
      },
      desktop: {
        enabled: !this.deviceCapabilities.reducedMotion,
        complexity: 'full',
        duration: 600,
        stagger: 100,
        hoverEffects: this.deviceCapabilities.supportsHover
      }
    };
  }

  private setupMediaQueryListeners(): void {
    // Listen for screen size changes
    const mobileQuery = window.matchMedia('(max-width: 768px)');
    const tabletQuery = window.matchMedia('(min-width: 769px) and (max-width: 1024px)');
    const desktopQuery = window.matchMedia('(min-width: 1025px)');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const updateCapabilities = () => {
      this.deviceCapabilities = this.detectDeviceCapabilities();
      this.animationConfig = this.getDefaultConfig();
      this.notifyConfigChange();
    };

    mobileQuery.addEventListener('change', updateCapabilities);
    tabletQuery.addEventListener('change', updateCapabilities);
    desktopQuery.addEventListener('change', updateCapabilities);
    reducedMotionQuery.addEventListener('change', updateCapabilities);

    this.mediaQueryListeners = [mobileQuery, tabletQuery, desktopQuery, reducedMotionQuery];
  }

  private notifyConfigChange(): void {
    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent('responsiveAnimationConfigChange', {
      detail: {
        capabilities: this.deviceCapabilities,
        config: this.animationConfig
      }
    }));
  }

  getDeviceCapabilities(): DeviceCapabilities {
    return { ...this.deviceCapabilities };
  }

  getCurrentConfig(): ResponsiveAnimationConfig {
    return { ...this.animationConfig };
  }

  getActiveDeviceConfig() {
    if (this.deviceCapabilities.isMobile) {
      return this.animationConfig.mobile;
    } else if (this.deviceCapabilities.isTablet) {
      return this.animationConfig.tablet;
    } else {
      return this.animationConfig.desktop;
    }
  }

  shouldEnableAnimations(): boolean {
    const activeConfig = this.getActiveDeviceConfig();
    return activeConfig.enabled && !this.deviceCapabilities.reducedMotion;
  }

  getOptimalDuration(baseDuration: number): number {
    if (this.deviceCapabilities.reducedMotion) return 0;
    
    const activeConfig = this.getActiveDeviceConfig();
    const complexityMultiplier = {
      minimal: 0.5,
      reduced: 0.75,
      full: 1
    }[activeConfig.complexity];

    return Math.round(baseDuration * complexityMultiplier);
  }

  getOptimalStagger(baseStagger: number): number {
    if (this.deviceCapabilities.reducedMotion) return 0;
    
    const activeConfig = this.getActiveDeviceConfig();
    const complexityMultiplier = {
      minimal: 0.3,
      reduced: 0.6,
      full: 1
    }[activeConfig.complexity];

    return Math.round(baseStagger * complexityMultiplier);
  }

  getTouchAreaSize(): number {
    const activeConfig = this.getActiveDeviceConfig();
    return 'touchAreaSize' in activeConfig ? activeConfig.touchAreaSize : 44;
  }

  shouldUseHoverEffects(): boolean {
    return this.deviceCapabilities.supportsHover && 
           this.deviceCapabilities.isDesktop &&
           'hoverEffects' in this.animationConfig.desktop &&
           this.animationConfig.desktop.hoverEffects;
  }

  getCardSizeMultiplier(): number {
    if (this.deviceCapabilities.isMobile) {
      return 0.8; // Smaller cards on mobile
    } else if (this.deviceCapabilities.isTablet) {
      return 0.9; // Slightly smaller on tablet
    }
    return 1; // Full size on desktop
  }

  getAnimationComplexity(): 'minimal' | 'reduced' | 'full' {
    if (this.deviceCapabilities.reducedMotion) return 'minimal';
    return this.getActiveDeviceConfig().complexity;
  }

  // Utility method to create responsive CSS custom properties
  getCSSCustomProperties(): Record<string, string> {
    const activeConfig = this.getActiveDeviceConfig();
    const cardSize = this.getCardSizeMultiplier();
    
    return {
      '--animation-duration': `${activeConfig.duration}ms`,
      '--animation-stagger': `${activeConfig.stagger}ms`,
      '--card-size-multiplier': cardSize.toString(),
      '--touch-area-size': `${this.getTouchAreaSize()}px`,
      '--animation-complexity': this.getAnimationComplexity(),
      '--hover-enabled': this.shouldUseHoverEffects() ? '1' : '0'
    };
  }

  // Clean up listeners
  destroy(): void {
    this.mediaQueryListeners.forEach(listener => {
      listener.removeEventListener('change', () => {});
    });
    this.mediaQueryListeners = [];
  }
}

// Hook for React components
export function useResponsiveAnimation() {
  const [controller] = React.useState(() => ResponsiveAnimationController.getInstance());
  const [capabilities, setCapabilities] = React.useState(controller.getDeviceCapabilities());
  const [config, setConfig] = React.useState(controller.getCurrentConfig());

  React.useEffect(() => {
    const handleConfigChange = (event: CustomEvent) => {
      setCapabilities(event.detail.capabilities);
      setConfig(event.detail.config);
    };

    window.addEventListener('responsiveAnimationConfigChange', handleConfigChange as EventListener);
    
    return () => {
      window.removeEventListener('responsiveAnimationConfigChange', handleConfigChange as EventListener);
    };
  }, []);

  return {
    capabilities,
    config,
    activeConfig: controller.getActiveDeviceConfig(),
    shouldEnableAnimations: controller.shouldEnableAnimations(),
    getOptimalDuration: controller.getOptimalDuration.bind(controller),
    getOptimalStagger: controller.getOptimalStagger.bind(controller),
    getTouchAreaSize: controller.getTouchAreaSize.bind(controller),
    shouldUseHoverEffects: controller.shouldUseHoverEffects.bind(controller),
    getCardSizeMultiplier: controller.getCardSizeMultiplier.bind(controller),
    getAnimationComplexity: controller.getAnimationComplexity.bind(controller),
    getCSSCustomProperties: controller.getCSSCustomProperties.bind(controller)
  };
}