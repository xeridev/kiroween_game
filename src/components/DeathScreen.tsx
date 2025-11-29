import type { DeathData } from "../utils/types";
import "./DeathScreen.css";

interface DeathScreenProps {
  deathData: DeathData;
  onStartNew: () => void;
}

/**
 * DeathScreen - Full-screen memorial overlay displayed when pet dies
 * 
 * Requirements: 2.3, 5.1, 5.2
 * - Display pet name, archetype, stage, age, cause, corruption
 * - Show death narrative and epitaph
 * - "Start New Pet" button
 */
export function DeathScreen({ deathData, onStartNew }: DeathScreenProps) {
  const {
    petName,
    archetype,
    stage,
    age,
    cause,
    finalStats,
    deathNarrative,
    epitaph,
  } = deathData;

  // Format age as days and hours
  const formatAge = (ageMinutes: number): string => {
    const days = Math.floor(ageMinutes / 1440);
    const hours = Math.floor((ageMinutes % 1440) / 60);
    const minutes = ageMinutes % 60;
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Get cause display text
  const getCauseText = (deathCause: string): string => {
    switch (deathCause) {
      case "STARVATION":
        return "Starved";
      case "INSANITY":
        return "Lost to Madness";
      default:
        return deathCause;
    }
  };

  // Get archetype icon
  const getArchetypeIcon = (arch: string): string => {
    switch (arch) {
      case "GLOOM":
        return "🌑";
      case "SPARK":
        return "⚡";
      case "ECHO":
        return "🔮";
      default:
        return "👻";
    }
  };

  return (
    <div className="death-screen" role="main" aria-label="Pet Memorial">
      <div className="death-container">
        {/* Memorial Header */}
        <div className="memorial-header">
          <span className="memorial-icon" aria-hidden="true">💀</span>
          <h1 className="memorial-title">In Memoriam</h1>
        </div>

        {/* Pet Identity Card */}
        <div className="memorial-card">
          <div className="pet-identity">
            <span className="archetype-icon" aria-hidden="true">
              {getArchetypeIcon(archetype)}
            </span>
            <h2 className="pet-name">{petName}</h2>
            <span className="pet-archetype">{archetype}</span>
          </div>

          {/* Stats Grid */}
          <div className="memorial-stats" role="list" aria-label="Final statistics">
            <div className="stat-item" role="listitem">
              <span className="stat-label">Stage</span>
              <span className="stat-value">{stage}</span>
            </div>
            <div className="stat-item" role="listitem">
              <span className="stat-label">Age</span>
              <span className="stat-value">{formatAge(age)}</span>
            </div>
            <div className="stat-item" role="listitem">
              <span className="stat-label">Cause</span>
              <span className="stat-value cause-value">{getCauseText(cause)}</span>
            </div>
            <div className="stat-item" role="listitem">
              <span className="stat-label">Corruption</span>
              <span className="stat-value">{Math.round(finalStats.corruption)}%</span>
            </div>
          </div>
        </div>

        {/* Death Narrative */}
        {deathNarrative && (
          <div className="narrative-section">
            <p className="death-narrative">{deathNarrative}</p>
          </div>
        )}

        {/* Epitaph */}
        {epitaph && (
          <div className="epitaph-section">
            <p className="epitaph">"{epitaph}"</p>
          </div>
        )}

        {/* Start New Pet Button */}
        <button
          type="button"
          className="start-new-button"
          onClick={onStartNew}
          aria-label="Start a new pet"
        >
          Start New Pet
        </button>

        <p className="ghost-notice">
          The spirit of {petName} will linger...
        </p>
      </div>
    </div>
  );
}

export default DeathScreen;
