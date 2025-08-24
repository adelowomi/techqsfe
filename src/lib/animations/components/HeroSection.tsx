'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { LogoAnimation } from './LogoAnimation';
import { CardAnimation } from './CardAnimation';
import { PersonalizedHeroContent } from './PersonalizedHeroContent';
import { AuthenticatedCTAs } from './AuthenticatedCTAs';
import { AuthStateTransition } from './AuthStateTransition';
import { useResponsiveLogo } from '../../hooks/useResponsiveLogo';
import { useResponsiveAnimation } from '../responsive-controller';
import type { CardData } from '../types';

export interface HeroSectionProps {
  isAuthenticated?: boolean;
  user?: {
    id?: string;
    name?: string;
    email?: string;
    role?: 'HOST' | 'PRODUCER' | 'ADMIN';
  };
  userStats?: {
    totalAttempts: number;
    correctAttempts: number;
    successRate: number;
    seasonsParticipated: number;
    recentActivity: {
      date: string;
      attempts: number;
      successRate: number;
    }[];
  };
  onSignInClick?: () => void;
  onSignUpClick?: () => void;
  onDashboardClick?: () => void;
  onSeasonsClick?: () => void;
  onAnalyticsClick?: () => void;
  onCardsClick?: () => void;
  onGameClick?: () => void;
  className?: string;
}

// Demo cards for the shuffle animation
const createDemoCards = (): CardData[] => {
  const questions = [
    { q: "What is React?", a: "A JavaScript library for building user interfaces" },
    { q: "What is TypeScript?", a: "A typed superset of JavaScript" },
    { q: "What is Next.js?", a: "A React framework for production" },
    { q: "What is Tailwind CSS?", a: "A utility-first CSS framework" },
    { q: "What is tRPC?", a: "End-to-end typesafe APIs" },
  ];

  return questions.map((item, index) => ({
    id: `demo-card-${index}`,
    front: (
      <div className="flex flex-col justify-center items-center h-full p-4 text-center">
        <div className="text-sm font-medium text-gray-800 mb-2">Question</div>
        <div className="text-xs text-gray-600 leading-relaxed">{item.q}</div>
      </div>
    ),
    back: (
      <div className="flex flex-col justify-center items-center h-full p-4 text-center relative">
        {/* Logo on card back */}
        <div className="absolute top-2 right-2">
          <LogoAnimation 
            variant="purple-outline" 
            size="sm" 
            animate={false}
            className="opacity-30"
          />
        </div>
        <div className="text-sm font-medium text-white mb-2">Answer</div>
        <div className="text-xs text-gray-100 leading-relaxed">{item.a}</div>
      </div>
    ),
    position: {
      x: index * 25 - 50, // Spread cards horizontally
      y: index * 5 - 10,  // Slight vertical offset
      z: index * 2,       // Depth layering
      rotation: {
        x: 0,
        y: 0,
        z: index * 3 - 6   // Slight rotation variation
      }
    },
    rotation: {
      x: 0,
      y: 0,
      z: index * 3 - 6   // Slight rotation variation
    }
  }));
};

export const HeroSection: React.FC<HeroSectionProps> = ({
  isAuthenticated = false,
  user,
  userStats,
  onSignInClick,
  onSignUpClick,
  onDashboardClick,
  onSeasonsClick,
  onAnalyticsClick,
  onCardsClick,
  onGameClick,
  className = ''
}) => {
  const [demoCards] = useState<CardData[]>(createDemoCards());
  const [animationKey, setAnimationKey] = useState(0);
  
  // Responsive animation and logo sizing
  const {
    shouldEnableAnimations,
    getOptimalDuration,
    getOptimalStagger,
    getTouchAreaSize,
    getCardSizeMultiplier,
    getCSSCustomProperties,
    capabilities
  } = useResponsiveAnimation();

  const logoSize = useResponsiveLogo({
    mobile: 'lg',
    tablet: 'xl',
    desktop: 'xl'
  });

  // Auto-restart shuffle animation with responsive timing
  useEffect(() => {
    if (!shouldEnableAnimations) return;

    const intervalDuration = capabilities.isMobile ? 10000 : 8000; // Longer on mobile
    const interval = setInterval(() => {
      setAnimationKey(prev => prev + 1);
    }, intervalDuration);

    return () => clearInterval(interval);
  }, [shouldEnableAnimations, capabilities.isMobile]);

  const handleAnimationEnd = useCallback(() => {
    // Animation completed, will restart automatically via interval
  }, []);

  const renderCTAButtons = () => {
    const touchAreaSize = getTouchAreaSize();
    const buttonStyles = {
      minHeight: `${touchAreaSize}px`,
      minWidth: capabilities.isMobile ? '100%' : 'auto',
      padding: capabilities.isMobile ? '16px 24px' : '16px 32px'
    };

    if (isAuthenticated) {
      return (
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onDashboardClick}
            className="group relative bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
            style={buttonStyles}
          >
            <span className="relative z-10">Go to Dashboard</span>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-purple-800 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
          
          {user?.name && (
            <div className="flex items-center justify-center text-gray-600">
              Welcome back, <span className="font-semibold ml-1">{user.name}</span>!
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={onSignUpClick}
          className="group relative bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
          style={buttonStyles}
        >
          <span className="relative z-10">Start Playing</span>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-purple-800 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Card-themed hover effect - only on desktop */}
          {!capabilities.isMobile && (
            <div className="absolute -top-1 -right-1 w-3 h-4 bg-white rounded-sm opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:rotate-12" />
          )}
        </button>
        
        <button
          onClick={onSignInClick}
          className="group relative bg-white text-purple-600 font-semibold rounded-lg border-2 border-purple-600 hover:bg-purple-50 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
          style={buttonStyles}
        >
          <span className="relative z-10">Sign In</span>
          
          {/* Card-themed hover effect - only on desktop */}
          {!capabilities.isMobile && (
            <div className="absolute -top-1 -left-1 w-3 h-4 bg-purple-600 rounded-sm opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:-rotate-12" />
          )}
        </button>
      </div>
    );
  };

  return (
    <section className={`relative min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden ${className}`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Crect width='11' height='11' rx='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Logo and Title */}
        <div className="mb-8">
          <div className="flex justify-center mb-6">
            <LogoAnimation 
              variant="purple-filled" 
              size={logoSize}
              animate={true}
            />
          </div>
          
          {!isAuthenticated ? (
            <>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
                Welcome to{' '}
                <span className="bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                  TechQS
                </span>
              </h1>
              
              <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Master technology concepts through interactive card-based learning. 
                Challenge yourself, track progress, and level up your tech skills.
              </p>
            </>
          ) : (
            <div className="mb-8">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                <span className="bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                  TechQS
                </span>{' '}
                Dashboard
              </h1>
            </div>
          )}
        </div>

        {/* Card Shuffle Demo */}
        {shouldEnableAnimations && (
          <div className="mb-12">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <CardAnimation
                  key={animationKey}
                  variant="shuffle"
                  cards={demoCards}
                  autoPlay={true}
                  trigger="auto"
                  duration={getOptimalDuration(2000)}
                  stagger={getOptimalStagger(200)}
                  onAnimationEnd={handleAnimationEnd}
                  className="w-full max-w-md mx-auto"
                  style={getCSSCustomProperties()}
                />
                
                {/* Demo Label */}
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                  <div className="bg-white px-4 py-2 rounded-full shadow-md border border-gray-200">
                    <span className="text-sm text-gray-600 font-medium">
                      Interactive Card Demo
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Static card display for reduced motion */}
        {!shouldEnableAnimations && (
          <div className="mb-12">
            <div className="flex justify-center mb-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-md mx-auto">
                {demoCards.slice(0, 3).map((card, index) => (
                  <div
                    key={card.id}
                    className="w-20 h-28 bg-white rounded-lg shadow-md border border-gray-200 flex items-center justify-center"
                    style={{ transform: `scale(${getCardSizeMultiplier()})` }}
                  >
                    <div className="text-xs text-center p-2">
                      Sample Card {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Personalized Content or Call to Action */}
        <div className="mb-8">
          <AuthStateTransition
            isAuthenticated={isAuthenticated}
            fallback={
              <div className="text-center">
                {renderCTAButtons()}
              </div>
            }
          >
            {isAuthenticated && user?.id ? (
              <div>
                <PersonalizedHeroContent
                  user={{
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role || 'HOST'
                  }}
                  userStats={userStats}
                  className="mb-12"
                />
                
                <AuthenticatedCTAs
                  user={{
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role || 'HOST'
                  }}
                  onDashboardClick={onDashboardClick}
                  onSeasonsClick={onSeasonsClick}
                  onAnalyticsClick={onAnalyticsClick}
                  onCardsClick={onCardsClick}
                  onGameClick={onGameClick}
                />
              </div>
            ) : (
              <div className="text-center">
                {renderCTAButtons()}
              </div>
            )}
          </AuthStateTransition>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Learn by Doing</h3>
            <p className="text-gray-600">Interactive card-based learning that makes complex concepts stick</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Track Progress</h3>
            <p className="text-gray-600">Monitor your learning journey with detailed analytics and insights</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Level Up</h3>
            <p className="text-gray-600">Challenge yourself with different difficulty levels and seasonal content</p>
          </div>
        </div>
      </div>

      {/* Floating Cards Background Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-20 h-28 bg-white rounded-lg shadow-lg opacity-10"
            style={{
              left: `${10 + i * 15}%`,
              top: `${20 + (i % 2) * 60}%`,
              transform: `rotate(${-15 + i * 6}deg)`,
              animation: `float ${8 + i * 2}s ease-in-out infinite`,
              animationDelay: `${i * 1.5}s`
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(var(--rotation));
          }
          50% {
            transform: translateY(-20px) rotate(var(--rotation));
          }
        }
      `}</style>
    </section>
  );
};

export default HeroSection;