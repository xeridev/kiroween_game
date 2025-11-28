import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { GameLoop } from "./utils/gameLoop";
import { useGameStore } from "./store";

describe("GameLoop", () => {
  let gameLoop: GameLoop;

  beforeEach(() => {
    // Reset store before each test
    useGameStore.getState().reset();
    gameLoop = new GameLoop(100); // Use 100ms for faster tests
    vi.useFakeTimers();
  });

  afterEach(() => {
    gameLoop.stop();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("should start the game loop", () => {
    expect(gameLoop.isRunning()).toBe(false);
    gameLoop.start();
    expect(gameLoop.isRunning()).toBe(true);
  });

  it("should stop the game loop", () => {
    gameLoop.start();
    expect(gameLoop.isRunning()).toBe(true);
    gameLoop.stop();
    expect(gameLoop.isRunning()).toBe(false);
  });

  it("should not start multiple intervals", () => {
    gameLoop.start();
    const firstRunning = gameLoop.isRunning();
    gameLoop.start(); // Try to start again
    expect(gameLoop.isRunning()).toBe(firstRunning);
  });

  it("should call store.tick() on each interval", () => {
    // Initialize pet first
    useGameStore.getState().initializePet("TestPet", "GLOOM", 0xff0000);

    const initialAge = useGameStore.getState().age;

    gameLoop.start();

    // Advance time by 100ms (one tick)
    vi.advanceTimersByTime(100);

    const ageAfterOneTick = useGameStore.getState().age;
    expect(ageAfterOneTick).toBe(initialAge + 1);

    // Advance time by another 100ms (another tick)
    vi.advanceTimersByTime(100);

    const ageAfterTwoTicks = useGameStore.getState().age;
    expect(ageAfterTwoTicks).toBe(initialAge + 2);
  });

  it("should handle errors gracefully without crashing", () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    // Mock tick to throw an error
    const originalTick = useGameStore.getState().tick;
    useGameStore.setState({
      tick: () => {
        throw new Error("Test error");
      },
    });

    gameLoop.start();

    // Advance time - should not crash
    expect(() => {
      vi.advanceTimersByTime(100);
    }).not.toThrow();

    // Error should be logged (using errorLogger format)
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[ERROR] Error during game tick",
      expect.objectContaining({ tickInterval: 100 }),
      expect.any(Error)
    );

    // Game loop should still be running
    expect(gameLoop.isRunning()).toBe(true);

    // Restore original tick
    useGameStore.setState({ tick: originalTick });
  });

  it("should stop calling tick after stop is called", () => {
    useGameStore.getState().initializePet("TestPet", "GLOOM", 0xff0000);

    gameLoop.start();

    // Advance time by 100ms
    vi.advanceTimersByTime(100);
    const ageAfterStart = useGameStore.getState().age;

    gameLoop.stop();

    // Advance time by another 100ms
    vi.advanceTimersByTime(100);
    const ageAfterStop = useGameStore.getState().age;

    // Age should not have changed after stop
    expect(ageAfterStop).toBe(ageAfterStart);
  });
});
