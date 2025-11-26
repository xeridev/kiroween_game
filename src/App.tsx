import { useEffect, useRef } from "react";
import { useGameStore } from "./store";
import CreationScreen from "./CreationScreen";
import { GameCanvas } from "./GameCanvas";
import { InventoryPanel } from "./InventoryPanel";
import { UIOverlay } from "./UIOverlay";
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

  return (
    <div className="app" role="main" aria-label="Creepy Companion Game">
      <div style={{ width: "800px", height: "600px", margin: "0 auto" }}>
        <GameCanvas
          traits={traits}
          stage={stage}
          sanity={stats.sanity}
          corruption={stats.corruption}
        />
      </div>
      <UIOverlay
        stats={stats}
        stage={stage}
        age={age}
        logs={logs}
        gameDay={gameDay}
        dailyFeeds={dailyFeeds}
      />
      <InventoryPanel
        inventory={inventory}
        onFeed={feed}
        canScavenge={canScavenge}
        onScavenge={scavenge}
      />
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
