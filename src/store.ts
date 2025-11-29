import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GameState, Archetype, LogSource, AudioState, SoundContext, Offering, Theme, ImageStatus, DeathData, DeathCause } from "./utils/types";
import { logError, logWarning, logCritical, logInfo } from "./utils/errorLogger";
import { soundManager } from "./utils/soundManager";

// In-memory fallback storage for reactions when localStorage is unavailable (Requirement 10.4)
let inMemoryReactions: Map<string, import("./utils/types").ReactionData[]> = new Map();

// ============================================
// Compression Utilities for Story Summary (Requirement 14.4)
// ============================================

/**
 * Simple text compression using LZ-based algorithm.
 * Compresses summary text before storing in localStorage.
 */
function compressSummaryText(text: string): string {
  try {
    // Use a simple run-length encoding for repeated patterns
    // This is a lightweight compression suitable for browser environment
    const compressed = text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    // For browser compatibility, we'll use base64 encoding of the compressed text
    // This provides some size reduction while maintaining compatibility
    return btoa(encodeURIComponent(compressed));
  } catch (error) {
    logWarning("Failed to compress summary text", {
      error: error instanceof Error ? error.message : "Unknown",
    });
    // Return original text if compression fails
    return text;
  }
}

/**
 * Decompress summary text when retrieving from cache.
 */
function decompressSummaryText(compressed: string): string {
  try {
    // Check if text appears to be compressed (base64)
    if (/^[A-Za-z0-9+/=]+$/.test(compressed)) {
      return decodeURIComponent(atob(compressed));
    }
    // Return as-is if not compressed
    return compressed;
  } catch (error) {
    logWarning("Failed to decompress summary text", {
      error: error instanceof Error ? error.message : "Unknown",
    });
    // Return original text if decompression fails
    return compressed;
  }
}

const initialState = {
  isInitialized: false,
  traits: {
    name: "",
    archetype: "GLOOM" as Archetype,
    color: 0x000000,
  },
  stats: {
    hunger: 0,
    sanity: 100,
    corruption: 0,
  },
  stage: "EGG" as const,
  age: 0,
  isAlive: true,
  inventory: [],
  dailyFeeds: 0,
  gameDay: 0,
  logs: [],
  lastTickTime: Date.now(),
  currentPetSpriteUrl: null as string | null,
  // Death system state (Requirements 1.4, 6.4, 4.3)
  deathData: null as DeathData | null,
  lastPlacateTime: null as number | null,
  lastHauntGameDay: 0,
  // Placate visual effect state (Requirement 7.1)
  placateEffect: {
    isActive: false,
    archetype: null as import("./utils/types").Archetype | null,
    timestamp: null as number | null,
  },
  // Vomit visual effect state (Requirement 9.2)
  vomitEffect: {
    isActive: false,
    timestamp: null as number | null,
  },
  // Insanity visual effect state (Requirement 10.6)
  insanityEffect: {
    isActive: false,
    eventType: null as import("./utils/types").InsanityEventType | null,
    timestamp: null as number | null,
  },
  // Auto-image generation flag (Requirement 8.2)
  autoGenerateImages: true,
  // Gallery state (narrative-enhancements)
  galleryOpen: false,
  galleryFilter: "all" as import("./utils/types").GalleryFilter,
  galleryViewMode: "grid" as import("./utils/types").GalleryViewMode,
  // Visual traits for character consistency (narrative-enhancements)
  currentVisualTraits: null as import("./utils/types").VisualTraits | null,
  // Story summary cache (narrative-enhancements)
  cachedSummary: null as import("./utils/types").StorySummary | null,
  summaryCacheTime: null as number | null,
};

// Default audio state (Requirements 4.1, 4.2)
const initialAudioState: AudioState = {
  masterVolume: 0.7,    // 70% - comfortable default
  sfxVolume: 0.8,       // 80% - slightly prominent for feedback
  ambientVolume: 0.5,   // 50% - background, not overwhelming
  isMuted: false,
  hasUserInteracted: false,
};

// Default settings state
const initialSettingsState = {
  gameSpeed: 1,         // 1x normal speed (0.5, 1, 2, 4)
  crtEnabled: false,    // CRT scanline effect off by default (modern UI - Requirement 8.1)
  reduceMotion: false,  // Respect system preference by default
  retroMode: false,     // Modern UI by default (Requirement 8.1)
  theme: "cute" as const,  // Default to cute theme (Requirement 1.4)
};

// Placate cooldown duration in game minutes (Requirement 6.4)
const PLACATE_COOLDOWN_DURATION = 30;

/**
 * Calculate remaining placate cooldown in game minutes.
 * Returns 0 if not on cooldown.
 * 
 * Requirement 6.7: Return remaining game minutes (0 if not on cooldown)
 */
export const getPlacateCooldownRemaining = (
  lastPlacateTime: number | null,
  currentAge: number
): number => {
  if (lastPlacateTime === null) {
    return 0;
  }
  
  const elapsed = currentAge - lastPlacateTime;
  const remaining = PLACATE_COOLDOWN_DURATION - elapsed;
  
  return remaining > 0 ? remaining : 0;
};

// Helper function to calculate offline decay
const calculateOfflineDecay = (state: any, elapsedRealSeconds: number) => {
  if (!state.isInitialized || !state.isAlive) {
    return state;
  }

  // 1 real second = 1 game minute
  const gameMinutesElapsed = elapsedRealSeconds;

  // ============================================
  // Starvation Consequences (Requirements 8.1, 8.2)
  // ============================================
  // For offline decay, we simulate minute-by-minute to properly apply
  // accelerated decay rates when thresholds are crossed
  
  let currentHunger = state.stats.hunger;
  let currentSanity = state.stats.sanity;
  
  for (let i = 0; i < gameMinutesElapsed; i++) {
    // Base decay rates
    let hungerIncreaseRate = 0.05;  // Base: 0.05 per minute
    let sanityDecayRate = 0.02;     // Base: 0.02 per minute
    
    // Requirement 8.1: When hunger > 80, sanity decays at 0.05/min instead of 0.02/min
    if (currentHunger > 80) {
      sanityDecayRate = 0.05;
    }
    
    // Requirement 8.2: When hunger >= 90, hunger increases at 0.1/min instead of 0.05/min
    if (currentHunger >= 90) {
      hungerIncreaseRate = 0.1;
    }
    
    // Apply decay with calculated rates
    currentHunger = Math.min(100, currentHunger + hungerIncreaseRate);
    currentSanity = Math.max(0, currentSanity - sanityDecayRate);
    
    // Early exit if pet would die (hunger >= 100 or sanity <= 0)
    if (currentHunger >= 100 || currentSanity <= 0) {
      break;
    }
  }
  
  const newHunger = currentHunger;
  const newSanity = currentSanity;
  const newAge = state.age + gameMinutesElapsed;

  // Calculate daily resets
  const minutesInDay = 24 * 60; // 1440 minutes
  const oldDayCount = Math.floor(state.age / minutesInDay);
  const newDayCount = Math.floor(newAge / minutesInDay);
  const daysPassed = newDayCount - oldDayCount;

  let newDailyFeeds = state.dailyFeeds;
  let newGameDay = state.gameDay;

  if (daysPassed > 0) {
    newDailyFeeds = 0;
    newGameDay = state.gameDay + daysPassed;
  }

  // Check for evolution
  let newStage = state.stage;

  // Corruption-based evolution (highest priority)
  if (state.stats.corruption > 80 && state.stage !== "ABOMINATION") {
    newStage = "ABOMINATION";
  }
  // Age-based evolution
  else if (state.stage === "EGG" && newAge >= 5) {
    newStage = "BABY";
  } else if (state.stage === "BABY" && newAge >= 24 * 60) {
    newStage = "TEEN";
  }

  return {
    ...state,
    age: newAge,
    stage: newStage,
    stats: {
      ...state.stats,
      hunger: newHunger,
      sanity: newSanity,
    },
    dailyFeeds: newDailyFeeds,
    gameDay: newGameDay,
    lastTickTime: Date.now(),
  };
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...initialState,
      ...initialAudioState,
      ...initialSettingsState,

      // ============================================
      // Audio Actions (Requirements 4.1, 4.2, 4.3, 4.4)
      // ============================================

      /**
       * Set master volume and apply to sound manager
       * Requirement 4.3: Immediately apply new volume
       */
      setMasterVolume: (volume: number) => {
        const clampedVolume = Math.max(0, Math.min(1, volume));
        set({ masterVolume: clampedVolume });
        soundManager.setMasterVolume(clampedVolume);
      },

      /**
       * Set SFX volume and apply to sound manager
       * Requirement 4.3: Immediately apply new volume
       */
      setSfxVolume: (volume: number) => {
        const clampedVolume = Math.max(0, Math.min(1, volume));
        set({ sfxVolume: clampedVolume });
        soundManager.setSfxVolume(clampedVolume);
      },

      /**
       * Set ambient volume and apply to sound manager
       * Requirement 4.3: Immediately apply new volume
       */
      setAmbientVolume: (volume: number) => {
        const clampedVolume = Math.max(0, Math.min(1, volume));
        set({ ambientVolume: clampedVolume });
        soundManager.setAmbientVolume(clampedVolume);
      },

      /**
       * Toggle mute state for all audio channels
       * Requirement 4.4: Mute/unmute all channels simultaneously
       */
      toggleMute: () => {
        const newMuted = !get().isMuted;
        set({ isMuted: newMuted });
        soundManager.setMuted(newMuted);
      },

      /**
       * Mark that user has interacted (unlocks audio)
       * Requirement 2.4: Unlock audio on first user interaction
       */
      setUserInteracted: () => {
        if (!get().hasUserInteracted) {
          set({ hasUserInteracted: true });
          soundManager.handleUserInteraction();
        }
      },

      // ============================================
      // Settings Actions
      // ============================================

      /**
       * Set game speed multiplier (0.5, 1, 2, 4)
       */
      setGameSpeed: (speed: number) => {
        const validSpeeds = [0.5, 1, 2, 4];
        const clampedSpeed = validSpeeds.includes(speed) ? speed : 1;
        set({ gameSpeed: clampedSpeed });
      },

      /**
       * Toggle CRT scanline effect
       */
      setCrtEnabled: (enabled: boolean) => {
        set({ crtEnabled: enabled });
      },

      /**
       * Toggle reduce motion preference
       */
      setReduceMotion: (enabled: boolean) => {
        set({ reduceMotion: enabled });
      },

      /**
       * Toggle retro mode (CRT overlay + disable React Bits animations)
       * Requirements 8.1, 8.2, 8.3, 8.4
       */
      setRetroMode: (enabled: boolean) => {
        set({ retroMode: enabled });
      },

      /**
       * Set theme preference (cute or horror)
       * Requirements 6.1, 6.2
       */
      setTheme: (theme: Theme) => {
        if (theme === "cute" || theme === "horror") {
          set({ theme });
        }
      },

      // ============================================
      // Pet Sprite Actions (Image Generation)
      // ============================================

      /**
       * Update cached pet sprite URL
       * Called when pet evolves or sprite is captured
       */
      updatePetSprite: (spriteUrl: string) => {
        set({ currentPetSpriteUrl: spriteUrl });
      },

      /**
       * Generate image for a narrative log entry
       * Captures current pet sprite and calls RunPod API
       * Requirements 4.1, 4.2, 4.3, 4.4, 4.5: Track progress during generation
       */
      generateLogImage: async (logId: string) => {
        const state = get();
        
        // Find the log entry
        const log = state.logs.find(l => l.id === logId);
        if (!log) {
          logWarning("Log not found for image generation", { logId });
          return;
        }

        // Don't regenerate if already generating
        if (log.imageStatus === "generating") {
          return;
        }

        // Initialize progress tracking (Requirement 4.1)
        const startTime = Date.now();
        const initialProgress: import("./utils/types").GenerationProgress = {
          startTime,
          pollCount: 0,
          estimatedTimeRemaining: 90, // 90 seconds max
        };

        // Update log status to generating with progress tracking
        set({
          logs: state.logs.map(l =>
            l.id === logId
              ? { 
                  ...l, 
                  imageStatus: "generating" as ImageStatus,
                  generationProgress: initialProgress,
                }
              : l
          ),
        });

        // Start progress update interval (Requirement 4.2)
        const progressInterval = setInterval(() => {
          const currentState = get();
          const currentLog = currentState.logs.find(l => l.id === logId);
          
          if (!currentLog || !currentLog.generationProgress) {
            clearInterval(progressInterval);
            return;
          }

          // Calculate elapsed time and estimated time remaining (Requirements 4.3, 4.4)
          const elapsed = Date.now() - currentLog.generationProgress.startTime;
          const elapsedSeconds = Math.floor(elapsed / 1000);
          const estimatedTimeRemaining = Math.max(0, 90 - elapsedSeconds);
          
          // Update progress (Requirement 4.2)
          set({
            logs: currentState.logs.map(l =>
              l.id === logId && l.generationProgress
                ? {
                    ...l,
                    generationProgress: {
                      ...l.generationProgress,
                      pollCount: l.generationProgress.pollCount + 1,
                      estimatedTimeRemaining,
                    },
                  }
                : l
            ),
          });
        }, 2000); // Update every 2 seconds (Requirement 4.2)

        try {
          // Gather source images
          const sourceImages: string[] = [];

          // PRIMARY: Current pet sprite (required)
          if (state.currentPetSpriteUrl) {
            sourceImages.push(state.currentPetSpriteUrl);
          } else {
            // No pet sprite available - fail gracefully
            logWarning("No pet sprite available for image generation");
            clearInterval(progressInterval);
            set({
              logs: get().logs.map(l =>
                l.id === logId
                  ? { 
                      ...l, 
                      imageStatus: "failed" as ImageStatus,
                      generationProgress: undefined,
                    }
                  : l
              ),
            });
            return;
          }

          // SECONDARY: Previous narrative image from same log chain (for continuity)
          const previousLogs = state.logs.filter(
            l => l.id !== logId && l.imageUrl && l.imageStatus === "completed"
          );
          if (previousLogs.length > 0) {
            // Get the most recent previous image
            const lastImageLog = previousLogs[previousLogs.length - 1];
            if (lastImageLog.imageUrl) {
              sourceImages.push(lastImageLog.imageUrl);
            }
          }

          // Get visual traits for character consistency (Requirements 8.1, 8.2, 8.3, 8.5)
          const visualTraits = get().getVisualTraits();

          // Build API request body with eventType if available
          const requestBody: any = {
            narrativeText: log.text,
            petName: state.traits.name,
            archetype: state.traits.archetype,
            stage: state.stage,
            sourceImages,
            visualTraits, // Include visual traits for consistency (Requirements 8.1, 8.2, 8.3, 8.5)
          };

          // Include eventType for specialized prompts (Requirements 4.1-4.6, 5.1-5.6)
          if (log.eventType) {
            requestBody.eventType = log.eventType;
          }

          // Call the API
          const response = await fetch("/api/generateImage", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `API error: ${response.status}`);
          }

          const result = await response.json();

          // Clear progress interval (Requirement 4.6)
          clearInterval(progressInterval);

          // Extract and store visual traits for future consistency (Requirements 8.4, 8.5)
          // Build visual traits from current pet state
          const newVisualTraits: import("./utils/types").VisualTraits = {
            archetype: state.traits.archetype,
            stage: state.stage,
            colorPalette: [
              `#${state.traits.color.toString(16).padStart(6, '0')}`, // Convert color to hex
            ],
            keyFeatures: [], // Will be populated by future AI extraction
            styleKeywords: [], // Will be populated by future AI extraction
          };

          // Add archetype-specific features (Requirement 8.1)
          const archetypeFeatures: Record<string, string[]> = {
            GLOOM: ["shadowy form", "hollow eyes", "melancholic aura"],
            SPARK: ["electric energy", "crackling sparks", "jittery movements"],
            ECHO: ["translucent body", "fading echoes", "ethereal presence"],
          };
          newVisualTraits.keyFeatures = archetypeFeatures[state.traits.archetype] || [];

          // Add stage-specific features (Requirement 8.1)
          const stageFeatures: Record<string, string[]> = {
            EGG: ["pulsing energy", "mysterious shell"],
            BABY: ["small vulnerable form", "developing features"],
            TEEN: ["growing body", "maturing characteristics"],
            ABOMINATION: ["twisted form", "corrupted appearance", "horrific features"],
          };
          newVisualTraits.keyFeatures.push(...(stageFeatures[state.stage] || []));

          // Add style keywords based on corruption level
          if (state.stats.corruption > 80) {
            newVisualTraits.styleKeywords = ["corrupted", "twisted", "nightmarish"];
          } else if (state.stats.corruption > 50) {
            newVisualTraits.styleKeywords = ["unsettling", "eerie", "disturbing"];
          } else {
            newVisualTraits.styleKeywords = ["mysterious", "otherworldly", "haunting"];
          }

          // Store visual traits (Requirement 8.4)
          get().storeVisualTraits(logId, newVisualTraits);

          // Update log with generated image (Requirement 4.6)
          set({
            logs: get().logs.map(l =>
              l.id === logId
                ? {
                    ...l,
                    imageUrl: result.imageUrl,
                    imageStatus: "completed" as ImageStatus,
                    sourceImages,
                    visualTraits: newVisualTraits, // Store traits in log (Requirement 8.4)
                    generationProgress: undefined, // Clear progress on completion
                  }
                : l
            ),
          });

          // Update the current pet sprite to use the latest generated image
          // This ensures the canvas displays the most recent narrative image
          get().updatePetSprite(result.imageUrl);

          logInfo("Image generated for log", { logId, visualTraitsStored: true });
        } catch (error) {
          // Clear progress interval on error
          clearInterval(progressInterval);
          
          logError(
            "Failed to generate log image",
            error instanceof Error ? error : new Error(String(error)),
            { logId }
          );

          // Update log status to failed (Requirement 4.7)
          set({
            logs: get().logs.map(l =>
              l.id === logId
                ? { 
                    ...l, 
                    imageStatus: "failed" as ImageStatus,
                    generationProgress: undefined, // Clear progress on failure
                  }
                : l
            ),
          });
        }
      },

      /**
       * Play sound via AI selection API
       * Requirements 5.1, 7.2, 7.3
       */
      playSound: async (eventType: string, context?: SoundContext) => {
        const state = get();
        
        // Build full context from game state
        const fullContext = {
          petName: context?.petName ?? state.traits.name,
          stage: context?.stage ?? state.stage,
          archetype: context?.archetype ?? state.traits.archetype,
          itemType: context?.itemType,
          sanity: context?.sanity ?? state.stats.sanity,
          corruption: context?.corruption ?? state.stats.corruption,
          narrativeText: context?.narrativeText,
        };

        try {
          // Call the selectSound API
          const response = await fetch('/api/selectSound', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventType,
              context: fullContext,
            }),
          });

          if (!response.ok) {
            throw new Error(`Sound selection API failed: ${response.status}`);
          }

          const selection = await response.json();

          // Play primary sound
          if (selection.primarySound) {
            soundManager.play(selection.primarySound, { volume: selection.volume });
          }

          // Play secondary sounds
          if (selection.secondarySounds) {
            for (const soundId of selection.secondarySounds) {
              soundManager.play(soundId, { volume: selection.volume * 0.7 });
            }
          }

          // Set ambient if specified
          if (selection.ambientSound) {
            soundManager.setAmbient(selection.ambientSound);
          }

          logInfo('Sound played', { eventType, primarySound: selection.primarySound });
        } catch (error) {
          // Requirement 7.2, 7.3: Log error and continue without crashing
          logError(
            'Failed to play sound',
            error instanceof Error ? error : new Error(String(error)),
            { eventType }
          );
          // Game continues without audio
        }
      },

      // ============================================
      // Game Actions
      // ============================================

      initializePet: (name: string, archetype: Archetype, color: number) => {
        set({
          isInitialized: true,
          traits: {
            name: name.trim(),
            archetype,
            color,
          },
          stats: {
            hunger: 0,
            sanity: 100,
            corruption: 0,
          },
          stage: "EGG",
          age: 0,
          isAlive: true,
          inventory: [],
          dailyFeeds: 0,
          gameDay: 0,
          logs: [],
          lastTickTime: Date.now(),
        });
      },

      tick: () => {
        const state = get();

        if (!state.isAlive || !state.isInitialized) {
          return;
        }

        // Advance game time by 1 minute (1 real second = 1 game minute)
        const newAge = state.age + 1;

        // ============================================
        // Starvation Consequences (Requirements 8.1, 8.2)
        // ============================================
        
        // Base decay rates
        let hungerIncreaseRate = 0.05;  // Base: 0.05 per minute
        let sanityDecayRate = 0.02;     // Base: 0.02 per minute
        
        // Requirement 8.1: When hunger > 80, sanity decays at 0.05/min instead of 0.02/min
        if (state.stats.hunger > 80) {
          sanityDecayRate = 0.05;
        }
        
        // Requirement 8.2: When hunger >= 90, hunger increases at 0.1/min instead of 0.05/min
        if (state.stats.hunger >= 90) {
          hungerIncreaseRate = 0.1;
        }

        // Apply decay with calculated rates
        const newHunger = Math.min(100, state.stats.hunger + hungerIncreaseRate);
        const newSanity = Math.max(0, state.stats.sanity - sanityDecayRate);

        // Check for daily reset (24 game hours = 1440 minutes)
        let newDailyFeeds = state.dailyFeeds;
        let newGameDay = state.gameDay;
        const minutesInDay = 24 * 60; // 1440 minutes

        if (newAge > 0 && newAge % minutesInDay === 0) {
          newDailyFeeds = 0;
          newGameDay = state.gameDay + 1;
        }

        // Check for evolution
        let newStage = state.stage;
        let evolutionOccurred = false;
        let fromStage = state.stage;

        // Corruption-based evolution (highest priority)
        if (state.stats.corruption > 80 && state.stage !== "ABOMINATION") {
          newStage = "ABOMINATION";
          evolutionOccurred = true;
        }
        // Age-based evolution
        else if (state.stage === "EGG" && newAge >= 5) {
          newStage = "BABY";
          evolutionOccurred = true;
        } else if (state.stage === "BABY" && newAge >= 24 * 60) {
          // 24 hours = 1440 minutes
          newStage = "TEEN";
          evolutionOccurred = true;
        }

        // Update state
        set({
          age: newAge,
          stage: newStage,
          dailyFeeds: newDailyFeeds,
          gameDay: newGameDay,
          stats: {
            ...state.stats,
            hunger: newHunger,
            sanity: newSanity,
          },
          lastTickTime: Date.now(),
        });

        // Add evolution log with AI narrative if evolution occurred
        if (evolutionOccurred) {
          // Import narrative generator dynamically
          import("./utils/narrativeGenerator").then(async ({ generateEvolutionNarrative, getPlaceholderText, buildNarrativeContext }) => {
            const currentState = get();
            
            // Build memory context (Requirements 5.1, 5.2, 5.3, 5.4)
            const memoryContext = buildNarrativeContext(
              currentState.logs,
              { sanity: newSanity, corruption: currentState.stats.corruption },
              { sanity: state.stats.sanity, corruption: state.stats.corruption }
            );
            
            const eventType = fromStage === "EGG" ? "hatch" : "evolution";
            const placeholderText = getPlaceholderText(eventType, state.traits.name);
            // Requirement 4.1: Set autoGenerateImage for evolution events
            // Pass "evolution" as eventType to trigger auto-generation
            const logId = get().addLog(placeholderText, "SYSTEM", true, "evolution");

            // Log evolution for debugging
            logInfo("Evolution detected", { from: fromStage, to: newStage });

            try {
              const aiNarrative = await generateEvolutionNarrative({
                petName: state.traits.name,
                stage: newStage,
                archetype: state.traits.archetype,
                sanity: newSanity,
                corruption: currentState.stats.corruption,
                fromStage,
                toStage: newStage,
              }, undefined, memoryContext);
              get().updateLogText(logId, aiNarrative);
            } catch (error) {
              logWarning("Failed to generate evolution narrative", {
                error: error instanceof Error ? error.message : "Unknown",
              });
            }
          });
        }

        // Requirement 5.3: Play evolution sound when stage changes
        if (newStage !== state.stage) {
          // Call playSound with eventType "evolution" and new stage
          get().playSound("evolution", {
            stage: newStage,
          });
          
          // Trigger ambient crossfade to stage-appropriate ambient
          // Stage-based ambient mapping from design doc
          const stageAmbientMap: Record<string, string> = {
            EGG: "ambient_suburban_neighborhood_morning",
            BABY: "ambient_rain_medium_2",
            TEEN: "ambient_creepy_ambience_3",
            ABOMINATION: "ambient_drone_doom",
          };
          const newAmbient = stageAmbientMap[newStage];
          if (newAmbient) {
            soundManager.setAmbient(newAmbient);
          }
        }

        // Requirements 5.4, 5.5: Sanity-based ambient management
        // Detect threshold crossing (above/below 30)
        const SANITY_THRESHOLD = 30;
        const previousSanity = state.stats.sanity;
        const crossedBelowThreshold = previousSanity >= SANITY_THRESHOLD && newSanity < SANITY_THRESHOLD;
        const crossedAboveThreshold = previousSanity < SANITY_THRESHOLD && newSanity >= SANITY_THRESHOLD;

        if (crossedBelowThreshold) {
          // Sanity dropped below 30 - switch to horror ambient
          soundManager.setAmbient("ambient_creepy_ambience_3");
        } else if (crossedAboveThreshold) {
          // Sanity rose above 30 - switch to normal ambient based on stage
          const stageAmbientMap: Record<string, string> = {
            EGG: "ambient_suburban_neighborhood_morning",
            BABY: "ambient_rain_medium_2",
            TEEN: "ambient_creepy_ambience_3",
            ABOMINATION: "ambient_drone_doom",
          };
          const normalAmbient = stageAmbientMap[newStage];
          if (normalAmbient) {
            soundManager.setAmbient(normalAmbient);
          }
        }

        // ============================================
        // Death Detection (Requirements 1.1, 1.2)
        // ============================================
        
        // Check for death conditions AFTER state update
        // Hunger >= 100 triggers STARVATION death
        if (newHunger >= 100) {
          get().triggerDeath("STARVATION");
          return; // Stop tick processing after death
        }
        
        // Sanity <= 0 triggers INSANITY death
        if (newSanity <= 0) {
          get().triggerDeath("INSANITY");
          return; // Stop tick processing after death
        }

        // Check for critical events and add warnings (only on first occurrence)
        if (newHunger >= 100 && state.stats.hunger < 100) {
          get().addLog(`WARNING: ${state.traits.name} is starving!`, "SYSTEM");
        }

        if (newSanity <= 0 && state.stats.sanity > 0) {
          get().addLog(
            `WARNING: ${state.traits.name} has lost all sanity!`,
            "SYSTEM"
          );
        }

        if (newDailyFeeds > 3 && state.dailyFeeds === 3) {
          get().addLog(
            `WARNING: ${state.traits.name} has eaten too much today!`,
            "SYSTEM"
          );
        }

        // ============================================
        // Insanity Events (Requirements 10.1, 10.2)
        // ============================================
        // 1% chance per tick when sanity < 30
        if (newSanity < 30) {
          const insanityRoll = Math.random();
          if (insanityRoll < 0.01) {
            // Trigger insanity event asynchronously
            get().triggerInsanityEvent();
          }
        }

        // ============================================
        // Haunt Events (Requirements 4.1, 4.2, 4.3)
        // ============================================
        // Evaluate haunt trigger each tick when sanity < 50
        // Uses shouldTriggerHaunt which checks:
        // - Sanity < 50 threshold (Requirement 4.2)
        // - 1% chance per tick (Requirement 4.2)
        // - Max 1 haunt per game day (Requirement 4.3)
        // - Ghosts exist in storage (Requirement 4.1)
        import("./utils/hauntSystem").then(({ shouldTriggerHaunt }) => {
          // Use the updated gameDay (newGameDay) for the check
          const currentGameDay = newGameDay;
          const lastHauntDay = get().lastHauntGameDay;
          
          if (shouldTriggerHaunt(newSanity, lastHauntDay, currentGameDay)) {
            // Trigger haunt event asynchronously
            get().triggerHaunt();
          }
        });
      },

      scavenge: async () => {
        const state = get();

        // Check if inventory is full
        if (state.inventory.length >= 3) {
          return;
        }

        // Generate random item type (50/50 PURITY/ROT)
        const itemType: "PURITY" | "ROT" =
          Math.random() < 0.5 ? "PURITY" : "ROT";

        // Generate AI description
        const { generateText } = await import("./utils/aiClient");
        const prompt = `Generate a one-sentence abstract description for a mysterious ${
          itemType === "PURITY" ? "pure" : "rotting"
        } offering. Be cryptic and unsettling.`;

        const aiResponse = await generateText({ prompt, maxTokens: 50 });

        // Create offering with UUID
        const offering = {
          id: crypto.randomUUID(),
          type: itemType,
          description: aiResponse.text,
          icon: itemType === "PURITY" ? "✨" : "🦴",
        };

        // Add to inventory
        set({
          inventory: [...state.inventory, offering],
        });

        // Requirement 5.2: Play discovery sound effect on successful scavenge
        // Use character_woosh for UI feedback
        soundManager.play("character_woosh");
      },

      feed: async (itemId: string) => {
        const state = get();

        // Find offering by ID
        const offering = state.inventory.find((item) => item.id === itemId);
        if (!offering) {
          return;
        }

        // Apply stat changes based on item type
        let newHunger = state.stats.hunger;
        let newSanity = state.stats.sanity;
        let newCorruption = state.stats.corruption;

        if (offering.type === "PURITY") {
          newHunger = Math.max(0, state.stats.hunger - 20);
          newSanity = Math.min(100, state.stats.sanity + 10);
          newCorruption = Math.max(0, state.stats.corruption - 5);
        } else {
          // ROT
          newHunger = Math.max(0, state.stats.hunger - 20);
          newSanity = Math.max(0, state.stats.sanity - 15);
          newCorruption = Math.min(100, state.stats.corruption + 10);
        }

        // Remove offering from inventory
        const newInventory = state.inventory.filter(
          (item) => item.id !== itemId
        );

        // Increment dailyFeeds counter
        const newDailyFeeds = state.dailyFeeds + 1;
        const isOverfed = newDailyFeeds > 3;

        // Check for vomit event (more than 3 feeds)
        if (isOverfed) {
          newSanity = Math.max(0, newSanity - 20);
        }

        // Update state immediately
        set({
          stats: {
            hunger: newHunger,
            sanity: newSanity,
            corruption: newCorruption,
          },
          inventory: newInventory,
          dailyFeeds: newDailyFeeds,
          // Trigger vomit effect if overfed (Requirement 9.2)
          ...(isOverfed && { vomitEffect: { isActive: true, timestamp: Date.now() } }),
        });

        // Import narrative generator
        const { generateFeedingNarrative, generateVomitNarrative, getPlaceholderText, buildNarrativeContext } = await import("./utils/narrativeGenerator");

        // Build memory context (Requirements 5.1, 5.2, 5.3, 5.4)
        const memoryContext = buildNarrativeContext(
          state.logs,
          { sanity: newSanity, corruption: newCorruption },
          { sanity: state.stats.sanity, corruption: state.stats.corruption }
        );

        // Add placeholder log immediately with pending state
        // Requirement 4.4: Set autoGenerateImage for vomit events
        // Requirement 4.7: Do NOT set autoGenerateImage for regular feeding
        const eventType: import("./utils/types").EventType = isOverfed ? "vomit" : "feed";
        const placeholderText = getPlaceholderText(eventType, state.traits.name);
        const logId = get().addLog(placeholderText, "PET", true, isOverfed ? eventType : undefined);

        // Requirement 5.1: Play sound with feeding context
        // Requirement 9.4: Play vomit sound on overfeed
        if (isOverfed) {
          get().playSound("vomit", {
            petName: state.traits.name,
            stage: state.stage,
            archetype: state.traits.archetype,
            sanity: newSanity,
            corruption: newCorruption,
          });
        } else {
          get().playSound("feed", {
            itemType: offering.type,
            narrativeText: placeholderText,
          });
        }

        // Generate AI narrative async
        try {
          let aiNarrative: string;
          
          if (isOverfed) {
            // Requirement 9.3: Generate vomit narrative for overfeed
            aiNarrative = await generateVomitNarrative({
              petName: state.traits.name,
              archetype: state.traits.archetype,
              stage: state.stage,
              sanity: newSanity,
              corruption: newCorruption,
            }, undefined, memoryContext);
          } else {
            aiNarrative = await generateFeedingNarrative({
              petName: state.traits.name,
              stage: state.stage,
              archetype: state.traits.archetype,
              sanity: newSanity,
              corruption: newCorruption,
              itemName: offering.description,
              itemType: offering.type,
              isOverfed,
            }, undefined, memoryContext);
          }

          // Update log with AI-generated text
          get().updateLogText(logId, aiNarrative);
        } catch (error) {
          // Fallback already handled in narrativeGenerator
          logWarning("Failed to generate feeding narrative", {
            error: error instanceof Error ? error.message : "Unknown",
          });
        }

        // Auto-clear vomit effect after animation duration (1.5 seconds)
        if (isOverfed) {
          setTimeout(() => {
            get().clearVomitEffect();
          }, 1500);
        }
      },

      reorderInventory: (newInventory: Offering[]) => {
        // Update inventory order and persist to localStorage
        set({ inventory: newInventory });
      },

      addLog: (text: string, source: LogSource, isPending?: boolean, eventType?: import("./utils/types").EventType) => {
        const state = get();
        const logId = crypto.randomUUID();
        
        // Requirement 4.7: Regular feeding events should NOT trigger auto-generation
        // Only set autoGenerateImage for specific event types (not "feed")
        const shouldAutoGenerate = eventType && 
                                   eventType !== "feed" && 
                                   state.autoGenerateImages;
        
        const newLog = {
          id: logId,
          text,
          source,
          timestamp: state.age,
          isPending: isPending ?? false,
          // Set autoGenerateImage flag based on eventType and autoGenerateImages setting (Requirements 4.1-4.8, 8.3)
          ...(shouldAutoGenerate && { autoGenerateImage: true, eventType }),
        };

        set({
          logs: [...state.logs, newLog],
        });

        return logId; // Return ID so caller can update it later
      },

      updateLogText: (logId: string, newText: string) => {
        const state = get();
        const updatedLogs = state.logs.map((log) =>
          log.id === logId
            ? { ...log, text: newText, isPending: false }
            : log
        );
        set({ logs: updatedLogs });
      },

      reset: () => {
        set({ ...initialState, ...initialAudioState });
      },

      // ============================================
      // Death System Actions (Requirements 1.3, 1.4, 3.1, 2.4)
      // ============================================

      /**
       * Trigger death event for the pet.
       * Sets isAlive to false, creates DeathData, saves ghost, plays death sound.
       * 
       * Requirements: 1.3, 1.4, 3.1, 2.4
       */
      triggerDeath: async (cause: DeathCause) => {
        const state = get();
        
        // Don't trigger death if already dead
        if (!state.isAlive) {
          return;
        }

        // Import narrative generator for death narrative and epitaph
        const { generateDeathNarrative, generateEpitaph } = await import("./utils/narrativeGenerator");
        
        // Import haunt system for ghost storage
        const { saveGhost, createGhostFromPet } = await import("./utils/hauntSystem");

        // Generate death narrative and epitaph
        let deathNarrative = "";
        let epitaph = "";
        
        try {
          deathNarrative = await generateDeathNarrative({
            petName: state.traits.name,
            archetype: state.traits.archetype,
            stage: state.stage,
            age: state.age,
            cause,
            sanity: state.stats.sanity,
            corruption: state.stats.corruption,
          });
        } catch (error) {
          logWarning("Failed to generate death narrative", {
            error: error instanceof Error ? error.message : "Unknown",
          });
          // Fallback will be handled by narrativeGenerator
        }

        try {
          epitaph = await generateEpitaph({
            petName: state.traits.name,
            archetype: state.traits.archetype,
            stage: state.stage,
            age: state.age,
            cause,
          });
        } catch (error) {
          logWarning("Failed to generate epitaph", {
            error: error instanceof Error ? error.message : "Unknown",
          });
          // Fallback will be handled by narrativeGenerator
        }

        // Create DeathData with all required fields
        const deathData: DeathData = {
          petName: state.traits.name,
          archetype: state.traits.archetype,
          stage: state.stage,
          age: state.age,
          cause,
          finalStats: { ...state.stats },
          timestamp: Date.now(),
          deathNarrative,
          epitaph,
        };

        // Create and save ghost to localStorage
        const ghost = createGhostFromPet(
          state.traits,
          state.stats,
          state.stage,
          cause,
          epitaph
        );
        saveGhost(ghost);

        // Update state: set isAlive to false and store death data
        set({
          isAlive: false,
          deathData,
        });

        // Add death log entry with auto-generation (Requirement 4.2)
        get().addLog(deathNarrative, "SYSTEM", false, "death");

        // Play death sound
        get().playSound("death", {
          petName: state.traits.name,
          stage: state.stage,
          archetype: state.traits.archetype,
        });

        logInfo("Pet death triggered", {
          petName: state.traits.name,
          cause,
          age: state.age,
          stage: state.stage,
        });

        // Requirement 7.5: Auto-generate story summary on death
        // Generate summary asynchronously (don't block death processing)
        get().generateStorySummary().catch((error) => {
          logWarning("Failed to auto-generate story summary on death", {
            error: error instanceof Error ? error.message : "Unknown",
          });
        });
      },

      /**
       * Start a new pet after death.
       * Resets game state to initial values while preserving ghost data.
       * 
       * Requirements: 5.3, 5.4
       */
      startNewPet: () => {
        // Reset game state to initial values
        // Ghost data is stored in separate localStorage key ("creepy-companion-ghosts")
        // and is NOT affected by this reset
        set({
          ...initialState,
          ...initialAudioState,
          ...initialSettingsState,
          // Explicitly set isInitialized to false to show CreationScreen
          isInitialized: false,
          // Reset death data
          deathData: null,
          lastPlacateTime: null,
          lastHauntGameDay: 0,
        });

        logInfo("New pet started - game state reset");
      },

      // ============================================
      // Placate Action (Requirements 6.1, 6.2, 6.3, 6.4, 6.6)
      // ============================================

      /**
       * Execute placate action to restore sanity.
       * - Check isAlive and cooldown before executing
       * - Increase sanity by 15 (or 5 if sanity >= 80 and corruption < 50)
       * - Increase hunger by 5
       * - Set lastPlacateTime to current age
       * - Play placate sound
       * 
       * Requirements: 6.1, 6.2, 6.3, 6.4, 6.6
       */
      placate: async () => {
        const state = get();

        // Check if pet is alive (Requirement 6.1)
        if (!state.isAlive) {
          logWarning("Cannot placate: pet is not alive");
          return;
        }

        // Check cooldown (Requirement 6.4)
        const cooldownRemaining = getPlacateCooldownRemaining(
          state.lastPlacateTime,
          state.age
        );
        if (cooldownRemaining > 0) {
          logWarning("Cannot placate: on cooldown", { cooldownRemaining });
          return;
        }

        // Calculate sanity increase (Requirements 6.1, 6.2)
        // Normal: +15 sanity
        // Reduced: +5 sanity if sanity >= 80 AND corruption < 50
        let sanityIncrease = 15;
        if (state.stats.sanity >= 80 && state.stats.corruption < 50) {
          sanityIncrease = 5;
        }

        const newSanity = Math.min(100, state.stats.sanity + sanityIncrease);
        
        // Increase hunger by 5 (Requirement 6.3)
        const newHunger = Math.min(100, state.stats.hunger + 5);

        // Update state
        set({
          stats: {
            ...state.stats,
            sanity: newSanity,
            hunger: newHunger,
          },
          // Set lastPlacateTime to current age (Requirement 6.4)
          lastPlacateTime: state.age,
        });

        // Play placate sound (Requirement 6.6)
        get().playSound("placate", {
          petName: state.traits.name,
          stage: state.stage,
          archetype: state.traits.archetype,
          sanity: newSanity,
          corruption: state.stats.corruption,
        });

        // Generate placate narrative (Requirement 6.5)
        try {
          const { generatePlacateNarrative, getPlaceholderText, buildNarrativeContext } = await import("./utils/narrativeGenerator");
          
          // Build memory context (Requirements 5.1, 5.2, 5.3, 5.4)
          const memoryContext = buildNarrativeContext(
            state.logs,
            { sanity: newSanity, corruption: state.stats.corruption },
            { sanity: state.stats.sanity, corruption: state.stats.corruption }
          );
          
          // Add placeholder log immediately
          // Requirement 4.3: Set autoGenerateImage for placate events
          const placeholderText = getPlaceholderText("placate", state.traits.name);
          const logId = get().addLog(placeholderText, "PET", true, "placate");

          // Generate AI narrative async
          const aiNarrative = await generatePlacateNarrative({
            petName: state.traits.name,
            archetype: state.traits.archetype,
            stage: state.stage,
            sanity: newSanity,
            corruption: state.stats.corruption,
          }, undefined, memoryContext);

          // Update log with AI-generated text
          get().updateLogText(logId, aiNarrative);
        } catch (error) {
          logWarning("Failed to generate placate narrative", {
            error: error instanceof Error ? error.message : "Unknown",
          });
        }

        logInfo("Placate action executed", {
          sanityIncrease,
          newSanity,
          newHunger,
        });

        // Trigger placate visual effect (Requirement 7.1)
        get().triggerPlacateEffect();
      },

      // ============================================
      // Placate Visual Effect Actions (Requirement 7.1)
      // ============================================

      /**
       * Trigger placate visual effect animation.
       * Sets the effect state to active with current archetype.
       * 
       * Requirement 7.1: Display glow pulse animation on pet sprite
       */
      triggerPlacateEffect: () => {
        const state = get();
        set({
          placateEffect: {
            isActive: true,
            archetype: state.traits.archetype,
            timestamp: Date.now(),
          },
        });

        // Auto-clear effect after animation duration (1.5 seconds)
        setTimeout(() => {
          get().clearPlacateEffect();
        }, 1500);
      },

      /**
       * Clear placate visual effect animation.
       * Resets the effect state to inactive.
       */
      clearPlacateEffect: () => {
        set({
          placateEffect: {
            isActive: false,
            archetype: null,
            timestamp: null,
          },
        });
      },

      // ============================================
      // Vomit Visual Effect Actions (Requirement 9.2)
      // ============================================

      /**
       * Clear vomit visual effect animation.
       * Resets the effect state to inactive.
       * 
       * Requirement 9.2: Particle splatter animation on overfeed
       */
      clearVomitEffect: () => {
        set({
          vomitEffect: {
            isActive: false,
            timestamp: null,
          },
        });
      },

      // ============================================
      // Insanity Event Actions (Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6)
      // ============================================

      /**
       * Trigger an insanity event with random event type.
       * - Select random InsanityEventType (WHISPERS, SHADOWS, GLITCH, INVERSION)
       * - Play appropriate sound based on event type
       * - Generate insanity narrative
       * - Trigger visual effect
       * 
       * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
       */
      triggerInsanityEvent: async () => {
        const state = get();

        // Don't trigger if pet is not alive
        if (!state.isAlive) {
          return;
        }

        // Select random InsanityEventType (Requirement 10.2)
        const eventTypes: import("./utils/types").InsanityEventType[] = ["WHISPERS", "SHADOWS", "GLITCH", "INVERSION"];
        const randomIndex = Math.floor(Math.random() * eventTypes.length);
        const eventType = eventTypes[randomIndex];

        // Trigger visual effect (Requirement 10.6)
        set({
          insanityEffect: {
            isActive: true,
            eventType,
            timestamp: Date.now(),
          },
        });

        // Play appropriate sound (Requirements 10.3, 10.4)
        // WHISPERS: playSound("insanity_whispers")
        // Others: playSound("insanity_stinger")
        const soundEventType = eventType === "WHISPERS" ? "insanity_whispers" : "insanity_stinger";
        get().playSound(soundEventType, {
          petName: state.traits.name,
          stage: state.stage,
          archetype: state.traits.archetype,
          sanity: state.stats.sanity,
          corruption: state.stats.corruption,
        });

        // Generate insanity narrative (Requirement 10.5)
        try {
          const { generateInsanityNarrative, getPlaceholderText, buildNarrativeContext } = await import("./utils/narrativeGenerator");
          
          // Build memory context (Requirements 5.1, 5.2, 5.3, 5.4)
          const memoryContext = buildNarrativeContext(
            state.logs,
            { sanity: state.stats.sanity, corruption: state.stats.corruption }
          );
          
          // Add placeholder log immediately
          // Requirement 4.5: Set autoGenerateImage for insanity events
          const placeholderText = getPlaceholderText("insanity", state.traits.name);
          const logId = get().addLog(placeholderText, "PET", true, "insanity");

          // Generate AI narrative async
          const aiNarrative = await generateInsanityNarrative({
            petName: state.traits.name,
            archetype: state.traits.archetype,
            stage: state.stage,
            sanity: state.stats.sanity,
            corruption: state.stats.corruption,
            eventType,
          }, undefined, memoryContext);

          // Update log with AI-generated text
          get().updateLogText(logId, aiNarrative);
        } catch (error) {
          logWarning("Failed to generate insanity narrative", {
            error: error instanceof Error ? error.message : "Unknown",
            eventType,
          });
        }

        logInfo("Insanity event triggered", {
          eventType,
          sanity: state.stats.sanity,
        });

        // Auto-clear effect after animation duration (2 seconds for insanity effects)
        setTimeout(() => {
          get().clearInsanityEffect();
        }, 2000);
      },

      /**
       * Clear insanity visual effect animation.
       * Resets the effect state to inactive.
       * 
       * Requirement 10.6
       */
      clearInsanityEffect: () => {
        set({
          insanityEffect: {
            isActive: false,
            eventType: null,
            timestamp: null,
          },
        });
      },

      // ============================================
      // Haunt System Actions (Requirements 4.4, 4.5, 4.6)
      // ============================================

      /**
       * Trigger a haunt event from a deceased pet's ghost.
       * - Select random ghost from storage
       * - Reduce sanity by 5
       * - Generate haunt narrative
       * - Update lastHauntGameDay
       * - Play haunt sound
       * 
       * Requirements: 4.4, 4.5, 4.6
       */
      triggerHaunt: async () => {
        const state = get();

        // Don't trigger if pet is not alive
        if (!state.isAlive) {
          return;
        }

        // Import haunt system functions
        const { getRandomGhost } = await import("./utils/hauntSystem");

        // Select random ghost from storage (Requirement 4.3)
        const ghost = getRandomGhost();
        if (!ghost) {
          logWarning("Cannot trigger haunt: no ghosts available");
          return;
        }

        // Reduce sanity by 5 (Requirement 4.5)
        const newSanity = Math.max(0, state.stats.sanity - 5);

        // Update state with new sanity and lastHauntGameDay
        set({
          stats: {
            ...state.stats,
            sanity: newSanity,
          },
          lastHauntGameDay: state.gameDay,
        });

        // Play haunt sound (Requirement 4.6)
        get().playSound("haunt", {
          petName: state.traits.name,
          stage: state.stage,
          archetype: state.traits.archetype,
          sanity: newSanity,
          corruption: state.stats.corruption,
        });

        // Generate haunt narrative (Requirement 4.4)
        try {
          const { generateHauntNarrative, buildNarrativeContext } = await import("./utils/narrativeGenerator");
          
          // Build memory context (Requirements 5.1, 5.2, 5.3, 5.4)
          const memoryContext = buildNarrativeContext(
            state.logs,
            { sanity: newSanity, corruption: state.stats.corruption },
            { sanity: state.stats.sanity, corruption: state.stats.corruption }
          );
          
          // Add placeholder log immediately
          // Requirement 4.6: Set autoGenerateImage for haunt events
          const placeholderText = `${state.traits.name} senses a familiar presence...`;
          const logId = get().addLog(placeholderText, "SYSTEM", true, "haunt");

          // Generate AI narrative async
          const aiNarrative = await generateHauntNarrative({
            petName: state.traits.name,
            archetype: state.traits.archetype,
            stage: state.stage,
            sanity: newSanity,
            corruption: state.stats.corruption,
            ghostName: ghost.petName,
            ghostArchetype: ghost.archetype,
            ghostStage: ghost.stage,
            ghostDeathCause: ghost.deathCause,
          }, undefined, memoryContext);

          // Update log with AI-generated text
          get().updateLogText(logId, aiNarrative);
        } catch (error) {
          logWarning("Failed to generate haunt narrative", {
            error: error instanceof Error ? error.message : "Unknown",
            ghostName: ghost.petName,
          });
        }

        logInfo("Haunt event triggered", {
          ghostName: ghost.petName,
          ghostArchetype: ghost.archetype,
          sanityReduction: 5,
          newSanity,
          gameDay: state.gameDay,
        });
      },

      // ============================================
      // Reaction System Actions (Requirements 1.2, 1.5, 3.1)
      // ============================================

      /**
       * Add a reaction to a narrative log entry.
       * - Validate log exists
       * - Check if log already has a reaction
       * - Apply stat delta with clamping (0-100)
       * - Store reaction data in log
       * 
       * Requirements: 1.2, 1.5, 10.1, 10.4, 10.5
       */
      addReaction: async (logId: string, reactionType: import("./utils/types").ReactionType) => {
        try {
          const state = get();

          // Find the log entry (Requirement 10.5)
          const log = state.logs.find(l => l.id === logId);
          if (!log) {
            logWarning("Cannot add reaction: log not found", { logId });
            return;
          }

          // Check if log already has a reaction (prevent duplicates)
          // Check both in-memory and persisted reactions
          const hasPersistedReaction = log.reactions && log.reactions.length > 0;
          const hasInMemoryReaction = inMemoryReactions.has(logId);
          
          if (hasPersistedReaction || hasInMemoryReaction) {
            logWarning("Cannot add reaction: log already has a reaction", { logId });
            return;
          }

          // Import stat deltas
          const { REACTION_STAT_DELTAS } = await import("./utils/types");
          const statDelta = REACTION_STAT_DELTAS[reactionType];

          // Apply stat changes with clamping (0-100) (Requirement 1.5)
          const newStats = { ...state.stats };
          
          if (statDelta.sanity !== undefined) {
            newStats.sanity = Math.max(0, Math.min(100, newStats.sanity + statDelta.sanity));
          }
          
          if (statDelta.corruption !== undefined) {
            newStats.corruption = Math.max(0, Math.min(100, newStats.corruption + statDelta.corruption));
          }
          
          if (statDelta.hunger !== undefined) {
            newStats.hunger = Math.max(0, Math.min(100, newStats.hunger + statDelta.hunger));
          }

          // Create reaction data (Requirement 1.2)
          const reactionData: import("./utils/types").ReactionData = {
            reactionType,
            timestamp: Date.now(),
            statDelta,
          };

          // Try to update log with reaction data and stats
          try {
            set({
              stats: newStats,
              logs: state.logs.map(l =>
                l.id === logId
                  ? { ...l, reactions: [reactionData] }
                  : l
              ),
            });

            logInfo("Reaction added", {
              logId,
              reactionType,
              statDelta,
            });
          } catch (storageError) {
            // Requirement 10.4: Fallback to in-memory storage if localStorage fails
            logWarning("localStorage unavailable, using in-memory storage for reaction", {
              logId,
              reactionType,
              error: storageError instanceof Error ? storageError.message : "Unknown",
            });
            
            // Store reaction in memory
            inMemoryReactions.set(logId, [reactionData]);
            
            // Still update stats in the store (stats are more critical than reaction history)
            set({ stats: newStats });
            
            logInfo("Reaction stored in memory", {
              logId,
              reactionType,
              statDelta,
            });
          }
        } catch (error) {
          // Requirement 10.1: Log error and continue without crashing
          logError(
            "Failed to add reaction",
            error instanceof Error ? error : new Error(String(error)),
            { logId, reactionType }
          );
          // Game continues without applying the reaction
        }
      },

      /**
       * Get reaction history (last 10 reactions).
       * Returns array of ReactionData from most recent logs.
       * 
       * Requirements: 3.1, 10.3, 10.4
       */
      getReactionHistory: (): import("./utils/types").ReactionData[] => {
        try {
          const state = get();
          
          // Collect all reactions from logs (persisted)
          const allReactions: import("./utils/types").ReactionData[] = [];
          
          for (const log of state.logs) {
            if (log.reactions && log.reactions.length > 0) {
              allReactions.push(...log.reactions);
            }
          }
          
          // Also collect reactions from in-memory storage (Requirement 10.4)
          for (const reactions of inMemoryReactions.values()) {
            allReactions.push(...reactions);
          }
          
          // Sort by timestamp (most recent first) and take last 10
          const sortedReactions = allReactions.sort((a, b) => b.timestamp - a.timestamp);
          return sortedReactions.slice(0, 10);
        } catch (error) {
          // Requirement 10.3: Graceful degradation - return empty array on failure
          logError(
            "Failed to retrieve reaction history",
            error instanceof Error ? error : new Error(String(error))
          );
          return []; // Return empty array so narrative generation continues without tone influence
        }
      },

      // ============================================
      // Dialogue Choice System Actions (Requirements 6.3, 6.4, 6.7)
      // ============================================

      /**
       * Select a dialogue choice and apply its effects.
       * - Store choice in log entry
       * - Apply stat deltas with clamping (0-100)
       * - Trigger follow-up narrative generation
       * 
       * Requirements: 6.3, 6.4, 6.7
       */
      selectDialogueChoice: async (logId: string, choiceId: string, statDelta: import("./utils/types").StatDelta) => {
        try {
          const state = get();

          // Find the log entry (Requirement 6.7)
          const log = state.logs.find(l => l.id === logId);
          if (!log) {
            logWarning("Cannot select dialogue choice: log not found", { logId });
            return;
          }

          // Check if log already has a dialogue choice selected
          if (log.dialogueChoice?.selectedChoiceId) {
            logWarning("Cannot select dialogue choice: choice already selected", { logId });
            return;
          }

          // Apply stat changes with clamping (0-100) (Requirement 6.4)
          const newStats = { ...state.stats };
          
          if (statDelta.sanity !== undefined) {
            newStats.sanity = Math.max(0, Math.min(100, newStats.sanity + statDelta.sanity));
          }
          
          if (statDelta.corruption !== undefined) {
            newStats.corruption = Math.max(0, Math.min(100, newStats.corruption + statDelta.corruption));
          }
          
          if (statDelta.hunger !== undefined) {
            newStats.hunger = Math.max(0, Math.min(100, newStats.hunger + statDelta.hunger));
          }

          // Update log with selected choice (Requirement 6.3)
          set({
            stats: newStats,
            logs: state.logs.map(l =>
              l.id === logId && l.dialogueChoice
                ? {
                    ...l,
                    dialogueChoice: {
                      ...l.dialogueChoice,
                      selectedChoiceId: choiceId,
                    },
                  }
                : l
            ),
          });

          logInfo("Dialogue choice selected", {
            logId,
            choiceId,
            statDelta,
          });

          // Trigger follow-up narrative generation (Requirement 6.7)
          // Import narrative generator dynamically
          const { buildNarrativeContext, formatNarrativeContextString } = await import("./utils/narrativeGenerator");
          
          // Build memory context
          const memoryContext = buildNarrativeContext(
            state.logs,
            { sanity: newStats.sanity, corruption: newStats.corruption },
            { sanity: state.stats.sanity, corruption: state.stats.corruption }
          );

          // Find the selected choice to get its text
          const selectedChoice = log.dialogueChoice?.choices.find(c => c.id === choiceId);
          if (!selectedChoice) {
            logWarning("Selected choice not found in dialogue choices", { choiceId });
            return;
          }

          // Add placeholder log for follow-up narrative
          const placeholderText = `${state.traits.name} responds to your choice...`;
          const followUpLogId = get().addLog(placeholderText, "PET", true);

          // Generate follow-up narrative based on the choice
          try {
            const memoryContextString = formatNarrativeContextString(memoryContext);
            const prompt = `The player chose to respond: "${selectedChoice.text}" (${selectedChoice.emotionalTone} tone)

${state.traits.name} the ${state.stage.toLowerCase()} ${state.traits.archetype.toLowerCase()} creature reacts to this response. Current sanity: ${newStats.sanity}%, corruption: ${newStats.corruption}%.

${memoryContextString ? `Context:\n${memoryContextString}` : ""}

Generate 1-2 sentences describing how ${state.traits.name} responds to the player's choice. Match the emotional tone of the interaction.`;

            const response = await fetch("/api/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                prompt,
                temperature: 0.8,
                maxTokens: 100,
              }),
            });

            if (!response.ok) {
              throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.text && data.text.trim()) {
              get().updateLogText(followUpLogId, data.text.trim());
            } else {
              throw new Error("Empty response from AI");
            }
          } catch (error) {
            logWarning("Failed to generate follow-up narrative", {
              error: error instanceof Error ? error.message : "Unknown",
            });
            // Use fallback text
            get().updateLogText(followUpLogId, `${state.traits.name} acknowledges your response with a subtle shift in demeanor.`);
          }
        } catch (error) {
          logError(
            "Failed to select dialogue choice",
            error instanceof Error ? error : new Error(String(error)),
            { logId, choiceId }
          );
        }
      },

      // ============================================
      // Gallery System Actions (Requirements 1.1, 2.2)
      // ============================================

      /**
       * Get all completed images from narrative logs.
       * Returns logs with imageStatus === "completed" and imageUrl !== null.
       * 
       * Requirement 1.1: Display all narrative log images with completed status
       */
      getCompletedImages: (): import("./utils/types").NarrativeLog[] => {
        const state = get();
        return state.logs.filter(
          log => log.imageStatus === "completed" && log.imageUrl !== null && log.imageUrl !== undefined
        );
      },

      /**
       * Get images filtered by event type.
       * Returns logs matching the specified event type with completed images.
       * 
       * Requirement 2.2: Filter images by event type
       */
      getImagesByEventType: (eventType: import("./utils/types").EventType): import("./utils/types").NarrativeLog[] => {
        const state = get();
        return state.logs.filter(
          log => 
            log.imageStatus === "completed" && 
            log.imageUrl !== null && 
            log.imageUrl !== undefined &&
            log.eventType === eventType
        );
      },

      /**
       * Set gallery open state.
       * 
       * Requirement 1.1: Gallery state management
       */
      setGalleryOpen: (isOpen: boolean) => {
        set({ galleryOpen: isOpen });
      },

      /**
       * Set gallery filter.
       * 
       * Requirement 2.2: Gallery filter state management
       */
      setGalleryFilter: (filter: import("./utils/types").GalleryFilter) => {
        set({ galleryFilter: filter });
      },

      /**
       * Set gallery view mode (grid or timeline).
       * 
       * Requirement 3.1: Gallery view mode state management
       */
      setGalleryViewMode: (viewMode: import("./utils/types").GalleryViewMode) => {
        set({ galleryViewMode: viewMode });
      },

      // ============================================
      // Visual Traits System Actions (Requirements 8.4, 8.5)
      // ============================================

      /**
       * Store visual traits for character consistency.
       * Implements LRU cache (last 10 traits) in separate localStorage key.
       * 
       * Requirements: 8.4, 8.5, 15.4
       * Error Handling: Fails gracefully, allowing image generation to continue without traits
       */
      storeVisualTraits: (logId: string, traits: import("./utils/types").VisualTraits) => {
        try {
          const STORAGE_KEY = "creepy-companion-visual-traits";
          const MAX_TRAITS = 10;

          // Get existing traits from localStorage
          let traitsCache: Array<{ logId: string; traits: import("./utils/types").VisualTraits; timestamp: number }> = [];
          
          try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
              traitsCache = JSON.parse(stored);
            }
          } catch (parseError) {
            // Requirement 15.4: Handle corrupted cache gracefully
            logWarning("Failed to parse visual traits cache, starting fresh", {
              error: parseError instanceof Error ? parseError.message : "Unknown",
            });
            traitsCache = [];
          }

          // Add new traits to cache
          traitsCache.push({
            logId,
            traits,
            timestamp: Date.now(),
          });

          // Implement LRU: Keep only last 10 traits (Requirement 8.4)
          if (traitsCache.length > MAX_TRAITS) {
            traitsCache = traitsCache.slice(-MAX_TRAITS);
          }

          // Save back to localStorage
          localStorage.setItem(STORAGE_KEY, JSON.stringify(traitsCache));

          // Update current visual traits in store (Requirement 8.5)
          set({ currentVisualTraits: traits });

          logInfo("Visual traits stored", {
            logId,
            cacheSize: traitsCache.length,
            archetype: traits.archetype,
            stage: traits.stage,
          });
        } catch (error) {
          // Requirement 15.4: Graceful degradation on storage failure
          // Image generation continues without consistency features
          logError(
            "Failed to store visual traits",
            error instanceof Error ? error : new Error(String(error)),
            { logId }
          );
          // Don't throw - allow the game to continue
        }
      },

      /**
       * Get the most recent visual traits for character consistency.
       * Returns null if no traits are available or on error.
       * 
       * Requirements: 8.4, 8.5, 15.4
       * Error Handling: Returns null on any failure, allowing image generation to continue
       */
      getVisualTraits: (): import("./utils/types").VisualTraits | null => {
        try {
          const STORAGE_KEY = "creepy-companion-visual-traits";

          // Try to get from current state first
          const state = get();
          if (state.currentVisualTraits) {
            return state.currentVisualTraits;
          }

          // Fall back to localStorage
          const stored = localStorage.getItem(STORAGE_KEY);
          if (!stored) {
            // No traits stored yet - this is normal for first image generation
            return null;
          }

          const traitsCache: Array<{ logId: string; traits: import("./utils/types").VisualTraits; timestamp: number }> = JSON.parse(stored);
          
          if (traitsCache.length === 0) {
            return null;
          }

          // Return most recent traits (last in array)
          const mostRecent = traitsCache[traitsCache.length - 1];
          
          // Update current visual traits in store
          set({ currentVisualTraits: mostRecent.traits });
          
          return mostRecent.traits;
        } catch (error) {
          // Requirement 15.4: Graceful degradation on retrieval failure
          // Return null so image generation continues without consistency features
          logError(
            "Failed to retrieve visual traits",
            error instanceof Error ? error : new Error(String(error))
          );
          return null;
        }
      },

      // ============================================
      // Story Summary System Actions (Requirements 7.1, 14.4)
      // ============================================

      /**
       * Generate a story summary of the pet's life.
       * Calls the storySummary API and caches the result for 5 minutes.
       * Compresses summary before localStorage to save space.
       * 
       * Requirements: 7.1, 14.4
       * Performance: Compression before localStorage (Requirement 14.4)
       */
      generateStorySummary: async (): Promise<import("./utils/types").StorySummary | null> => {
        try {
          const state = get();

          // Check cache first (Requirement 14.4: Cache for 5 minutes)
          const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
          if (state.cachedSummary && state.summaryCacheTime) {
            const cacheAge = Date.now() - state.summaryCacheTime;
            if (cacheAge < CACHE_DURATION) {
              logInfo("Returning cached story summary", {
                cacheAge: Math.floor(cacheAge / 1000),
              });
              // Decompress summary text before returning
              return {
                ...state.cachedSummary,
                summaryText: decompressSummaryText(state.cachedSummary.summaryText),
              };
            }
          }

          // Call storySummary API (Requirement 7.1)
          const response = await fetch("/api/storySummary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              logs: state.logs,
              petName: state.traits.name,
              finalStats: state.stats,
              totalAge: state.age,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `API error: ${response.status}`);
          }

          const result = await response.json();

          // Create StorySummary object with compressed text (Requirement 14.4)
          const summary: import("./utils/types").StorySummary = {
            petName: state.traits.name,
            summaryText: compressSummaryText(result.summaryText),
            generatedAt: Date.now(),
            keyEvents: result.keyEvents,
            finalStats: { ...state.stats },
            totalAge: state.age,
          };

          // Cache the result (Requirement 14.4)
          set({
            cachedSummary: summary,
            summaryCacheTime: Date.now(),
          });

          logInfo("Story summary generated", {
            petName: state.traits.name,
            keyEventsCount: result.keyEvents.length,
          });

          // Return decompressed version to caller
          return {
            ...summary,
            summaryText: decompressSummaryText(summary.summaryText),
          };
        } catch (error) {
          // Requirement 15.3: Fallback summary using log entry text
          logError(
            "Failed to generate story summary",
            error instanceof Error ? error : new Error(String(error))
          );

          const state = get();

          // Create fallback summary from log entries
          const keyLogs = state.logs
            .filter(log => log.eventType && ["evolution", "death", "placate", "haunt", "insanity", "vomit"].includes(log.eventType))
            .slice(-10); // Last 10 key events

          const fallbackText = `${state.traits.name}'s journey was marked by ${keyLogs.length} significant moments. ${
            keyLogs.length > 0
              ? `The story began with ${keyLogs[0].text} and continued through various trials and transformations.`
              : "Their time was brief but memorable."
          } Final state: Sanity ${state.stats.sanity}%, Corruption ${state.stats.corruption}%, Age ${Math.floor(state.age / 60)}h ${state.age % 60}m.`;

          const fallbackSummary: import("./utils/types").StorySummary = {
            petName: state.traits.name,
            summaryText: compressSummaryText(fallbackText),
            generatedAt: Date.now(),
            keyEvents: keyLogs.map(log => log.text),
            finalStats: { ...state.stats },
            totalAge: state.age,
          };

          // Cache fallback summary too
          set({
            cachedSummary: fallbackSummary,
            summaryCacheTime: Date.now(),
          });

          // Return decompressed version to caller
          return {
            ...fallbackSummary,
            summaryText: decompressSummaryText(fallbackSummary.summaryText),
          };
        }
      },
    }),
    {
      name: "creepy-companion-storage",
      // Persist both game state and audio state (Requirement 4.1)
      partialize: (state) => ({
        // Game state
        isInitialized: state.isInitialized,
        traits: state.traits,
        stats: state.stats,
        stage: state.stage,
        age: state.age,
        isAlive: state.isAlive,
        inventory: state.inventory,
        dailyFeeds: state.dailyFeeds,
        gameDay: state.gameDay,
        logs: state.logs, // Includes reaction data (Requirement 6.1, 6.2)
        lastTickTime: state.lastTickTime,
        // Pet sprite state (for image generation continuity)
        currentPetSpriteUrl: state.currentPetSpriteUrl,
        // Audio state (Requirement 4.1: Persist audio preferences)
        masterVolume: state.masterVolume,
        sfxVolume: state.sfxVolume,
        ambientVolume: state.ambientVolume,
        isMuted: state.isMuted,
        // Settings state
        gameSpeed: state.gameSpeed,
        crtEnabled: state.crtEnabled,
        reduceMotion: state.reduceMotion,
        retroMode: state.retroMode,
        theme: state.theme,
        // Death system state (Requirements 11.1, 11.3)
        deathData: state.deathData,
        lastPlacateTime: state.lastPlacateTime,
        lastHauntGameDay: state.lastHauntGameDay,
        // Auto-image generation flag (Requirement 8.2)
        autoGenerateImages: state.autoGenerateImages,
        // Note: hasUserInteracted is NOT persisted - must be re-established each session
      }),
      // Custom storage with error handling
      storage: {
        getItem: (name: string) => {
          try {
            const str = localStorage.getItem(name);
            if (!str) return null;

            const parsed = JSON.parse(str);
            return parsed;
          } catch (error) {
            logError(
              "Failed to parse stored state",
              error instanceof Error ? error : undefined,
              { storageName: name }
            );
            // Clear corrupted state
            localStorage.removeItem(name);
            return null;
          }
        },
        setItem: (name: string, value: any) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
          } catch (error) {
            logError(
              "Failed to save state",
              error instanceof Error ? error : undefined,
              { storageName: name }
            );
            // Handle quota exceeded by clearing old logs
            if (error instanceof Error && error.name === "QuotaExceededError") {
              logWarning("localStorage quota exceeded, trimming logs", {
                storageName: name,
              });
              try {
                const state = value.state;
                if (state && state.logs && state.logs.length > 50) {
                  // Keep only last 50 logs
                  const trimmedState = {
                    ...value,
                    state: {
                      ...state,
                      logs: state.logs.slice(-50),
                    },
                  };
                  localStorage.setItem(name, JSON.stringify(trimmedState));
                }
              } catch (retryError) {
                logCritical(
                  "Failed to save state even after trimming",
                  retryError instanceof Error ? retryError : undefined,
                  { storageName: name }
                );
              }
            }
          }
        },
        removeItem: (name: string) => {
          try {
            localStorage.removeItem(name);
          } catch (error) {
            logError(
              "Failed to remove state",
              error instanceof Error ? error : undefined,
              { storageName: name }
            );
          }
        },
      },
      // Apply offline decay and restore audio settings when state is restored
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            logCritical(
              "Failed to rehydrate state",
              error instanceof Error ? error : new Error(String(error))
            );
            return;
          }

          if (state) {
            // Restore audio settings to sound manager (Requirement 4.2)
            soundManager.setMasterVolume(state.masterVolume ?? initialAudioState.masterVolume);
            soundManager.setSfxVolume(state.sfxVolume ?? initialAudioState.sfxVolume);
            soundManager.setAmbientVolume(state.ambientVolume ?? initialAudioState.ambientVolume);
            soundManager.setMuted(state.isMuted ?? initialAudioState.isMuted);
            
            logInfo('Audio settings restored', {
              masterVolume: state.masterVolume,
              sfxVolume: state.sfxVolume,
              ambientVolume: state.ambientVolume,
              isMuted: state.isMuted,
            });
            
            // Detect mobile viewport and set autoGenerateImages flag (Requirement 8.2)
            const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
            useGameStore.setState({ autoGenerateImages: !isMobile });
            
            logInfo('Mobile detection', {
              isMobile,
              autoGenerateImages: !isMobile,
            });
          }

          if (state && state.isInitialized && state.isAlive) {
            const now = Date.now();
            const lastTick = state.lastTickTime || now;
            const elapsedRealMs = now - lastTick;
            const elapsedRealSeconds = Math.floor(elapsedRealMs / 1000);

            // Only apply offline decay if more than 1 second has passed
            if (elapsedRealSeconds > 0) {
              const decayedState = calculateOfflineDecay(
                state,
                elapsedRealSeconds
              );

              // Update the store with decayed state
              useGameStore.setState(decayedState);

              // Add a log about the offline period
              if (elapsedRealSeconds >= 60) {
                const minutesOffline = Math.floor(elapsedRealSeconds / 60);
                state.addLog(
                  `You were away for ${minutesOffline} minute${
                    minutesOffline !== 1 ? "s" : ""
                  }. ${state.traits.name} has been waiting...`,
                  "SYSTEM"
                );
              }
            }
          }
        };
      },
    }
  )
);
