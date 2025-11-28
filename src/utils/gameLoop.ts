import { useGameStore } from "../store";
import { logError } from "./errorLogger";

/**
 * GameLoop manages the real-time game tick system.
 * 1 real second = 1 game minute
 */
export class GameLoop {
  private intervalId: number | null = null;
  private readonly tickInterval: number;

  constructor(tickInterval: number = 1000) {
    this.tickInterval = tickInterval;
  }

  /**
   * Start the game loop
   */
  start(): void {
    // Prevent multiple intervals
    if (this.intervalId !== null) {
      return;
    }

    this.intervalId = window.setInterval(() => {
      try {
        // Call the store's tick action
        useGameStore.getState().tick();
      } catch (error) {
        // Log error but don't crash the game loop
        logError(
          "Error during game tick",
          error instanceof Error ? error : undefined,
          { tickInterval: this.tickInterval }
        );
      }
    }, this.tickInterval);
  }

  /**
   * Stop the game loop
   */
  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Check if the game loop is currently running
   */
  isRunning(): boolean {
    return this.intervalId !== null;
  }
}
