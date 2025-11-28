import type { NarrativeLog as NarrativeLogType } from "../utils/types";
import "./NarrativeLog.css";

interface NarrativeLogProps {
  logs: NarrativeLogType[];
  sanityLevel: number;
}

export function NarrativeLog({ logs, sanityLevel }: NarrativeLogProps) {
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
    if (sanityLevel < 30) {
      return "critical";
    } else if (sanityLevel < 60) {
      return "warning";
    }
    return "normal";
  };

  const sanityClass = getSanityClass();

  return (
    <div
      className={`narrative-log-panel ${sanityClass}`}
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
  );
}
