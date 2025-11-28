import { useState, useEffect } from "react";
import { useGameStore } from "../store";
import type { PetStage } from "../utils/types";
import { 
  getPerformanceState, 
  onPerformanceChange,
  startPerformanceMonitoring,
} from "../utils/animationUtils";
import "./DebugPanel.css";

interface DebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DebugPanel({ isOpen, onClose }: DebugPanelProps) {
  const [statInput, setStatInput] = useState({
    hunger: "",
    sanity: "",
    corruption: "",
  });
  const [ageInput, setAgeInput] = useState("");
  
  // Performance monitoring state (Requirement 1.5, 7.4)
  const [performanceState, setPerformanceState] = useState(() => getPerformanceState());
  
  // Subscribe to performance changes when panel is open
  useEffect(() => {
    if (!isOpen) return;
    
    // Ensure monitoring is started
    startPerformanceMonitoring();
    
    // Update state immediately
    setPerformanceState(getPerformanceState());
    
    // Subscribe to changes
    const unsubscribe = onPerformanceChange((state) => {
      setPerformanceState(state);
    });
    
    // Also poll for updates since FPS changes frequently
    const interval = setInterval(() => {
      setPerformanceState(getPerformanceState());
    }, 500);
    
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [isOpen]);

  const stats = useGameStore((state) => state.stats);
  const stage = useGameStore((state) => state.stage);
  const age = useGameStore((state) => state.age);
  const gameDay = useGameStore((state) => state.gameDay);
  const dailyFeeds = useGameStore((state) => state.dailyFeeds);
  const inventory = useGameStore((state) => state.inventory);
  const logs = useGameStore((state) => state.logs);
  const isAlive = useGameStore((state) => state.isAlive);
  const reset = useGameStore((state) => state.reset);

  if (!isOpen) return null;

  const handleSetStats = () => {
    const newStats: any = {};
    if (statInput.hunger !== "") {
      newStats.hunger = Math.max(0, Math.min(100, Number(statInput.hunger)));
    }
    if (statInput.sanity !== "") {
      newStats.sanity = Math.max(0, Math.min(100, Number(statInput.sanity)));
    }
    if (statInput.corruption !== "") {
      newStats.corruption = Math.max(
        0,
        Math.min(100, Number(statInput.corruption))
      );
    }

    if (Object.keys(newStats).length > 0) {
      useGameStore.setState({
        stats: { ...stats, ...newStats },
      });
      setStatInput({ hunger: "", sanity: "", corruption: "" });
    }
  };

  const handleSetStage = (newStage: PetStage) => {
    useGameStore.setState({ stage: newStage });
  };

  const handleAddAge = () => {
    if (ageInput !== "") {
      const minutes = Number(ageInput);
      useGameStore.setState({ age: age + minutes });
      setAgeInput("");
    }
  };

  const handleClearData = () => {
    if (
      window.confirm(
        "⚠️ This will clear ALL game data and reload the page. Continue?"
      )
    ) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleReset = () => {
    if (
      window.confirm(
        "⚠️ This will reset the pet to initial state and reload. Continue?"
      )
    ) {
      reset();
      window.location.reload();
    }
  };

  // Convert age to hours and minutes
  const hours = Math.floor(age / 60);
  const minutes = age % 60;

  return (
    <>
      {/* Backdrop */}
      <div className="debug-backdrop" onClick={onClose} aria-hidden="true" />

      {/* Debug Panel */}
      <div
        className="debug-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="debug-title"
      >
        {/* Header */}
        <div className="debug-header">
          <h2 id="debug-title" className="debug-title">
            // DEBUG TERMINAL
          </h2>
          <button
            onClick={onClose}
            className="debug-close"
            aria-label="Close debug panel"
          >
            [X]
          </button>
        </div>

        {/* Content */}
        <div className="debug-content">
          {/* Current State Section */}
          <section className="debug-section">
            <h3 className="debug-section-title">&gt; CURRENT STATE</h3>
            <div className="debug-grid">
              <div className="debug-stat">
                <span className="debug-stat-label">STAGE:</span>
                <span className="debug-stat-value">{stage}</span>
              </div>
              <div className="debug-stat">
                <span className="debug-stat-label">AGE:</span>
                <span className="debug-stat-value">
                  {hours}h {minutes}m
                </span>
              </div>
              <div className="debug-stat">
                <span className="debug-stat-label">DAY:</span>
                <span className="debug-stat-value">{gameDay}</span>
              </div>
              <div className="debug-stat">
                <span className="debug-stat-label">FEEDS:</span>
                <span className="debug-stat-value">{dailyFeeds}/3</span>
              </div>
              <div className="debug-stat">
                <span className="debug-stat-label">HUNGER:</span>
                <span className="debug-stat-value">
                  {stats.hunger.toFixed(1)}
                </span>
              </div>
              <div className="debug-stat">
                <span className="debug-stat-label">SANITY:</span>
                <span className="debug-stat-value">
                  {stats.sanity.toFixed(1)}
                </span>
              </div>
              <div className="debug-stat">
                <span className="debug-stat-label">CORRUPT:</span>
                <span className="debug-stat-value">
                  {stats.corruption.toFixed(1)}
                </span>
              </div>
              <div className="debug-stat">
                <span className="debug-stat-label">ALIVE:</span>
                <span className="debug-stat-value">{isAlive ? "YES" : "NO"}</span>
              </div>
              <div className="debug-stat">
                <span className="debug-stat-label">ITEMS:</span>
                <span className="debug-stat-value">{inventory.length}/3</span>
              </div>
              <div className="debug-stat">
                <span className="debug-stat-label">LOGS:</span>
                <span className="debug-stat-value">{logs.length}</span>
              </div>
            </div>
          </section>
          
          {/* Performance Monitoring Section (Requirement 1.5, 7.4) */}
          <section className="debug-section">
            <h3 className="debug-section-title">&gt; PERFORMANCE</h3>
            <div className="debug-grid">
              <div className="debug-stat">
                <span className="debug-stat-label">FPS:</span>
                <span className={`debug-stat-value ${performanceState.currentFps < 30 ? 'debug-stat-warning' : ''}`}>
                  {performanceState.currentFps}
                </span>
              </div>
              <div className="debug-stat">
                <span className="debug-stat-label">LOW-END:</span>
                <span className="debug-stat-value">
                  {performanceState.isLowEndDevice ? "YES" : "NO"}
                </span>
              </div>
              <div className="debug-stat">
                <span className="debug-stat-label">REDUCE:</span>
                <span className="debug-stat-value">
                  {performanceState.shouldReduceAnimations ? "YES" : "NO"}
                </span>
              </div>
            </div>
          </section>

          {/* Set Stats Section */}
          <section className="debug-section">
            <h3 className="debug-section-title">&gt; SET STATS (0-100)</h3>
            <div className="debug-input-grid">
              <input
                type="number"
                placeholder="HUNGER"
                value={statInput.hunger}
                onChange={(e) =>
                  setStatInput({ ...statInput, hunger: e.target.value })
                }
                className="debug-input"
                min="0"
                max="100"
              />
              <input
                type="number"
                placeholder="SANITY"
                value={statInput.sanity}
                onChange={(e) =>
                  setStatInput({ ...statInput, sanity: e.target.value })
                }
                className="debug-input"
                min="0"
                max="100"
              />
              <input
                type="number"
                placeholder="CORRUPTION"
                value={statInput.corruption}
                onChange={(e) =>
                  setStatInput({ ...statInput, corruption: e.target.value })
                }
                className="debug-input"
                min="0"
                max="100"
              />
            </div>
            <button onClick={handleSetStats} className="debug-button">
              [APPLY STATS]
            </button>
          </section>

          {/* Set Stage Section */}
          <section className="debug-section">
            <h3 className="debug-section-title">&gt; SET STAGE</h3>
            <div className="debug-button-grid">
              <button
                onClick={() => handleSetStage("EGG")}
                className={`debug-button ${stage === "EGG" ? "debug-button-active" : ""}`}
              >
                [EGG]
              </button>
              <button
                onClick={() => handleSetStage("BABY")}
                className={`debug-button ${stage === "BABY" ? "debug-button-active" : ""}`}
              >
                [BABY]
              </button>
              <button
                onClick={() => handleSetStage("TEEN")}
                className={`debug-button ${stage === "TEEN" ? "debug-button-active" : ""}`}
              >
                [TEEN]
              </button>
              <button
                onClick={() => handleSetStage("ABOMINATION")}
                className={`debug-button ${stage === "ABOMINATION" ? "debug-button-active" : ""}`}
              >
                [ABOMINATION]
              </button>
            </div>
          </section>

          {/* Add Age Section */}
          <section className="debug-section">
            <h3 className="debug-section-title">&gt; ADD AGE (MINUTES)</h3>
            <div className="debug-input-row">
              <input
                type="number"
                placeholder="MINUTES (e.g., 1440 = 24h)"
                value={ageInput}
                onChange={(e) => setAgeInput(e.target.value)}
                className="debug-input"
                min="0"
              />
              <button onClick={handleAddAge} className="debug-button">
                [ADD]
              </button>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="debug-section debug-danger-zone">
            <h3 className="debug-section-title">&gt; DANGER ZONE</h3>
            <div className="debug-button-grid">
              <button onClick={handleReset} className="debug-button-danger">
                [RESET PET]
              </button>
              <button onClick={handleClearData} className="debug-button-danger">
                [CLEAR ALL DATA]
              </button>
            </div>
          </section>

          {/* Help Text */}
          <section className="debug-section">
            <div className="debug-help">
              <p className="debug-help-text">
                // Press <kbd>D</kbd> to toggle this panel
              </p>
              <p className="debug-help-text">
                // Console: <code>debugGame.help()</code> for more commands
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
