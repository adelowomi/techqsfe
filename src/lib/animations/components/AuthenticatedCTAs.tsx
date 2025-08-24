'use client';

import React, { useState } from 'react';
import { useResponsiveAnimation } from '../responsive-controller';

interface AuthenticatedCTAsProps {
  user: {
    id: string;
    name?: string;
    email?: string;
    role: 'HOST' | 'PRODUCER' | 'ADMIN';
  };
  onDashboardClick?: () => void;
  onSeasonsClick?: () => void;
  onAnalyticsClick?: () => void;
  onCardsClick?: () => void;
  onGameClick?: () => void;
  className?: string;
}

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  color: string;
  roles: ('HOST' | 'PRODUCER' | 'ADMIN')[];
}

export const AuthenticatedCTAs: React.FC<AuthenticatedCTAsProps> = ({
  user,
  onDashboardClick,
  onSeasonsClick,
  onAnalyticsClick,
  onCardsClick,
  onGameClick,
  className = ''
}) => {
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);
  const { shouldEnableAnimations, getTouchAreaSize, capabilities } = useResponsiveAnimation();

  const quickActions: QuickAction[] = [
    {
      id: 'seasons',
      label: 'Manage Seasons',
      description: 'Create and manage game seasons',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      onClick: onSeasonsClick || (() => {}),
      color: 'from-blue-500 to-blue-600',
      roles: ['PRODUCER', 'ADMIN']
    },
    {
      id: 'cards',
      label: 'Card Management',
      description: 'Create and edit question cards',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      onClick: onCardsClick || (() => {}),
      color: 'from-green-500 to-green-600',
      roles: ['PRODUCER', 'ADMIN']
    },
    {
      id: 'game',
      label: 'Start Game',
      description: 'Begin a new game session',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.5a1.5 1.5 0 011.5 1.5V12a1.5 1.5 0 01-1.5 1.5H9m0-4.5V9a1.5 1.5 0 011.5-1.5H12a1.5 1.5 0 011.5 1.5v1.5m-6 0h6m-6 0v1.5a1.5 1.5 0 001.5 1.5H12a1.5 1.5 0 001.5-1.5V12m-6 0H9" />
        </svg>
      ),
      onClick: onGameClick || (() => {}),
      color: 'from-purple-500 to-purple-600',
      roles: ['HOST', 'PRODUCER', 'ADMIN']
    },
    {
      id: 'analytics',
      label: 'View Analytics',
      description: 'Track performance and insights',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      onClick: onAnalyticsClick || (() => {}),
      color: 'from-orange-500 to-orange-600',
      roles: ['PRODUCER', 'ADMIN']
    }
  ];

  // Filter actions based on user role
  const availableActions = quickActions.filter(action => 
    action.roles.includes(user.role)
  );

  const touchAreaSize = getTouchAreaSize();

  const renderPrimaryButton = () => {
    const buttonStyles = {
      minHeight: `${touchAreaSize}px`,
      minWidth: capabilities.isMobile ? '100%' : 'auto',
      padding: capabilities.isMobile ? '16px 24px' : '20px 40px'
    };

    return (
      <button
        onClick={onDashboardClick}
        className="group relative bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 mb-8"
        style={buttonStyles}
      >
        <span className="relative z-10 flex items-center justify-center">
          <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          Go to Dashboard
        </span>
        <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-purple-800 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Card-themed hover effect - only on desktop */}
        {!capabilities.isMobile && shouldEnableAnimations && (
          <>
            <div className="absolute -top-2 -right-2 w-4 h-6 bg-white rounded-sm opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:rotate-12" />
            <div className="absolute -bottom-2 -left-2 w-4 h-6 bg-white rounded-sm opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:-rotate-12" />
          </>
        )}
      </button>
    );
  };

  const renderQuickActions = () => {
    if (availableActions.length === 0) return null;

    return (
      <div className="w-full max-w-4xl mx-auto">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
          Quick Actions
        </h3>
        <div className={`grid gap-4 ${
          availableActions.length === 1 ? 'grid-cols-1 max-w-sm mx-auto' :
          availableActions.length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto' :
          'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
        }`}>
          {availableActions.map((action, index) => (
            <div
              key={action.id}
              className="group relative"
              onMouseEnter={() => setHoveredAction(action.id)}
              onMouseLeave={() => setHoveredAction(null)}
              style={{
                animationDelay: shouldEnableAnimations ? `${index * 100}ms` : '0ms'
              }}
            >
              <button
                onClick={action.onClick}
                className={`w-full p-6 bg-white rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 text-left ${
                  capabilities.isMobile ? 'active:scale-95' : 'hover:scale-105'
                }`}
                style={{ minHeight: `${touchAreaSize + 40}px` }}
              >
                {/* Background gradient on hover */}
                <div className={`absolute inset-0 bg-gradient-to-r ${action.color} rounded-xl opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r ${action.color} text-white rounded-lg mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {action.icon}
                </div>
                
                {/* Content */}
                <h4 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-gray-800">
                  {action.label}
                </h4>
                <p className="text-sm text-gray-600 group-hover:text-gray-700">
                  {action.description}
                </p>
                
                {/* Arrow indicator */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                {/* Card-themed decoration - only on desktop */}
                {!capabilities.isMobile && shouldEnableAnimations && hoveredAction === action.id && (
                  <div className="absolute -top-1 -right-1 w-3 h-4 bg-gradient-to-r from-purple-400 to-purple-500 rounded-sm opacity-80 transform rotate-12 transition-all duration-300" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`text-center ${className}`}>
      {/* Primary Dashboard Button */}
      {renderPrimaryButton()}
      
      {/* Quick Actions Grid */}
      {renderQuickActions()}
      
      {/* Welcome Message */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-700">
          Welcome back, <span className="font-semibold text-purple-600">{user.name || 'there'}</span>! 
          {user.role === 'ADMIN' && ' You have full system access.'}
          {user.role === 'PRODUCER' && ' You can manage content and view analytics.'}
          {user.role === 'HOST' && ' You can host games and manage seasons.'}
        </p>
      </div>

      {/* Animation styles for staggered entrance */}
      {shouldEnableAnimations && (
        <style jsx>{`
          .group {
            animation: slideInUp 0.6s ease-out forwards;
            opacity: 0;
            transform: translateY(20px);
          }
          
          @keyframes slideInUp {
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      )}
    </div>
  );
};

export default AuthenticatedCTAs;