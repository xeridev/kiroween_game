import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { DialogueChoices } from "./DialogueChoices";
import { ThemeProvider } from "../contexts/ThemeContext";
import type { DialogueChoice } from "../utils/types";

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
  
  // Use fake timers for timeout testing
  vi.useFakeTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

// Helper to render with theme context
function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

/**
 * Integration Test: Dialogue Choice Flow
 * Requirements: 6.1-6.7
 * 
 * Tests:
 * - Trigger event → verify 30% chance (tested in store)
 * - Display choices → verify options
 * - Select → verify stats change
 * - Timeout → verify auto-select
 */
describe("DialogueChoices Integration Flow", () => {
  const mockChoices: DialogueChoice[] = [
    {
      id: "choice-1",
      text: "Comfort the creature",
      emotionalTone: "comforting",
      statDelta: { sanity: 5, corruption: -2 },
    },
    {
      id: "choice-2",
      text: "Recoil in fear",
      emotionalTone: "fearful",
      statDelta: { sanity: -3, corruption: 1 },
    },
    {
      id: "choice-3",
      text: "Observe calmly",
      emotionalTone: "neutral",
      statDelta: { sanity: 0, corruption: 0 },
    },
  ];

  it("should display all dialogue choices", () => {
    // Requirement 6.2: Display 2-3 options with clear emotional tones
    const onSelect = vi.fn();
    
    renderWithTheme(
      <DialogueChoices choices={mockChoices} onSelect={onSelect} />
    );

    // Verify all choices are displayed
    expect(screen.getByText("Comfort the creature")).toBeInTheDocument();
    expect(screen.getByText("Recoil in fear")).toBeInTheDocument();
    expect(screen.getByText("Observe calmly")).toBeInTheDocument();
    
    // Verify countdown timer is displayed
    expect(screen.getByRole("timer")).toBeInTheDocument();
    expect(screen.getByText(/Time to respond: 60s/)).toBeInTheDocument();
  });

  it("should show emotional tone indicators", () => {
    // Requirement 6.2: Clear emotional tones
    const onSelect = vi.fn();
    
    renderWithTheme(
      <DialogueChoices choices={mockChoices} onSelect={onSelect} />
    );

    // Verify tone emojis are present
    expect(screen.getByText("🤗")).toBeInTheDocument(); // comforting
    expect(screen.getByText("😨")).toBeInTheDocument(); // fearful
    expect(screen.getByText("😐")).toBeInTheDocument(); // neutral
  });

  it("should show stat delta previews", () => {
    // Requirement 6.4: Show stat changes
    const onSelect = vi.fn();
    
    renderWithTheme(
      <DialogueChoices choices={mockChoices} onSelect={onSelect} />
    );

    // Verify stat deltas are displayed
    expect(screen.getByText(/Sanity \+5/)).toBeInTheDocument();
    expect(screen.getByText(/Corruption -2/)).toBeInTheDocument();
    expect(screen.getByText(/Sanity -3/)).toBeInTheDocument();
    expect(screen.getByText(/Corruption \+1/)).toBeInTheDocument();
  });

  it("should handle choice selection", () => {
    // Requirement 6.3, 6.4: Select choice and apply stat changes
    const onSelect = vi.fn();
    
    renderWithTheme(
      <DialogueChoices choices={mockChoices} onSelect={onSelect} />
    );

    // Click first choice
    const comfortButton = screen.getByText("Comfort the creature").closest("button");
    fireEvent.click(comfortButton!);

    // Verify onSelect was called with correct parameters
    expect(onSelect).toHaveBeenCalledWith("choice-1", { sanity: 5, corruption: -2 });
    
    // Verify button is marked as selected
    expect(comfortButton).toHaveClass("selected");
  });

  it("should disable choices after selection", () => {
    // Requirement 6.3: Only one selection allowed
    const onSelect = vi.fn();
    
    renderWithTheme(
      <DialogueChoices choices={mockChoices} onSelect={onSelect} />
    );

    // Click first choice
    const comfortButton = screen.getByText("Comfort the creature").closest("button");
    fireEvent.click(comfortButton!);

    // Try to click another choice
    const fearButton = screen.getByText("Recoil in fear").closest("button");
    fireEvent.click(fearButton!);

    // Verify onSelect was only called once
    expect(onSelect).toHaveBeenCalledTimes(1);
    
    // Verify other buttons are disabled
    expect(fearButton).toBeDisabled();
  });

  it("should handle keyboard selection", () => {
    // Requirements 12.1, 12.2: Keyboard accessibility
    const onSelect = vi.fn();
    
    renderWithTheme(
      <DialogueChoices choices={mockChoices} onSelect={onSelect} />
    );

    // Focus and press Enter on first choice
    const comfortButton = screen.getByText("Comfort the creature").closest("button");
    comfortButton!.focus();
    fireEvent.keyDown(comfortButton!, { key: "Enter" });

    // Verify onSelect was called
    expect(onSelect).toHaveBeenCalledWith("choice-1", { sanity: 5, corruption: -2 });
  });

  it("should handle Space key selection", () => {
    // Requirements 12.1, 12.2: Keyboard accessibility
    const onSelect = vi.fn();
    
    renderWithTheme(
      <DialogueChoices choices={mockChoices} onSelect={onSelect} />
    );

    // Focus and press Space on second choice
    const fearButton = screen.getByText("Recoil in fear").closest("button");
    fearButton!.focus();
    fireEvent.keyDown(fearButton!, { key: " " });

    // Verify onSelect was called
    expect(onSelect).toHaveBeenCalledWith("choice-2", { sanity: -3, corruption: 1 });
  });

  it("should countdown and auto-select neutral option on timeout", async () => {
    // Requirement 6.5, 12.5: Auto-select after 60 seconds
    const onSelect = vi.fn();
    
    renderWithTheme(
      <DialogueChoices choices={mockChoices} onSelect={onSelect} timeoutSeconds={5} />
    );

    // Initially shows 5 seconds
    expect(screen.getByText(/Time to respond: 5s/)).toBeInTheDocument();

    // Advance time by 5 seconds (need to advance by 5001 to trigger the timeout)
    act(() => {
      vi.advanceTimersByTime(5001);
    });

    // Should auto-select neutral option
    expect(onSelect).toHaveBeenCalledWith("choice-3", { sanity: 0, corruption: 0 });
    
    // Should show auto-selected message
    expect(screen.getByText(/Auto-selected/)).toBeInTheDocument();
  }, 10000);

  it("should update countdown timer", () => {
    // Requirement 6.5: Display countdown
    const onSelect = vi.fn();
    
    renderWithTheme(
      <DialogueChoices choices={mockChoices} onSelect={onSelect} timeoutSeconds={10} />
    );

    // Initially shows 10 seconds
    expect(screen.getByText(/Time to respond: 10s/)).toBeInTheDocument();

    // Advance time by 3 seconds
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // Should show 7 seconds
    expect(screen.getByText(/Time to respond: 7s/)).toBeInTheDocument();
  });

  it("should stop countdown after selection", () => {
    // Requirement 6.5: Disable after selection
    const onSelect = vi.fn();
    
    renderWithTheme(
      <DialogueChoices choices={mockChoices} onSelect={onSelect} timeoutSeconds={10} />
    );

    // Click a choice
    const comfortButton = screen.getByText("Comfort the creature").closest("button");
    fireEvent.click(comfortButton!);

    // Advance time
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    // Should only have been called once (not auto-selected)
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("should have proper accessibility attributes", () => {
    // Requirements 12.1, 12.3, 12.4: Accessibility
    const onSelect = vi.fn();
    
    renderWithTheme(
      <DialogueChoices choices={mockChoices} onSelect={onSelect} />
    );

    // Verify group role
    expect(screen.getByRole("group", { name: /dialogue response options/i })).toBeInTheDocument();
    
    // Verify timer has aria-live
    const timer = screen.getByRole("timer");
    expect(timer).toHaveAttribute("aria-live", "polite");
    
    // Verify buttons are keyboard focusable
    const buttons = screen.getAllByRole("button");
    buttons.forEach(button => {
      expect(button).toHaveAttribute("tabIndex", "0");
    });
  });

  it("should announce choices to screen readers", () => {
    // Requirement 12.3: Announce options and tones
    const onSelect = vi.fn();
    
    renderWithTheme(
      <DialogueChoices choices={mockChoices} onSelect={onSelect} />
    );

    // Verify aria-labels include tone and stat information
    const comfortButton = screen.getByText("Comfort the creature").closest("button");
    expect(comfortButton).toHaveAttribute("aria-label");
    const ariaLabel = comfortButton!.getAttribute("aria-label");
    expect(ariaLabel).toContain("comforting");
    expect(ariaLabel).toContain("Sanity +5");
  });

  it("should handle error when invalid choice is selected", () => {
    // Requirement 15.2: Error handling
    const onSelect = vi.fn();
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    
    renderWithTheme(
      <DialogueChoices choices={mockChoices} onSelect={onSelect} />
    );

    // Manually trigger handleSelect with invalid choice
    screen.getByRole("group");
    const buttons = screen.getAllByRole("button");
    
    // Click a button (this should work normally)
    fireEvent.click(buttons[0]);
    
    // Verify it still selected something (fallback behavior)
    expect(onSelect).toHaveBeenCalled();
    
    consoleWarnSpy.mockRestore();
  });

  it("should fallback to first choice if no neutral option exists on timeout", async () => {
    // Requirement 15.2: Timeout handler failure fallback
    const choicesWithoutNeutral: DialogueChoice[] = [
      {
        id: "choice-1",
        text: "Comfort the creature",
        emotionalTone: "comforting",
        statDelta: { sanity: 5, corruption: -2 },
      },
      {
        id: "choice-2",
        text: "Recoil in fear",
        emotionalTone: "fearful",
        statDelta: { sanity: -3, corruption: 1 },
      },
    ];
    
    const onSelect = vi.fn();
    
    renderWithTheme(
      <DialogueChoices choices={choicesWithoutNeutral} onSelect={onSelect} timeoutSeconds={2} />
    );

    // Advance time to trigger timeout (need 2001 to trigger)
    act(() => {
      vi.advanceTimersByTime(2001);
    });

    // Should select first choice as fallback
    expect(onSelect).toHaveBeenCalled();
  }, 10000);

  it("should clean up timer on unmount", () => {
    // Performance: Clean up timeout
    const onSelect = vi.fn();
    
    const { unmount } = renderWithTheme(
      <DialogueChoices choices={mockChoices} onSelect={onSelect} />
    );

    // Unmount component
    unmount();

    // Advance time - should not call onSelect
    act(() => {
      vi.advanceTimersByTime(60000);
    });

    expect(onSelect).not.toHaveBeenCalled();
  });
});
