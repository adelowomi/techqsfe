'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

export interface LogoAnimationProps {
  variant: 'purple-filled' | 'purple-outline' | 'black-filled' | 'black-outline';
  size: 'sm' | 'md' | 'lg' | 'xl';
  animate?: boolean;
  className?: string;
  onAnimationComplete?: () => void;
}

const LOGO_PATHS = {
  'purple-filled': '/purple filled.svg',
  'purple-outline': '/purple outline.svg',
  'black-filled': '/black filled.svg',
  'black-outline': '/black outline.svg',
} as const;

const SIZE_CLASSES = {
  sm: 'w-8 h-8',
  md: 'w-16 h-16',
  lg: 'w-24 h-24',
  xl: 'w-32 h-32',
} as const;

export const LogoAnimation: React.FC<LogoAnimationProps> = ({
  variant,
  size,
  animate = true,
  className = '',
  onAnimationComplete,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (animate) {
      // Trigger entrance animation after component mounts
      const timer = setTimeout(() => {
        setIsVisible(true);
        if (onAnimationComplete) {
          // Call completion callback after animation duration
          setTimeout(onAnimationComplete, 800);
        }
      }, 100);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(true);
    }
  }, [animate, onAnimationComplete]);

  const logoPath = LOGO_PATHS[variant];
  const sizeClass = SIZE_CLASSES[size];

  return (
    <div
      className={`
        relative inline-block transition-all duration-700 ease-out
        ${animate ? (isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75') : 'opacity-100 scale-100'}
        ${isHovered ? 'scale-110' : ''}
        ${className}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transform: animate && !isVisible 
          ? 'translateY(20px) scale(0.75)' 
          : isHovered 
            ? 'translateY(-2px) scale(1.1)' 
            : 'translateY(0) scale(1)',
        filter: isHovered ? 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.1))' : 'none',
      }}
    >
      <Image
        src={logoPath}
        alt="TechQS Logo"
        width={128}
        height={128}
        className={`
          ${sizeClass}
          transition-all duration-300 ease-out
          ${isHovered ? 'brightness-110' : ''}
        `}
        priority={size === 'xl' || size === 'lg'}
      />
      
      {/* Animated glow effect on hover */}
      {isHovered && (
        <div
          className={`
            absolute inset-0 ${sizeClass}
            bg-gradient-to-r from-purple-400 to-purple-600
            rounded-full blur-xl opacity-20
            animate-pulse
          `}
          style={{
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        />
      )}
    </div>
  );
};

export default LogoAnimation;