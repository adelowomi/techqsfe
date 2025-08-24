'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ScrollAnimationController } from '../scroll-controller';
import { CardPhysics } from '../card-physics';
import type { SeasonWithStats } from '~/lib/types';
import { formatDistanceToNow } from 'date-fns';

export interface SeasonCardProps {
  season: SeasonWithStats;
  logoUrl?: string;
  logoAlt?: string;
  className?: string;
  style?: React.CSSProperties;
  flipOnHover?: boolean;
  flipOnClick?: boolean;
  staggerDelay?: number;
  onFlip?: (isFlipped: boolean) => void;
  onClick?: (season: SeasonWithStats) => void;
  onSelect?: (seasonId: string) => void;
}

export const SeasonCard: React.FC<SeasonCardProps> = ({
  season,
  logoUrl = '/purple filled.svg',
  logoAlt = 'TechQS Logo',
  className = '',
  style = {},
  flipOnHover = false,
  flipOnClick = true,
  staggerDelay = 0,
  onFlip,
  onClick,
  onSelect
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
    cardElement.style.transform = 'translateY(40px) scale(0.9) rotateX(10deg)';

    // Register entrance animation with stagger delay
    const entranceKeyframes = [
      { 
        opacity: '0', 
        transform: 'translateY(40px) scale(0.9) rotateX(10deg)',
        filter: 'blur(3px)'
      },
      { 
        opacity: '1', 
        transform: 'translateY(0) scale(1) rotateX(0deg)',
        filter: 'blur(0px)'
      }
    ];

    // Custom intersection observer for entrance animation
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !hasEnteredView) {
            setHasEnteredView(true);
            const animation = new Animation(
              new KeyframeEffect(cardElement, entranceKeyframes, {
                duration: 800,
                delay: staggerDelay,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                fill: 'forwards'
              }),
              document.timeline
            );
            animation.play();
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -15% 0px' }
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
      cardElementWithProps.cardId = season.id;
      cardElementWithProps.animationState = {
        id: season.id,
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
      console.warn('Season card flip animation error:', error);
    } finally {
      setIsAnimating(false);
      currentAnimation.current = null;
    }
  }, [isAnimating, season.id, isFlipped, isHovered, onFlip]);

  const handleHover = useCallback(async (hovered: boolean) => {
    if (isAnimating) return;

    const cardElement = cardRef.current;
    if (!cardElement) return;

    setIsHovered(hovered);

    if (hovered) {
      try {
        // Create card element with required properties
        const cardElementWithProps = cardElement as any;
        cardElementWithProps.cardId = season.id;
        cardElementWithProps.animationState = {
          id: season.id,
          position: { x: 0, y: 0, z: 0, rotation: { x: 0, y: 0, z: 0 } },
          isFlipped,
          isHovered: true,
          isSelected: false,
          animationState: 'animating'
        };

        // Perform hover animation
        const animation = CardPhysics.hover(cardElementWithProps, 0.6);
        await animation.finished;

        // Auto-flip on hover if enabled
        if (flipOnHover && !isFlipped) {
          setTimeout(() => handleFlip(), 300);
        }

      } catch (error) {
        console.warn('Season card hover animation error:', error);
      }
    }
  }, [isAnimating, season.id, isFlipped, flipOnHover, handleFlip]);

  const handleClick = useCallback(() => {
    onClick?.(season);
    
    if (flipOnClick) {
      handleFlip();
    } else if (onSelect) {
      onSelect(season.id);
    }
  }, [onClick, season, flipOnClick, handleFlip, onSelect]);

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

  // Helper function to get deck status color
  const getDeckStatusColor = (count: number, total: number = 52) => {
    if (total === 0) return '#e5e7eb'; // gray-200
    const percentage = (count / total) * 100;
    if (percentage < 25) return '#fecaca'; // red-200
    if (percentage < 50) return '#fef3c7'; // yellow-200
    if (percentage < 75) return '#bfdbfe'; // blue-200
    return '#bbf7d0'; // green-200
  };

  // Front content - Season overview
  const frontContent = (
    <div className="season-card-front-content">
      <div className="season-header" style={{ marginBottom: '16px' }}>
        <h3 style={{ 
          margin: '0 0 8px 0', 
          fontSize: '1.25rem', 
          fontWeight: '600',
          color: '#1a202c',
          lineHeight: '1.3'
        }}>
          {season.name}
        </h3>
        {season.description && (
          <p style={{ 
            margin: '0 0 8px 0', 
            fontSize: '0.875rem', 
            color: '#4a5568',
            lineHeight: '1.4',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {season.description}
          </p>
        )}
        <p style={{ 
          margin: '0', 
          fontSize: '0.75rem', 
          color: '#9ca3af'
        }}>
          Created {formatDistanceToNow(new Date(season.createdAt))} ago
          {season.createdBy.name && ` by ${season.createdBy.name}`}
        </p>
      </div>

      <div className="season-stats" style={{ marginBottom: '16px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginBottom: '8px',
          fontSize: '0.875rem'
        }}>
          <span style={{ color: '#6b7280' }}>Total Cards:</span>
          <span style={{ fontWeight: '600', color: '#1f2937' }}>{season.totalCards}</span>
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          fontSize: '0.875rem'
        }}>
          <span style={{ color: '#6b7280' }}>Total Attempts:</span>
          <span style={{ fontWeight: '600', color: '#1f2937' }}>{season.totalAttempts}</span>
        </div>
      </div>

      <div style={{
        fontSize: '0.75rem',
        color: '#9ca3af',
        fontStyle: 'italic',
        textAlign: 'center'
      }}>
        {flipOnClick ? 'Click to see deck details' : 'Hover to see deck details'}
      </div>
    </div>
  );

  // Back content - Deck statistics with logo
  const backContent = (
    <div className="season-card-back-content">
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
          {season.name} - Deck Status
        </h4>
      </div>

      <div className="deck-status" style={{ marginBottom: '16px' }}>
        <div style={{ marginBottom: '12px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '4px'
          }}>
            <span style={{ 
              fontSize: '0.875rem', 
              color: 'rgba(255, 255, 255, 0.9)' 
            }}>
              Easy Deck:
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: getDeckStatusColor(season.easyDeckCount),
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }} />
              <span style={{ 
                fontSize: '0.875rem', 
                color: 'white',
                fontWeight: '600'
              }}>
                {season.easyDeckCount}/52
              </span>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '4px'
          }}>
            <span style={{ 
              fontSize: '0.875rem', 
              color: 'rgba(255, 255, 255, 0.9)' 
            }}>
              Medium Deck:
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: getDeckStatusColor(season.mediumDeckCount),
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }} />
              <span style={{ 
                fontSize: '0.875rem', 
                color: 'white',
                fontWeight: '600'
              }}>
                {season.mediumDeckCount}/52
              </span>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '4px'
          }}>
            <span style={{ 
              fontSize: '0.875rem', 
              color: 'rgba(255, 255, 255, 0.9)' 
            }}>
              Hard Deck:
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: getDeckStatusColor(season.hardDeckCount),
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }} />
              <span style={{ 
                fontSize: '0.875rem', 
                color: 'white',
                fontWeight: '600'
              }}>
                {season.hardDeckCount}/52
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        fontSize: '0.75rem',
        color: 'rgba(255, 255, 255, 0.7)',
        fontStyle: 'italic',
        textAlign: 'center'
      }}>
        Click again to go back
      </div>
    </div>
  );

  return (
    <div
      ref={cardRef}
      className={`season-card ${className} ${isFlipped ? 'flipped' : ''} ${isHovered ? 'hovered' : ''} ${isAnimating ? 'animating' : ''}`}
      style={{
        position: 'relative',
        width: '320px',
        height: '240px',
        transformStyle: 'preserve-3d',
        transition: isAnimating ? 'none' : 'transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1)',
        cursor: flipOnClick || onSelect ? 'pointer' : 'default',
        ...style
      }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
      tabIndex={flipOnClick || onSelect ? 0 : -1}
      role={flipOnClick || onSelect ? 'button' : 'article'}
      aria-label={`Season: ${season.name}${isFlipped ? ' (showing deck details)' : ''}`}
      aria-pressed={flipOnClick ? isFlipped : undefined}
      data-season-id={season.id}
    >
      {/* Card Front */}
      <div
        className="season-card-face season-card-front"
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backfaceVisibility: 'hidden',
          borderRadius: '16px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          background: 'white',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '24px',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transition: 'transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1)'
        }}
      >
        {frontContent}
      </div>
      
      {/* Card Back */}
      <div
        className="season-card-face season-card-back"
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backfaceVisibility: 'hidden',
          transform: isFlipped ? 'rotateY(0deg)' : 'rotateY(180deg)',
          borderRadius: '16px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: '1px solid #5a67d8',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '24px',
          color: 'white',
          transition: 'transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1)'
        }}
      >
        {backContent}
      </div>

      {/* Focus indicator for accessibility */}
      <div
        className="season-card-focus-indicator"
        style={{
          position: 'absolute',
          top: '-2px',
          left: '-2px',
          right: '-2px',
          bottom: '-2px',
          borderRadius: '18px',
          border: '2px solid transparent',
          pointerEvents: 'none',
          transition: 'border-color 0.2s ease'
        }}
      />

      {/* Inline styles for hover and focus effects */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .season-card:focus .season-card-focus-indicator {
            border-color: #667eea;
          }
          
          .season-card:hover .season-card-face {
            box-shadow: 0 8px 24px rgba(0,0,0,0.15);
          }
          
          .season-card.hovered .season-card-front {
            transform: ${isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'} translateZ(12px) scale(1.02);
          }
          
          .season-card.hovered .season-card-back {
            transform: ${isFlipped ? 'rotateY(0deg)' : 'rotateY(180deg)'} translateZ(12px) scale(1.02);
          }
          
          .season-card.animating {
            pointer-events: none;
          }
          
          @media (prefers-reduced-motion: reduce) {
            .season-card {
              transition: none !important;
            }
            
            .season-card-face {
              transition: none !important;
            }
            
            .season-card.hovered .season-card-front,
            .season-card.hovered .season-card-back {
              transform: ${isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'} !important;
            }
          }
          
          @media (max-width: 768px) {
            .season-card {
              width: 280px;
              height: 200px;
            }
            
            .season-card-face {
              padding: 20px;
            }
          }
          
          @media (max-width: 480px) {
            .season-card {
              width: 260px;
              height: 180px;
            }
            
            .season-card-face {
              padding: 16px;
            }
          }
        `
      }} />
    </div>
  );
};

export default SeasonCard;