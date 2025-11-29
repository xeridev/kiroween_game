/**
 * StatChangeIndicator Component Tests
 * 
 * Tests for stat change display, color coding, and animation behavior.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.5
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { StatChangeIndicator } from './StatChangeIndicator';
import { ThemeProvider } from '../contexts/ThemeContext';
import * as animationUtils from '../utils/animationUtils';

// Mock window.matchMedia
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

// Mock GSAP
vi.mock('gsap', () => ({
  gsap: {
    fromTo: vi.fn((_element, _from, to) => {
      // Simulate animation completion
      if (to.onComplete) {
        setTimeout(to.onComplete, 0);
      }
      return {
        kill: vi.fn(),
      };
    }),
  },
}));

// Helper to render with theme context
function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('StatChangeIndicator', () => {
  let onCompleteMock: () => void;

  beforeEach(() => {
    onCompleteMock = vi.fn() as () => void;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders positive stat change with correct formatting', () => {
    renderWithTheme(
      <StatChangeIndicator
        statName="sanity"
        delta={2}
        onComplete={onCompleteMock}
      />
    );

    const indicator = screen.getByText('+2');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveClass('stat-change--positive');
  });

  it('renders negative stat change with correct formatting', () => {
    renderWithTheme(
      <StatChangeIndicator
        statName="sanity"
        delta={-3}
        onComplete={onCompleteMock}
      />
    );

    const indicator = screen.getByText('-3');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveClass('stat-change--negative');
  });

  it('has proper accessibility attributes', () => {
    renderWithTheme(
      <StatChangeIndicator
        statName="corruption"
        delta={1}
        onComplete={onCompleteMock}
      />
    );

    const indicator = screen.getByRole('status');
    expect(indicator).toHaveAttribute('aria-live', 'polite');
    expect(indicator).toHaveAttribute('aria-label', 'corruption changed by +1');
  });

  it('calls onComplete after animation', async () => {
    renderWithTheme(
      <StatChangeIndicator
        statName="sanity"
        delta={2}
        onComplete={onCompleteMock}
      />
    );

    await waitFor(() => {
      expect(onCompleteMock).toHaveBeenCalledTimes(1);
    });
  });

  it('respects reduced motion preference', async () => {
    // Mock prefersReducedMotion to return true
    vi.spyOn(animationUtils, 'prefersReducedMotion').mockReturnValue(true);

    renderWithTheme(
      <StatChangeIndicator
        statName="sanity"
        delta={2}
        onComplete={onCompleteMock}
      />
    );

    // Should complete without GSAP animation
    await waitFor(() => {
      expect(onCompleteMock).toHaveBeenCalled();
    }, { timeout: 1000 });
  });

  it('applies correct color class for positive changes', () => {
    renderWithTheme(
      <StatChangeIndicator
        statName="sanity"
        delta={3}
        onComplete={onCompleteMock}
      />
    );

    const indicator = screen.getByText('+3');
    expect(indicator).toHaveClass('stat-change-indicator');
    expect(indicator).toHaveClass('stat-change--positive');
  });

  it('applies correct color class for negative changes', () => {
    renderWithTheme(
      <StatChangeIndicator
        statName="corruption"
        delta={-2}
        onComplete={onCompleteMock}
      />
    );

    const indicator = screen.getByText('-2');
    expect(indicator).toHaveClass('stat-change-indicator');
    expect(indicator).toHaveClass('stat-change--negative');
  });

  it('handles zero delta', () => {
    renderWithTheme(
      <StatChangeIndicator
        statName="hunger"
        delta={0}
        onComplete={onCompleteMock}
      />
    );

    const indicator = screen.getByText('0');
    expect(indicator).toBeInTheDocument();
    // Zero is treated as negative (no + sign)
    expect(indicator).toHaveClass('stat-change--negative');
  });
});
