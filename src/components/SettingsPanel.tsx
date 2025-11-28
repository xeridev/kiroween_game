import { useGameStore } from "../store";
import { GlassPanel } from "./GlassPanel";
import { useTheme } from "../contexts/ThemeContext";
import "./SettingsPanel.css";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SPEED_OPTIONS = [
  { value: 0.5, label: "0.5x (Slow)" },
  { value: 1, label: "1x (Normal)" },
  { value: 2, label: "2x (Fast)" },
  { value: 4, label: "4x (Turbo)" },
];

/**
 * SettingsPanel - Game settings modal with glassmorphism styling
 * 
 * Requirements: 6.1, 6.4, 6.5
 */
export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const gameSpeed = useGameStore((state) => state.gameSpeed);
  const setGameSpeed = useGameStore((state) => state.setGameSpeed);
  const crtEnabled = useGameStore((state) => state.crtEnabled);
  const setCrtEnabled = useGameStore((state) => state.setCrtEnabled);
  const reduceMotion = useGameStore((state) => state.reduceMotion);
  const setReduceMotion = useGameStore((state) => state.setReduceMotion);
  const retroMode = useGameStore((state) => state.retroMode);
  const setRetroMode = useGameStore((state) => state.setRetroMode);
  const { mode } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <GlassPanel
        className={`settings-panel settings-panel--${mode}`}
        variant="settings"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Game Settings"
        aria-modal={true}
      >
        <div className="settings-header">
          <h2>Settings</h2>
          <button
            className="settings-close"
            onClick={onClose}
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        <div className="settings-content">
          {/* Game Speed */}
          <div className="setting-group">
            <label className="setting-label" htmlFor="game-speed">
              Game Speed
            </label>
            <select
              id="game-speed"
              className="setting-select"
              value={gameSpeed}
              onChange={(e) => setGameSpeed(Number(e.target.value))}
            >
              {SPEED_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span className="setting-hint">
              Controls how fast time passes in-game
            </span>
          </div>

          {/* Retro Mode - Requirements 8.1, 8.2, 8.3, 8.4 */}
          <div className="setting-group">
            <label className="setting-label">
              <input
                type="checkbox"
                checked={retroMode}
                onChange={(e) => setRetroMode(e.target.checked)}
              />
              Retro Mode
            </label>
            <span className="setting-hint">
              Classic CRT aesthetic with simpler effects
            </span>
          </div>

          {/* CRT Effect - only shown when not in retro mode */}
          {!retroMode && (
            <div className="setting-group">
              <label className="setting-label">
                <input
                  type="checkbox"
                  checked={crtEnabled}
                  onChange={(e) => setCrtEnabled(e.target.checked)}
                />
                CRT Scanline Effect
              </label>
              <span className="setting-hint">
                Retro TV scanline overlay effect
              </span>
            </div>
          )}

          {/* Reduce Motion */}
          <div className="setting-group">
            <label className="setting-label">
              <input
                type="checkbox"
                checked={reduceMotion}
                onChange={(e) => setReduceMotion(e.target.checked)}
              />
              Reduce Motion
            </label>
            <span className="setting-hint">
              Disable animations for accessibility
            </span>
          </div>
        </div>

        <div className="settings-footer">
          <span className="settings-shortcut">Press S to toggle settings</span>
        </div>
      </GlassPanel>
    </div>
  );
}
