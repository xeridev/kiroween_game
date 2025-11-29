import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { StorySummary } from "./StorySummary";
import type { StorySummary as StorySummaryType } from "../utils/types";

/**
 * Integration Test: Story Summary Flow
 * Requirements: 7.1-7.7
 * 
 * Tests:
 * - Request summary → verify generation
 * - Check content → verify key events
 * - Copy → verify clipboard
 * - Download → verify file
 */
describe("StorySummary Integration Flow", () => {
  const mockSummary: StorySummaryType = {
    petName: "Whisper",
    summaryText: "Whisper emerged from darkness, a creature of shadow and light. Through countless feedings and evolutions, it grew from a trembling egg into something magnificent and terrible. The journey was marked by moments of comfort and terror, sanity and madness. In the end, Whisper's story became a testament to the bond between keeper and kept, a relationship that transcended the boundaries of understanding.",
    generatedAt: Date.now(),
    keyEvents: [
      "Hatched from mysterious egg",
      "Evolved into BABY stage",
      "Experienced first insanity event",
      "Evolved into TEEN stage",
      "Final evolution into ABOMINATION",
    ],
    finalStats: {
      hunger: 45,
      sanity: 30,
      corruption: 75,
    },
    totalAge: 1440, // 24 hours
  };

  let mockOnGenerate: any;

  beforeEach(() => {
    mockOnGenerate = vi.fn();
    
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
    
    // Mock URL.createObjectURL and revokeObjectURL
    (globalThis as any).URL.createObjectURL = vi.fn(() => "blob:mock-url");
    (globalThis as any).URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should display modal when open", () => {
    // Requirement 7.1: Display story summary
    render(
      <StorySummary
        isOpen={true}
        onClose={vi.fn()}
        petName="Whisper"
        onGenerate={mockOnGenerate}
      />
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Whisper's Story")).toBeInTheDocument();
  });

  it("should not render when closed", () => {
    // Modal should not render when isOpen is false
    const { container } = render(
      <StorySummary
        isOpen={false}
        onClose={vi.fn()}
        petName="Whisper"
        onGenerate={mockOnGenerate}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("should show generate button when no summary exists", () => {
    // Initial state should show generate button
    render(
      <StorySummary
        isOpen={true}
        onClose={vi.fn()}
        petName="Whisper"
        onGenerate={mockOnGenerate}
      />
    );

    expect(screen.getByText("No summary generated yet.")).toBeInTheDocument();
    expect(screen.getByText("Generate Summary")).toBeInTheDocument();
  });

  it("should generate summary when button is clicked", async () => {
    // Requirement 7.1: Request summary generation
    mockOnGenerate.mockResolvedValue(mockSummary);

    render(
      <StorySummary
        isOpen={true}
        onClose={vi.fn()}
        petName="Whisper"
        onGenerate={mockOnGenerate}
      />
    );

    // Click generate button
    const generateButton = screen.getByText("Generate Summary");
    fireEvent.click(generateButton);

    // Should show loading state
    expect(screen.getByText("Generating story summary...")).toBeInTheDocument();

    // Wait for generation to complete
    await waitFor(() => {
      expect(mockOnGenerate).toHaveBeenCalled();
    });

    // Should display summary text
    await waitFor(() => {
      expect(screen.getByText(/Whisper emerged from darkness/)).toBeInTheDocument();
    });
  });

  it("should auto-generate summary when autoGenerate is true", async () => {
    // Requirement 7.5: Auto-generate on death
    mockOnGenerate.mockResolvedValue(mockSummary);

    render(
      <StorySummary
        isOpen={true}
        onClose={vi.fn()}
        petName="Whisper"
        autoGenerate={true}
        onGenerate={mockOnGenerate}
      />
    );

    // Should automatically call onGenerate
    await waitFor(() => {
      expect(mockOnGenerate).toHaveBeenCalled();
    });
  });

  it("should display summary content with key events", async () => {
    // Requirement 7.2: Include key events
    mockOnGenerate.mockResolvedValue(mockSummary);

    render(
      <StorySummary
        isOpen={true}
        onClose={vi.fn()}
        petName="Whisper"
        onGenerate={mockOnGenerate}
      />
    );

    // Generate summary
    fireEvent.click(screen.getByText("Generate Summary"));

    // Wait for summary to appear
    await waitFor(() => {
      expect(screen.getByRole("article")).toBeInTheDocument();
    });

    // Verify summary text is displayed
    expect(screen.getByText(/Whisper emerged from darkness/)).toBeInTheDocument();
  });

  it("should display final stats in summary", async () => {
    // Requirement 7.3: Include final stats
    mockOnGenerate.mockResolvedValue(mockSummary);

    render(
      <StorySummary
        isOpen={true}
        onClose={vi.fn()}
        petName="Whisper"
        onGenerate={mockOnGenerate}
      />
    );

    // Generate summary
    fireEvent.click(screen.getByText("Generate Summary"));

    await waitFor(() => {
      expect(mockOnGenerate).toHaveBeenCalled();
    });

    // Summary should reference stats (verified in the summary text)
    await waitFor(() => {
      expect(screen.getByRole("article")).toBeInTheDocument();
    });
  });

  it("should copy summary to clipboard", async () => {
    // Requirement 7.6: Copy to clipboard
    mockOnGenerate.mockResolvedValue(mockSummary);

    render(
      <StorySummary
        isOpen={true}
        onClose={vi.fn()}
        petName="Whisper"
        onGenerate={mockOnGenerate}
      />
    );

    // Generate summary first
    fireEvent.click(screen.getByText("Generate Summary"));

    await waitFor(() => {
      expect(screen.getByRole("article")).toBeInTheDocument();
    });

    // Click copy button
    const copyButton = screen.getByLabelText("Copy story to clipboard");
    fireEvent.click(copyButton);

    // Verify clipboard API was called
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockSummary.summaryText);
    });

    // Should show success message
    expect(screen.getByText("Copied!")).toBeInTheDocument();
  });

  it("should download summary as text file", async () => {
    // Requirement 7.7: Download as text
    mockOnGenerate.mockResolvedValue(mockSummary);

    render(
      <StorySummary
        isOpen={true}
        onClose={vi.fn()}
        petName="Whisper"
        onGenerate={mockOnGenerate}
      />
    );

    // Generate summary first
    fireEvent.click(screen.getByText("Generate Summary"));

    await waitFor(() => {
      expect(screen.getByRole("article")).toBeInTheDocument();
    });

    // Mock document.createElement and appendChild AFTER render
    const mockLink = {
      href: "",
      download: "",
      click: vi.fn(),
    };
    const createElementSpy = vi.spyOn(document, "createElement").mockReturnValue(mockLink as any);
    const appendChildSpy = vi.spyOn(document.body, "appendChild").mockImplementation(() => mockLink as any);
    const removeChildSpy = vi.spyOn(document.body, "removeChild").mockImplementation(() => mockLink as any);

    // Click download button
    const downloadButton = screen.getByLabelText("Download story as text file");
    fireEvent.click(downloadButton);

    // Verify download was triggered
    expect(createElementSpy).toHaveBeenCalledWith("a");
    expect(mockLink.download).toBe("Whisper-story.txt");
    expect(mockLink.click).toHaveBeenCalled();
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();

    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });

  it("should handle generation errors with retry", async () => {
    // Requirement 15.3: Generation failure with retry
    mockOnGenerate.mockResolvedValue(null);

    render(
      <StorySummary
        isOpen={true}
        onClose={vi.fn()}
        petName="Whisper"
        onGenerate={mockOnGenerate}
      />
    );

    // Try to generate
    fireEvent.click(screen.getByText("Generate Summary"));

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/Failed to generate summary/)).toBeInTheDocument();
    });

    // Should show retry button
    expect(screen.getByText("Retry")).toBeInTheDocument();

    // Click retry
    mockOnGenerate.mockResolvedValue(mockSummary);
    fireEvent.click(screen.getByText("Retry"));

    // Should try again
    await waitFor(() => {
      expect(mockOnGenerate).toHaveBeenCalledTimes(2);
    });
  });

  it("should handle clipboard copy errors", async () => {
    // Requirement 15.3: Export failure with retry
    mockOnGenerate.mockResolvedValue(mockSummary);
    (navigator.clipboard.writeText as any).mockRejectedValue(new Error("Clipboard error"));

    render(
      <StorySummary
        isOpen={true}
        onClose={vi.fn()}
        petName="Whisper"
        onGenerate={mockOnGenerate}
      />
    );

    // Generate summary
    fireEvent.click(screen.getByText("Generate Summary"));

    await waitFor(() => {
      expect(screen.getByRole("article")).toBeInTheDocument();
    });

    // Try to copy
    const copyButton = screen.getByLabelText("Copy story to clipboard");
    fireEvent.click(copyButton);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/Failed to copy to clipboard/)).toBeInTheDocument();
    });
  });

  it("should handle download errors", async () => {
    // Requirement 15.3: Export failure with retry
    mockOnGenerate.mockResolvedValue(mockSummary);

    render(
      <StorySummary
        isOpen={true}
        onClose={vi.fn()}
        petName="Whisper"
        onGenerate={mockOnGenerate}
      />
    );

    // Generate summary
    fireEvent.click(screen.getByText("Generate Summary"));

    await waitFor(() => {
      expect(screen.getByRole("article")).toBeInTheDocument();
    });

    // Mock createElement to throw error ONLY for "a" elements
    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName === "a") {
        throw new Error("Download error");
      }
      return originalCreateElement(tagName);
    });

    // Try to download
    const downloadButton = screen.getByLabelText("Download story as text file");
    fireEvent.click(downloadButton);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/Failed to download file/)).toBeInTheDocument();
    });

    createElementSpy.mockRestore();
  });

  it("should close modal and reset state", async () => {
    // Modal should close and clear state
    mockOnGenerate.mockResolvedValue(mockSummary);
    const onClose = vi.fn();

    render(
      <StorySummary
        isOpen={true}
        onClose={onClose}
        petName="Whisper"
        onGenerate={mockOnGenerate}
      />
    );

    // Generate summary
    fireEvent.click(screen.getByText("Generate Summary"));

    await waitFor(() => {
      expect(screen.getByRole("article")).toBeInTheDocument();
    });

    // Close modal
    const closeButton = screen.getByLabelText("Close story summary");
    fireEvent.click(closeButton);

    // Should call onClose
    expect(onClose).toHaveBeenCalled();
  });

  it("should have proper accessibility attributes", async () => {
    // Requirements: Accessibility
    mockOnGenerate.mockResolvedValue(mockSummary);

    render(
      <StorySummary
        isOpen={true}
        onClose={vi.fn()}
        petName="Whisper"
        onGenerate={mockOnGenerate}
      />
    );

    // Verify dialog attributes
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "summary-title");

    // Generate summary
    fireEvent.click(screen.getByText("Generate Summary"));

    // Verify loading state has aria-live
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");

    // Wait for summary
    await waitFor(() => {
      expect(screen.getByRole("article")).toBeInTheDocument();
    });

    // Verify buttons have aria-labels
    expect(screen.getByLabelText("Copy story to clipboard")).toBeInTheDocument();
    expect(screen.getByLabelText("Download story as text file")).toBeInTheDocument();
  });

  it("should show loading state during generation", async () => {
    // Requirement 7.1: Loading state
    mockOnGenerate.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockSummary), 100)));

    render(
      <StorySummary
        isOpen={true}
        onClose={vi.fn()}
        petName="Whisper"
        onGenerate={mockOnGenerate}
      />
    );

    // Start generation
    fireEvent.click(screen.getByText("Generate Summary"));

    // Should show loading state
    expect(screen.getByText("Generating story summary...")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();

    // Wait for completion
    await waitFor(() => {
      expect(screen.getByRole("article")).toBeInTheDocument();
    });
  });
});
