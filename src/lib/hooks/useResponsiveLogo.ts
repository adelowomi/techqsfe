'use client';

import { useState, useEffect } from 'react';

export type LogoSize = 'sm' | 'md' | 'lg' | 'xl';

interface ResponsiveLogoConfig {
  mobile: LogoSize;
  tablet: LogoSize;
  desktop: LogoSize;
}

export const useResponsiveLogo = (config: ResponsiveLogoConfig): LogoSize => {
  const [logoSize, setLogoSize] = useState<LogoSize>(config.desktop);

  useEffect(() => {
    const updateLogoSize = () => {
      const width = window.innerWidth;
      
      if (width < 768) {
        setLogoSize(config.mobile);
      } else if (width < 1024) {
        setLogoSize(config.tablet);
      } else {
        setLogoSize(config.desktop);
      }
    };

    // Set initial size
    updateLogoSize();

    // Add event listener
    window.addEventListener('resize', updateLogoSize);

    // Cleanup
    return () => window.removeEventListener('resize', updateLogoSize);
  }, [config]);

  return logoSize;
};

export default useResponsiveLogo;