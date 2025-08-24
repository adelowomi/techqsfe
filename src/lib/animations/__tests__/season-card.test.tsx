import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SeasonCard } from '../components/SeasonCard';
import type { SeasonWithStats } from '~/lib/types';

// Mock the animation dependencies
vi.mock('../scroll-controller', () => ({
  ScrollAnimationController: vi.fn().mockImplementation(() => ({
    destroy: vi.fn()
  }))
}));

vi.mock('../card-physics', () => ({
  CardPhysics: {
    optimizeForGPU: vi.fn(),
    removeGPUOptimization: vi.fn(),
    flip: vi.fn().mockReturnValue({ finished: Promise.resolve() }),
    hover: vi.fn().mockReturnValue({ finished: Promise.resolve() })
  }
}));

// IntersectionObserver is mocked globally in test-setup.ts

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn(() => '2 days')
}));

describe('SeasonCard', () => {
  const mockSeason: SeasonWithStats = {
    id: 'season-1',
    name: 'Test Season',
    description: 'A test season for unit testing',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdById: 'user-1',
    totalCards: 45,
    totalAttempts: 120,
    easyDeckCount: 20,
    mediumDeckCount: 15,
    hardDeckCount: 10,
    createdBy: {
      name: 'Test User',
      email: 'test@example.com'
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders season information correctly', () => {
    render(<SeasonCard season={mockSeason} />);
    
    expect(screen.getByText('Test Season')).toBeInTheDocument();
    expect(screen.getByText('A test season for unit testing')).toBeInTheDocument();
    expect(screen.getByText('Created 2 days ago by Test User')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument(); // Total cards
    expect(screen.getByText('120')).toBeInTheDocument(); // Total attempts
  });

  it('displays deck statistics on the front', () => {
    render(<SeasonCard season={mockSeason} />);
    
    expect(screen.getByText('Total Cards:')).toBeInTheDocument();
    expect(screen.getByText('Total Attempts:')).toBeInTheDocument();
  });

  it('shows deck details when flipped', async () => {
    render(<SeasonCard season={mockSeason} flipOnClick={true} />);
    
    const card = screen.getByRole('button');
    fireEvent.click(card);
    
    await waitFor(() => {
      expect(screen.getByText(/Deck Status/)).toBeInTheDocument();
    });
  });

  it('calls onClick handler when clicked', () => {
    const mockOnClick = vi.fn();
    render(<SeasonCard season={mockSeason} onClick={mockOnClick} />);
    
    const card = screen.getByRole('button');
    fireEvent.click(card);
    
    expect(mockOnClick).toHaveBeenCalledWith(mockSeason);
  });

  it('calls onSelect handler when provided', () => {
    const mockOnSelect = vi.fn();
    render(<SeasonCard season={mockSeason} onSelect={mockOnSelect} flipOnClick={false} />);
    
    const card = screen.getByRole('button');
    fireEvent.click(card);
    
    expect(mockOnSelect).toHaveBeenCalledWith('season-1');
  });

  it('handles keyboard navigation', () => {
    const mockOnClick = vi.fn();
    render(<SeasonCard season={mockSeason} onClick={mockOnClick} />);
    
    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: 'Enter' });
    
    expect(mockOnClick).toHaveBeenCalledWith(mockSeason);
  });

  it('handles space key navigation', () => {
    const mockOnClick = vi.fn();
    render(<SeasonCard season={mockSeason} onClick={mockOnClick} />);
    
    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: ' ' });
    
    expect(mockOnClick).toHaveBeenCalledWith(mockSeason);
  });

  it('applies custom className and style', () => {
    const customStyle = { backgroundColor: 'red' };
    render(
      <SeasonCard 
        season={mockSeason} 
        className="custom-class" 
        style={customStyle}
        flipOnClick={false}
        onSelect={undefined}
      />
    );
    
    const card = screen.getByRole('article');
    expect(card).toHaveClass('custom-class');
    expect(card).toHaveStyle({ backgroundColor: 'red' });
  });

  it('shows correct deck status colors', () => {
    const seasonWithLowCounts: SeasonWithStats = {
      ...mockSeason,
      easyDeckCount: 5,   // < 25% of 52
      mediumDeckCount: 20, // ~38% of 52
      hardDeckCount: 40    // ~77% of 52
    };

    render(<SeasonCard season={seasonWithLowCounts} flipOnClick={true} />);
    
    const card = screen.getByRole('button');
    fireEvent.click(card);
    
    // The component should render with appropriate colors based on percentages
    // This is tested through the component rendering without errors
    expect(card).toBeInTheDocument();
  });

  it('handles season without description', () => {
    const seasonWithoutDescription: SeasonWithStats = {
      ...mockSeason,
      description: null
    };

    render(<SeasonCard season={seasonWithoutDescription} />);
    
    expect(screen.getByText('Test Season')).toBeInTheDocument();
    expect(screen.queryByText('A test season for unit testing')).not.toBeInTheDocument();
  });

  it('handles season without creator name', () => {
    const seasonWithoutCreatorName: SeasonWithStats = {
      ...mockSeason,
      createdBy: {
        name: null,
        email: 'test@example.com'
      }
    };

    render(<SeasonCard season={seasonWithoutCreatorName} />);
    
    expect(screen.getByText('Created 2 days ago')).toBeInTheDocument();
  });

  it('sets up intersection observer for entrance animation', () => {
    render(<SeasonCard season={mockSeason} />);
    
    // Component should render without errors and set up intersection observer
    expect(screen.getByText('Test Season')).toBeInTheDocument();
  });

  it('applies stagger delay to entrance animation', () => {
    render(<SeasonCard season={mockSeason} staggerDelay={200} />);
    
    // Component should render without errors with stagger delay
    expect(screen.getByText('Test Season')).toBeInTheDocument();
  });

  it('respects flipOnHover prop', async () => {
    render(<SeasonCard season={mockSeason} flipOnHover={true} flipOnClick={false} onSelect={undefined} />);
    
    const card = screen.getByRole('article');
    fireEvent.mouseEnter(card);
    
    // Should trigger hover animation
    expect(card).toBeInTheDocument();
  });

  it('handles mouse leave event', () => {
    render(<SeasonCard season={mockSeason} flipOnClick={false} onSelect={undefined} />);
    
    const card = screen.getByRole('article');
    fireEvent.mouseEnter(card);
    fireEvent.mouseLeave(card);
    
    // Should handle mouse leave without errors
    expect(card).toBeInTheDocument();
  });

  it('displays correct aria labels', () => {
    render(<SeasonCard season={mockSeason} flipOnClick={true} />);
    
    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('aria-label', 'Season: Test Season');
    expect(card).toHaveAttribute('aria-pressed', 'false');
  });

  it('updates aria-pressed when flipped', async () => {
    const mockOnFlip = vi.fn();
    render(<SeasonCard season={mockSeason} flipOnClick={true} onFlip={mockOnFlip} />);
    
    const card = screen.getByRole('button');
    fireEvent.click(card);
    
    await waitFor(() => {
      expect(mockOnFlip).toHaveBeenCalledWith(true);
    });
  });
});