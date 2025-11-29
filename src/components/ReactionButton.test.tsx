/**
 * ReactionButton Component Tests
 * 
 * Tests for emoji display, theme awareness, keyboard accessibility,
 * and selection state.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactionButton } from './ReactionButton';
import { ThemeProvider } from '../contexts/ThemeContext';

// Helper to render with theme context
function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('ReactionButton', () => {
  it('renders with correct emoji for cute theme', () => {
    renderWithTheme(
      <ReactionButton
        reactionType="COMFORT"
        isSelected={false}
        onClick={() => {}}
      />
    );
    
    const button = screen.getByRole('button', { name: /react with comfort/i });
    expect(button).toBeInTheDocument();
    expect(button.textContent).toBe('🥰');
  });

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    renderWithTheme(
      <ReactionButton
        reactionType="LOVE"
        isSelected={false}
        onClick={handleClick}
      />
    );
    
    const button = screen.getByRole('button', { name: /react with love/i });
    await user.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('triggers onClick when Enter key is pressed', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    renderWithTheme(
      <ReactionButton
        reactionType="HOPE"
        isSelected={false}
        onClick={handleClick}
      />
    );
    
    const button = screen.getByRole('button', { name: /react with hope/i });
    button.focus();
    await user.keyboard('{Enter}');
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('triggers onClick when Space key is pressed', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    renderWithTheme(
      <ReactionButton
        reactionType="FEAR"
        isSelected={false}
        onClick={handleClick}
      />
    );
    
    const button = screen.getByRole('button', { name: /react with fear/i });
    button.focus();
    await user.keyboard(' ');
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows selected state with aria-pressed', () => {
    renderWithTheme(
      <ReactionButton
        reactionType="DREAD"
        isSelected={true}
        onClick={() => {}}
      />
    );
    
    const button = screen.getByRole('button', { name: /react with dread/i });
    expect(button).toHaveClass('selected');
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('does not call onClick when disabled', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    renderWithTheme(
      <ReactionButton
        reactionType="COMFORT"
        isSelected={false}
        onClick={handleClick}
        disabled={true}
      />
    );
    
    const button = screen.getByRole('button', { name: /react with comfort/i });
    await user.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('has proper accessibility attributes', () => {
    renderWithTheme(
      <ReactionButton
        reactionType="LOVE"
        isSelected={false}
        onClick={() => {}}
      />
    );
    
    const button = screen.getByRole('button', { name: /react with love/i });
    expect(button).toHaveAttribute('tabIndex', '0');
    expect(button).toHaveAttribute('aria-label', 'React with love');
    expect(button).toHaveAttribute('data-reaction', 'LOVE');
  });

  it('applies disabled class when disabled', () => {
    renderWithTheme(
      <ReactionButton
        reactionType="HOPE"
        isSelected={false}
        onClick={() => {}}
        disabled={true}
      />
    );
    
    const button = screen.getByRole('button', { name: /react with hope/i });
    expect(button).toHaveClass('disabled');
    expect(button).toBeDisabled();
  });
});
