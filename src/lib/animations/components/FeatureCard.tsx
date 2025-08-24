'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ScrollAnimationController } from '../scroll-controller';
import { CardPhysics } from '../card-physics';
import type { Position } from '../types';

export interface FeatureCardProps {
  id: string;
  title: string;
  description: string;
  detailedInfo: React.ReactNode;
  icon?: React.ReactNode;
  logoUrl?: string;
  logoAlt?: string;
  className?: string;
  style?: React.CSSProperties;
  flipOnHover?: boolean;
  flipOnClick?: boolean;
  staggerDelay?: number;
  onFlip?: (isFlipped: boolean) => void;
  onClick?: () => void;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  id,
  title,
  description,
  detailedInfo,
  icon,
  logoUrl = '/purple filled.svg',
  logoAlt = 'TechQS Logo',
  className = '',
  style = {},
  flipOnHover = false,
  flipOnClick = true,
  staggerDelay = 0,
  onFlip,
  onClick
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const scrollController = useRef<ScrollAnimationController | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasEnteredView, setHasEnteredView] = useState(false);
  const currentAnimation = useRef<Animation | null>(null);

  // Initialize scroll controller and entrance animation
  useEffect(() => {
    const cardElement = cardRef.current;
    if (!cardElement) return;

    // Initialize scroll controller
    scrollController.current = new ScrollAnimationController();

    // Set initial state for entrance animation
    cardElement.style.opacity = '0';
    cardElement.style.transform = 'translateY(30px) scale(0.95)';

    // Register entrance animation with stagger delay
    const entranceKeyframes = [
      { 
        opacity: '0', 
        transform: 'translateY(30px) scale(0.95)',
        filter: 'blur(2px)'
      },
      { 
        opacity: '1', 
        transform: 'translateY(0) scale(1)',
        filter: 'blur(0px)'
      }
    ];

    const animationConfig = {
      trigger: 'enter' as const,
      threshold: 0.1,
      animation: new KeyframeEffect(cardElement, entranceKeyframes, {
        duration: 600,
        delay: staggerDelay,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        fill: 'forwards'
      }),
      options: { 
        duration: 600, 
        delay: staggerDelay, 
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', 
        fill: 'forwards' 
      }
    };

    // Custom intersection observer for entrance animation
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !hasEnteredView) {
            setHasEnteredView(true);
            const animation = new Animation(animationConfig.animation, document.timeline);
            animation.play();
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -10% 0px' }
    );

    observer.observe(cardElement);

    // GPU optimization
    CardPhysics.optimizeForGPU(cardElement);

    return () => {
      observer.disconnect();
      if (scrollController.current) {
        scrollController.current.destroy();
      }
      CardPhysics.removeGPUOptimization(cardElement);
    };
  }, [staggerDelay, hasEnteredView]);

  const handleFlip = useCallback(async () => {
    if (isAnimating) return;

    const cardElement = cardRef.current;
    if (!cardElement) return;

    setIsAnimating(true);

    try {
      // Cancel any existing animation
      if (currentAnimation.current) {
        currentAnimation.current.cancel();
      }

      // Create card element with required properties for CardPhysics
      const cardElementWithProps = cardElement as any;
      cardElementWithProps.cardId = id;
      cardElementWithProps.animationState = {
        id,
        position: { x: 0, y: 0, z: 0, rotation: { x: 0, y: 0, z: 0 } },
        isFlipped,
        isHovered,
        isSelected: false,
        animationState: 'animating'
      };

      // Perform flip animation
      const animation = CardPhysics.flip(cardElementWithProps, 'y');
      currentAnimation.current = animation;

      // Wait for animation to complete
      await animation.finished;

      // Update state
      const newFlippedState = !isFlipped;
      setIsFlipped(newFlippedState);
      onFlip?.(newFlippedState);

    } catch (error) {
      console.warn('Feature card flip animation error:', error);
    } finally {
      setIsAnimating(false);
      currentAnimation.current = null;
    }
  }, [isAnimating, id, isFlipped, isHovered, onFlip]);

  const handleHover = useCallback(async (hovered: boolean) => {
    if (isAnimating) return;

    const cardElement = cardRef.current;
    if (!cardElement) return;

    setIsHovered(hovered);

    if (hovered) {
      try {
        // Create card element with required properties
        const cardElementWithProps = cardElement as any;
        cardElementWithProps.cardId = id;
        cardElementWithProps.animationState = {
          id,
          position: { x: 0, y: 0, z: 0, rotation: { x: 0, y: 0, z: 0 } },
          isFlipped,
          isHovered: true,
          isSelected: false,
          animationState: 'animating'
        };

        // Perform hover animation
        const animation = CardPhysics.hover(cardElementWithProps, 0.5);
        await animation.finished;

        // Auto-flip on hover if enabled
        if (flipOnHover && !isFlipped) {
          setTimeout(() => handleFlip(), 200);
        }

      } catch (error) {
        console.warn('Feature card hover animation error:', error);
      }
    }
  }, [isAnimating, id, isFlipped, flipOnHover, handleFlip]);

  const handleClick = useCallback(() => {
    onClick?.();
    
    if (flipOnClick) {
      handleFlip();
    }
  }, [onClick, flipOnClick, handleFlip]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  }, [handleClick]);

  const handleMouseEnter = useCallback(() => {
    handleHover(true);
  }, [handleHover]);

  const handleMouseLeave = useCallback(() => {
    handleHover(false);
  }, [handleHover]);

  // Front content
  const frontContent = (
    <div className="feature-card-front-content">
      {icon && (
        <div className="feature-icon" style={{ marginBottom: '16px', fontSize: '2rem' }}>
          {icon}
        </div>
      )}
      <h3 style={{ 
        margin: '0 0 12px 0', 
        fontSize: '1.25rem', 
        fontWeight: '600',
        color: '#1a202c'
      }}>
        {title}
      </h3>
      <p style={{ 
        margin: '0', 
        fontSize: '0.875rem', 
        color: '#4a5568',
        lineHeight: '1.5'
      }}>
        {description}
      </p>
      <div style={{
        marginTop: '16px',
        fontSize: '0.75rem',
        color: '#9ca3af',
        fontStyle: 'italic'
      }}>
        {flipOnClick ? 'Click to learn more' : 'Hover to learn more'}
      </div>
    </div>
  );

  // Back content with logo
  const backContent = (
    <div className="feature-card-back-content">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <img 
          src={logoUrl} 
          alt={logoAlt}
          style={{
            width: '24px',
            height: '24px',
            marginRight: '8px',
            filter: 'brightness(0) invert(1)'
          }}
        />
        <h4 style={{ 
          margin: '0', 
          fontSize: '1rem', 
          fontWeight: '600',
          color: 'white'
        }}>
          {title}
        </h4>
      </div>
      <div style={{ 
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: '0.875rem',
        lineHeight: '1.5'
      }}>
        {detailedInfo}
      </div>
      <div style={{
        marginTop: '16px',
        fontSize: '0.75rem',
        color: 'rgba(255, 255, 255, 0.7)',
        fontStyle: 'italic'
      }}>
        Click again to go back
      </div>
    </div>
  );

  return (
    <div
      ref={cardRef}
      className={`feature-card ${className} ${isFlipped ? 'flipped' : ''} ${isHovered ? 'hovered' : ''} ${isAnimating ? 'animating' : ''}`}
      style={{
        position: 'relative',
        width: '280px',
        height: '200px',
        transformStyle: 'preserve-3d',
        transition: isAnimating ? 'none' : 'transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1)',
        cursor: flipOnClick ? 'pointer' : 'default',
        ...style
      }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
      tabIndex={flipOnClick ? 0 : -1}
      role={flipOnClick ? 'button' : 'article'}
      aria-label={`Feature: ${title}${isFlipped ? ' (showing details)' : ''}`}
      aria-pressed={flipOnClick ? isFlipped : undefined}
      data-feature-id={id}
    >
      {/* Card Front */}
      <div
        className="feature-card-face feature-card-front"
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backfaceVisibility: 'hidden',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          background: 'white',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transition: 'transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1)'
        }}
      >
        {frontContent}
      </div>
      
      {/* Card Back */}
      <div
        className="feature-card-face feature-card-back"
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backfaceVisibility: 'hidden',
          transform: isFlipped ? 'rotateY(0deg)' : 'rotateY(180deg)',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: '1px solid #5a67d8',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '24px',
          color: 'white',
          transition: 'transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1)'
        }}
      >
        {backContent}
      </div>

      {/* Focus indicator for accessibility */}
      <div
        className="feature-card-focus-indicator"
        style={{
          position: 'absolute',
          top: '-2px',
          left: '-2px',
          right: '-2px',
          bottom: '-2px',
          borderRadius: '14px',
          border: '2px solid transparent',
          pointerEvents: 'none',
          transition: 'border-color 0.2s ease'
        }}
      />

      {/* Inline styles for hover and focus effects */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .feature-card:focus .feature-card-focus-indicator {
            border-color: #667eea;
          }
          
          .feature-card:hover .feature-card-face {
            box-shadow: 0 8px 20px rgba(0,0,0,0.15);
          }
          
          .feature-card.hovered .feature-card-front {
            transform: ${isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'} translateZ(10px) scale(1.02);
          }
          
          .feature-card.hovered .feature-card-back {
            transform: ${isFlipped ? 'rotateY(0deg)' : 'rotateY(180deg)'} translateZ(10px) scale(1.02);
          }
          
          .feature-card.animating {
            pointer-events: none;
          }
          
          @media (prefers-reduced-motion: reduce) {
            .feature-card {
              transition: none !important;
            }
            
            .feature-card-face {
              transition: none !important;
            }
            
            .feature-card.hovered .feature-card-front,
            .feature-card.hovered .feature-card-back {
              transform: ${isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'} !important;
            }
          }
          
          @media (max-width: 768px) {
            .feature-card {
              width: 260px;
              height: 180px;
            }
            
            .feature-card-face {
              padding: 20px;
            }
            
            .feature-icon {
              font-size: 1.5rem !important;
              margin-bottom: 12px !important;
            }
          }
        `
      }} />
    </div>
  );
};

export default FeatureCard;