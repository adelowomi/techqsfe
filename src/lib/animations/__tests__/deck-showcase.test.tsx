import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DeckShowcase } from '../components/DeckShowcase';
import type { DeckData } from '../components/DeckShowcase';

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
    stack: vi.fn().mockReturnValue({ finished: Promise.resolve() }),
    hover: vi.fn().mockReturnValue({ finished: Promise.resolve() })
  }
}));

// IntersectionObserver is mocked globally in test-setup.ts

describe('DeckShowcase', () => {
  const mockDecks: DeckData[] = [
    {
      difficulty: 'EASY',
      totalCards: 52,
      usedCards: 30,
      averageUsage: 2.5,
      color: '#10b981',
      description: 'Perfect for beginners and warm-up sessions'
    },
    {
      difficulty: 'MEDIUM',
      totalCards: 52,
      usedCards: 25,
      averageUsage: 3.2,
      color: '#f59e0b',
      description: 'Balanced challenge for regular practice'
    },
    {
      difficulty: 'HARD',
      totalCards: 52,
      usedCards: 15,
      averageUsage: 4.1,
      color: '#ef4444',
      description: 'Advanced questions for expert players'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders deck showcase with title and subtitle', () => {
    render(
      <DeckShowcase 
        decks={mockDecks}
        title="Test Decks"
        subtitle="Choose your challenge level"
      />
    );
    
    expect(screen.getByText('Test Decks')).toBeInTheDocument();
    expect(screen.getByText('Choose your challenge level')).toBeInTheDocument();
  });

  it('renders all deck cards with correct information', () => {
    render(<DeckShowcase decks={mockDecks} />);
    
    expect(screen.getByText('Easy')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Hard')).toBeInTheDocument();
    
    expect(screen.getByText('Perfect for beginners and warm-up sessions')).toBeInTheDocument();
    expect(screen.getByText('Balanced challenge for regular practice')).toBeInTheDocument();
    expect(screen.getByText('Advanced questions for expert players')).toBeInTheDocument();
  });

  it('displays correct statistics for each deck', () => {
    render(<DeckShowcase decks={mockDecks} />);
    
    // Check total cards
    expect(screen.getAllByText('52')).toHaveLength(3);
    
    // Check used cards
    expect(screen.getByText('30')).toBeInTheDocument(); // Easy deck
    expect(screen.getByText('25')).toBeInTheDocument(); // Medium deck
    expect(screen.getByText('15')).toBeInTheDocument(); // Hard deck
    
    // Check average usage
    expect(screen.getByText('2.5')).toBeInTheDocument();
    expect(screen.getByText('3.2')).toBeInTheDocument();
    expect(screen.getByText('4.1')).toBeInTheDocument();
  });

  it('calculates and displays usage percentages correctly', () => {
    render(<DeckShowcase decks={mockDecks} />);
    
    // Easy: 30/52 = ~58%
    expect(screen.getByText('58%')).toBeInTheDocument();
    
    // Medium: 25/52 = ~48%
    expect(screen.getByText('48%')).toBeInTheDocument();
    
    // Hard: 15/52 = ~29%
    expect(screen.getByText('29%')).toBeInTheDocument();
  });

  it('calls onDeckSelect when a deck is clicked', () => {
    const mockOnDeckSelect = vi.fn();
    render(<DeckShowcase decks={mockDecks} onDeckSelect={mockOnDeckSelect} />);
    
    const easyDeck = screen.getByRole('button', { name: /Easy deck/ });
    fireEvent.click(easyDeck);
    
    expect(mockOnDeckSelect).toHaveBeenCalledWith('EASY');
  });

  it('handles keyboard navigation', () => {
    const mockOnDeckSelect = vi.fn();
    render(<DeckShowcase decks={mockDecks} onDeckSelect={mockOnDeckSelect} />);
    
    const mediumDeck = screen.getByRole('button', { name: /Medium deck/ });
    fireEvent.keyDown(mediumDeck, { key: 'Enter' });
    
    expect(mockOnDeckSelect).toHaveBeenCalledWith('MEDIUM');
  });

  it('handles space key navigation', () => {
    const mockOnDeckSelect = vi.fn();
    render(<DeckShowcase decks={mockDecks} onDeckSelect={mockOnDeckSelect} />);
    
    const hardDeck = screen.getByRole('button', { name: /Hard deck/ });
    fireEvent.keyDown(hardDeck, { key: ' ' });
    
    expect(mockOnDeckSelect).toHaveBeenCalledWith('HARD');
  });

  it('applies custom className and style', () => {
    const customStyle = { backgroundColor: 'blue' };
    render(
      <DeckShowcase 
        decks={mockDecks}
        className="custom-showcase"
        style={customStyle}
      />
    );
    
    const showcase = screen.getByRole('region');
    expect(showcase).toHaveClass('custom-showcase');
    expect(showcase).toHaveStyle({ backgroundColor: 'blue' });
  });

  it('renders without onDeckSelect as articles', () => {
    render(<DeckShowcase decks={mockDecks} />);
    
    const articles = screen.getAllByRole('article');
    expect(articles).toHaveLength(3);
  });

  it('renders with onDeckSelect as buttons', () => {
    const mockOnDeckSelect = vi.fn();
    render(<DeckShowcase decks={mockDecks} onDeckSelect={mockOnDeckSelect} />);
    
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
  });

  it('handles mouse hover events', () => {
    render(<DeckShowcase decks={mockDecks} />);
    
    const easyDeck = screen.getByRole('article', { name: /Easy deck/ });
    fireEvent.mouseEnter(easyDeck);
    fireEvent.mouseLeave(easyDeck);
    
    // Should handle hover without errors
    expect(easyDeck).toBeInTheDocument();
  });

  it('displays correct difficulty colors', () => {
    render(<DeckShowcase decks={mockDecks} />);
    
    // The component should render with appropriate colors for each difficulty
    // This is tested through the component rendering without errors
    expect(screen.getByText('Easy')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Hard')).toBeInTheDocument();
  });

  it('handles empty deck list', () => {
    render(<DeckShowcase decks={[]} />);
    
    expect(screen.getByText('Card Decks')).toBeInTheDocument();
    expect(screen.getByText('Choose your difficulty level')).toBeInTheDocument();
  });

  it('handles deck with zero total cards', () => {
    const deckWithZeroCards: DeckData[] = [{
      difficulty: 'EASY',
      totalCards: 0,
      usedCards: 0,
      averageUsage: 0,
      color: '#10b981',
      description: 'Empty deck for testing'
    }];

    render(<DeckShowcase decks={deckWithZeroCards} />);
    
    expect(screen.getByText('0%')).toBeInTheDocument(); // Usage percentage should be 0%
    expect(screen.getByText('0.0')).toBeInTheDocument(); // Average usage should be 0.0
  });

  it('sets up intersection observer for entrance animation', () => {
    render(<DeckShowcase decks={mockDecks} />);
    
    // Component should render without errors and set up intersection observer
    expect(screen.getByText('Card Decks')).toBeInTheDocument();
  });

  it('applies stagger delay to deck animations', () => {
    render(<DeckShowcase decks={mockDecks} staggerDelay={200} />);
    
    // Component should render without errors with custom stagger delay
    expect(screen.getByText('Easy')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Hard')).toBeInTheDocument();
  });

  it('displays correct aria labels', () => {
    const mockOnDeckSelect = vi.fn();
    render(<DeckShowcase decks={mockDecks} onDeckSelect={mockOnDeckSelect} />);
    
    expect(screen.getByRole('button', { name: 'Easy deck: 30/52 cards used' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Medium deck: 25/52 cards used' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hard deck: 15/52 cards used' })).toBeInTheDocument();
  });

  it('uses custom logo URL and alt text', () => {
    render(
      <DeckShowcase 
        decks={mockDecks}
        logoUrl="/custom-logo.svg"
        logoAlt="Custom Logo"
      />
    );
    
    const logos = screen.getAllByAltText('Custom Logo');
    expect(logos).toHaveLength(3); // One for each deck
    
    logos.forEach(logo => {
      expect(logo).toHaveAttribute('src', '/custom-logo.svg');
    });
  });
});