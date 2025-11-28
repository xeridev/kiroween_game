import type { PetStats, PetStage, NarrativeLog } from "../utils/types";
import "./UIOverlay.css";

interface UIOverlayProps {
  stats: PetStats;
  stage: PetStage;
  age: number;
  logs: NarrativeLog[];
  gameDay: number;
  dailyFeeds: number;
}

export function UIOverlay({
  stats,
  stage,
  age,
  logs,
  gameDay,
  dailyFeeds,
}: UIOverlayProps) {
  // Format age for display
  const formatAge = (ageInMinutes: number): string => {
    const hours = Math.floor(ageInMinutes / 60);
    const minutes = Math.floor(ageInMinutes % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Determine visual styling based on sanity level
  const getSanityClass = (): string => {
    if (stats.sanity < 30) {
      return "critical";
    } else if (stats.sanity < 60) {
      return "warning";
    }
    return "normal";
  };

  const sanityClass = getSanityClass();

  return (
    <div
      className={`ui-overlay ${sanityClass}`}
      role="complementary"
      aria-label="Game status"
    >
      {/* Stats Section */}
      <div className="stats-section" role="region" aria-label="Pet statistics">
        <div className="stat-group">
          <div className="stat-label" id="hunger-label">
            Hunger
          </div>
          <div
            className="stat-bar-container"
            role="progressbar"
            aria-labelledby="hunger-label"
            aria-valuenow={Math.round(stats.hunger)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-live="polite"
          >
            <div
              className="stat-bar hunger-bar"
              style={{ width: `${stats.hunger}%` }}
            />
          </div>
          <div className="stat-value" aria-hidden="true">
            {stats.hunger.toFixed(1)}
          </div>
        </div>

        <div className="stat-group">
          <div className="stat-label" id="sanity-label">
            Sanity
          </div>
          <div
            className="stat-bar-container"
            role="progressbar"
            aria-labelledby="sanity-label"
            aria-valuenow={Math.round(stats.sanity)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-live="polite"
          >
            <div
              className="stat-bar sanity-bar"
              style={{ width: `${stats.sanity}%` }}
            />
          </div>
          <div className="stat-value" aria-hidden="true">
            {stats.sanity.toFixed(1)}
          </div>
        </div>
      </div>

      {/* Pet Info Section */}
      <div
        className="pet-info-section"
        role="region"
        aria-label="Pet information"
      >
        <div className="info-item">
          <span className="info-label">Stage:</span>
          <span className="info-value" aria-live="polite">
            {stage}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">Age:</span>
          <span className="info-value">{formatAge(age)}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Day:</span>
          <span className="info-value">{gameDay}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Daily Feeds:</span>
          <span className="info-value" aria-live="polite">
            {dailyFeeds}/3
          </span>
        </div>
      </div>

      {/* Narrative Log Section */}
      <div
        className="narrative-log-section"
        role="region"
        aria-label="Narrative log"
      >
        <div className="log-header">Narrative Log</div>
        <div
          className="log-container"
          role="log"
          aria-live="polite"
          aria-atomic="false"
          tabIndex={0}
          aria-label="Scrollable narrative log of game events"
        >
          {logs.length === 0 ? (
            <div className="log-empty" role="status">
              No events yet...
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className={`log-entry log-${log.source.toLowerCase()}`}
                role="article"
              >
                <span className="log-timestamp">
                  [{formatAge(log.timestamp)}]
                </span>
                <span className="log-text">{log.text}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
