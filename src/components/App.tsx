import { useEffect, useRef, useState } from "react";
import { useGameStore } from "../store";
import CreationScreen from "./CreationScreen";
import { GameCanvas } from "./GameCanvas";
import { InventoryPanel } from "./InventoryPanel";
import { StatsPanel } from "./StatsPanel";
import { NarrativeLog } from "./NarrativeLog";
import { DebugPanel } from "./DebugPanel";
import { GameLoop } from "../utils/gameLoop";
import { ErrorBoundary } from "./ErrorBoundary";
import type { Archetype } from "../utils/types";
import "./App.css";

function AppContent() {
  const gameLoopRef = useRef<GameLoop | null>(null);
  const [debugPanelOpen, setDebugPanelOpen] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [isScavenging, setIsScavenging] = useState(false);

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

  // Scavenge wrapper with loading state
  const handleScavenge = async () => {
    setIsScavenging(true);
    try {
      await scavenge();
    } finally {
      setIsScavenging(false);
    }
  };

  // Initialize and cleanup game loop
  useEffect(() => {
    // Only start the game loop if the pet is initialized
    if (isInitialized) {
      if (!gameLoopRef.current) {
        gameLoopRef.current = new GameLoop(1000); // 1 second = 1 game minute
      }

      if (!gameLoopRef.current.isRunning()) {
        gameLoopRef.current.start();
      }
    }

    // Cleanup: stop the game loop when component unmounts
    return () => {
      if (gameLoopRef.current) {
        gameLoopRef.current.stop();
      }
    };
  }, [isInitialized]);

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

      // Support Escape to close panels
      if (event.key === "Escape") {
        if (debugPanelOpen) {
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
    <div
      className={`app ${zenMode ? "zen-mode" : ""}`}
      role="main"
      aria-label="Creepy Companion Game"
      data-stage={stage}
      data-sanity={sanityState}
    >
      {/* Zen Mode Toggle Button */}
      {!zenMode && (
        <button
          className="zen-toggle"
          onClick={() => setZenMode(true)}
          aria-label="Enter zen mode (hide panels)"
          title="Press Z or click to hide all panels"
        >
          🧘
        </button>
      )}

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
          </aside>
        )}

        <section className="canvas-container">
          <GameCanvas
            traits={traits}
            stage={stage}
            sanity={stats.sanity}
            corruption={stats.corruption}
            petName={traits.name}
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
              />
            </div>
          </aside>
        )}
      </main>

      {/* Debug Panel */}
      <DebugPanel isOpen={debugPanelOpen} onClose={() => setDebugPanelOpen(false)} />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;
