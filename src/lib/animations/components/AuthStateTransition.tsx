'use client';

import React, { useEffect, useState } from 'react';
import { useResponsiveAnimation } from '../responsive-controller';

interface AuthStateTransitionProps {
  isAuthenticated: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

export const AuthStateTransition: React.FC<AuthStateTransitionProps> = ({
  isAuthenticated,
  children,
  fallback,
  className = ''
}) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentContent, setCurrentContent] = useState(children);
  const { shouldEnableAnimations, getOptimalDuration } = useResponsiveAnimation();

  useEffect(() => {
    if (!shouldEnableAnimations) {
      setCurrentContent(isAuthenticated ? children : fallback);
      return;
    }

    setIsTransitioning(true);
    
    const transitionDuration = getOptimalDuration(300);
    
    // Start fade out
    const fadeOutTimer = setTimeout(() => {
      setCurrentContent(isAuthenticated ? children : fallback);
      
      // Start fade in
      const fadeInTimer = setTimeout(() => {
        setIsTransitioning(false);
      }, transitionDuration / 2);

      return () => clearTimeout(fadeInTimer);
    }, transitionDuration / 2);

    return () => clearTimeout(fadeOutTimer);
  }, [isAuthenticated, children, fallback, shouldEnableAnimations, getOptimalDuration]);

  if (!shouldEnableAnimations) {
    return (
      <div className={className}>
        {isAuthenticated ? children : fallback}
      </div>
    );
  }

  return (
    <div 
      className={`transition-all duration-300 ${isTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'} ${className}`}
      style={{
        transitionDuration: `${getOptimalDuration(300)}ms`,
      }}
    >
      {currentContent}
    </div>
  );
};

export default AuthStateTransition;