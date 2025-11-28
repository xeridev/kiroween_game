import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GameState, Archetype, LogSource } from "./utils/types";
import { logError, logWarning, logCritical } from "./utils/errorLogger";

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
        let evolutionLog: string | null = null;

        // Corruption-based evolution (highest priority)
        if (state.stats.corruption > 80 && state.stage !== "ABOMINATION") {
          newStage = "ABOMINATION";
          evolutionLog = `The corruption consumes ${state.traits.name}. It has become an ABOMINATION.`;
        }
        // Age-based evolution
        else if (state.stage === "EGG" && newAge >= 5) {
          newStage = "BABY";
          evolutionLog = `${state.traits.name} hatches from its egg. A BABY emerges.`;
        } else if (state.stage === "BABY" && newAge >= 24 * 60) {
          // 24 hours = 1440 minutes
          newStage = "TEEN";
          evolutionLog = `${state.traits.name} has matured into a TEEN.`;
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

        // Add evolution log if evolution occurred
        if (evolutionLog) {
          get().addLog(evolutionLog, "SYSTEM");
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
      },

      feed: (itemId: string) => {
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
        let narrativeText = "";

        if (offering.type === "PURITY") {
          newHunger = Math.max(0, state.stats.hunger - 20);
          newSanity = Math.min(100, state.stats.sanity + 10);
          newCorruption = Math.max(0, state.stats.corruption - 5);
          narrativeText = `${state.traits.name} purrs softly as it consumes the offering. A gentle warmth fills the air.`;
        } else {
          // ROT
          newHunger = Math.max(0, state.stats.hunger - 20);
          newSanity = Math.max(0, state.stats.sanity - 15);
          newCorruption = Math.min(100, state.stats.corruption + 10);
          narrativeText = `${state.traits.name} glitches violently as it devours the offering. Something writhes beneath its surface.`;
        }

        // Remove offering from inventory
        const newInventory = state.inventory.filter(
          (item) => item.id !== itemId
        );

        // Increment dailyFeeds counter
        const newDailyFeeds = state.dailyFeeds + 1;

        // Check for vomit event (more than 3 feeds)
        if (newDailyFeeds > 3) {
          newSanity = Math.max(0, newSanity - 20);
          narrativeText = `${state.traits.name} convulses and vomits. It has eaten too much today.`;
        }

        // Update state
        set({
          stats: {
            hunger: newHunger,
            sanity: newSanity,
            corruption: newCorruption,
          },
          inventory: newInventory,
          dailyFeeds: newDailyFeeds,
        });

        // Add narrative log
        get().addLog(narrativeText, "PET");
      },

      addLog: (text: string, source: LogSource) => {
        const state = get();
        const newLog = {
          id: crypto.randomUUID(),
          text,
          source,
          timestamp: state.age,
        };

        set({
          logs: [...state.logs, newLog],
        });
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: "creepy-companion-storage",
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
      // Apply offline decay when state is restored
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            logCritical(
              "Failed to rehydrate state",
              error instanceof Error ? error : new Error(String(error))
            );
            return;
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
