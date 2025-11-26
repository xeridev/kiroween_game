import "./AIErrorFallback.css";

interface AIErrorFallbackProps {
  error?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

/**
 * Fallback UI component for AI generation failures
 * Requirements: Error Handling section
 */
export function AIErrorFallback({
  error,
  onRetry,
  onDismiss,
}: AIErrorFallbackProps) {
  return (
    <div className="ai-error-fallback">
      <div className="ai-error-content">
        <span className="ai-error-icon">⚠️</span>
        <p className="ai-error-message">
          {error || "Unable to generate description. The void is silent."}
        </p>
        <div className="ai-error-actions">
          {onRetry && (
            <button className="ai-error-button retry" onClick={onRetry}>
              Try Again
            </button>
          )}
          {onDismiss && (
            <button className="ai-error-button dismiss" onClick={onDismiss}>
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
