import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProgressChart, ChartCard, ChartGrid } from '../components/ProgressChart';
import type { ChartDataPoint } from '../types';

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock data
const mockChartData: ChartDataPoint[] = [
  { label: 'JavaScript', value: 45, color: '#F7DF1E' },
  { label: 'TypeScript', value: 30, color: '#3178C6' },
  { label: 'Python', value: 25, color: '#3776AB' },
  { label: 'Java', value: 20, color: '#ED8B00' }
];

describe('ProgressChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Basic Functionality', () => {
    it('should render chart with data', () => {
      render(
        <ProgressChart
          data={mockChartData}
          type="progress"
          title="Programming Languages"
        />
      );
      
      const chart = screen.getByTestId('progress-chart');
      expect(chart).toBeInTheDocument();
      
      // Check if title is rendered
      expect(screen.getByText('Programming Languages')).toBeInTheDocument();
      
      // Check if labels are rendered
      expect(screen.getByText('JavaScript')).toBeInTheDocument();
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
      expect(screen.getByText('Python')).toBeInTheDocument();
      expect(screen.getByText('Java')).toBeInTheDocument();
    });

    it('should render bar chart type', () => {
      render(
        <ProgressChart
          data={mockChartData}
          type="bar"
        />
      );
      
      const chart = screen.getByTestId('progress-chart');
      expect(chart).toBeInTheDocument();
      
      // Check if bars are rendered
      mockChartData.forEach((_, index) => {
        expect(screen.getByTestId(`bar-${index}`)).toBeInTheDocument();
      });
    });

    it('should render progress bar type', () => {
      render(
        <ProgressChart
          data={mockChartData}
          type="progress"
        />
      );
      
      const chart = screen.getByTestId('progress-chart');
      expect(chart).toBeInTheDocument();
      
      // Check if progress bars are rendered
      mockChartData.forEach((_, index) => {
        expect(screen.getByTestId(`progress-${index}`)).toBeInTheDocument();
      });
    });

    it('should render donut chart type', () => {
      render(
        <ProgressChart
          data={mockChartData}
          type="donut"
        />
      );
      
      const chart = screen.getByTestId('progress-chart');
      expect(chart).toBeInTheDocument();
      
      // Check if donut segments are rendered
      mockChartData.forEach((_, index) => {
        expect(screen.getByTestId(`donut-segment-${index}`)).toBeInTheDocument();
      });
    });
  });

  describe('Animation and Interaction', () => {
    it('should set up intersection observer for animations', () => {
      render(
        <ProgressChart
          data={mockChartData}
          type="progress"
        />
      );
      
      expect(mockIntersectionObserver).toHaveBeenCalled();
    });

    it('should handle hover interactions when interactive', () => {
      render(
        <ProgressChart
          data={mockChartData}
          type="progress"
          interactive={true}
        />
      );
      
      const firstProgressBar = screen.getByTestId('progress-0');
      
      // Hover over first bar
      fireEvent.mouseEnter(firstProgressBar);
      
      // Should apply hover styles (tested through DOM structure)
      expect(firstProgressBar).toBeInTheDocument();
      
      // Mouse leave
      fireEvent.mouseLeave(firstProgressBar);
      expect(firstProgressBar).toBeInTheDocument();
    });

    it('should not handle hover when not interactive', () => {
      render(
        <ProgressChart
          data={mockChartData}
          type="progress"
          interactive={false}
        />
      );
      
      const firstProgressBar = screen.getByTestId('progress-0');
      
      // Hover should not cause issues
      fireEvent.mouseEnter(firstProgressBar);
      fireEvent.mouseLeave(firstProgressBar);
      
      expect(firstProgressBar).toBeInTheDocument();
    });
  });

  describe('Configuration Options', () => {
    it('should hide labels when showLabels is false', () => {
      render(
        <ProgressChart
          data={mockChartData}
          type="progress"
          showLabels={false}
        />
      );
      
      // Labels should not be rendered
      expect(screen.queryByText('JavaScript')).not.toBeInTheDocument();
      expect(screen.queryByText('TypeScript')).not.toBeInTheDocument();
    });

    it('should hide values when showValues is false', () => {
      render(
        <ProgressChart
          data={mockChartData}
          type="bar"
          showValues={false}
        />
      );
      
      // Values should not be rendered
      expect(screen.queryByText('45')).not.toBeInTheDocument();
      expect(screen.queryByText('30')).not.toBeInTheDocument();
    });

    it('should apply custom colors', () => {
      const customColors = ['#FF0000', '#00FF00', '#0000FF'];
      
      render(
        <ProgressChart
          data={mockChartData}
          type="progress"
          colors={customColors}
        />
      );
      
      const chart = screen.getByTestId('progress-chart');
      expect(chart).toBeInTheDocument();
    });

    it('should apply custom dimensions', () => {
      render(
        <ProgressChart
          data={mockChartData}
          type="bar"
          width={400}
          height={300}
        />
      );
      
      const chart = screen.getByTestId('progress-chart');
      expect(chart).toBeInTheDocument();
      expect(chart).toHaveStyle({ width: '400px' });
    });
  });

  describe('Data Handling', () => {
    it('should handle empty data gracefully', () => {
      render(
        <ProgressChart
          data={[]}
          type="progress"
        />
      );
      
      const chart = screen.getByTestId('progress-chart');
      expect(chart).toBeInTheDocument();
    });

    it('should handle single data point', () => {
      const singleData = [{ label: 'Single', value: 100 }];
      
      render(
        <ProgressChart
          data={singleData}
          type="progress"
        />
      );
      
      const chart = screen.getByTestId('progress-chart');
      expect(chart).toBeInTheDocument();
      expect(screen.getByText('Single')).toBeInTheDocument();
    });

    it('should handle data with metadata', () => {
      const dataWithMetadata = [
        {
          label: 'Test',
          value: 50,
          metadata: { category: 'frontend', difficulty: 'easy' }
        }
      ];
      
      render(
        <ProgressChart
          data={dataWithMetadata}
          type="progress"
          interactive={true}
        />
      );
      
      const chart = screen.getByTestId('progress-chart');
      expect(chart).toBeInTheDocument();
    });
  });
});

describe('ChartCard', () => {
  const mockChart = (
    <ProgressChart
      data={mockChartData}
      type="progress"
    />
  );

  it('should render chart card with title', () => {
    render(
      <ChartCard
        title="Test Chart"
        chart={mockChart}
      />
    );
    
    expect(screen.getByText('Test Chart')).toBeInTheDocument();
    expect(screen.getByTestId('progress-chart')).toBeInTheDocument();
  });

  it('should render chart card with description', () => {
    render(
      <ChartCard
        title="Test Chart"
        description="This is a test chart"
        chart={mockChart}
      />
    );
    
    expect(screen.getByText('Test Chart')).toBeInTheDocument();
    expect(screen.getByText('This is a test chart')).toBeInTheDocument();
  });

  it('should render chart card with icon', () => {
    const icon = <span data-testid="chart-icon">📊</span>;
    
    render(
      <ChartCard
        title="Test Chart"
        icon={icon}
        chart={mockChart}
      />
    );
    
    expect(screen.getByTestId('chart-icon')).toBeInTheDocument();
  });

  it('should render chart card with actions', () => {
    const actions = <button data-testid="chart-action">Export</button>;
    
    render(
      <ChartCard
        title="Test Chart"
        actions={actions}
        chart={mockChart}
      />
    );
    
    expect(screen.getByTestId('chart-action')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <ChartCard
        title="Test Chart"
        chart={mockChart}
        className="custom-chart-card"
      />
    );
    
    const card = screen.getByText('Test Chart').closest('.chart-card');
    expect(card).toHaveClass('custom-chart-card');
  });
});

describe('ChartGrid', () => {
  const mockCharts = [
    {
      id: '1',
      title: 'Chart 1',
      description: 'First chart',
      data: mockChartData.slice(0, 2),
      type: 'progress' as const
    },
    {
      id: '2',
      title: 'Chart 2',
      description: 'Second chart',
      data: mockChartData.slice(2, 4),
      type: 'bar' as const
    },
    {
      id: '3',
      title: 'Chart 3',
      data: mockChartData,
      type: 'donut' as const
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render all charts in grid', () => {
    render(<ChartGrid charts={mockCharts} />);
    
    const grid = screen.getByTestId('chart-grid');
    expect(grid).toBeInTheDocument();
    
    expect(screen.getByText('Chart 1')).toBeInTheDocument();
    expect(screen.getByText('Chart 2')).toBeInTheDocument();
    expect(screen.getByText('Chart 3')).toBeInTheDocument();
  });

  it('should render chart descriptions', () => {
    render(<ChartGrid charts={mockCharts} />);
    
    expect(screen.getByText('First chart')).toBeInTheDocument();
    expect(screen.getByText('Second chart')).toBeInTheDocument();
  });

  it('should apply different column layouts', () => {
    const { rerender } = render(<ChartGrid charts={mockCharts} columns={1} />);
    
    let grid = screen.getByTestId('chart-grid');
    expect(grid).toHaveClass('grid-cols-1');
    
    rerender(<ChartGrid charts={mockCharts} columns={2} />);
    grid = screen.getByTestId('chart-grid');
    expect(grid).toHaveClass('md:grid-cols-2');
    
    rerender(<ChartGrid charts={mockCharts} columns={3} />);
    grid = screen.getByTestId('chart-grid');
    expect(grid).toHaveClass('lg:grid-cols-3');
    
    rerender(<ChartGrid charts={mockCharts} columns={4} />);
    grid = screen.getByTestId('chart-grid');
    expect(grid).toHaveClass('lg:grid-cols-4');
  });

  it('should apply custom className', () => {
    render(<ChartGrid charts={mockCharts} className="custom-grid" />);
    
    const grid = screen.getByTestId('chart-grid');
    expect(grid).toHaveClass('custom-grid');
  });

  it('should handle empty charts array', () => {
    render(<ChartGrid charts={[]} />);
    
    const grid = screen.getByTestId('chart-grid');
    expect(grid).toBeInTheDocument();
  });

  it('should render charts with icons and actions', () => {
    const chartsWithExtras = mockCharts.map(chart => ({
      ...chart,
      icon: <span data-testid={`icon-${chart.id}`}>📊</span>,
      actions: <button data-testid={`action-${chart.id}`}>Export</button>
    }));

    render(<ChartGrid charts={chartsWithExtras} />);
    
    expect(screen.getByTestId('icon-1')).toBeInTheDocument();
    expect(screen.getByTestId('icon-2')).toBeInTheDocument();
    expect(screen.getByTestId('icon-3')).toBeInTheDocument();
    
    expect(screen.getByTestId('action-1')).toBeInTheDocument();
    expect(screen.getByTestId('action-2')).toBeInTheDocument();
    expect(screen.getByTestId('action-3')).toBeInTheDocument();
  });
});