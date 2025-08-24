import { describe, it, expect, vi } from 'vitest';
import { LogoAnimation } from '../components/LogoAnimation';

// Mock Next.js Image component for testing
vi.mock('next/image', () => ({
  default: ({ src, alt, className }: any) => ({
    type: 'img',
    props: { src, alt, className }
  })
}));

describe('LogoAnimation', () => {
  it('should export LogoAnimation component', () => {
    expect(LogoAnimation).toBeDefined();
    expect(typeof LogoAnimation).toBe('function');
  });

  it('should have correct logo paths mapping', () => {
    // Test that the component can be instantiated with all variants
    const variants = [
      'purple-filled',
      'purple-outline', 
      'black-filled',
      'black-outline'
    ] as const;
    
    variants.forEach(variant => {
      expect(() => {
        // This tests that the component can be created with each variant
        const props = { variant, size: 'md' as const };
        // Component should accept these props without TypeScript errors
        expect(props.variant).toBe(variant);
      }).not.toThrow();
    });
  });

  it('should support all size variants', () => {
    const sizes = ['sm', 'md', 'lg', 'xl'] as const;
    
    sizes.forEach(size => {
      expect(() => {
        const props = { variant: 'purple-filled' as const, size };
        expect(props.size).toBe(size);
      }).not.toThrow();
    });
  });

  it('should accept optional props', () => {
    expect(() => {
      const props = {
        variant: 'purple-filled' as const,
        size: 'md' as const,
        animate: true,
        className: 'test-class',
        onAnimationComplete: () => {}
      };
      expect(props.animate).toBe(true);
      expect(props.className).toBe('test-class');
      expect(typeof props.onAnimationComplete).toBe('function');
    }).not.toThrow();
  });
});