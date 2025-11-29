import { useEffect, useRef, useState, useCallback } from "react";
import type { PetStats, PetStage } from "../utils/types";
import { StatDisplay } from "./StatDisplay";
import { GlassPanel } from "./GlassPanel";
import { useTheme } from "../contexts/ThemeContext";
import { safeAnimateFromTo, safeKillTweens, prefersReducedMotion } from "../utils/animationUtils";
import "./StatsPanel.css";

interface StatsPanelProps {
  stats: PetStats;
  stage: PetStage;
  age: number;
  gameDay: number;
  dailyFeeds: number;
  onCriticalWarning?: () => void; // Callback when critical state is first entered
}

// Threshold for emphasis animation (Requirement 3.5)
const EMPHASIS_THRESHOLD = 10;
// Batching window in milliseconds (Requirement 3.3)
const BATCH_WINDOW_MS = 100;
// Tick throttle interval - only animate every N ticks (Requirement 8.3)
const TICK_THROTTLE_COUNT = 5;

/**
 * Custom hook for batching rapid stat changes
 * Batches changes within BATCH_WINDOW_MS and returns the final value
 */
function useBatchedValue(value: number): number {
  const [batchedValue, setBatchedValue] = useState(value);
  const pendingValue = useRef(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    pendingValue.current = value;

    // If there's already a pending batch, let it complete
    if (timeoutRef.current) {
      return;
    }

    // Start a new batch window
    timeoutRef.current = setTimeout(() => {
      setBatchedValue(pendingValue.current);
      timeoutRef.current = null;
    }, BATCH_WINDOW_MS);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [value]);

  // On unmount, apply final value immediately
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        setBatchedValue(pendingValue.current);
      }
    };
  }, []);

  return batchedValue;
}

/**
 * Custom hook for tick-based throttling
 * Only updates the displayed value every TICK_THROTTLE_COUNT ticks for small changes
 * Large changes (> EMPHASIS_THRESHOLD) are always shown immediately
 */
function useTickThrottledValue(value: number): number {
  const [throttledValue, setThrottledValue] = useState(value);
  const tickCount = useRef(0);
  const lastThrottledValue = useRef(value);

  useEffect(() => {
    const change = Math.abs(value - lastThrottledValue.current);
    
    // Large changes bypass throttling (user actions like feeding)
    if (change > EMPHASIS_THRESHOLD) {
      setThrottledValue(value);
      lastThrottledValue.current = value;
      tickCount.current = 0;
      return;
    }

    // Small changes (tick decay) are throttled
    if (value !== lastThrottledValue.current) {
      tickCount.current += 1;

      // Only update every TICK_THROTTLE_COUNT ticks
      if (tickCount.current >= TICK_THROTTLE_COUNT) {
        setThrottledValue(value);
        lastThrottledValue.current = value;
        tickCount.current = 0;
      }
    }
  }, [value]);

  // Always show initial value
  useEffect(() => {
    setThrottledValue(value);
    lastThrottledValue.current = value;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return throttledValue;
}

// Critical state thresholds (Requirement 8.3)
const CRITICAL_HUNGER_THRESHOLD = 90;
const CRITICAL_SANITY_THRESHOLD = 10;

/**
 * StatsPanel - Pet statistics display with glassmorphism styling
 * 
 * Requirements: 6.2, 6.4, 6.5, 8.3, 8.4
 */
export function StatsPanel({
  stats,
  stage,
  age,
  gameDay,
  dailyFeeds,
  onCriticalWarning,
}: StatsPanelProps) {
  // Refs for emphasis animation elements
  const hungerRef = useRef<HTMLDivElement>(null);
  const sanityRef = useRef<HTMLDivElement>(null);
  
  // Track previous values for emphasis detection
  const prevHunger = useRef(stats.hunger);
  const prevSanity = useRef(stats.sanity);
  
  // Track previous critical state for threshold crossing detection (Requirement 8.4)
  const wasCritical = useRef(false);
  
  // Get theme mode for styling
  const { mode } = useTheme();
  
  // Calculate if currently in critical state (Requirement 8.3)
  const isCritical = stats.hunger >= CRITICAL_HUNGER_THRESHOLD || stats.sanity <= CRITICAL_SANITY_THRESHOLD;
  
  // Detect critical threshold crossing and trigger sound (Requirement 8.4)
  useEffect(() => {
    // Only trigger on first crossing into critical state
    if (isCritical && !wasCritical.current) {
      onCriticalWarning?.();
    }
    wasCritical.current = isCritical;
  }, [isCritical, onCriticalWarning]);
  
  // Apply tick throttling (Requirement 8.3)
  const throttledHunger = useTickThrottledValue(stats.hunger);
  const throttledSanity = useTickThrottledValue(stats.sanity);
  
  // Apply batching for rapid changes (Requirement 3.3)
  const batchedHunger = useBatchedValue(throttledHunger);
  const batchedSanity = useBatchedValue(throttledSanity);

  // Emphasis animation function (Requirement 3.5)
  // Uses safe animation utilities for error handling (Requirement 8.5)
  const triggerEmphasis = useCallback((element: HTMLElement | null) => {
    if (!element) return;
    
    // Check for reduced motion preference (Requirement 6.4)
    if (prefersReducedMotion()) {
      return;
    }

    // Kill any existing animation on this element
    safeKillTweens(element);
    
    // Apply scale pulse animation with error handling
    safeAnimateFromTo(
      element,
      { scale: 1 },
      {
        scale: 1.15,
        duration: 0.15,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1,
      },
      undefined,
      { element: element.className }
    );
  }, []);

  // Check for large changes and trigger emphasis (Requirement 3.5)
  useEffect(() => {
    const hungerChange = Math.abs(batchedHunger - prevHunger.current);
    const sanityChange = Math.abs(batchedSanity - prevSanity.current);

    if (hungerChange > EMPHASIS_THRESHOLD) {
      triggerEmphasis(hungerRef.current);
    }
    if (sanityChange > EMPHASIS_THRESHOLD) {
      triggerEmphasis(sanityRef.current);
    }

    prevHunger.current = batchedHunger;
    prevSanity.current = batchedSanity;
  }, [batchedHunger, batchedSanity, triggerEmphasis]);

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
    if (stats.sanity < 30) {
      return "critical";
    } else if (stats.sanity < 60) {
      return "warning";
    }
    return "normal";
  };

  const sanityClass = getSanityClass();

  // Combine sanity class with critical class for styling
  const panelClasses = [
    'stats-panel-content',
    `stats-panel-content--${mode}`,
    sanityClass,
    isCritical ? 'stats-panel-critical' : '',
  ].filter(Boolean).join(' ');

  return (
    <GlassPanel
      className={panelClasses}
      variant="stats"
      role="complementary"
      aria-label="Pet statistics"
    >
      {/* Stats Section - Using StatDisplay for animated transitions with highlights */}
      {/* Requirements: 2.1, 2.2, 2.3, 2.4, 2.5 */}
      <div className="stats-section" role="region" aria-label="Pet statistics">
        <div className="stat-group" ref={hungerRef}>
          <StatDisplay
            label="Hunger"
            value={batchedHunger}
            maxValue={100}
            duration={500}
            decimals={1}
            showBar={true}
            barColor="var(--stat-hunger-color, #cc0000)"
            className="hunger-stat"
          />
        </div>

        <div className="stat-group" ref={sanityRef}>
          <StatDisplay
            label="Sanity"
            value={batchedSanity}
            maxValue={100}
            duration={500}
            decimals={1}
            showBar={true}
            barColor="var(--stat-sanity-color, #0000cc)"
            className="sanity-stat"
          />
        </div>
      </div>

      {/* Pet Info Section */}
      <div
        className="pet-info-section"
        role="region"
        aria-label="Pet information"
      >
        <div className="info-item">
          <span className="info-label">Stage:</span>
          <span className="info-value" aria-live="polite">
            {stage}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">Age:</span>
          <span className="info-value">{formatAge(age)}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Day:</span>
          <span className="info-value">{gameDay}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Daily Feeds:</span>
          <span className="info-value" aria-live="polite">
            {dailyFeeds}/3
          </span>
        </div>
      </div>
    </GlassPanel>
  );
}
