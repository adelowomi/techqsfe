'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ScrollAnimationController } from '../scroll-controller';
import type { ChartDataPoint, ChartAnimationConfig } from '../types';

export interface ProgressChartProps {
  data: ChartDataPoint[];
  type: 'bar' | 'line' | 'pie' | 'donut' | 'progress';
  animationDelay?: number;
  staggerDelay?: number;
  duration?: number;
  className?: string;
  title?: string;
  showLabels?: boolean;
  showValues?: boolean;
  interactive?: boolean;
  colors?: string[];
  height?: number;
  width?: number;
}

export const ProgressChart: React.FC<ProgressChartProps> = ({
  data,
  type,
  animationDelay = 0,
  staggerDelay = 100,
  duration = 1000,
  className = '',
  title,
  showLabels = true,
  showValues = true,
  interactive = true,
  colors = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'],
  height = 200,
  width = 300
}) => {
  const [isAnimated, setIsAnimated] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const scrollControllerRef = useRef<ScrollAnimationController | undefined>(undefined);

  // Calculate maximum value for scaling
  const maxValue = Math.max(...data.map(d => d.value));

  useEffect(() => {
    if (chartRef.current) {
      scrollControllerRef.current = new ScrollAnimationController();
      
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting && !isAnimated) {
              setTimeout(() => {
                setIsAnimated(true);
              }, animationDelay);
            }
          });
        },
        {
          threshold: 0.3,
          rootMargin: '0px 0px -10% 0px'
        }
      );
      
      observer.observe(chartRef.current);
      
      return () => {
        observer.disconnect();
        if (scrollControllerRef.current) {
          scrollControllerRef.current.destroy();
        }
      };
    }
  }, [animationDelay, isAnimated]);

  const renderBarChart = () => {
    const barWidth = (width - 60) / data.length - 10;
    
    return (
      <div className="bar-chart flex items-end justify-center space-x-2 h-full">
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * (height - 40);
          const color = item.color || colors[index % colors.length];
          const delay = index * staggerDelay;
          
          return (
            <div
              key={item.label}
              className="bar-container flex flex-col items-center"
              style={{ width: barWidth }}
              onMouseEnter={() => interactive && setHoveredIndex(index)}
              onMouseLeave={() => interactive && setHoveredIndex(null)}
            >
              <div
                className="bar bg-gradient-to-t rounded-t transition-all duration-300 cursor-pointer"
                style={{
                  backgroundColor: color,
                  height: isAnimated ? barHeight : 0,
                  width: '100%',
                  transitionDelay: isAnimated ? `${delay}ms` : '0ms',
                  transform: hoveredIndex === index ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: hoveredIndex === index ? `0 4px 12px ${color}40` : 'none'
                }}
                data-testid={`bar-${index}`}
              />
              {showValues && (
                <div
                  className="bar-value text-xs font-medium mt-1 transition-opacity duration-300"
                  style={{
                    opacity: isAnimated ? 1 : 0,
                    transitionDelay: isAnimated ? `${delay + 200}ms` : '0ms'
                  }}
                >
                  {item.value}
                </div>
              )}
              {showLabels && (
                <div
                  className="bar-label text-xs text-gray-600 mt-1 text-center transition-opacity duration-300"
                  style={{
                    opacity: isAnimated ? 1 : 0,
                    transitionDelay: isAnimated ? `${delay + 300}ms` : '0ms'
                  }}
                >
                  {item.label}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderProgressBars = () => {
    return (
      <div className="progress-bars space-y-4">
        {data.map((item, index) => {
          const percentage = (item.value / maxValue) * 100;
          const color = item.color || colors[index % colors.length];
          const delay = index * staggerDelay;
          
          return (
            <div
              key={item.label}
              className="progress-item"
              onMouseEnter={() => interactive && setHoveredIndex(index)}
              onMouseLeave={() => interactive && setHoveredIndex(null)}
            >
              <div className="flex justify-between items-center mb-2">
                {showLabels && (
                  <span className="text-sm font-medium text-gray-700">
                    {item.label}
                  </span>
                )}
                {showValues && (
                  <span className="text-sm text-gray-500">
                    {item.value}
                  </span>
                )}
              </div>
              <div className="progress-track bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="progress-fill h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    backgroundColor: color,
                    width: isAnimated ? `${percentage}%` : '0%',
                    transitionDelay: isAnimated ? `${delay}ms` : '0ms',
                    transform: hoveredIndex === index ? 'scaleY(1.2)' : 'scaleY(1)',
                    boxShadow: hoveredIndex === index ? `0 0 8px ${color}60` : 'none'
                  }}
                  data-testid={`progress-${index}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDonutChart = () => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;
    const innerRadius = radius * 0.6;
    
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = -90; // Start from top
    
    return (
      <div className="donut-chart relative">
        <svg width={width} height={height} className="overflow-visible">
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const angle = (item.value / total) * 360;
            const color = item.color || colors[index % colors.length];
            const delay = index * staggerDelay;
            
            // Calculate path for donut segment
            const startAngle = (currentAngle * Math.PI) / 180;
            const endAngle = ((currentAngle + angle) * Math.PI) / 180;
            
            const x1 = centerX + radius * Math.cos(startAngle);
            const y1 = centerY + radius * Math.sin(startAngle);
            const x2 = centerX + radius * Math.cos(endAngle);
            const y2 = centerY + radius * Math.sin(endAngle);
            
            const x3 = centerX + innerRadius * Math.cos(endAngle);
            const y3 = centerY + innerRadius * Math.sin(endAngle);
            const x4 = centerX + innerRadius * Math.cos(startAngle);
            const y4 = centerY + innerRadius * Math.sin(startAngle);
            
            const largeArcFlag = angle > 180 ? 1 : 0;
            
            const pathData = [
              `M ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              `L ${x3} ${y3}`,
              `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
              'Z'
            ].join(' ');
            
            currentAngle += angle;
            
            return (
              <path
                key={item.label}
                d={pathData}
                fill={color}
                className="transition-all duration-300 cursor-pointer"
                style={{
                  opacity: isAnimated ? 1 : 0,
                  transform: hoveredIndex === index ? 'scale(1.05)' : 'scale(1)',
                  transformOrigin: `${centerX}px ${centerY}px`,
                  transitionDelay: isAnimated ? `${delay}ms` : '0ms',
                  filter: hoveredIndex === index ? `drop-shadow(0 4px 8px ${color}40)` : 'none'
                }}
                onMouseEnter={() => interactive && setHoveredIndex(index)}
                onMouseLeave={() => interactive && setHoveredIndex(null)}
                data-testid={`donut-segment-${index}`}
              />
            );
          })}
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {data.reduce((sum, item) => sum + item.value, 0)}
            </div>
            <div className="text-sm text-gray-500">Total</div>
          </div>
        </div>
        
        {/* Legend */}
        {showLabels && (
          <div className="donut-legend mt-4 grid grid-cols-2 gap-2">
            {data.map((item, index) => {
              const color = item.color || colors[index % colors.length];
              const percentage = ((item.value / data.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(1);
              
              return (
                <div
                  key={item.label}
                  className="legend-item flex items-center space-x-2 cursor-pointer"
                  onMouseEnter={() => interactive && setHoveredIndex(index)}
                  onMouseLeave={() => interactive && setHoveredIndex(null)}
                >
                  <div
                    className="legend-color w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <div className="legend-text text-xs">
                    <div className="font-medium">{item.label}</div>
                    {showValues && (
                      <div className="text-gray-500">{percentage}%</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return renderBarChart();
      case 'progress':
        return renderProgressBars();
      case 'donut':
      case 'pie':
        return renderDonutChart();
      default:
        return renderProgressBars();
    }
  };

  return (
    <div
      ref={chartRef}
      className={`progress-chart ${className}`}
      data-testid="progress-chart"
      style={{ width, height: type === 'donut' ? height + 100 : height }}
    >
      {title && (
        <div className="chart-title text-lg font-semibold text-gray-900 mb-4 text-center">
          {title}
        </div>
      )}
      <div className="chart-container">
        {renderChart()}
      </div>
      
      {/* Tooltip for hovered item */}
      {interactive && hoveredIndex !== null && data[hoveredIndex] && (
        <div className="chart-tooltip absolute bg-gray-900 text-white px-3 py-2 rounded-lg text-sm pointer-events-none z-10">
          <div className="font-medium">{data[hoveredIndex].label}</div>
          <div>Value: {data[hoveredIndex].value}</div>
          {data[hoveredIndex].metadata && (
            <div className="text-gray-300 text-xs mt-1">
              {Object.entries(data[hoveredIndex].metadata || {}).map(([key, value]) => (
                <div key={key}>{key}: {String(value)}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Chart Card Container Component
export interface ChartCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  chart: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  description,
  icon,
  chart,
  className = '',
  actions
}) => {
  return (
    <div className={`chart-card bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300 ${className}`}>
      <div className="chart-card-header flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {icon && (
            <div className="chart-icon text-purple-600">
              {icon}
            </div>
          )}
          <div>
            <h3 className="chart-title text-lg font-semibold text-gray-900">
              {title}
            </h3>
            {description && (
              <p className="chart-description text-sm text-gray-600 mt-1">
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="chart-actions">
            {actions}
          </div>
        )}
      </div>
      
      <div className="chart-content">
        {chart}
      </div>
    </div>
  );
};

// Chart Grid Component for displaying multiple charts
export interface ChartGridProps {
  charts: Array<{
    id: string;
    title: string;
    description?: string;
    icon?: React.ReactNode;
    data: ChartDataPoint[];
    type: ProgressChartProps['type'];
    actions?: React.ReactNode;
  }>;
  columns?: 1 | 2 | 3 | 4;
  staggerDelay?: number;
  className?: string;
}

export const ChartGrid: React.FC<ChartGridProps> = ({
  charts,
  columns = 2,
  staggerDelay = 200,
  className = ''
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  };

  return (
    <div className={`chart-grid grid gap-6 ${gridCols[columns]} ${className}`} data-testid="chart-grid">
      {charts.map((chartConfig, index) => (
        <ChartCard
          key={chartConfig.id}
          title={chartConfig.title}
          description={chartConfig.description}
          icon={chartConfig.icon}
          actions={chartConfig.actions}
          chart={
            <ProgressChart
              data={chartConfig.data}
              type={chartConfig.type}
              animationDelay={index * staggerDelay}
              interactive={true}
              showLabels={true}
              showValues={true}
            />
          }
        />
      ))}
    </div>
  );
};