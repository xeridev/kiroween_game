import { describe, it, expect, beforeEach } from "vitest";
import {
  errorLogger,
  ErrorSeverity,
  logInfo,
  logWarning,
  logError,
  logCritical,
} from "./utils/errorLogger";

describe("errorLogger", () => {
  beforeEach(() => {
    // Clear logs before each test
    errorLogger.clearLogs();
    errorLogger.clearCriticalErrors();
    localStorage.clear();
  });

  it("logs messages with correct severity", () => {
    logInfo("Info message");
    logWarning("Warning message");
    logError("Error message");

    const logs = errorLogger.getLogs();
    expect(logs).toHaveLength(3);
    expect(logs[0].severity).toBe(ErrorSeverity.INFO);
    expect(logs[1].severity).toBe(ErrorSeverity.WARNING);
    expect(logs[2].severity).toBe(ErrorSeverity.ERROR);
  });

  it("includes context in log entries", () => {
    const context = { userId: "123", action: "scavenge" };
    logError("Test error", undefined, context);

    const logs = errorLogger.getLogs();
    expect(logs[0].context).toEqual(context);
  });

  it("includes error stack in log entries", () => {
    const error = new Error("Test error");
    logError("Error occurred", error);

    const logs = errorLogger.getLogs();
    expect(logs[0].stack).toBeDefined();
    expect(logs[0].stack).toContain("Test error");
  });

  it("filters logs by severity", () => {
    logInfo("Info 1");
    logWarning("Warning 1");
    logError("Error 1");
    logInfo("Info 2");

    const infoLogs = errorLogger.getLogsBySeverity(ErrorSeverity.INFO);
    const warningLogs = errorLogger.getLogsBySeverity(ErrorSeverity.WARNING);

    expect(infoLogs).toHaveLength(2);
    expect(warningLogs).toHaveLength(1);
  });

  it("persists critical errors to localStorage", () => {
    logCritical("Critical error", new Error("Fatal"));

    const criticalErrors = errorLogger.getCriticalErrors();
    expect(criticalErrors).toHaveLength(1);
    expect(criticalErrors[0].message).toBe("Critical error");
    expect(criticalErrors[0].severity).toBe(ErrorSeverity.CRITICAL);
  });

  it("limits stored logs to max capacity", () => {
    // Log more than the max (100)
    for (let i = 0; i < 150; i++) {
      logInfo(`Message ${i}`);
    }

    const logs = errorLogger.getLogs();
    expect(logs.length).toBeLessThanOrEqual(100);
  });

  it("clears all logs", () => {
    logInfo("Info");
    logError("Error");

    expect(errorLogger.getLogs()).toHaveLength(2);

    errorLogger.clearLogs();

    expect(errorLogger.getLogs()).toHaveLength(0);
  });

  it("includes timestamp in log entries", () => {
    logInfo("Test message");

    const logs = errorLogger.getLogs();
    expect(logs[0].timestamp).toBeDefined();
    expect(new Date(logs[0].timestamp).getTime()).toBeGreaterThan(0);
  });

  it("includes user agent in log entries", () => {
    logError("Test error");

    const logs = errorLogger.getLogs();
    expect(logs[0].userAgent).toBeDefined();
    expect(logs[0].userAgent).toBe(navigator.userAgent);
  });

  it("limits critical errors in localStorage to 10", () => {
    // Log 15 critical errors
    for (let i = 0; i < 15; i++) {
      logCritical(`Critical ${i}`);
    }

    const criticalErrors = errorLogger.getCriticalErrors();
    expect(criticalErrors.length).toBeLessThanOrEqual(10);
  });
});
