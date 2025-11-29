import { useState, useEffect, useCallback } from "react";
import type { DialogueChoice, StatDelta } from "../utils/types";
import { useTheme } from "../contexts/ThemeContext";
import { logError, logWarning } from "../utils/errorLogger";
import "./DialogueChoices.css";

interface DialogueChoicesProps {
  choices: DialogueChoice[];
  onSelect: (choiceId: string, statDelta: StatDelta) => void;
  timeoutSeconds?: number;
}

/**
 * DialogueChoices - Display player-selectable narrative response options
 * 
 * Requirements: 6.2, 6.3, 6.4, 6.5, 6.6, 12.1, 12.2, 12.3, 12.4, 12.5
 */
export function DialogueChoices({ 
  choices, 
  onSelect, 
  timeoutSeconds = 60 
}: DialogueChoicesProps) {
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(timeoutSeconds);
  const [initialAnnouncement, setInitialAnnouncement] = useState<string>("");
  const { mode } = useTheme();

  // Announce when choices first appear (Requirement 12.3)
  useEffect(() => {
    const tones = choices.map(c => c.emotionalTone).join(", ");
    setInitialAnnouncement(
      `${choices.length} dialogue options available: ${tones}. You have ${timeoutSeconds} seconds to choose.`
    );
    // Clear announcement after it's been read
    const timer = setTimeout(() => setInitialAnnouncement(""), 3000);
    return () => clearTimeout(timer);
  }, []); // Only run once on mount

  // Handle choice selection with error handling (Requirements 6.3, 6.4, 12.4, 15.2)
  const handleSelect = useCallback((choice: DialogueChoice) => {
    try {
      if (selectedChoiceId) return; // Already selected

      // Requirement 15.2: Validate choice exists
      if (!choice || !choice.id) {
        logWarning("Invalid dialogue choice selection", { choice });
        // Fall back to neutral option
        const neutralChoice = choices.find(c => c.emotionalTone === "neutral") || choices[0];
        if (neutralChoice) {
          setSelectedChoiceId(neutralChoice.id);
          onSelect(neutralChoice.id, neutralChoice.statDelta);
        }
        return;
      }

      setSelectedChoiceId(choice.id);
      onSelect(choice.id, choice.statDelta);
    } catch (error) {
      // Requirement 15.2: Handle selection errors gracefully
      logError(
        "Failed to handle dialogue choice selection",
        error instanceof Error ? error : new Error(String(error)),
        { choiceId: choice?.id }
      );
      // Fall back to neutral option
      const neutralChoice = choices.find(c => c.emotionalTone === "neutral") || choices[0];
      if (neutralChoice && !selectedChoiceId) {
        setSelectedChoiceId(neutralChoice.id);
        onSelect(neutralChoice.id, neutralChoice.statDelta);
      }
    }
  }, [selectedChoiceId, onSelect, choices]);

  // Countdown timer with cleanup and error handling (Requirement 6.5, 15.2)
  useEffect(() => {
    if (selectedChoiceId) return; // Stop countdown if choice made

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          try {
            // Timeout - auto-select neutral option (Requirement 6.5, 12.5)
            const neutralChoice = choices.find(c => c.emotionalTone === "neutral") || choices[0];
            
            // Requirement 15.2: Validate neutral choice exists
            if (!neutralChoice) {
              logError(
                "Dialogue timeout handler failure: no neutral choice available",
                new Error("No neutral choice found"),
                { choicesCount: choices.length }
              );
              return 0;
            }
            
            handleSelect(neutralChoice);
          } catch (error) {
            // Requirement 15.2: Handle timeout handler failure
            logError(
              "Dialogue timeout handler failure",
              error instanceof Error ? error : new Error(String(error))
            );
            // Immediately select first available choice as last resort
            if (choices.length > 0 && choices[0]) {
              try {
                handleSelect(choices[0]);
              } catch (fallbackError) {
                logError(
                  "Dialogue fallback selection also failed",
                  fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError))
                );
              }
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Cleanup timeout on unmount (Performance optimization)
    return () => {
      clearInterval(interval);
    };
  }, [selectedChoiceId, choices, handleSelect]);

  // Keyboard navigation (Requirements 12.1, 12.2)
  const handleKeyDown = useCallback((e: React.KeyboardEvent, choice: DialogueChoice) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleSelect(choice);
    }
  }, [handleSelect]);

  // Get tone indicator emoji
  const getToneEmoji = (tone: DialogueChoice["emotionalTone"]): string => {
    const emojiMap = {
      comforting: "🤗",
      fearful: "😨",
      loving: "💖",
      neutral: "😐",
    };
    return emojiMap[tone];
  };

  // Get tone color class
  const getToneClass = (tone: DialogueChoice["emotionalTone"]): string => {
    return `choice-tone-${tone}`;
  };

  return (
    <div 
      className={`dialogue-choices dialogue-choices--${mode}`}
      role="group"
      aria-label="Dialogue response options"
    >
      {/* Countdown timer (Requirement 6.5) */}
      <div 
        className="choice-timeout"
        role="timer"
        aria-live="polite"
        aria-atomic="true"
      >
        {timeRemaining > 0 ? (
          <>Time to respond: {timeRemaining}s</>
        ) : (
          <>Auto-selected</>
        )}
      </div>

      {/* Choice buttons (Requirements 6.2, 6.6, 12.1, 12.2, 12.3) */}
      <div className="choice-buttons">
        {choices.map((choice) => (
          <button
            key={choice.id}
            className={`dialogue-choice-button ${getToneClass(choice.emotionalTone)} ${
              selectedChoiceId === choice.id ? "selected" : ""
            } ${selectedChoiceId && selectedChoiceId !== choice.id ? "disabled" : ""}`}
            onClick={() => handleSelect(choice)}
            onKeyDown={(e) => handleKeyDown(e, choice)}
            disabled={!!selectedChoiceId}
            tabIndex={0}
            aria-label={`${choice.text}. ${choice.emotionalTone} response. ${
              choice.statDelta.sanity ? `Sanity ${choice.statDelta.sanity > 0 ? '+' : ''}${choice.statDelta.sanity}` : ''
            } ${
              choice.statDelta.corruption ? `Corruption ${choice.statDelta.corruption > 0 ? '+' : ''}${choice.statDelta.corruption}` : ''
            }`}
          >
            <span className="choice-tone-indicator" aria-hidden="true">
              {getToneEmoji(choice.emotionalTone)}
            </span>
            <span className="choice-text">{choice.text}</span>
            {/* Stat delta preview */}
            <span className="choice-stats" aria-hidden="true">
              {choice.statDelta.sanity !== undefined && choice.statDelta.sanity !== 0 && (
                <span className={`stat-delta ${choice.statDelta.sanity > 0 ? 'positive' : 'negative'}`}>
                  Sanity {choice.statDelta.sanity > 0 ? '+' : ''}{choice.statDelta.sanity}
                </span>
              )}
              {choice.statDelta.corruption !== undefined && choice.statDelta.corruption !== 0 && (
                <span className={`stat-delta ${choice.statDelta.corruption > 0 ? 'positive' : 'negative'}`}>
                  Corruption {choice.statDelta.corruption > 0 ? '+' : ''}{choice.statDelta.corruption}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      {/* Screen reader announcements (Requirements 12.3, 12.4, 12.5) */}
      <div className="sr-only" role="status" aria-live="assertive" aria-atomic="true">
        {initialAnnouncement && <>{initialAnnouncement}</>}
        {selectedChoiceId && (
          <>Choice selected: {choices.find(c => c.id === selectedChoiceId)?.text}</>
        )}
        {!selectedChoiceId && timeRemaining === 30 && <>30 seconds remaining to choose</>}
        {!selectedChoiceId && timeRemaining === 10 && <>10 seconds remaining to choose</>}
        {!selectedChoiceId && timeRemaining === 5 && <>5 seconds remaining to choose</>}
        {!selectedChoiceId && timeRemaining === 0 && <>Time expired. Neutral option auto-selected.</>}
      </div>
    </div>
  );
}
