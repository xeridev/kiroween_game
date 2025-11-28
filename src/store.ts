import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GameState, Archetype, LogSource, AudioState, SoundContext, Offering, Theme, ImageStatus } from "./utils/types";
import { logError, logWarning, logCritical, logInfo } from "./utils/errorLogger";
import { soundManager } from "./utils/soundManager";

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

// Helper function to calculate offline decay
const calculateOfflineDecay = (state: any, elapsedRealSeconds: number) => {
  if (!state.isInitialized || !state.isAlive) {
    return state;
  }

  // 1 real second = 1 game minute
  const gameMinutesElapsed = elapsedRealSeconds;

  // Apply decay: hunger increases by 0.05 per minute, sanity decreases by 0.02 per minute
  const newHunger = Math.min(
    100,
    state.stats.hunger + gameMinutesElapsed * 0.05
  );
  const newSanity = Math.max(0, state.stats.sanity - gameMinutesElapsed * 0.02);
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

        // Update log status to generating
        set({
          logs: state.logs.map(l =>
            l.id === logId
              ? { ...l, imageStatus: "generating" as ImageStatus }
              : l
          ),
        });

        try {
          // Gather source images
          const sourceImages: string[] = [];

          // PRIMARY: Current pet sprite (required)
          if (state.currentPetSpriteUrl) {
            sourceImages.push(state.currentPetSpriteUrl);
          } else {
            // No pet sprite available - fail gracefully
            logWarning("No pet sprite available for image generation");
            set({
              logs: get().logs.map(l =>
                l.id === logId
                  ? { ...l, imageStatus: "failed" as ImageStatus }
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

          // Call the API
          const response = await fetch("/api/generateImage", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              narrativeText: log.text,
              petName: state.traits.name,
              archetype: state.traits.archetype,
              stage: state.stage,
              sourceImages,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `API error: ${response.status}`);
          }

          const result = await response.json();

          // Update log with generated image
          set({
            logs: get().logs.map(l =>
              l.id === logId
                ? {
                    ...l,
                    imageUrl: result.imageUrl,
                    imageStatus: "completed" as ImageStatus,
                    sourceImages,
                  }
                : l
            ),
          });

          logInfo("Image generated for log", { logId });
        } catch (error) {
          logError(
            "Failed to generate log image",
            error instanceof Error ? error : new Error(String(error)),
            { logId }
          );

          // Update log status to failed
          set({
            logs: get().logs.map(l =>
              l.id === logId
                ? { ...l, imageStatus: "failed" as ImageStatus }
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

        // Apply decay: hunger increases, sanity decreases
        const newHunger = Math.min(100, state.stats.hunger + 0.05);
        const newSanity = Math.max(0, state.stats.sanity - 0.02);

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
          import("./utils/narrativeGenerator").then(async ({ generateEvolutionNarrative, getPlaceholderText }) => {
            const eventType = fromStage === "EGG" ? "hatch" : "evolution";
            const placeholderText = getPlaceholderText(eventType, state.traits.name);
            const logId = get().addLog(placeholderText, "SYSTEM", true);

            // Log evolution for debugging
            logInfo("Evolution detected", { from: fromStage, to: newStage });

            try {
              const aiNarrative = await generateEvolutionNarrative({
                petName: state.traits.name,
                stage: newStage,
                archetype: state.traits.archetype,
                sanity: newSanity,
                corruption: state.stats.corruption,
                fromStage,
                toStage: newStage,
              });
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
        });

        // Import narrative generator
        const { generateFeedingNarrative, getPlaceholderText } = await import("./utils/narrativeGenerator");

        // Add placeholder log immediately with pending state
        const eventType = isOverfed ? "overfeed" : "feed";
        const placeholderText = getPlaceholderText(eventType, state.traits.name);
        const logId = get().addLog(placeholderText, "PET", true);

        // Requirement 5.1: Play sound with feeding context
        get().playSound("feed", {
          itemType: offering.type,
          narrativeText: placeholderText,
        });

        // Generate AI narrative async
        try {
          const aiNarrative = await generateFeedingNarrative({
            petName: state.traits.name,
            stage: state.stage,
            archetype: state.traits.archetype,
            sanity: newSanity,
            corruption: newCorruption,
            itemName: offering.description,
            itemType: offering.type,
            isOverfed,
          });

          // Update log with AI-generated text
          get().updateLogText(logId, aiNarrative);
        } catch (error) {
          // Fallback already handled in narrativeGenerator
          logWarning("Failed to generate feeding narrative", {
            error: error instanceof Error ? error.message : "Unknown",
          });
        }
      },

      reorderInventory: (newInventory: Offering[]) => {
        // Update inventory order and persist to localStorage
        set({ inventory: newInventory });
      },

      addLog: (text: string, source: LogSource, isPending?: boolean) => {
        const state = get();
        const logId = crypto.randomUUID();
        const newLog = {
          id: logId,
          text,
          source,
          timestamp: state.age,
          isPending: isPending ?? false,
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
        logs: state.logs,
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
