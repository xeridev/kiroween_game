import { useEffect, useRef, useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type Announcements,
  type Modifier,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useGameStore } from "../store";
import { ThemeProvider } from "../contexts/ThemeContext";
import CreationScreen from "./CreationScreen";
import { GameCanvas, type GameCanvasHandle } from "./GameCanvas";
import { InventoryPanel } from "./InventoryPanel";
import { StatsPanel } from "./StatsPanel";
import { NarrativeLog } from "./NarrativeLog";
import { DebugPanel } from "./DebugPanel";
import { AudioControls } from "./AudioControls";
import { SettingsPanel } from "./SettingsPanel";
import { BackgroundLayer } from "./BackgroundLayer";
import { ActionDock } from "./ActionDock";
import { GameLoop } from "../utils/gameLoop";
import { ErrorBoundary } from "./ErrorBoundary";
import { soundManager } from "../utils/soundManager";
import { logInfo, logError } from "../utils/errorLogger";
import { reorderInventory } from "../utils/inventoryUtils";
import { isMobileViewport } from "../utils/animationUtils";
import type { Archetype, SoundCatalog, PetStage, Offering } from "../utils/types";
import "./App.css";

/**
 * Touch offset modifier for DragOverlay
 * Positions the overlay above the finger for better visibility on touch devices
 * 
 * Requirement 7.5: Position overlay for finger visibility
 */
const touchOffsetModifier: Modifier = ({ transform, activatorEvent }) => {
  // Only apply offset for touch events on mobile viewports
  if (activatorEvent instanceof TouchEvent && isMobileViewport()) {
    return {
      ...transform,
      // Offset the overlay 60px above the touch point for finger visibility
      y: transform.y - 60,
    };
  }
  return transform;
};

// Helper function to get initial ambient based on stage and sanity
function getInitialAmbient(stage: PetStage, sanity: number): string {
  // If sanity is below 30, use horror ambient (Requirement 5.4)
  if (sanity < 30) {
    return "ambient_creepy_ambience_3";
  }
  
  // Otherwise, use stage-appropriate ambient
  const stageAmbientMap: Record<PetStage, string> = {
    EGG: "ambient_suburban_neighborhood_morning",
    BABY: "ambient_rain_medium_2",
    TEEN: "ambient_creepy_ambience_3",
    ABOMINATION: "ambient_drone_doom",
  };
  return stageAmbientMap[stage];
}

function AppContent() {
  const gameLoopRef = useRef<GameLoop | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const gameCanvasRef = useRef<GameCanvasHandle | null>(null);
  const [debugPanelOpen, setDebugPanelOpen] = useState(false);
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [isScavenging, setIsScavenging] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);
  
  // Drag-and-drop state (lifted from InventoryPanel for cross-component drag)
  const [activeId, setActiveId] = useState<string | null>(null);
  const [feedSuccess, setFeedSuccess] = useState(false);
  
  // Evolution flash effect state (Requirement 5.4)
  const [evolutionFlash, setEvolutionFlash] = useState(false);
  const previousStageRef = useRef<PetStage | null>(null);

  const isInitialized = useGameStore((state) => state.isInitialized);
  const initializePet = useGameStore((state) => state.initializePet);
  const traits = useGameStore((state) => state.traits);
  const stage = useGameStore((state) => state.stage);
  const stats = useGameStore((state) => state.stats);
  const age = useGameStore((state) => state.age);
  const logs = useGameStore((state) => state.logs);
  const gameDay = useGameStore((state) => state.gameDay);
  const dailyFeeds = useGameStore((state) => state.dailyFeeds);
  const inventory = useGameStore((state) => state.inventory);
  const scavenge = useGameStore((state) => state.scavenge);
  const feed = useGameStore((state) => state.feed);
  const storeReorderInventory = useGameStore((state) => state.reorderInventory);
  const hasUserInteracted = useGameStore((state) => state.hasUserInteracted);
  const setUserInteracted = useGameStore((state) => state.setUserInteracted);
  const gameSpeed = useGameStore((state) => state.gameSpeed);
  const crtEnabled = useGameStore((state) => state.crtEnabled);
  const reduceMotion = useGameStore((state) => state.reduceMotion);
  const retroMode = useGameStore((state) => state.retroMode);
  const theme = useGameStore((state) => state.theme);
  const updatePetSprite = useGameStore((state) => state.updatePetSprite);
  
  // Get the currently dragged item for DragOverlay
  const activeItem: Offering | undefined = activeId 
    ? inventory.find(item => item.id === activeId) 
    : undefined;

  // Scavenge wrapper with loading state
  const handleScavenge = async () => {
    setIsScavenging(true);
    try {
      await scavenge();
    } finally {
      setIsScavenging(false);
    }
  };

  // Get item description for ARIA announcements (Requirement 6.3)
  const getItemDescription = useCallback((id: string) => {
    const item = inventory.find(i => i.id === id);
    return item ? `Mystery Item: ${item.description.slice(0, 50)}` : 'Unknown item';
  }, [inventory]);

  // ARIA announcements for screen readers (Requirement 6.3, 6.5)
  const announcements: Announcements = {
    onDragStart({ active }) {
      return `Picked up ${getItemDescription(active.id as string)}. Drag to another slot to reorder, or drag to your pet to feed. Use arrow keys to move, Enter to drop, Escape to cancel.`;
    },
    onDragOver({ active, over }) {
      if (over) {
        if (over.id === 'game-canvas') {
          return `${getItemDescription(active.id as string)} is over your pet. Release to feed.`;
        }
        const overIndex = inventory.findIndex(i => i.id === over.id);
        if (overIndex !== -1) {
          return `${getItemDescription(active.id as string)} is over position ${overIndex + 1}.`;
        }
      }
      return undefined;
    },
    onDragEnd({ active, over }) {
      if (over) {
        if (over.id === 'game-canvas') {
          return `Fed ${getItemDescription(active.id as string)} to your pet.`;
        }
        if (active.id !== over.id) {
          const fromIndex = inventory.findIndex(i => i.id === active.id);
          const toIndex = inventory.findIndex(i => i.id === over.id);
          if (fromIndex !== -1 && toIndex !== -1) {
            return `Moved ${getItemDescription(active.id as string)} from position ${fromIndex + 1} to position ${toIndex + 1}.`;
          }
        }
      }
      return `${getItemDescription(active.id as string)} was dropped in its original position.`;
    },
    onDragCancel({ active }) {
      return `Dragging cancelled. ${getItemDescription(active.id as string)} returned to original position.`;
    },
  };

  // Configure sensors for different input methods
  // Requirement 7.1: TouchSensor with 200ms delay
  // Requirement 7.3: Quick taps trigger click-to-feed
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // 200ms hold to start drag
        tolerance: 5, // 5px movement tolerance during delay
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  // Handle drag end - supports both reordering and drag-to-feed (Requirements 1.3, 2.2, 2.3)
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);

    if (!over) {
      // Dropped outside valid zones - no change (Requirement 1.4)
      return;
    }

    // Handle drag-to-feed on GameCanvas (Requirement 2.2)
    if (over.id === 'game-canvas') {
      const itemId = active.id as string;
      feed(itemId);
      
      // Trigger visual feedback animation (Requirement 2.5)
      setFeedSuccess(true);
      setTimeout(() => setFeedSuccess(false), 500);
      
      logInfo('Drag-to-feed completed', { itemId });
      return;
    }

    // Handle reordering within inventory (Requirement 1.3)
    if (active.id !== over.id) {
      const oldIndex = inventory.findIndex(item => item.id === active.id);
      const newIndex = inventory.findIndex(item => item.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newInventory = reorderInventory(inventory, oldIndex, newIndex);
        storeReorderInventory(newInventory);
      }
    }
  }, [inventory, feed, storeReorderInventory]);

  // Handle first user interaction to unlock audio (Requirements 2.3, 2.4)
  const handleUserInteraction = useCallback(() => {
    if (!hasUserInteracted) {
      setUserInteracted();
      logInfo("User interaction detected, audio unlocked");
      
      // Set initial ambient after audio is unlocked
      if (isInitialized && audioInitialized) {
        const initialAmbient = getInitialAmbient(stage, stats.sanity);
        soundManager.setAmbient(initialAmbient);
        logInfo("Initial ambient set", { ambient: initialAmbient, stage, sanity: stats.sanity });
      }
    }
  }, [hasUserInteracted, setUserInteracted, isInitialized, audioInitialized, stage, stats.sanity]);

  // Initialize sound manager with catalog on mount
  useEffect(() => {
    const initAudio = async () => {
      try {
        const response = await fetch("/sounds-catalog.json");
        if (!response.ok) {
          throw new Error(`Failed to load sound catalog: ${response.status}`);
        }
        const catalog: SoundCatalog = await response.json();
        await soundManager.initialize(catalog);
        setAudioInitialized(true);
        logInfo("Sound manager initialized with catalog");
        
        // If user has already interacted (from previous session), set initial ambient
        if (hasUserInteracted && isInitialized) {
          const initialAmbient = getInitialAmbient(stage, stats.sanity);
          soundManager.setAmbient(initialAmbient);
          logInfo("Initial ambient set on load", { ambient: initialAmbient });
        }
      } catch (error) {
        logError(
          "Failed to initialize sound manager",
          error instanceof Error ? error : new Error(String(error))
        );
        // Game continues without audio (Requirement 7.3)
      }
    };

    initAudio();
  }, []); // Only run once on mount

  // Set up user interaction listeners for audio unlock
  useEffect(() => {
    if (hasUserInteracted) {
      return; // Already unlocked
    }

    const events = ["click", "touchstart", "keydown"];
    
    const handler = () => {
      handleUserInteraction();
      // Remove listeners after first interaction
      events.forEach((event) => {
        document.removeEventListener(event, handler);
      });
    };

    events.forEach((event) => {
      document.addEventListener(event, handler, { once: true });
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handler);
      });
    };
  }, [hasUserInteracted, handleUserInteraction]);

  // Initialize and cleanup game loop with game speed support
  useEffect(() => {
    // Only start the game loop if the pet is initialized
    if (isInitialized) {
      // Stop existing loop if speed changed
      if (gameLoopRef.current) {
        gameLoopRef.current.stop();
      }
      
      // Calculate tick interval based on game speed
      // Base: 1000ms = 1 game minute at 1x speed
      // At 2x speed: 500ms per tick, at 0.5x: 2000ms per tick
      const tickInterval = Math.round(1000 / gameSpeed);
      gameLoopRef.current = new GameLoop(tickInterval);
      gameLoopRef.current.start();
    }

    // Cleanup: stop the game loop when component unmounts
    return () => {
      if (gameLoopRef.current) {
        gameLoopRef.current.stop();
      }
    };
  }, [isInitialized, gameSpeed]);

  // Evolution flash effect - detect stage changes (Requirement 5.4)
  useEffect(() => {
    if (previousStageRef.current !== null && previousStageRef.current !== stage) {
      // Stage has changed - trigger evolution flash
      setEvolutionFlash(true);
      setTimeout(() => setEvolutionFlash(false), 800);
      logInfo('Evolution detected', { from: previousStageRef.current, to: stage });
    }
    previousStageRef.current = stage;
  }, [stage]);

  // Apply theme to document root on mount and when theme changes (Requirements 1.3, 6.4)
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Keyboard shortcuts (D key for debug, Z key for zen mode, Escape)
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // Toggle debug panel with 'D' key (not in input fields)
      if (
        event.key === "d" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !isTyping
      ) {
        setDebugPanelOpen((prev) => !prev);
      }

      // Toggle zen mode with 'Z' key (not in input fields)
      if (
        event.key === "z" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !isTyping
      ) {
        setZenMode((prev) => !prev);
      }

      // Toggle settings panel with 'S' key (not in input fields)
      if (
        event.key === "s" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !isTyping
      ) {
        setSettingsPanelOpen((prev) => !prev);
      }

      // Support Escape to close panels
      if (event.key === "Escape") {
        if (settingsPanelOpen) {
          setSettingsPanelOpen(false);
        } else if (debugPanelOpen) {
          setDebugPanelOpen(false);
        } else if (zenMode) {
          setZenMode(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [debugPanelOpen, zenMode]);

  // Debug functions exposed to window object (development only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      // @ts-ignore - Adding debug functions to window
      window.debugGame = {
        clearAllData: () => {
          localStorage.clear();
          window.location.reload();
          console.log("✅ All game data cleared. Page reloading...");
        },
        resetPet: () => {
          useGameStore.getState().reset();
          window.location.reload();
          console.log("✅ Pet reset. Page reloading...");
        },
        getState: () => {
          const state = useGameStore.getState();
          console.log("Current game state:", state);
          return state;
        },
        setStats: (newStats: any) => {
          const currentStats = useGameStore.getState().stats;
          useGameStore.setState({
            stats: { ...currentStats, ...newStats },
          });
          console.log("✅ Stats updated:", { ...currentStats, ...newStats });
        },
        setStage: (newStage: any) => {
          useGameStore.setState({ stage: newStage });
          console.log(`✅ Stage set to: ${newStage}`);
        },
        addAge: (minutes: number) => {
          const currentAge = useGameStore.getState().age;
          useGameStore.setState({ age: currentAge + minutes });
          console.log(`✅ Added ${minutes} minutes. New age: ${currentAge + minutes}`);
        },
        help: () => {
          console.log(`
🎮 Kiroween Game Debug Functions:

• Press 'D' key to toggle Debug Panel UI
• Press 'Escape' to close Debug Panel

• debugGame.clearAllData()
  Clear all localStorage data and reload

• debugGame.resetPet()
  Reset the pet to initial state and reload

• debugGame.getState()
  Get current game state

• debugGame.setStats({ hunger: 50, sanity: 80, corruption: 10 })
  Set specific stats (partial update supported)

• debugGame.setStage("BABY" | "TEEN" | "ABOMINATION")
  Force change to a specific stage

• debugGame.addAge(1440)
  Add game minutes (1440 = 24 game hours)

• debugGame.openDebugPanel()
  Open the debug panel UI

• debugGame.closeDebugPanel()
  Close the debug panel UI

• debugGame.help()
  Show this help message
          `);
        },
        openDebugPanel: () => {
          setDebugPanelOpen(true);
          console.log("✅ Debug panel opened");
        },
        closeDebugPanel: () => {
          setDebugPanelOpen(false);
          console.log("✅ Debug panel closed");
        },
      };

      console.log(
        "%c🎮 Kiroween Game Debug Mode",
        "background: #00ff00; color: #000; font-size: 16px; padding: 8px; font-family: 'Press Start 2P', monospace;"
      );
      console.log("%cPress 'D' key to open Debug Panel", "color: #00ff00; font-size: 14px;");
      console.log("Type 'debugGame.help()' for all available commands");
    }

    return () => {
      // Cleanup: remove debug functions on unmount
      if (typeof window !== "undefined") {
        // @ts-ignore
        delete window.debugGame;
      }
    };
  }, []);

  const handlePetCreation = (
    name: string,
    archetype: Archetype,
    color: number
  ) => {
    initializePet(name, archetype, color);
  };

  if (!isInitialized) {
    return <CreationScreen onComplete={handlePetCreation} />;
  }

  const canScavenge = inventory.length < 3 && !isScavenging;

  // Determine sanity state for data attribute (critical when below 30)
  const sanityState = stats.sanity < 30 ? "critical" : "normal";

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable: 'To pick up an item, press Enter or Space. Use arrow keys to move the item. Drag to your pet to feed, or to another slot to reorder. Press Enter to drop or Escape to cancel.',
        },
      }}
    >
      <div
        className={`app ${zenMode ? "zen-mode" : ""} ${!crtEnabled && !retroMode ? "no-crt" : ""} ${reduceMotion ? "reduce-motion" : ""} ${retroMode ? "retro-mode" : ""}`}
        role="main"
        aria-label="Creepy Companion Game"
        data-stage={stage}
        data-sanity={sanityState}
      >
        {/* Animated background layer - positioned behind all content */}
        <BackgroundLayer />
        
        <main className={`app-main ${zenMode ? "zen-mode-active" : ""}`}>
          {!zenMode && (
            <aside className="stats-panel">
              <StatsPanel
                stats={stats}
                stage={stage}
                age={age}
                gameDay={gameDay}
                dailyFeeds={dailyFeeds}
              />
              {/* Audio Controls - accessible during gameplay (Requirements 6.1, 6.2) */}
              <AudioControls />
              {/* Action Dock - below audio controls */}
              <ActionDock
                onScavenge={handleScavenge}
                onSettings={() => setSettingsPanelOpen(true)}
                onZenMode={() => setZenMode(true)}
                isScavenging={isScavenging}
                canScavenge={canScavenge}
                reduceMotion={reduceMotion}
                retroMode={retroMode}
              />
            </aside>
          )}

          <section className={`canvas-container ${feedSuccess ? 'feed-success-container' : ''} ${evolutionFlash ? 'evolution-flash' : ''}`} ref={canvasRef}>
            <GameCanvas
              ref={gameCanvasRef}
              traits={traits}
              stage={stage}
              sanity={stats.sanity}
              corruption={stats.corruption}
              petName={traits.name}
              isDropTarget={activeId !== null}
              reduceMotion={reduceMotion}
              retroMode={retroMode}
              onSpriteCapture={updatePetSprite}
            />
            {zenMode && (
              <button
                className="zen-exit"
                onClick={() => setZenMode(false)}
                aria-label="Exit zen mode"
                title="Press Z or Escape to show panels"
              >
                ✕
              </button>
            )}
          </section>

          {!zenMode && (
            <aside className="right-panel">
              <div className="log-section">
                <NarrativeLog logs={logs} sanityLevel={stats.sanity} />
              </div>
              <div className="inventory-section">
                <InventoryPanel
                  inventory={inventory}
                  onFeed={feed}
                  canScavenge={canScavenge}
                  onScavenge={handleScavenge}
                  isScavenging={isScavenging}
                  activeId={activeId}
                  petCanvasRef={canvasRef as React.RefObject<HTMLElement>}
                />
              </div>
            </aside>
          )}
        </main>

        {/* Debug Panel */}
        <DebugPanel isOpen={debugPanelOpen} onClose={() => setDebugPanelOpen(false)} />
        
        {/* Settings Panel */}
        <SettingsPanel isOpen={settingsPanelOpen} onClose={() => setSettingsPanelOpen(false)} />
        
        {/* DragOverlay renders the dragged item preview (Requirement 1.1, 7.5, 9.3, 9.5) */}
        <DragOverlay modifiers={[touchOffsetModifier]}>
          {activeItem ? (
            <div 
              className={`offering-card drag-overlay ${stage === 'ABOMINATION' ? 'abomination-glitch' : ''}`}
              data-stage={stage}
              aria-hidden="true"
            >
              <div className="card-icon">{activeItem.icon}</div>
              <div className="card-title">Mystery Item</div>
              <div className="card-description">{activeItem.description}</div>
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
