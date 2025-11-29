/**
 * Haunt System Utility Module
 * Manages ghost storage and haunt trigger logic for the death/haunt mechanics.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 4.2, 4.3
 */

import type { GhostData, DeathCause, PetStage, PetTraits, PetStats } from "./types";
import { logError, logWarning, logInfo } from "./errorLogger";

// Constants
const GHOST_STORAGE_KEY = "creepy-companion-ghosts";
const MAX_GHOSTS = 10;
const HAUNT_CHANCE = 0.01; // 1% chance per tick
const SANITY_THRESHOLD_FOR_HAUNT = 50;

/**
 * Save a ghost to localStorage.
 * Implements FIFO eviction when array exceeds MAX_GHOSTS.
 * 
 * Requirements: 3.1, 3.2, 3.3
 * 
 * @param ghost - The ghost data to save
 */
export function saveGhost(ghost: GhostData): void {
  try {
    const ghosts = loadGhosts();
    ghosts.push(ghost);
    
    // FIFO eviction: remove oldest ghosts if exceeding max
    // Sort by deathTimestamp ascending (oldest first) and keep only the newest MAX_GHOSTS
    if (ghosts.length > MAX_GHOSTS) {
      ghosts.sort((a, b) => a.deathTimestamp - b.deathTimestamp);
      const evictedGhosts = ghosts.splice(0, ghosts.length - MAX_GHOSTS);
      logInfo("Ghost FIFO eviction", { 
        evictedCount: evictedGhosts.length,
        remainingCount: ghosts.length 
      });
    }
    
    localStorage.setItem(GHOST_STORAGE_KEY, JSON.stringify(ghosts));
    logInfo("Ghost saved", { ghostId: ghost.id, petName: ghost.petName });
  } catch (error) {
    logError(
      "Failed to save ghost",
      error instanceof Error ? error : new Error(String(error)),
      { ghostId: ghost.id }
    );
  }
}

/**
 * Load all ghosts from localStorage.
 * Returns empty array on error or if no ghosts exist.
 * 
 * Requirements: 3.2, 3.4
 * 
 * @returns Array of ghost data
 */
export function loadGhosts(): GhostData[] {
  try {
    const stored = localStorage.getItem(GHOST_STORAGE_KEY);
    if (!stored) {
      return [];
    }
    
    const parsed = JSON.parse(stored);
    
    // Validate that parsed data is an array
    if (!Array.isArray(parsed)) {
      logWarning("Ghost storage corrupted - not an array, resetting", {
        type: typeof parsed
      });
      return [];
    }
    
    // Basic validation of ghost objects
    const validGhosts = parsed.filter((ghost: unknown): ghost is GhostData => {
      if (typeof ghost !== "object" || ghost === null) return false;
      const g = ghost as Record<string, unknown>;
      return (
        typeof g.id === "string" &&
        typeof g.petName === "string" &&
        typeof g.deathTimestamp === "number"
      );
    });
    
    if (validGhosts.length !== parsed.length) {
      logWarning("Some ghost entries were invalid and filtered out", {
        original: parsed.length,
        valid: validGhosts.length
      });
    }
    
    return validGhosts;
  } catch (error) {
    logError(
      "Failed to load ghosts",
      error instanceof Error ? error : new Error(String(error))
    );
    // Return empty array on error - don't corrupt main game state
    return [];
  }
}

/**
 * Clear all ghosts from localStorage.
 * 
 * @returns void
 */
export function clearGhosts(): void {
  try {
    localStorage.removeItem(GHOST_STORAGE_KEY);
    logInfo("Ghost storage cleared");
  } catch (error) {
    logError(
      "Failed to clear ghosts",
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Get a random ghost from storage.
 * Returns null if no ghosts exist.
 * 
 * Requirements: 4.3
 * 
 * @returns Random ghost or null
 */
export function getRandomGhost(): GhostData | null {
  const ghosts = loadGhosts();
  if (ghosts.length === 0) {
    return null;
  }
  
  const randomIndex = Math.floor(Math.random() * ghosts.length);
  return ghosts[randomIndex];
}

/**
 * Evaluate whether a haunt event should trigger.
 * 1% chance when sanity < 50, max 1 per game day.
 * 
 * Requirements: 4.2, 4.3
 * 
 * @param sanity - Current pet sanity (0-100)
 * @param lastHauntGameDay - Game day of last haunt event
 * @param currentGameDay - Current game day
 * @returns Whether a haunt should trigger
 */
export function shouldTriggerHaunt(
  sanity: number,
  lastHauntGameDay: number,
  currentGameDay: number
): boolean {
  // Check if sanity is below threshold
  if (sanity >= SANITY_THRESHOLD_FOR_HAUNT) {
    return false;
  }
  
  // Check if already haunted today (max 1 per game day)
  if (lastHauntGameDay >= currentGameDay) {
    return false;
  }
  
  // Check if ghosts exist
  const ghosts = loadGhosts();
  if (ghosts.length === 0) {
    return false;
  }
  
  // 1% chance to trigger
  return Math.random() < HAUNT_CHANCE;
}

/**
 * Create a GhostData record from current pet state and death info.
 * 
 * Requirements: 3.1
 * 
 * @param traits - Pet traits (name, archetype, color)
 * @param stats - Pet stats (hunger, sanity, corruption)
 * @param stage - Current pet stage
 * @param deathCause - Cause of death
 * @param epitaph - Generated epitaph for the pet
 * @returns GhostData record
 */
export function createGhostFromPet(
  traits: PetTraits,
  stats: PetStats,
  stage: PetStage,
  deathCause: DeathCause,
  epitaph: string
): GhostData {
  return {
    id: crypto.randomUUID(),
    petName: traits.name,
    archetype: traits.archetype,
    stage,
    color: traits.color,
    deathCause,
    deathTimestamp: Date.now(),
    finalCorruption: stats.corruption,
    epitaph,
  };
}

// Export constants for testing
export { MAX_GHOSTS, HAUNT_CHANCE, SANITY_THRESHOLD_FOR_HAUNT, GHOST_STORAGE_KEY };
