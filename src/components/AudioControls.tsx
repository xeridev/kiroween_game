import { useGameStore } from "../store";
import "./AudioControls.css";

/**
 * AudioControls Component
 * 
 * Provides volume sliders and mute toggle for the game's audio system.
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */
export function AudioControls() {
  // Connect to Zustand audio state
  const masterVolume = useGameStore((state) => state.masterVolume);
  const sfxVolume = useGameStore((state) => state.sfxVolume);
  const ambientVolume = useGameStore((state) => state.ambientVolume);
  const isMuted = useGameStore((state) => state.isMuted);
  
  const setMasterVolume = useGameStore((state) => state.setMasterVolume);
  const setSfxVolume = useGameStore((state) => state.setSfxVolume);
  const setAmbientVolume = useGameStore((state) => state.setAmbientVolume);
  const toggleMute = useGameStore((state) => state.toggleMute);

  // Handler for volume slider changes (Requirement 6.4)
  const handleMasterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMasterVolume(parseFloat(e.target.value));
  };

  const handleSfxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSfxVolume(parseFloat(e.target.value));
  };

  const handleAmbientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmbientVolume(parseFloat(e.target.value));
  };

  // Convert volume (0-1) to percentage for display
  const toPercent = (value: number): number => Math.round(value * 100);

  return (
    <div className="audio-controls" role="group" aria-label="Audio controls">
      {/* Master Volume Slider (Requirement 6.1) */}
      <div className="audio-control-group">
        <label htmlFor="master-volume" className="audio-label">
          Master
        </label>
        <input
          type="range"
          id="master-volume"
          className="audio-slider"
          min="0"
          max="1"
          step="0.01"
          value={masterVolume}
          onChange={handleMasterChange}
          aria-label="Master volume"
          aria-valuenow={toPercent(masterVolume)}
          aria-valuemin={0}
          aria-valuemax={100}
        />
        <span className="audio-value" aria-hidden="true">
          {toPercent(masterVolume)}%
        </span>
      </div>

      {/* SFX Volume Slider (Requirement 6.1) */}
      <div className="audio-control-group">
        <label htmlFor="sfx-volume" className="audio-label">
          SFX
        </label>
        <input
          type="range"
          id="sfx-volume"
          className="audio-slider"
          min="0"
          max="1"
          step="0.01"
          value={sfxVolume}
          onChange={handleSfxChange}
          aria-label="Sound effects volume"
          aria-valuenow={toPercent(sfxVolume)}
          aria-valuemin={0}
          aria-valuemax={100}
        />
        <span className="audio-value" aria-hidden="true">
          {toPercent(sfxVolume)}%
        </span>
      </div>

      {/* Ambient Volume Slider (Requirement 6.1) */}
      <div className="audio-control-group">
        <label htmlFor="ambient-volume" className="audio-label">
          Ambient
        </label>
        <input
          type="range"
          id="ambient-volume"
          className="audio-slider"
          min="0"
          max="1"
          step="0.01"
          value={ambientVolume}
          onChange={handleAmbientChange}
          aria-label="Ambient volume"
          aria-valuenow={toPercent(ambientVolume)}
          aria-valuemin={0}
          aria-valuemax={100}
        />
        <span className="audio-value" aria-hidden="true">
          {toPercent(ambientVolume)}%
        </span>
      </div>

      {/* Mute Toggle Button (Requirement 6.2, 6.5) */}
      <button
        type="button"
        className={`audio-mute-button ${isMuted ? "muted" : ""}`}
        onClick={toggleMute}
        aria-label={isMuted ? "Unmute audio" : "Mute audio"}
        aria-pressed={isMuted}
      >
        {isMuted ? "🔇" : "🔊"}
      </button>
    </div>
  );
}
