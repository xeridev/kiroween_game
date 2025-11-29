/**
 * ProgressIndicator Component Tests
 * 
 * Tests for progress display, time remaining calculation, and status transitions.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
 */

import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressIndicator } from './ProgressIndicator';
import { ThemeProvider } from '../contexts/ThemeContext';
import type { GenerationProgress } from '../utils/types';

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

// Helper to render with theme context
function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('ProgressIndicator', () => {
  it('does not render when status is idle', () => {
    const progress: GenerationProgress = {
      startTime: Date.now(),
      pollCount: 0,
      estimatedTimeRemaining: 90,
    };

    const { container } = renderWithTheme(
      <ProgressIndicator progress={progress} status="idle" />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders generating state with spinner', () => {
    const progress: GenerationProgress = {
      startTime: Date.now(),
      pollCount: 0,
      estimatedTimeRemaining: 90,
    };

    renderWithTheme(
      <ProgressIndicator progress={progress} status="generating" />
    );

    expect(screen.getByText('Generating...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows ~60s remaining after 30 seconds elapsed (Requirement 4.3)', () => {
    const progress: GenerationProgress = {
      startTime: Date.now() - 30000, // 30 seconds ago
      pollCount: 15,
      estimatedTimeRemaining: 60,
    };

    renderWithTheme(
      <ProgressIndicator progress={progress} status="generating" />
    );

    expect(screen.getByText('Generating... ~60s remaining')).toBeInTheDocument();
  });

  it('shows ~30s remaining after 60 seconds elapsed (Requirement 4.4)', () => {
    const progress: GenerationProgress = {
      startTime: Date.now() - 60000, // 60 seconds ago
      pollCount: 30,
      estimatedTimeRemaining: 30,
    };

    renderWithTheme(
      <ProgressIndicator progress={progress} status="generating" />
    );

    expect(screen.getByText('Generating... ~30s remaining')).toBeInTheDocument();
  });

  it('shows "Taking longer than expected..." after 90 seconds (Requirement 4.5)', () => {
    const progress: GenerationProgress = {
      startTime: Date.now() - 90000, // 90 seconds ago
      pollCount: 45,
      estimatedTimeRemaining: 0,
    };

    renderWithTheme(
      <ProgressIndicator progress={progress} status="generating" />
    );

    expect(screen.getByText('Taking longer than expected...')).toBeInTheDocument();
  });

  it('renders completed state (Requirement 4.6)', () => {
    const progress: GenerationProgress = {
      startTime: Date.now() - 45000,
      pollCount: 22,
      estimatedTimeRemaining: 0,
    };

    renderWithTheme(
      <ProgressIndicator progress={progress} status="completed" />
    );

    expect(screen.getByText('Image generated!')).toBeInTheDocument();
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('renders failed state (Requirement 4.7)', () => {
    const progress: GenerationProgress = {
      startTime: Date.now() - 30000,
      pollCount: 15,
      estimatedTimeRemaining: 60,
    };

    renderWithTheme(
      <ProgressIndicator progress={progress} status="failed" />
    );

    expect(screen.getByText('Generation failed')).toBeInTheDocument();
    expect(screen.getByText('✕')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    const progress: GenerationProgress = {
      startTime: Date.now(),
      pollCount: 0,
      estimatedTimeRemaining: 90,
    };

    renderWithTheme(
      <ProgressIndicator progress={progress} status="generating" />
    );

    const indicator = screen.getByRole('status');
    expect(indicator).toHaveAttribute('aria-live', 'polite');
    expect(indicator).toHaveAttribute('aria-label', 'Generating...');
  });

  it('applies correct CSS classes for generating state', () => {
    const progress: GenerationProgress = {
      startTime: Date.now(),
      pollCount: 0,
      estimatedTimeRemaining: 90,
    };

    renderWithTheme(
      <ProgressIndicator progress={progress} status="generating" />
    );

    const indicator = screen.getByRole('status');
    expect(indicator).toHaveClass('progress-indicator');
    expect(indicator).toHaveClass('progress-indicator--generating');
  });

  it('applies correct CSS classes for completed state', () => {
    const progress: GenerationProgress = {
      startTime: Date.now() - 45000,
      pollCount: 22,
      estimatedTimeRemaining: 0,
    };

    renderWithTheme(
      <ProgressIndicator progress={progress} status="completed" />
    );

    const indicator = screen.getByRole('status');
    expect(indicator).toHaveClass('progress-indicator');
    expect(indicator).toHaveClass('progress-indicator--completed');
  });

  it('applies correct CSS classes for failed state', () => {
    const progress: GenerationProgress = {
      startTime: Date.now() - 30000,
      pollCount: 15,
      estimatedTimeRemaining: 60,
    };

    renderWithTheme(
      <ProgressIndicator progress={progress} status="failed" />
    );

    const indicator = screen.getByRole('status');
    expect(indicator).toHaveClass('progress-indicator');
    expect(indicator).toHaveClass('progress-indicator--failed');
  });
});
