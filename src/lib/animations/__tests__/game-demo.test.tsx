import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { GameDemo } from '../components/GameDemo';

// Mock the CardPhysics module
vi.mock('../card-physics', () => ({
  CardPhysics: {
    optimizeForGPU: vi.fn(),
    removeGPUOptimization: vi.fn()
  }
}));

// Mock the ScrollAnimationController
vi.mock('../scroll-controller', () => ({
  ScrollAnimationController: vi.fn().mockImplementation(() => ({
    destroy: vi.fn()
  }))
}));

describe('GameDemo', () => {
  const mockDemoCards = [
    {
      id: 'card-1',
      question: 'What is React?',
      answer: 'A JavaScript library for building user interfaces',
      difficulty: 'easy' as const,
      category: 'Frontend'
    },
    {
      id: 'card-2',
      question: 'What is TypeScript?',
      answer: 'A typed superset of JavaScript',
      difficulty: 'medium' as const,
      category: 'Languages'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders with demo cards', () => {
    render(<GameDemo demoCards={mockDemoCards} />);
    
    expect(screen.getByText('Game Demo')).toBeInTheDocument();
    expect(screen.getByText('Welcome to TechQS! Let\'s see how the game works.')).toBeInTheDocument();
  });

  it('shows controls when showControls is true', () => {
    render(<GameDemo demoCards={mockDemoCards} showControls={true} />);
    
    expect(screen.getByText('← Previous')).toBeInTheDocument();
    expect(screen.getByText('Play')).toBeInTheDocument();
    expect(screen.getByText('Next →')).toBeInTheDocument();
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });

  it('hides controls when showControls is false', () => {
    render(<GameDemo demoCards={mockDemoCards} showControls={false} />);
    
    expect(screen.queryByText('← Previous')).not.toBeInTheDocument();
    expect(screen.queryByText('Play')).not.toBeInTheDocument();
    expect(screen.queryByText('Next →')).not.toBeInTheDocument();
    expect(screen.queryByText('Reset')).not.toBeInTheDocument();
  });

  it('starts demo when play button is clicked', () => {
    render(<GameDemo demoCards={mockDemoCards} autoAdvance={false} />);
    
    const playButton = screen.getByText('Play');
    fireEvent.click(playButton);
    
    expect(screen.getByText('Pause')).toBeInTheDocument();
  });

  it('advances to next step when next button is clicked', () => {
    render(<GameDemo demoCards={mockDemoCards} autoAdvance={false} />);
    
    const nextButton = screen.getByText('Next →');
    fireEvent.click(nextButton);
    
    expect(screen.getByText('Drawing a question card from the deck...')).toBeInTheDocument();
  });

  it('goes to previous step when previous button is clicked', () => {
    render(<GameDemo demoCards={mockDemoCards} autoAdvance={false} />);
    
    // First advance to next step
    const nextButton = screen.getByText('Next →');
    fireEvent.click(nextButton);
    
    // Then go back
    const prevButton = screen.getByText('← Previous');
    fireEvent.click(prevButton);
    
    expect(screen.getByText('Welcome to TechQS! Let\'s see how the game works.')).toBeInTheDocument();
  });

  it('resets demo when reset button is clicked', () => {
    render(<GameDemo demoCards={mockDemoCards} autoAdvance={false} />);
    
    // Advance a few steps
    const nextButton = screen.getByText('Next →');
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);
    
    // Reset
    const resetButton = screen.getByText('Reset');
    fireEvent.click(resetButton);
    
    expect(screen.getByText('Welcome to TechQS! Let\'s see how the game works.')).toBeInTheDocument();
  });

  it('calls onStepChange when step changes', () => {
    const onStepChange = vi.fn();
    render(<GameDemo demoCards={mockDemoCards} onStepChange={onStepChange} autoAdvance={false} />);
    
    const nextButton = screen.getByText('Next →');
    fireEvent.click(nextButton);
    
    expect(onStepChange).toHaveBeenCalledWith(1);
  });

  it('auto-advances when autoAdvance is true', async () => {
    render(<GameDemo demoCards={mockDemoCards} autoAdvance={true} stepDuration={1000} />);
    
    // Start the demo
    const playButton = screen.getByText('Play');
    fireEvent.click(playButton);
    
    // Fast-forward time
    vi.advanceTimersByTime(1000);
    
    await waitFor(() => {
      expect(screen.getByText('Drawing a question card from the deck...')).toBeInTheDocument();
    });
  });

  it('displays card content during question step', () => {
    render(<GameDemo demoCards={mockDemoCards} autoAdvance={false} />);
    
    // Advance to question step
    const nextButton = screen.getByText('Next →');
    fireEvent.click(nextButton); // dealing
    fireEvent.click(nextButton); // question
    
    expect(screen.getByText('What is React?')).toBeInTheDocument();
    expect(screen.getByText('Frontend')).toBeInTheDocument();
    expect(screen.getByText('easy')).toBeInTheDocument();
  });

  it('displays answer during answer step', () => {
    render(<GameDemo demoCards={mockDemoCards} autoAdvance={false} />);
    
    // Advance to answer step
    const nextButton = screen.getByText('Next →');
    fireEvent.click(nextButton); // dealing
    fireEvent.click(nextButton); // question
    fireEvent.click(nextButton); // thinking
    fireEvent.click(nextButton); // answer
    
    expect(screen.getByText('A JavaScript library for building user interfaces')).toBeInTheDocument();
    expect(screen.getByText('Answer:')).toBeInTheDocument();
  });

  it('shows completion message at the end', () => {
    render(<GameDemo demoCards={[mockDemoCards[0]]} autoAdvance={false} />);
    
    // Advance through all steps
    const nextButton = screen.getByText('Next →');
    for (let i = 0; i < 6; i++) {
      fireEvent.click(nextButton);
    }
    
    expect(screen.getByText('Demo Complete!')).toBeInTheDocument();
    expect(screen.getByText(/Final Score:/)).toBeInTheDocument();
  });

  it('applies custom className and style', () => {
    render(
      <GameDemo 
        demoCards={mockDemoCards}
        className="custom-demo"
        style={{ backgroundColor: 'red' }}
      />
    );
    
    const demo = screen.getByText('Game Demo').closest('.game-demo');
    expect(demo).toHaveClass('custom-demo');
    expect(demo).toHaveStyle({ backgroundColor: 'red' });
  });

  it('handles empty demo cards array', () => {
    render(<GameDemo demoCards={[]} />);
    
    expect(screen.getByText('Game Demo')).toBeInTheDocument();
    expect(screen.getByText('Welcome to TechQS! Let\'s see how the game works.')).toBeInTheDocument();
  });
});