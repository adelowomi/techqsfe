'use client';

import React from 'react';
import { AnimatedCounter, StatisticCounter, CounterGrid } from '../components/AnimatedCounter';
import { ProgressChart, ChartCard, ChartGrid } from '../components/ProgressChart';
import type { ChartDataPoint } from '../types';

// Example data for the statistics showcase
const statisticsData = [
  {
    id: 'users',
    label: 'Active Users',
    value: 12500,
    type: 'number' as const,
    icon: <span className="text-2xl">👥</span>,
    description: 'Monthly active users'
  },
  {
    id: 'success-rate',
    label: 'Success Rate',
    value: 94.5,
    type: 'percentage' as const,
    icon: <span className="text-2xl">✅</span>,
    description: 'Average quiz completion rate'
  },
  {
    id: 'questions',
    label: 'Questions Answered',
    value: 45000,
    type: 'number' as const,
    icon: <span className="text-2xl">❓</span>,
    description: 'Total questions this month'
  },
  {
    id: 'revenue',
    label: 'Monthly Revenue',
    value: 25000,
    type: 'currency' as const,
    icon: <span className="text-2xl">💰</span>,
    description: 'Recurring monthly revenue'
  }
];

const skillDistributionData: ChartDataPoint[] = [
  { label: 'JavaScript', value: 45, color: '#F7DF1E' },
  { label: 'TypeScript', value: 30, color: '#3178C6' },
  { label: 'Python', value: 25, color: '#3776AB' },
  { label: 'Java', value: 20, color: '#ED8B00' },
  { label: 'React', value: 35, color: '#61DAFB' }
];

const difficultyData: ChartDataPoint[] = [
  { label: 'Easy', value: 40, color: '#10B981' },
  { label: 'Medium', value: 35, color: '#F59E0B' },
  { label: 'Hard', value: 25, color: '#EF4444' }
];

const performanceData: ChartDataPoint[] = [
  { label: 'Week 1', value: 85, color: '#8B5CF6' },
  { label: 'Week 2', value: 92, color: '#8B5CF6' },
  { label: 'Week 3', value: 88, color: '#8B5CF6' },
  { label: 'Week 4', value: 95, color: '#8B5CF6' }
];

const chartConfigurations = [
  {
    id: 'skills',
    title: 'Skill Distribution',
    description: 'Most popular programming languages',
    icon: <span className="text-xl">💻</span>,
    data: skillDistributionData,
    type: 'donut' as const,
    actions: (
      <button className="text-sm text-purple-600 hover:text-purple-800 font-medium">
        View Details
      </button>
    )
  },
  {
    id: 'difficulty',
    title: 'Question Difficulty',
    description: 'Distribution by difficulty level',
    icon: <span className="text-xl">📊</span>,
    data: difficultyData,
    type: 'progress' as const
  },
  {
    id: 'performance',
    title: 'Weekly Performance',
    description: 'Average scores over time',
    icon: <span className="text-xl">📈</span>,
    data: performanceData,
    type: 'bar' as const
  }
];

export const StatisticsShowcase: React.FC = () => {
  return (
    <div className="statistics-showcase max-w-7xl mx-auto p-6 space-y-12">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Platform Statistics
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Real-time insights into user engagement, performance metrics, and platform growth
        </p>
      </div>

      {/* Key Metrics Counter Grid */}
      <section className="metrics-section">
        <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
          Key Metrics
        </h3>
        <CounterGrid
          counters={statisticsData}
          staggerDelay={150}
          className="grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
        />
      </section>

      {/* Detailed Analytics Charts */}
      <section className="charts-section">
        <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
          Detailed Analytics
        </h3>
        <ChartGrid
          charts={chartConfigurations}
          columns={3}
          staggerDelay={200}
        />
      </section>

      {/* Individual Chart Examples */}
      <section className="examples-section">
        <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
          Interactive Examples
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Custom Counter Example */}
          <ChartCard
            title="Custom Animated Counter"
            description="Example of a custom formatted counter with animation"
            icon={<span className="text-xl">🎯</span>}
            chart={
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-purple-600 mb-2">
                    <AnimatedCounter
                      value={98.7}
                      trigger="scroll"
                      duration={2500}
                      decimals={1}
                      suffix="%"
                      className="text-purple-600"
                    />
                  </div>
                  <div className="text-sm text-gray-600">
                    User Satisfaction Score
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-semibold text-green-600">
                      <StatisticCounter
                        value={1250}
                        type="number"
                        trigger="scroll"
                        delay={500}
                      />
                    </div>
                    <div className="text-xs text-gray-500">New Users</div>
                  </div>
                  <div>
                    <div className="text-2xl font-semibold text-blue-600">
                      <StatisticCounter
                        value={15000}
                        type="currency"
                        trigger="scroll"
                        delay={750}
                      />
                    </div>
                    <div className="text-xs text-gray-500">Revenue</div>
                  </div>
                </div>
              </div>
            }
          />

          {/* Custom Progress Chart Example */}
          <ChartCard
            title="Interactive Progress Chart"
            description="Hover over elements to see detailed information"
            icon={<span className="text-xl">📊</span>}
            chart={
              <ProgressChart
                data={[
                  { 
                    label: 'Frontend', 
                    value: 65, 
                    color: '#06B6D4',
                    metadata: { category: 'Development', trend: '+5%' }
                  },
                  { 
                    label: 'Backend', 
                    value: 45, 
                    color: '#10B981',
                    metadata: { category: 'Development', trend: '+2%' }
                  },
                  { 
                    label: 'DevOps', 
                    value: 30, 
                    color: '#F59E0B',
                    metadata: { category: 'Operations', trend: '+8%' }
                  },
                  { 
                    label: 'Design', 
                    value: 25, 
                    color: '#EF4444',
                    metadata: { category: 'Creative', trend: '+3%' }
                  }
                ]}
                type="progress"
                interactive={true}
                showLabels={true}
                showValues={true}
                animationDelay={300}
                staggerDelay={150}
                title="Skill Categories"
              />
            }
          />
        </div>
      </section>

      {/* Performance Summary */}
      <section className="summary-section bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-8">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">
            Performance Summary
          </h3>
          <p className="text-gray-600">
            Overall platform health and user engagement metrics
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              <StatisticCounter
                value={99.9}
                type="percentage"
                trigger="scroll"
                decimals={1}
                delay={100}
              />
            </div>
            <div className="text-sm font-medium text-gray-700">Uptime</div>
            <div className="text-xs text-gray-500">Last 30 days</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              <StatisticCounter
                value={2.3}
                type="time"
                trigger="scroll"
                timeUnit="seconds"
                decimals={1}
                delay={200}
              />
            </div>
            <div className="text-sm font-medium text-gray-700">Avg Response Time</div>
            <div className="text-xs text-gray-500">API endpoints</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              <StatisticCounter
                value={4.8}
                type="number"
                trigger="scroll"
                decimals={1}
                delay={300}
                suffix="/5"
              />
            </div>
            <div className="text-sm font-medium text-gray-700">User Rating</div>
            <div className="text-xs text-gray-500">App store average</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default StatisticsShowcase;