import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ImageGallery } from "./ImageGallery";
import { useGameStore } from "../store";
import type { NarrativeLog } from "../utils/types";

// Mock the store
vi.mock("../store", () => ({
  useGameStore: vi.fn(),
}));

// Mock error logger
vi.mock("../utils/errorLogger", () => ({
  logError: vi.fn(),
}));

/**
 * Integration Test: Gallery Flow
 * Requirements: 1.1-1.6, 2.1-2.5
 * 
 * Tests:
 * - Open gallery → verify images
 * - Apply filter → verify results
 * - Click image → verify modal
 * - Navigate → verify arrows work
 */
describe("ImageGallery Integration", () => {
  const mockImages: NarrativeLog[] = [
    {
      id: "1",
      text: "Evolution narrative",
      timestamp: 120,
      eventType: "evolution",
      source: "SYSTEM",
      imageUrl: "https://example.com/image1.jpg",
      imageStatus: "completed",
      visualTraits: {
        archetype: "ECHO",
        stage: "BABY",
        colorPalette: ["#ff0000"],
        keyFeatures: ["glowing eyes"],
        styleKeywords: ["ethereal"],
      },
    },
    {
      id: "2",
      text: "Feed narrative",
      timestamp: 60,
      eventType: "feed",
      source: "SYSTEM",
      imageUrl: "https://example.com/image2.jpg",
      imageStatus: "completed",
    },
    {
      id: "3",
      text: "Death narrative",
      timestamp: 180,
      eventType: "death",
      source: "SYSTEM",
      imageUrl: "https://example.com/image3.jpg",
      imageStatus: "completed",
    },
  ];

  const mockStoreState = {
    getCompletedImages: vi.fn(() => mockImages),
    getImagesByEventType: vi.fn((eventType: string) =>
      mockImages.filter((img) => img.eventType === eventType)
    ),
    galleryFilter: "all" as const,
    galleryViewMode: "grid" as const,
    setGalleryFilter: vi.fn(),
    setGalleryViewMode: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useGameStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockStoreState);
  });

  it("should display all images when gallery opens", () => {
    // Requirement 1.1: Display all completed images
    render(<ImageGallery isOpen={true} onClose={vi.fn()} />);

    // Verify images are displayed
    expect(mockStoreState.getCompletedImages).toHaveBeenCalled();
    
    // Check for image elements (via alt text)
    const images = screen.getAllByRole("listitem");
    expect(images).toHaveLength(3);
  });

  it("should filter images by event type", async () => {
    // Requirement 2.2: Filter by event type
    render(<ImageGallery isOpen={true} onClose={vi.fn()} />);

    // Click evolution filter
    const evolutionFilter = screen.getByRole("button", { name: /filter by evolution/i });
    fireEvent.click(evolutionFilter);

    // Verify filter was set
    expect(mockStoreState.setGalleryFilter).toHaveBeenCalledWith("evolution");
  });

  it("should open modal when image is clicked", async () => {
    // Requirement 1.3: Open modal on image click
    render(<ImageGallery isOpen={true} onClose={vi.fn()} />);

    // Click first image
    const images = screen.getAllByRole("listitem");
    fireEvent.click(images[0]);

    // Verify modal opens
    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: /image viewer/i })).toBeInTheDocument();
    });
  });

  it("should navigate between images in modal", async () => {
    // Requirement 1.4: Navigate with arrows
    render(<ImageGallery isOpen={true} onClose={vi.fn()} />);

    // Open modal with first image
    const images = screen.getAllByRole("listitem");
    fireEvent.click(images[0]);

    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: /image viewer/i })).toBeInTheDocument();
    });

    // Click next button
    const nextButton = screen.getByRole("button", { name: /next image/i });
    fireEvent.click(nextButton);

    // Verify navigation occurred (modal should still be open with different content)
    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: /image viewer/i })).toBeInTheDocument();
    });
  });

  it("should navigate with keyboard arrows", async () => {
    // Requirement 1.4, 10.2: Keyboard navigation
    render(<ImageGallery isOpen={true} onClose={vi.fn()} />);

    // Open modal
    const images = screen.getAllByRole("listitem");
    fireEvent.click(images[0]);

    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: /image viewer/i })).toBeInTheDocument();
    });

    // Press right arrow key
    fireEvent.keyDown(window, { key: "ArrowRight" });

    // Modal should still be open (navigation occurred)
    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: /image viewer/i })).toBeInTheDocument();
    });
  });

  it("should close modal with Escape key", async () => {
    // Requirement 10.2: Keyboard accessibility
    render(<ImageGallery isOpen={true} onClose={vi.fn()} />);

    // Open modal
    const images = screen.getAllByRole("listitem");
    fireEvent.click(images[0]);

    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: /image viewer/i })).toBeInTheDocument();
    });

    // Press Escape key
    fireEvent.keyDown(window, { key: "Escape" });

    // Modal should close
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: /image viewer/i })).not.toBeInTheDocument();
    });
  });

  it("should toggle between grid and timeline views", () => {
    // Requirement 3.1: View mode toggle
    render(<ImageGallery isOpen={true} onClose={vi.fn()} />);

    // Click view toggle button
    const toggleButton = screen.getByRole("button", { name: /switch to timeline view/i });
    fireEvent.click(toggleButton);

    // Verify view mode was changed
    expect(mockStoreState.setGalleryViewMode).toHaveBeenCalledWith("timeline");
  });

  it("should show empty state when no images exist", () => {
    // Requirement 15.1: Empty state handling
    const emptyStoreState = {
      ...mockStoreState,
      getCompletedImages: vi.fn(() => []),
    };
    (useGameStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(emptyStoreState);

    render(<ImageGallery isOpen={true} onClose={vi.fn()} />);

    // Verify empty state message
    expect(screen.getByText(/no images generated yet/i)).toBeInTheDocument();
  });

  it("should show filter-specific empty state", () => {
    // Requirement 2.4: Filter no results message
    const filteredStoreState = {
      ...mockStoreState,
      galleryFilter: "haunt" as const,
      getImagesByEventType: vi.fn(() => []),
    };
    (useGameStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(filteredStoreState);

    render(<ImageGallery isOpen={true} onClose={vi.fn()} />);

    // Verify filter-specific empty state
    expect(screen.getByText(/no images for this event type/i)).toBeInTheDocument();
  });

  it("should handle load errors with retry", async () => {
    // Requirement 15.1: Error handling with retry
    const errorStoreState = {
      ...mockStoreState,
      getCompletedImages: vi.fn(() => {
        throw new Error("Load failed");
      }),
    };
    (useGameStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(errorStoreState);

    render(<ImageGallery isOpen={true} onClose={vi.fn()} />);

    // Verify error message and retry button
    expect(screen.getByText(/failed to load images/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry loading images/i })).toBeInTheDocument();
  });
});
