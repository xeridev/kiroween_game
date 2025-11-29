/**
 * ReactionButtons Container Component
 * 
 * Renders a container with 5 ReactionButton components for player reactions.
 * Handles reaction logic, stat change callbacks, and duplicate prevention.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 8.1
 */

import { useCallback } from 'react';
import { useGameStore } from '../store';
import { ReactionButton } from './ReactionButton';
import type { NarrativeLog, ReactionType, StatDelta } from '../utils/types';
import './ReactionButtons.css';

/**
 * All available reaction types in display order
 */
const REACTION_TYPES: ReactionType[] = ['COMFORT', 'FEAR', 'LOVE', 'DREAD', 'HOPE'];

export interface ReactionButtonsProps {
  /** The narrative log entry to react to */
  log: NarrativeLog;
  /** Callback when a reaction is applied with stat changes */
  onReactionApplied: (statChanges: StatDelta) => void;
}

/**
 * ReactionButtons Container Component
 * 
 * Features:
 * - Renders 5 reaction buttons (COMFORT, FEAR, LOVE, DREAD, HOPE)
 * - Calls store.addReaction() on click
 * - Triggers stat change animation callback
 * - Prevents duplicate reactions (checks if log already has reaction)
 * - Hidden on mobile via CSS (.log-reactions class)
 */
export function ReactionButtons({ log, onReactionApplied }: ReactionButtonsProps) {
  const addReaction = useGameStore((state) => state.addReaction);

  // Check if log already has a reaction (Requirement 1.3)
  const hasReaction = log.reactions && log.reactions.length > 0;
  const selectedReaction = hasReaction ? log.reactions![0].reactionType : null;

  /**
   * Handle reaction button click
   * Requirement 1.2: Call store.addReaction()
   * Requirement 1.4: Trigger stat change animation callback
   */
  const handleReactionClick = useCallback(
    async (reactionType: ReactionType) => {
      // Don't allow duplicate reactions
      if (hasReaction) {
        return;
      }

      // Import stat deltas to get the delta for this reaction
      const { REACTION_STAT_DELTAS } = await import('../utils/types');
      const statDelta = REACTION_STAT_DELTAS[reactionType];

      // Add reaction to store (this will update stats and log)
      await addReaction(log.id, reactionType);

      // Trigger stat change animation callback
      onReactionApplied(statDelta);
    },
    [log.id, hasReaction, addReaction, onReactionApplied]
  );

  return (
    <div className="log-reactions">
      {REACTION_TYPES.map((reactionType) => (
        <ReactionButton
          key={reactionType}
          reactionType={reactionType}
          isSelected={selectedReaction === reactionType}
          onClick={() => handleReactionClick(reactionType)}
          disabled={hasReaction}
        />
      ))}
    </div>
  );
}
