import { Component, type ReactNode } from "react";
import "./ErrorBoundary.css";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

/**
 * React Error Boundary component
 * Catches JavaScript errors anywhere in the child component tree
 * Requirements: Error Handling section
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error details
    console.error("Error Boundary caught an error:", error);
    console.error("Error Info:", errorInfo);

    // Store error info in state
    this.setState({
      errorInfo: errorInfo.componentStack || null,
    });

    // Log to external service if available (placeholder for future implementation)
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService(error: Error, errorInfo: React.ErrorInfo): void {
    // Placeholder for external error logging service
    // In production, this could send to Sentry, LogRocket, etc.
    const errorLog = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };

    // For now, just log to console
    console.error("Error logged:", errorLog);

    // Future: Send to error tracking service
    // fetch('/api/log-error', { method: 'POST', body: JSON.stringify(errorLog) });
  }

  handleReset = (): void => {
    // Reset error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Reload the page to reset application state
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <h1 className="error-boundary-title">Something went wrong</h1>
            <p className="error-boundary-message">
              The creature has glitched into the void. We're sorry for the
              inconvenience.
            </p>

            {this.state.error && (
              <details className="error-boundary-details">
                <summary>Error Details</summary>
                <pre className="error-boundary-stack">
                  {this.state.error.toString()}
                  {this.state.errorInfo && `\n\n${this.state.errorInfo}`}
                </pre>
              </details>
            )}

            <button
              className="error-boundary-button"
              onClick={this.handleReset}
            >
              Reset Application
            </button>

            <p className="error-boundary-note">
              Note: Resetting will reload the page. Your saved progress should
              be preserved.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
