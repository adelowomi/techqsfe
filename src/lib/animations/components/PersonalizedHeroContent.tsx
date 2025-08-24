'use client';

import React from 'react';
import { AnimatedCounter } from './AnimatedCounter';
import { ProgressChart } from './ProgressChart';
import { useResponsiveAnimation } from '../responsive-controller';

interface PersonalizedHeroContentProps {
  user: {
    id: string;
    name?: string;
    email?: string;
    role: 'HOST' | 'PRODUCER' | 'ADMIN';
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
  className?: string;
}

export const PersonalizedHeroContent: React.FC<PersonalizedHeroContentProps> = ({
  user,
  userStats,
  className = ''
}) => {
  const { shouldEnableAnimations, getOptimalDuration } = useResponsiveAnimation();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'HOST': return 'Game Host';
      case 'PRODUCER': return 'Producer';
      case 'ADMIN': return 'Administrator';
      default: return 'User';
    }
  };

  if (!userStats) {
    return (
      <div className={`text-center ${className}`}>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
          {getGreeting()}, {user.name || 'there'}!
        </h2>
        <p className="text-lg text-gray-600 mb-6">
          Welcome back to TechQS. Ready to continue your learning journey?
        </p>
        <div className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          {getRoleDisplayName(user.role)}
        </div>
      </div>
    );
  }

  const chartData = userStats.recentActivity.map((activity, index) => ({
    id: `activity-${index}`,
    label: new Date(activity.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }),
    value: activity.successRate,
    color: activity.successRate >= 70 ? '#10b981' : activity.successRate >= 50 ? '#f59e0b' : '#ef4444'
  }));

  return (
    <div className={`text-center ${className}`}>
      {/* Personalized Greeting */}
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          {getGreeting()}, {user.name || 'there'}!
        </h2>
        <p className="text-lg text-gray-600 mb-4">
          Here's your learning progress at a glance
        </p>
        <div className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          {getRoleDisplayName(user.role)}
        </div>
      </div>

      {/* Personal Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Attempts */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Attempts</h3>
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {shouldEnableAnimations ? (
              <AnimatedCounter
                value={userStats.totalAttempts}
                duration={getOptimalDuration(1500)}
                trigger="scroll"
              />
            ) : (
              userStats.totalAttempts.toLocaleString()
            )}
          </div>
        </div>

        {/* Correct Answers */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Correct Answers</h3>
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {shouldEnableAnimations ? (
              <AnimatedCounter
                value={userStats.correctAttempts}
                duration={getOptimalDuration(1500)}
                trigger="scroll"
              />
            ) : (
              userStats.correctAttempts.toLocaleString()
            )}
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Success Rate</h3>
            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {shouldEnableAnimations ? (
              <AnimatedCounter
                value={userStats.successRate}
                duration={getOptimalDuration(1500)}
                format={(value) => `${value.toFixed(1)}%`}
                trigger="scroll"
              />
            ) : (
              `${userStats.successRate.toFixed(1)}%`
            )}
          </div>
        </div>

        {/* Seasons Participated */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Seasons</h3>
            <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {shouldEnableAnimations ? (
              <AnimatedCounter
                value={userStats.seasonsParticipated}
                duration={getOptimalDuration(1500)}
                trigger="scroll"
              />
            ) : (
              userStats.seasonsParticipated.toLocaleString()
            )}
          </div>
        </div>
      </div>

      {/* Recent Performance Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 max-w-2xl mx-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            Recent Performance Trend
          </h3>
          <div className="h-48">
            <ProgressChart
              data={chartData}
              type="line"
              animationDelay={shouldEnableAnimations ? 500 : 0}
              className="w-full h-full"
            />
          </div>
          <p className="text-sm text-gray-600 mt-4 text-center">
            Your success rate over the last {chartData.length} days
          </p>
        </div>
      )}

      {/* Motivational Message */}
      <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
        <div className="flex items-center justify-center mb-3">
          <svg className="w-6 h-6 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h4 className="text-lg font-semibold text-purple-900">Keep Learning!</h4>
        </div>
        <p className="text-purple-800 text-center">
          {userStats.successRate >= 80 
            ? "Excellent work! You're mastering the concepts beautifully."
            : userStats.successRate >= 60
            ? "Great progress! Keep challenging yourself with more questions."
            : "Every attempt is a step forward. Keep practicing and you'll improve!"
          }
        </p>
      </div>
    </div>
  );
};

export default PersonalizedHeroContent;