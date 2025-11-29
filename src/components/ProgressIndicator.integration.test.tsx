import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { ProgressIndicator } from "./ProgressIndicator";
import { ThemeProvider } from "../contexts/ThemeContext";
import type { GenerationProgress, ImageStatus } from "../utils/types";

// Mock window.matchMedia
beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

// Helper to render with theme context
function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

/**
 * Integration Test: Progress Indicator Flow
 * Requirements: 4.1-4.7
 * 
 * Tests:
 * - Start generation → verify progress
 * - Wait 30s → verify update
 * - Complete → verify success
 * - Fail → verify error
 */
describe("ProgressIndicator Integration Flow", () => {
  it("should show progress when generation starts", () => {
    // Requirement 4.1: Display progress indicator when generation starts
    const progress: GenerationProgress = {
      startTime: Date.now(),
      pollCount: 0,
      estimatedTimeRemaining: 90,
    };

    renderWithTheme(
      <ProgressIndicator progress={progress} status="generating" />
    );

    // Verify progress indicator is displayed
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Generating...")).toBeInTheDocument();
    
    // Verify spinner is present
    const spinner = document.querySelector(".progress-spinner");
    expect(spinner).toBeInTheDocument();
  });

  it("should update progress message after 30 seconds", async () => {
    // Requirement 4.2, 4.3: Update every 2 seconds, show ~60s remaining after 30s
    const startTime = Date.now() - 30000; // 30 seconds ago
    
    const progress: GenerationProgress = {
      startTime,
      pollCount: 15,
      estimatedTimeRemaining: 60,
    };

    renderWithTheme(
      <ProgressIndicator progress={progress} status="generating" />
    );

    // Should show ~60s remaining (wait for animation frame to update)
    await waitFor(() => {
      expect(screen.getByText("Generating... ~60s remaining")).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it("should update progress message after 60 seconds", async () => {
    // Requirement 4.4: Show ~30s remaining after 60s
    const startTime = Date.now() - 60000; // 60 seconds ago
    
    const progress: GenerationProgress = {
      startTime,
      pollCount: 30,
      estimatedTimeRemaining: 30,
    };

    renderWithTheme(
      <ProgressIndicator progress={progress} status="generating" />
    );

    // Should show ~30s remaining (wait for animation frame to update)
    await waitFor(() => {
      expect(screen.getByText("Generating... ~30s remaining")).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it("should show timeout message after 90 seconds", async () => {
    // Requirement 4.5: Show "Taking longer than expected..." after 90s
    const startTime = Date.now() - 90000; // 90 seconds ago
    
    const progress: GenerationProgress = {
      startTime,
      pollCount: 45,
      estimatedTimeRemaining: 0,
    };

    renderWithTheme(
      <ProgressIndicator progress={progress} status="generating" />
    );

    // Should show timeout message (wait for animation frame to update)
    await waitFor(() => {
      expect(screen.getByText("Taking longer than expected...")).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it("should transition to success state when completed", async () => {
    // Requirement 4.6: Replace progress with success state
    const { rerender } = renderWithTheme(
      <ProgressIndicator
        progress={{
          startTime: Date.now() - 30000,
          pollCount: 15,
          estimatedTimeRemaining: 60,
        }}
        status="generating"
      />
    );

    // Initially generating (wait for animation frame)
    await waitFor(() => {
      expect(screen.getByText("Generating... ~60s remaining")).toBeInTheDocument();
    }, { timeout: 3000 });

    // Simulate completion
    act(() => {
      rerender(
        <ThemeProvider>
          <ProgressIndicator
            progress={{
              startTime: Date.now() - 45000,
              pollCount: 22,
              estimatedTimeRemaining: 0,
            }}
            status="completed"
          />
        </ThemeProvider>
      );
    });

    // Should show success message
    await waitFor(() => {
      expect(screen.getByText("Image generated!")).toBeInTheDocument();
    });
    
    // Should show success icon
    expect(screen.getByText("✓")).toBeInTheDocument();
    
    // Should not show spinner
    const spinner = document.querySelector(".progress-spinner");
    expect(spinner).not.toBeInTheDocument();
  });

  it("should transition to error state when failed", async () => {
    // Requirement 4.7: Display error message with retry button
    const { rerender } = renderWithTheme(
      <ProgressIndicator
        progress={{
          startTime: Date.now() - 30000,
          pollCount: 15,
          estimatedTimeRemaining: 60,
        }}
        status="generating"
      />
    );

    // Initially generating (wait for animation frame)
    await waitFor(() => {
      expect(screen.getByText("Generating... ~60s remaining")).toBeInTheDocument();
    }, { timeout: 3000 });

    // Simulate failure
    act(() => {
      rerender(
        <ThemeProvider>
          <ProgressIndicator
            progress={{
              startTime: Date.now() - 30000,
              pollCount: 15,
              estimatedTimeRemaining: 60,
            }}
            status="failed"
          />
        </ThemeProvider>
      );
    });

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText("Generation failed")).toBeInTheDocument();
    });
    
    // Should show error icon
    expect(screen.getByText("✕")).toBeInTheDocument();
    
    // Should not show spinner
    const spinner = document.querySelector(".progress-spinner");
    expect(spinner).not.toBeInTheDocument();
  });

  it("should handle complete flow: start → update → complete", async () => {
    // Full integration flow
    let currentStatus: ImageStatus = "generating";
    let currentTime = Date.now();
    
    const { rerender } = renderWithTheme(
      <ProgressIndicator
        progress={{
          startTime: currentTime,
          pollCount: 0,
          estimatedTimeRemaining: 90,
        }}
        status={currentStatus}
      />
    );

    // Step 1: Start generation
    expect(screen.getByText("Generating...")).toBeInTheDocument();

    // Step 2: After 30 seconds
    currentTime = Date.now() - 30000;
    act(() => {
      rerender(
        <ThemeProvider>
          <ProgressIndicator
            progress={{
              startTime: currentTime,
              pollCount: 15,
              estimatedTimeRemaining: 60,
            }}
            status="generating"
          />
        </ThemeProvider>
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Generating... ~60s remaining")).toBeInTheDocument();
    }, { timeout: 3000 });

    // Step 3: Complete
    currentStatus = "completed";
    act(() => {
      rerender(
        <ThemeProvider>
          <ProgressIndicator
            progress={{
              startTime: currentTime,
              pollCount: 22,
              estimatedTimeRemaining: 0,
            }}
            status={currentStatus}
          />
        </ThemeProvider>
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Image generated!")).toBeInTheDocument();
    });
  });

  it("should handle accessibility announcements", async () => {
    // Requirements 11.1, 11.3, 11.4: Screen reader announcements
    const { rerender } = renderWithTheme(
      <ProgressIndicator
        progress={{
          startTime: Date.now(),
          pollCount: 0,
          estimatedTimeRemaining: 90,
        }}
        status="idle"
      />
    );

    // Start generation - should announce
    act(() => {
      rerender(
        <ThemeProvider>
          <ProgressIndicator
            progress={{
              startTime: Date.now(),
              pollCount: 0,
              estimatedTimeRemaining: 90,
            }}
            status="generating"
          />
        </ThemeProvider>
      );
    });

    // Check for aria-live region (there are multiple status elements, get the first one)
    const statusElements = screen.getAllByRole("status");
    expect(statusElements[0]).toHaveAttribute("aria-live", "polite");

    // Complete - should announce success
    act(() => {
      rerender(
        <ThemeProvider>
          <ProgressIndicator
            progress={{
              startTime: Date.now() - 45000,
              pollCount: 22,
              estimatedTimeRemaining: 0,
            }}
            status="completed"
          />
        </ThemeProvider>
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Image generated!")).toBeInTheDocument();
    });
  });

  it("should clean up animation frame on unmount", () => {
    // Requirement 4.2: Cancel polling on unmount
    const cancelAnimationFrameSpy = vi.spyOn(window, "cancelAnimationFrame");
    
    const { unmount } = renderWithTheme(
      <ProgressIndicator
        progress={{
          startTime: Date.now(),
          pollCount: 0,
          estimatedTimeRemaining: 90,
        }}
        status="generating"
      />
    );

    // Unmount component
    unmount();

    // Should have called cancelAnimationFrame
    expect(cancelAnimationFrameSpy).toHaveBeenCalled();
    
    cancelAnimationFrameSpy.mockRestore();
  });
});
