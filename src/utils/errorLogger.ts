/**
 * Error logging utility
 * Provides centralized error logging with context
 * Requirements: Error Handling section
 */

export const ErrorSeverity = {
  INFO: "info",
  WARNING: "warning",
  ERROR: "error",
  CRITICAL: "critical",
} as const;

export type ErrorSeverity = (typeof ErrorSeverity)[keyof typeof ErrorSeverity];

export interface ErrorLog {
  timestamp: string;
  severity: ErrorSeverity;
  message: string;
  context?: Record<string, any>;
  stack?: string;
  userAgent?: string;
}

class ErrorLogger {
  private logs: ErrorLog[] = [];
  private maxLogs = 100;

  /**
   * Log an error with context
   */
  log(
    message: string,
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    context?: Record<string, any>,
    error?: Error
  ): void {
    const errorLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      severity,
      message,
      context,
      stack: error?.stack,
      userAgent: navigator.userAgent,
    };

    // Add to in-memory logs
    this.logs.push(errorLog);

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console logging based on severity
    switch (severity) {
      case ErrorSeverity.INFO:
        console.info(`[INFO] ${message}`, context);
        break;
      case ErrorSeverity.WARNING:
        console.warn(`[WARNING] ${message}`, context);
        break;
      case ErrorSeverity.ERROR:
        console.error(`[ERROR] ${message}`, context, error);
        break;
      case ErrorSeverity.CRITICAL:
        console.error(`[CRITICAL] ${message}`, context, error);
        break;
    }

    // Persist critical errors to localStorage for debugging
    if (severity === ErrorSeverity.CRITICAL) {
      this.persistCriticalError(errorLog);
    }
  }

  /**
   * Persist critical errors to localStorage
   */
  private persistCriticalError(errorLog: ErrorLog): void {
    try {
      const key = "creepy-companion-critical-errors";
      const existing = localStorage.getItem(key);
      const errors = existing ? JSON.parse(existing) : [];

      errors.push(errorLog);

      // Keep only last 10 critical errors
      const trimmed = errors.slice(-10);

      localStorage.setItem(key, JSON.stringify(trimmed));
    } catch (error) {
      // If we can't persist, just log to console
      console.error("Failed to persist critical error:", error);
    }
  }

  /**
   * Get all logs
   */
  getLogs(): ErrorLog[] {
    return [...this.logs];
  }

  /**
   * Get logs by severity
   */
  getLogsBySeverity(severity: ErrorSeverity): ErrorLog[] {
    return this.logs.filter((log) => log.severity === severity);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Get critical errors from localStorage
   */
  getCriticalErrors(): ErrorLog[] {
    try {
      const key = "creepy-companion-critical-errors";
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Failed to retrieve critical errors:", error);
      return [];
    }
  }

  /**
   * Clear critical errors from localStorage
   */
  clearCriticalErrors(): void {
    try {
      localStorage.removeItem("creepy-companion-critical-errors");
    } catch (error) {
      console.error("Failed to clear critical errors:", error);
    }
  }
}

// Export singleton instance
export const errorLogger = new ErrorLogger();

// Convenience functions
export function logInfo(message: string, context?: Record<string, any>): void {
  errorLogger.log(message, ErrorSeverity.INFO, context);
}

export function logWarning(
  message: string,
  context?: Record<string, any>
): void {
  errorLogger.log(message, ErrorSeverity.WARNING, context);
}

export function logError(
  message: string,
  error?: Error,
  context?: Record<string, any>
): void {
  errorLogger.log(message, ErrorSeverity.ERROR, context, error);
}

export function logCritical(
  message: string,
  error?: Error,
  context?: Record<string, any>
): void {
  errorLogger.log(message, ErrorSeverity.CRITICAL, context, error);
}
