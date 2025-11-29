import { useEffect, useRef, useState, useCallback } from "react";
import type { NarrativeLog as NarrativeLogType, StatDelta } from "../utils/types";
import { FadeIn } from "./animations/FadeIn";
import { SplitText } from "./reactbits/SplitText";
import { GlassPanel } from "./GlassPanel";
import { useTheme } from "../contexts/ThemeContext";
import { useGameStore } from "../store";
import { ReactionButtons } from "./ReactionButtons";
import { StatChangeIndicator } from "./StatChangeIndicator";
import { ProgressIndicator } from "./ProgressIndicator";
import { DialogueChoices } from "./DialogueChoices";
import "./NarrativeLog.css";

interface NarrativeLogProps {
  logs: NarrativeLogType[];
  sanityLevel: number;
}

// Image modal component for viewing generated images
function ImageModal({ 
  imageUrl, 
  onClose 
}: { 
  imageUrl: string; 
  onClose: () => void;
}) {
  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div 
      className="image-modal-overlay" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Generated narrative image"
    >
      <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
        <img src={imageUrl} alt="Generated narrative scene" />
        <button 
          className="image-modal-close" 
          onClick={onClose}
          aria-label="Close image"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// Stagger delay between log entry animations (Requirements 4.2)
const STAGGER_DELAY_MS = 150;

/**
 * NarrativeLog - Game event log with dark-tinted glassmorphism
 * 
 * Requirements: 6.3, 6.4, 6.5
 */

// Animation duration for FadeIn (used to calculate scroll timing)
const FADE_IN_DURATION_MS = 400;

export function NarrativeLog({ logs, sanityLevel }: NarrativeLogProps) {
  // Track which log IDs have been seen (for animating only new entries)
  const [seenLogIds, setSeenLogIds] = useState<Set<string>>(new Set());
  
  // Track the previous log count to detect new batches
  const prevLogCountRef = useRef(logs.length);
  
  // Track the index of the first new entry in current batch
  const batchStartIndexRef = useRef<number | null>(null);
  
  // Ref for the log container to enable auto-scroll
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track if this is the initial render (don't animate existing entries)
  const isInitialRenderRef = useRef(true);
  
  // Get theme mode for styling
  const { mode } = useTheme();

  // Image generation state
  const generateLogImage = useGameStore((state) => state.generateLogImage);
  const currentPetSpriteUrl = useGameStore((state) => state.currentPetSpriteUrl);
  const autoGenerateImages = useGameStore((state) => state.autoGenerateImages);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  // Dialogue choice state
  const selectDialogueChoice = useGameStore((state) => state.selectDialogueChoice);
  const petName = useGameStore((state) => state.traits.name);
  const archetype = useGameStore((state) => state.traits.archetype);
  const stage = useGameStore((state) => state.stage);
  const stats = useGameStore((state) => state.stats);

  // Stat change indicator state (Requirement 7.1)
  const [statChanges, setStatChanges] = useState<Array<{
    id: string;
    statName: "sanity" | "corruption";
    delta: number;
  }>>([]);

  // Aria-live region for screen reader announcements (Requirement 9.4)
  const [ariaAnnouncement, setAriaAnnouncement] = useState<string>("");

  // Handle log click for image generation
  const handleLogClick = useCallback((log: NarrativeLogType) => {
    // If image already exists, show it in modal
    if (log.imageStatus === "completed" && log.imageUrl) {
      setSelectedImageUrl(log.imageUrl);
      return;
    }

    // If not generating and we have a pet sprite, start generation
    if (log.imageStatus !== "generating" && currentPetSpriteUrl) {
      generateLogImage(log.id);
    }
  }, [generateLogImage, currentPetSpriteUrl]);

  // Handle reaction applied - trigger stat change animation (Requirement 7.1)
  const handleReactionApplied = useCallback((logId: string, statDelta: StatDelta) => {
    const changes: Array<{ id: string; statName: "sanity" | "corruption"; delta: number }> = [];
    
    // Create stat change indicators for each affected stat
    if (statDelta.sanity !== undefined && statDelta.sanity !== 0) {
      changes.push({
        id: `${logId}-sanity-${Date.now()}`,
        statName: "sanity",
        delta: statDelta.sanity,
      });
    }
    
    if (statDelta.corruption !== undefined && statDelta.corruption !== 0) {
      changes.push({
        id: `${logId}-corruption-${Date.now()}`,
        statName: "corruption",
        delta: statDelta.corruption,
      });
    }

    // Add stat changes with stagger delay (Requirement 7.4)
    changes.forEach((change, index) => {
      setTimeout(() => {
        setStatChanges(prev => [...prev, change]);
      }, index * 100); // 100ms stagger
    });

    // Update aria-live region for screen readers (Requirement 9.4)
    const announcements: string[] = [];
    if (statDelta.sanity !== undefined && statDelta.sanity !== 0) {
      announcements.push(`Sanity ${statDelta.sanity > 0 ? 'increased' : 'decreased'} by ${Math.abs(statDelta.sanity)}`);
    }
    if (statDelta.corruption !== undefined && statDelta.corruption !== 0) {
      announcements.push(`Corruption ${statDelta.corruption > 0 ? 'increased' : 'decreased'} by ${Math.abs(statDelta.corruption)}`);
    }
    setAriaAnnouncement(announcements.join(', '));
    
    // Clear announcement after screen reader has time to read it
    setTimeout(() => setAriaAnnouncement(""), 3000);
  }, []);

  // Remove stat change indicator after animation completes
  const handleStatChangeComplete = useCallback((id: string) => {
    setStatChanges(prev => prev.filter(change => change.id !== id));
  }, []);

  // Format age for display
  const formatAge = (ageInMinutes: number): string => {
    const hours = Math.floor(ageInMinutes / 60);
    const minutes = Math.floor(ageInMinutes % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Determine visual styling based on sanity level
  const getSanityClass = (): string => {
    if (sanityLevel < 30) {
      return "critical";
    } else if (sanityLevel < 60) {
      return "warning";
    }
    return "normal";
  };

  // Check if sanity is critical for glitch effects (Requirements 4.4)
  const isSanityCritical = sanityLevel < 30;

  const sanityClass = getSanityClass();

  // Auto-scroll to newest entry after animation completes (Requirements 4.3)
  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, []);

  // Handle new log entries - track seen IDs and batch info
  useEffect(() => {
    const currentLogCount = logs.length;
    const prevLogCount = prevLogCountRef.current;

    // On initial render, mark all existing logs as seen (don't animate them)
    // Requirements 4.5: Only animate new additions
    if (isInitialRenderRef.current) {
      isInitialRenderRef.current = false;
      const existingIds = new Set(logs.map((log) => log.id));
      setSeenLogIds(existingIds);
      prevLogCountRef.current = currentLogCount;
      return;
    }

    // Detect new entries added
    if (currentLogCount > prevLogCount) {
      // New entries were added - calculate batch start index
      batchStartIndexRef.current = prevLogCount;

      // Calculate total animation time for the batch (used as fallback)
      const newEntriesCount = currentLogCount - prevLogCount;
      const totalAnimationTime =
        FADE_IN_DURATION_MS + (newEntriesCount - 1) * STAGGER_DELAY_MS;

      // Update seen IDs after animations would have started
      const updateSeenTimer = setTimeout(() => {
        setSeenLogIds((prev) => {
          const newSet = new Set(prev);
          logs.forEach((log) => newSet.add(log.id));
          return newSet;
        });
        batchStartIndexRef.current = null;
      }, totalAnimationTime + 100);

      prevLogCountRef.current = currentLogCount;

      return () => {
        clearTimeout(updateSeenTimer);
      };
    }

    prevLogCountRef.current = currentLogCount;
  }, [logs]);

  // Auto-generate images for logs with autoGenerateImage flag
  // Requirements 4.1-4.8, 8.3, 8.4
  useEffect(() => {
    // Skip if auto-generation is disabled (mobile or user preference)
    if (!autoGenerateImages) {
      return;
    }

    // Skip if no pet sprite available
    if (!currentPetSpriteUrl) {
      return;
    }

    // Find logs that need auto-generation
    logs.forEach((log) => {
      // Check if this log should auto-generate
      if (
        log.autoGenerateImage && 
        !log.isPending && 
        !log.imageStatus && 
        !log.imageUrl
      ) {
        // Trigger image generation
        generateLogImage(log.id);
      }
    });
  }, [logs, autoGenerateImages, currentPetSpriteUrl, generateLogImage]);

  // Generate dialogue choices for significant events (Requirements 6.1, 6.2)
  useEffect(() => {
    // Check for logs that need dialogue choices
    logs.forEach(async (log) => {
      // Only trigger for significant events (evolution, insanity, haunt)
      const significantEvents = ["evolution", "insanity", "haunt"];
      
      // Check if this log should trigger dialogue choices
      if (
        log.eventType &&
        significantEvents.includes(log.eventType) &&
        !log.isPending &&
        !log.dialogueChoice // Don't regenerate if already has choices
      ) {
        // Import dialogue choice generator
        const { generateDialogueChoices } = await import("../utils/narrativeGenerator");
        
        try {
          // Generate dialogue choices (30% probability check inside)
          const choices = await generateDialogueChoices({
            petName,
            archetype,
            stage,
            sanity: stats.sanity,
            corruption: stats.corruption,
            eventType: log.eventType,
            narrativeText: log.text,
          });

          // If choices were generated, update the log
          if (choices && choices.length >= 2) {
            // Update log with dialogue choices
            useGameStore.setState((state) => ({
              logs: state.logs.map((l) =>
                l.id === log.id
                  ? {
                      ...l,
                      dialogueChoice: {
                        logId: log.id,
                        choices,
                        selectedChoiceId: null,
                        timestamp: Date.now(),
                      },
                    }
                  : l
              ),
            }));
          }
        } catch (error) {
          // Requirement 15.2: Fallback to standard narrative on generation failure
          // Dialogue choices are optional - game continues without them
          console.warn("Failed to generate dialogue choices, continuing without them", error);
        }
      }
    });
  }, [logs, petName, archetype, stage, stats.sanity, stats.corruption]);

  // Calculate stagger delay for a log entry based on its position in the batch
  const getStaggerDelay = (index: number): number => {
    if (batchStartIndexRef.current === null) return 0;
    const positionInBatch = index - batchStartIndexRef.current;
    return positionInBatch * STAGGER_DELAY_MS;
  };

  // Check if a log entry is new (should be animated)
  const isNewEntry = (logId: string): boolean => {
    return !seenLogIds.has(logId);
  };

  // Check if this is the last entry in the current batch (for auto-scroll trigger)
  const isLastInBatch = (index: number): boolean => {
    return index === logs.length - 1 && batchStartIndexRef.current !== null;
  };

  return (
    <GlassPanel
      className={`narrative-log-panel narrative-log-panel--${mode} ${sanityClass}`}
      variant="narrative"
      role="region"
      aria-label="Narrative log"
    >
      <div className="log-header">Narrative Log</div>
      <div
        ref={containerRef}
        className="log-container"
        role="log"
        aria-live="polite"
        aria-atomic="false"
        tabIndex={0}
        aria-label="Scrollable narrative log of game events"
      >
        {logs.length === 0 ? (
          <div className="log-empty" role="status">
            No events yet...
          </div>
        ) : (
          logs.map((log, index) => {
            const isNew = isNewEntry(log.id);
            const staggerDelay = isNew ? getStaggerDelay(index) : 0;
            const isPending = log.isPending ?? false;
            
            // Build class names for the entry
            const entryClassName = `log-entry log-${log.source.toLowerCase()}${isPending ? " log-pending" : ""}`;

            // Determine if log can be reacted to (Requirement 1.1)
            // Last 5 entries, not pending, not system logs
            const canReact = index >= logs.length - 5 && 
                            !isPending && 
                            log.source !== "SYSTEM";

            // Render text content - use SplitText for newly resolved AI text
            const renderLogText = () => {
              // If pending, show shimmer placeholder
              if (isPending) {
                return <span className="log-text log-text-shimmer">{log.text}</span>;
              }
              
              // If this is a new entry that just resolved (was pending), use typing animation
              if (isNew && !isPending) {
                return (
                  <span className="log-text">
                    <SplitText
                      text={log.text}
                      splitType="chars"
                      staggerDelay={20}
                      duration={0.3}
                      from={{ opacity: 0, y: 5 }}
                      to={{ opacity: 1, y: 0 }}
                      onComplete={isLastInBatch(index) ? scrollToBottom : undefined}
                    />
                  </span>
                );
              }
              
              // Default: static text
              return <span className="log-text">{log.text}</span>;
            };

            // Determine if log is clickable (has pet sprite available)
            const isClickable = !isPending && currentPetSpriteUrl;
            const isGenerating = log.imageStatus === "generating";
            const hasImage = log.imageStatus === "completed" && log.imageUrl;
            const hasFailed = log.imageStatus === "failed";

            const entryContent = (
              <div
                key={log.id}
                className={`${entryClassName}${isClickable ? " log-clickable" : ""}${isGenerating ? " log-image-generating" : ""}${hasImage ? " log-has-image" : ""}${hasFailed ? " log-image-failed" : ""}`}
                role="article"
                onClick={isClickable ? () => handleLogClick(log) : undefined}
                onKeyDown={isClickable ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleLogClick(log);
                  }
                } : undefined}
                tabIndex={isClickable ? 0 : undefined}
                aria-label={isClickable ? `${log.text}. Click to ${hasImage ? "view" : "generate"} image.` : undefined}
              >
                <div className="log-entry-header">
                  <span className="log-timestamp">
                    [{formatAge(log.timestamp)}]
                  </span>
                  {/* Image status indicators */}
                  {isGenerating && (
                    <span className="log-image-status generating" aria-label="Generating image">
                      <span className="spinner" />
                    </span>
                  )}
                  {hasImage && (
                    <span className="log-image-status completed" aria-label="Image available">
                      🖼️
                    </span>
                  )}
                  {hasFailed && (
                    <span className="log-image-status failed" aria-label="Image generation failed. Click to retry.">
                      ⚠️
                    </span>
                  )}
                </div>
                {renderLogText()}
                {/* Progress indicator for generating images (Requirements 4.1, 4.6, 4.7) */}
                {log.generationProgress && (
                  <ProgressIndicator
                    progress={log.generationProgress}
                    status={log.imageStatus || "generating"}
                  />
                )}
                {/* Inline image preview */}
                {hasImage && log.imageUrl && (
                  <div className="log-image-preview">
                    <img 
                      src={log.imageUrl} 
                      alt="Generated scene" 
                      loading="lazy"
                    />
                  </div>
                )}
                {/* Dialogue choices for eligible entries (Requirements 6.1, 6.2) */}
                {log.dialogueChoice && !log.dialogueChoice.selectedChoiceId && !isPending && (
                  <DialogueChoices
                    choices={log.dialogueChoice.choices}
                    onSelect={(choiceId, statDelta) => {
                      selectDialogueChoice(log.id, choiceId, statDelta);
                      // Also trigger stat change animation
                      handleReactionApplied(log.id, statDelta);
                    }}
                    timeoutSeconds={60}
                  />
                )}
                {/* Reaction buttons for eligible entries (Requirements 1.1, 1.3, 1.4) */}
                {canReact && !log.dialogueChoice && (
                  <ReactionButtons 
                    log={log}
                    onReactionApplied={(statDelta) => handleReactionApplied(log.id, statDelta)}
                  />
                )}
              </div>
            );

            // Only wrap new entries in FadeIn animation (Requirements 4.1, 4.5)
            if (isNew) {
              // Auto-scroll handled by SplitText onComplete for typing animation
              const handleAnimationComplete = isPending || isLastInBatch(index) ? scrollToBottom : undefined;
              
              return (
                <FadeIn
                  key={log.id}
                  duration={FADE_IN_DURATION_MS}
                  delay={staggerDelay}
                  blur={true}
                  className={isSanityCritical ? "fade-in-glitch" : ""}
                  onComplete={handleAnimationComplete}
                >
                  {entryContent}
                </FadeIn>
              );
            }

            // Existing entries render without animation
            return entryContent;
          })
        )}
      </div>
      {/* Image modal for viewing generated images */}
      {selectedImageUrl && (
        <ImageModal 
          imageUrl={selectedImageUrl} 
          onClose={() => setSelectedImageUrl(null)} 
        />
      )}
      {/* Aria-live region for screen reader announcements (Requirement 9.4) */}
      <div 
        className="sr-only" 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
      >
        {ariaAnnouncement}
      </div>
      {/* Stat change indicators (Requirement 7.1) */}
      {statChanges.map(change => (
        <StatChangeIndicator
          key={change.id}
          statName={change.statName}
          delta={change.delta}
          onComplete={() => handleStatChangeComplete(change.id)}
        />
      ))}
    </GlassPanel>
  );
}
