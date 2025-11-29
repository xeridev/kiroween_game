/**
 * ReactionButton Component
 * 
 * Renders a single emoji reaction button with theme-aware styling,
 * hover animations, keyboard accessibility, and selection state.
 * 
 * Requirements: 1.3, 9.1, 9.2, 9.3
 */

import { useCallback } from 'react';
import { useThemeMode } from '../contexts/ThemeContext';
import type { ReactionType } from '../utils/types';
import './ReactionButton.css';

/**
 * Emoji mapping for each reaction type, theme-aware
 * Requirement 1.3: Theme-aware emoji selection
 */
const REACTION_EMOJIS: Record<'cute' | 'horror', Record<ReactionType, string>> = {
  cute: {
    COMFORT: '🥰',
    FEAR: '😊',
    LOVE: '💖',
    DREAD: '✨',
    HOPE: '🌸',
  },
  horror: {
    COMFORT: '😨',
    FEAR: '😱',
    LOVE: '🖤',
    DREAD: '👻',
    HOPE: '🩸',
  },
};

/**
 * Human-readable labels for each reaction type
 * Used for aria-label accessibility
 */
const REACTION_LABELS: Record<ReactionType, string> = {
  COMFORT: 'comfort',
  FEAR: 'fear',
  LOVE: 'love',
  DREAD: 'dread',
  HOPE: 'hope',
};

export interface ReactionButtonProps {
  /** Type of reaction this button represents */
  reactionType: ReactionType;
  /** Whether this reaction is currently selected */
  isSelected: boolean;
  /** Callback when button is clicked or activated via keyboard */
  onClick: () => void;
  /** Whether the button is disabled (e.g., already reacted) */
  disabled?: boolean;
}

/**
 * ReactionButton Component
 * 
 * A single emoji reaction button with:
 * - Theme-aware emoji display
 * - Hover scale animation (1.2x with bounce ease)
 * - Selected state with border highlight
 * - Full keyboard accessibility (Enter/Space)
 * - Screen reader support with aria-label
 */
export function ReactionButton({
  reactionType,
  isSelected,
  onClick,
  disabled = false,
}: ReactionButtonProps) {
  const themeMode = useThemeMode();
  
  // Get the appropriate emoji for current theme
  const emoji = REACTION_EMOJIS[themeMode][reactionType];
  const label = REACTION_LABELS[reactionType];

  /**
   * Handle keyboard activation
   * Requirement 9.2: Enter/Space triggers reaction
   */
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!disabled) {
        onClick();
      }
    }
  }, [onClick, disabled]);

  return (
    <button
      className={`reaction-button ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      tabIndex={0}
      aria-label={`React with ${label}`}
      aria-pressed={isSelected}
      data-reaction={reactionType}
      type="button"
    >
      <span className="reaction-emoji" aria-hidden="true">
        {emoji}
      </span>
    </button>
  );
}
