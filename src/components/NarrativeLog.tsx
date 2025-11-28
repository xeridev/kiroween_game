import { useEffect, useRef, useState, useCallback } from "react";
import type { NarrativeLog as NarrativeLogType } from "../utils/types";
import { FadeIn } from "./animations/FadeIn";
import { GlassPanel } from "./GlassPanel";
import { useTheme } from "../contexts/ThemeContext";
import "./NarrativeLog.css";

interface NarrativeLogProps {
  logs: NarrativeLogType[];
  sanityLevel: number;
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
            
            // Build class names for the entry
            const entryClassName = `log-entry log-${log.source.toLowerCase()}`;

            const entryContent = (
              <div
                key={log.id}
                className={entryClassName}
                role="article"
              >
                <span className="log-timestamp">
                  [{formatAge(log.timestamp)}]
                </span>
                <span className="log-text">{log.text}</span>
              </div>
            );

            // Only wrap new entries in FadeIn animation (Requirements 4.1, 4.5)
            if (isNew) {
              // Auto-scroll when the last entry in batch completes animation (Requirements 4.3)
              const handleAnimationComplete = isLastInBatch(index) ? scrollToBottom : undefined;
              
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
    </GlassPanel>
  );
}
