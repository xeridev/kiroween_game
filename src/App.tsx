import { useEffect, useRef } from "react";
import { useGameStore } from "./store";
import CreationScreen from "./CreationScreen";
import { GameCanvas } from "./GameCanvas";
import { InventoryPanel } from "./InventoryPanel";
import { StatsPanel } from "./StatsPanel";
import { NarrativeLog } from "./NarrativeLog";
import { GameLoop } from "./gameLoop";
import { ErrorBoundary } from "./ErrorBoundary";
import type { Archetype } from "./types";
import "./App.css";

function AppContent() {
  const gameLoopRef = useRef<GameLoop | null>(null);

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

• debugGame.help()
  Show this help message
          `);
        },
      };

      console.log(
        "%c🎮 Kiroween Game Debug Mode",
        "background: #ff00ff; color: #00ffff; font-size: 16px; padding: 8px; border-radius: 4px;"
      );
      console.log("Type 'debugGame.help()' for available commands");
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

  const canScavenge = inventory.length < 3;

  // Determine sanity state for data attribute (critical when below 30)
  const sanityState = stats.sanity < 30 ? "critical" : "normal";

  return (
    <div
      className="app"
      role="main"
      aria-label="Creepy Companion Game"
      data-stage={stage}
      data-sanity={sanityState}
    >
      <header className="app-header">
        <h1 className="pet-name">{traits.name}</h1>
        <div className="stage-indicator">{stage}</div>
      </header>

      <main className="app-main">
        <aside className="stats-panel">
          <StatsPanel
            stats={stats}
            stage={stage}
            age={age}
            gameDay={gameDay}
            dailyFeeds={dailyFeeds}
          />
        </aside>

        <section className="canvas-container">
          <GameCanvas
            traits={traits}
            stage={stage}
            sanity={stats.sanity}
            corruption={stats.corruption}
          />
        </section>

        <aside className="log-panel">
          <NarrativeLog logs={logs} sanityLevel={stats.sanity} />
        </aside>
      </main>

      <aside className="inventory-section">
        <InventoryPanel
          inventory={inventory}
          onFeed={feed}
          canScavenge={canScavenge}
          onScavenge={scavenge}
        />
      </aside>
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
