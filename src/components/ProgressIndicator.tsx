import { useState, useEffect, useRef } from "react";
import type { GenerationProgress, ImageStatus } from "../utils/types";
import { useTheme } from "../contexts/ThemeContext";
import "./ProgressIndicator.css";

interface ProgressIndicatorProps {
  progress: GenerationProgress;
  status: ImageStatus;
}

/**
 * ProgressIndicator - Shows real-time feedback during image generation
 * Optimized with requestAnimationFrame and throttled updates
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 11.1, 11.2, 11.3, 11.4
 * Performance: Throttled to 2s updates, uses requestAnimationFrame (Requirement 4.2)
 * Accessibility: Screen reader announcements for all state changes (Requirements 11.1-11.4)
 */
export function ProgressIndicator({ progress, status }: ProgressIndicatorProps) {
  const { mode } = useTheme();
  const [timeMessage, setTimeMessage] = useState<string>("Generating...");
  const [announcement, setAnnouncement] = useState<string>("");
  const rafIdRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const previousStatusRef = useRef<ImageStatus>(status);
  
  // Requirement 12.3: Reduced polling frequency on mobile (3s instead of 2s)
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const UPDATE_INTERVAL = isMobile ? 3000 : 2000; // 3s on mobile, 2s on desktop (Requirements 4.2, 12.3)

  // Calculate time message (Requirements 4.3, 4.4, 4.5)
  const calculateTimeMessage = (startTime: number, currentStatus: ImageStatus): string => {
    if (currentStatus === "completed") {
      return "Image generated!";
    }

    if (currentStatus === "failed") {
      return "Generation failed";
    }

    const elapsed = Date.now() - startTime;
    const elapsedSeconds = Math.floor(elapsed / 1000);

    // Requirement 4.5: After 90 seconds, show "Taking longer than expected..."
    if (elapsedSeconds >= 90) {
      return "Taking longer than expected...";
    }

    // Requirement 4.4: At 60 seconds elapsed, show "~30s remaining"
    if (elapsedSeconds >= 60) {
      return "Generating... ~30s remaining";
    }

    // Requirement 4.3: At 30 seconds elapsed, show "~60s remaining"
    if (elapsedSeconds >= 30) {
      return "Generating... ~60s remaining";
    }

    // Default: Show "Generating..."
    return "Generating...";
  };

  // Screen reader announcements for state changes (Requirements 11.1, 11.3, 11.4)
  useEffect(() => {
    // Announce when status changes
    if (previousStatusRef.current !== status) {
      if (status === "generating" && previousStatusRef.current === "idle") {
        // Requirement 11.1: Announce when generation starts
        setAnnouncement("Generating image");
      } else if (status === "completed") {
        // Requirement 11.3: Announce when generation completes
        setAnnouncement("Image generated successfully");
      } else if (status === "failed") {
        // Requirement 11.4: Announce when generation fails
        setAnnouncement("Image generation failed. Retry option available.");
      }
      previousStatusRef.current = status;
    }
  }, [status]);

  // Optimized update loop using requestAnimationFrame
  useEffect(() => {
    if (status !== "generating") {
      // Update immediately for completed/failed states
      setTimeMessage(calculateTimeMessage(progress.startTime, status));
      return;
    }

    // Animation loop for generating state
    const updateLoop = () => {
      const now = Date.now();
      
      // Throttle updates to every 2 seconds (Requirement 4.2)
      if (now - lastUpdateRef.current >= UPDATE_INTERVAL) {
        const newMessage = calculateTimeMessage(progress.startTime, status);
        setTimeMessage(newMessage);
        lastUpdateRef.current = now;
        
        // Requirement 11.2: Announce time updates via aria-live
        // The aria-live region will automatically announce the updated timeMessage
      }

      // Continue loop if still generating
      if (status === "generating") {
        rafIdRef.current = requestAnimationFrame(updateLoop);
      }
    };

    // Start the loop
    rafIdRef.current = requestAnimationFrame(updateLoop);

    // Cleanup: Cancel animation frame on unmount (Requirement 4.2)
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [progress.startTime, status]);

  // Don't render if status is idle (not generating yet)
  if (status === "idle") {
    return null;
  }

  return (
    <>
      <div 
        className={`progress-indicator progress-indicator--${mode} progress-indicator--${status}`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-label={timeMessage}
      >
        {status === "generating" && (
          <span className="progress-spinner" aria-hidden="true" />
        )}
        {status === "completed" && (
          <span className="progress-icon progress-icon--success" aria-hidden="true">
            ✓
          </span>
        )}
        {status === "failed" && (
          <span className="progress-icon progress-icon--error" aria-hidden="true">
            ✕
          </span>
        )}
        <span className="progress-text">{timeMessage}</span>
      </div>
      
      {/* Screen reader announcements for state changes (Requirements 11.1, 11.3, 11.4) */}
      {announcement && (
        <div 
          className="sr-only" 
          role="status" 
          aria-live="assertive" 
          aria-atomic="true"
        >
          {announcement}
        </div>
      )}
    </>
  );
}
