/**
 * Asset Loader for Animation Components
 * Handles preloading critical assets and lazy loading for performance optimization
 */

interface AssetLoadingOptions {
  priority?: 'high' | 'low';
  timeout?: number;
  retries?: number;
}

interface LoadedAsset {
  url: string;
  type: 'image' | 'font' | 'style';
  loaded: boolean;
  error?: Error;
}

class AssetLoader {
  private static instance: AssetLoader;
  private loadedAssets = new Map<string, LoadedAsset>();
  private loadingPromises = new Map<string, Promise<void>>();

  static getInstance(): AssetLoader {
    if (!AssetLoader.instance) {
      AssetLoader.instance = new AssetLoader();
    }
    return AssetLoader.instance;
  }

  /**
   * Preload critical animation assets
   */
  static async preloadCriticalAssets(): Promise<void> {
    const loader = AssetLoader.getInstance();
    
    const criticalAssets = [
      '/purple filled.svg',
      '/purple outline.svg', 
      '/black filled.svg',
      '/black outline.svg',
      '/favicon.ico'
    ];

    const preloadPromises = criticalAssets.map(asset => 
      loader.preloadImage(asset, { priority: 'high' })
    );

    try {
      await Promise.allSettled(preloadPromises);
      console.log('Critical animation assets preloaded');
    } catch (error) {
      console.warn('Some critical assets failed to preload:', error);
    }
  }

  /**
   * Lazy load secondary animation assets
   */
  static async lazyLoadSecondaryAssets(): Promise<void> {
    const loader = AssetLoader.getInstance();
    
    // Load animation CSS if not already loaded
    await loader.loadAnimationStyles();
    
    console.log('Secondary animation assets loaded');
  }

  /**
   * Preload an image asset
   */
  private async preloadImage(url: string, options: AssetLoadingOptions = {}): Promise<void> {
    if (this.loadedAssets.has(url) && this.loadedAssets.get(url)?.loaded) {
      return;
    }

    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url);
    }

    const loadPromise = this.loadImageWithRetry(url, options);
    this.loadingPromises.set(url, loadPromise);

    try {
      await loadPromise;
      this.loadedAssets.set(url, { url, type: 'image', loaded: true });
    } catch (error) {
      this.loadedAssets.set(url, { 
        url, 
        type: 'image', 
        loaded: false, 
        error: error as Error 
      });
      throw error;
    } finally {
      this.loadingPromises.delete(url);
    }
  }

  private async loadImageWithRetry(
    url: string, 
    options: AssetLoadingOptions,
    attempt = 1
  ): Promise<void> {
    const { timeout = 5000, retries = 2 } = options;

    return new Promise((resolve, reject) => {
      const img = new Image();
      const timeoutId = setTimeout(() => {
        reject(new Error(`Image load timeout: ${url}`));
      }, timeout);

      img.onload = () => {
        clearTimeout(timeoutId);
        resolve();
      };

      img.onerror = () => {
        clearTimeout(timeoutId);
        if (attempt <= retries) {
          // Retry with exponential backoff
          setTimeout(() => {
            this.loadImageWithRetry(url, options, attempt + 1)
              .then(resolve)
              .catch(reject);
          }, Math.pow(2, attempt) * 1000);
        } else {
          reject(new Error(`Failed to load image after ${retries} retries: ${url}`));
        }
      };

      img.src = url;
    });
  }

  /**
   * Load animation styles dynamically
   */
  private async loadAnimationStyles(): Promise<void> {
    if (this.loadedAssets.has('animations.css')) {
      return;
    }

    return new Promise((resolve, reject) => {
      // Check if styles are already loaded
      const existingLink = document.querySelector('link[href*="animations.css"]');
      if (existingLink) {
        this.loadedAssets.set('animations.css', { 
          url: 'animations.css', 
          type: 'style', 
          loaded: true 
        });
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/styles/animations.css';
      
      link.onload = () => {
        this.loadedAssets.set('animations.css', { 
          url: 'animations.css', 
          type: 'style', 
          loaded: true 
        });
        resolve();
      };

      link.onerror = () => {
        reject(new Error('Failed to load animation styles'));
      };

      document.head.appendChild(link);
    });
  }

  /**
   * Check if an asset is loaded
   */
  static isAssetLoaded(url: string): boolean {
    const loader = AssetLoader.getInstance();
    return loader.loadedAssets.get(url)?.loaded ?? false;
  }

  /**
   * Get loading status of all assets
   */
  static getLoadingStatus(): Record<string, boolean> {
    const loader = AssetLoader.getInstance();
    const status: Record<string, boolean> = {};
    
    loader.loadedAssets.forEach((asset, url) => {
      status[url] = asset.loaded;
    });
    
    return status;
  }
}

export { AssetLoader };
export type { AssetLoadingOptions, LoadedAsset };