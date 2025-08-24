import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { FeatureCard } from '../components/FeatureCard';
import { FeatureShowcase } from '../components/FeatureShowcase';

// Mock the CardPhysics module
vi.mock('../card-physics', () => ({
  CardPhysics: {
    optimizeForGPU: vi.fn(),
    removeGPUOptimization: vi.fn(),
    flip: vi.fn(() => ({
      finished: Promise.resolve()
    })),
    hover: vi.fn(() => ({
      finished: Promise.resolve()
    }))
  }
}));

// Mock the ScrollAnimationController
vi.mock('../scroll-controller', () => ({
  ScrollAnimationController: vi.fn().mockImplementation(() => ({
    destroy: vi.fn()
  }))
}));

describe('FeatureCard', () => {
  const defaultProps = {
    id: 'test-feature',
    title: 'Test Feature',
    description: 'This is a test feature description',
    detailedInfo: <div>Detailed information about the feature</div>
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with basic props', () => {
    render(<FeatureCard {...defaultProps} />);
    
    expect(screen.getByText('Test Feature')).toBeInTheDocument();
    expect(screen.getByText('This is a test feature description')).toBeInTheDocument();
  });

  it('displays icon when provided', () => {
    const icon = <span data-testid="test-icon">🎮</span>;
    render(<FeatureCard {...defaultProps} icon={icon} />);
    
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('handles click to flip when flipOnClick is true', async () => {
    const onFlip = vi.fn();
    render(
      <FeatureCard 
        {...defaultProps} 
        flipOnClick={true}
        onFlip={onFlip}
      />
    );
    
    const card = screen.getByRole('button');
    fireEvent.click(card);
    
    await waitFor(() => {
      expect(onFlip).toHaveBeenCalledWith(true);
    });
  });

  it('handles keyboard navigation', async () => {
    const onFlip = vi.fn();
    render(
      <FeatureCard 
        {...defaultProps} 
        flipOnClick={true}
        onFlip={onFlip}
      />
    );
    
    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: 'Enter' });
    
    await waitFor(() => {
      expect(onFlip).toHaveBeenCalledWith(true);
    });
  });

  it('calls onClick handler when provided', () => {
    const onClick = vi.fn();
    render(
      <FeatureCard 
        {...defaultProps} 
        onClick={onClick}
      />
    );
    
    const card = screen.getByRole('button');
    fireEvent.click(card);
    
    expect(onClick).toHaveBeenCalled();
  });

  it('applies custom className and style', () => {
    render(
      <FeatureCard 
        {...defaultProps} 
        className="custom-class"
        style={{ backgroundColor: 'red' }}
      />
    );
    
    const card = screen.getByRole('button');
    expect(card).toHaveClass('custom-class');
    expect(card).toHaveStyle({ backgroundColor: 'red' });
  });

  it('shows appropriate hint text based on interaction mode', () => {
    const { rerender } = render(
      <FeatureCard {...defaultProps} flipOnClick={true} />
    );
    
    expect(screen.getByText('Click to learn more')).toBeInTheDocument();
    
    rerender(<FeatureCard {...defaultProps} flipOnClick={false} />);
    expect(screen.getByText('Hover to learn more')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<FeatureCard {...defaultProps} flipOnClick={true} />);
    
    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('aria-label', 'Feature: Test Feature');
    expect(card).toHaveAttribute('aria-pressed', 'false');
    expect(card).toHaveAttribute('tabIndex', '0');
  });
});

describe('FeatureShowcase', () => {
  const mockFeatures = [
    {
      id: 'feature-1',
      title: 'Feature 1',
      description: 'Description 1',
      detailedInfo: <div>Details 1</div>,
      icon: <span>🎮</span>
    },
    {
      id: 'feature-2',
      title: 'Feature 2',
      description: 'Description 2',
      detailedInfo: <div>Details 2</div>,
      icon: <span>🎯</span>
    },
    {
      id: 'feature-3',
      title: 'Feature 3',
      description: 'Description 3',
      detailedInfo: <div>Details 3</div>,
      icon: <span>📊</span>
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all features', () => {
    render(<FeatureShowcase features={mockFeatures} />);
    
    expect(screen.getByText('Feature 1')).toBeInTheDocument();
    expect(screen.getByText('Feature 2')).toBeInTheDocument();
    expect(screen.getByText('Feature 3')).toBeInTheDocument();
  });

  it('renders title and subtitle when provided', () => {
    render(
      <FeatureShowcase 
        features={mockFeatures}
        title="Amazing Features"
        subtitle="Discover what makes our platform special"
      />
    );
    
    expect(screen.getByText('Amazing Features')).toBeInTheDocument();
    expect(screen.getByText('Discover what makes our platform special')).toBeInTheDocument();
  });

  it('applies custom className and style', () => {
    render(
      <FeatureShowcase 
        features={mockFeatures}
        className="custom-showcase"
        style={{ backgroundColor: 'blue' }}
      />
    );
    
    const showcase = screen.getByRole('region');
    expect(showcase).toHaveClass('custom-showcase');
    expect(showcase).toHaveStyle({ backgroundColor: 'blue' });
  });

  it('passes interaction props to feature cards', () => {
    render(
      <FeatureShowcase 
        features={mockFeatures}
        flipOnHover={true}
        flipOnClick={false}
      />
    );
    
    // Check that cards show hover hint instead of click hint
    expect(screen.getAllByText('Hover to learn more')).toHaveLength(3);
  });

  it('renders with different column configurations', () => {
    const { rerender } = render(
      <FeatureShowcase features={mockFeatures} columns={2} />
    );
    
    // Test that component renders without errors with different column counts
    rerender(<FeatureShowcase features={mockFeatures} columns={1} />);
    rerender(<FeatureShowcase features={mockFeatures} columns={4} />);
    
    // All features should still be present
    expect(screen.getByText('Feature 1')).toBeInTheDocument();
    expect(screen.getByText('Feature 2')).toBeInTheDocument();
    expect(screen.getByText('Feature 3')).toBeInTheDocument();
  });
});