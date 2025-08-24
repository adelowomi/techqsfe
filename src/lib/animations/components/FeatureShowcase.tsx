'use client';

import React, { useRef, useEffect, useState } from 'react';
import { FeatureCard } from './FeatureCard';

export interface FeatureData {
  id: string;
  title: string;
  description: string;
  detailedInfo: React.ReactNode;
  icon?: React.ReactNode;
}

export interface FeatureShowcaseProps {
  features: FeatureData[];
  title?: string;
  subtitle?: string;
  staggerDelay?: number;
  className?: string;
  style?: React.CSSProperties;
  flipOnHover?: boolean;
  flipOnClick?: boolean;
  columns?: 1 | 2 | 3 | 4;
}

export const FeatureShowcase: React.FC<FeatureShowcaseProps> = ({
  features,
  title = "Features",
  subtitle,
  staggerDelay = 150,
  className = '',
  style = {},
  flipOnHover = false,
  flipOnClick = true,
  columns = 3
}) => {
  const showcaseRef = useRef<HTMLDivElement>(null);
  const [hasEnteredView, setHasEnteredView] = useState(false);

  // Set up entrance animation for the showcase container
  useEffect(() => {
    const showcaseElement = showcaseRef.current;
    if (!showcaseElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !hasEnteredView) {
            setHasEnteredView(true);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -5% 0px' }
    );

    observer.observe(showcaseElement);

    return () => {
      observer.disconnect();
    };
  }, [hasEnteredView]);

  const getGridColumns = () => {
    switch (columns) {
      case 1: return '1fr';
      case 2: return 'repeat(2, 1fr)';
      case 3: return 'repeat(3, 1fr)';
      case 4: return 'repeat(4, 1fr)';
      default: return 'repeat(3, 1fr)';
    }
  };

  const getResponsiveColumns = () => {
    if (columns === 1) return '1fr';
    if (columns === 2) return 'repeat(auto-fit, minmax(260px, 1fr))';
    return 'repeat(auto-fit, minmax(280px, 1fr))';
  };

  return (
    <section
      ref={showcaseRef}
      className={`feature-showcase ${className}`}
      style={{
        padding: '60px 20px',
        maxWidth: '1200px',
        margin: '0 auto',
        ...style
      }}
    >
      {/* Header */}
      {(title || subtitle) && (
        <div 
          className="feature-showcase-header"
          style={{
            textAlign: 'center',
            marginBottom: '48px'
          }}
        >
          {title && (
            <h2 
              style={{
                fontSize: '2.5rem',
                fontWeight: '700',
                color: '#1a202c',
                margin: '0 0 16px 0',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              {title}
            </h2>
          )}
          {subtitle && (
            <p 
              style={{
                fontSize: '1.125rem',
                color: '#4a5568',
                margin: '0',
                maxWidth: '600px',
                marginLeft: 'auto',
                marginRight: 'auto',
                lineHeight: '1.6'
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Feature Cards Grid */}
      <div
        className="feature-showcase-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: getResponsiveColumns(),
          gap: '32px',
          justifyItems: 'center',
          alignItems: 'start'
        }}
      >
        {features.map((feature, index) => (
          <FeatureCard
            key={feature.id}
            id={feature.id}
            title={feature.title}
            description={feature.description}
            detailedInfo={feature.detailedInfo}
            icon={feature.icon}
            flipOnHover={flipOnHover}
            flipOnClick={flipOnClick}
            staggerDelay={hasEnteredView ? index * staggerDelay : 0}
            style={{
              width: '100%',
              maxWidth: '320px'
            }}
          />
        ))}
      </div>

      {/* Responsive styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media (max-width: 1024px) {
            .feature-showcase-grid {
              grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)) !important;
              gap: 24px !important;
            }
            
            .feature-showcase-header h2 {
              font-size: 2rem !important;
            }
          }
          
          @media (max-width: 768px) {
            .feature-showcase {
              padding: 40px 16px !important;
            }
            
            .feature-showcase-header {
              margin-bottom: 32px !important;
            }
            
            .feature-showcase-header h2 {
              font-size: 1.75rem !important;
            }
            
            .feature-showcase-header p {
              font-size: 1rem !important;
            }
            
            .feature-showcase-grid {
              grid-template-columns: 1fr !important;
              gap: 20px !important;
            }
          }
          
          @media (max-width: 480px) {
            .feature-showcase {
              padding: 32px 12px !important;
            }
            
            .feature-showcase-header h2 {
              font-size: 1.5rem !important;
            }
          }
        `
      }} />
    </section>
  );
};

export default FeatureShowcase;