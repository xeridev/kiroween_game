import { useState, useEffect } from "react";
import { useGameStore } from "../store";
import type { NarrativeLog, GalleryFilter, GalleryViewMode } from "../utils/types";
import { GalleryFilters } from "./GalleryFilters";
import { GalleryGrid } from "./GalleryGrid";
import { GalleryTimeline } from "./GalleryTimeline";
import { GalleryModal } from "./GalleryModal";
import { logError } from "../utils/errorLogger";
import "./ImageGallery.css";

interface ImageGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  initialFilter?: GalleryFilter;
  viewMode?: GalleryViewMode;
}

/**
 * ImageGallery Component
 * 
 * Main gallery view with filtering and view mode toggle
 * Requirements: 1.1, 1.2, 3.1
 */
export function ImageGallery({
  isOpen,
  onClose,
  initialFilter = "all",
  viewMode: initialViewMode = "grid",
}: ImageGalleryProps) {
  const {
    getCompletedImages,
    getImagesByEventType,
    galleryFilter,
    galleryViewMode,
    setGalleryFilter,
    setGalleryViewMode,
  } = useGameStore();

  const [selectedImage, setSelectedImage] = useState<NarrativeLog | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // Initialize filter and view mode from props or store
  useEffect(() => {
    if (isOpen) {
      if (initialFilter !== galleryFilter) {
        setGalleryFilter(initialFilter);
      }
      if (initialViewMode !== galleryViewMode) {
        setGalleryViewMode(initialViewMode);
      }
    }
    // Only run on mount/open, not when filter/viewMode change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Get filtered images with error handling (Requirements 1.1, 2.2, 15.1)
  const [filteredImages, setFilteredImages] = useState<NarrativeLog[]>([]);

  useEffect(() => {
    try {
      setLoadError(null); // Clear any previous errors
      let images: NarrativeLog[];
      if (galleryFilter === "all") {
        images = getCompletedImages();
      } else {
        images = getImagesByEventType(galleryFilter);
      }
      setFilteredImages(images);
    } catch (error) {
      // Requirement 15.1: Handle load failure gracefully
      logError(
        "Failed to load gallery images",
        error instanceof Error ? error : new Error(String(error)),
        { filter: galleryFilter }
      );
      setLoadError("Failed to load images. Please try again.");
      setFilteredImages([]);
    }
  }, [galleryFilter, getCompletedImages, getImagesByEventType]);

  // Handle filter change (Requirement 2.2)
  const handleFilterChange = (filter: GalleryFilter) => {
    setGalleryFilter(filter);
    // Announce filter change to screen readers (Requirement 10.4)
    const announcement = filter === "all" 
      ? "Showing all images" 
      : `Showing ${filter} images`;
    announceToScreenReader(announcement);
  };

  // Handle view mode toggle (Requirement 3.1)
  const handleViewModeToggle = () => {
    const newMode = galleryViewMode === "grid" ? "timeline" : "grid";
    setGalleryViewMode(newMode);
    // Announce view mode change to screen readers
    announceToScreenReader(`Switched to ${newMode} view`);
  };

  // Handle image click (Requirement 1.3)
  const handleImageClick = (image: NarrativeLog) => {
    setSelectedImage(image);
  };

  // Handle modal close
  const handleModalClose = () => {
    setSelectedImage(null);
  };

  // Handle modal navigation with error handling (Requirement 1.4, 15.1)
  const handleModalNavigate = (direction: "prev" | "next") => {
    try {
      if (!selectedImage) return;

      const currentIndex = filteredImages.findIndex(img => img.id === selectedImage.id);
      
      // Requirement 15.1: Handle navigation errors gracefully
      if (currentIndex === -1) {
        logError(
          "Gallery navigation error: selected image not found in filtered images",
          new Error("Image not found"),
          { imageId: selectedImage.id, filter: galleryFilter }
        );
        // Stay on current image instead of crashing
        return;
      }

      let newIndex: number;

      if (direction === "prev") {
        newIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex;
      } else {
        newIndex = currentIndex < filteredImages.length - 1 ? currentIndex + 1 : currentIndex;
      }

      if (newIndex !== currentIndex && filteredImages[newIndex]) {
        setSelectedImage(filteredImages[newIndex]);
      }
    } catch (error) {
      // Requirement 15.1: Log error and stay on current image
      logError(
        "Gallery navigation error",
        error instanceof Error ? error : new Error(String(error)),
        { direction }
      );
      // Don't crash - just stay on current image
    }
  };

  // Retry loading images (Requirement 15.1)
  const handleRetry = () => {
    setIsRetrying(true);
    setLoadError(null);
    
    // Force re-render by toggling a state
    setTimeout(() => {
      setIsRetrying(false);
      // Trigger re-fetch by updating filter (will trigger useEffect)
      setGalleryFilter(galleryFilter);
    }, 500);
  };

  // Screen reader announcement helper (Requirement 10.4)
  const announceToScreenReader = (message: string) => {
    const announcement = document.createElement("div");
    announcement.setAttribute("role", "status");
    announcement.setAttribute("aria-live", "polite");
    announcement.className = "sr-only";
    announcement.textContent = message;
    document.body.appendChild(announcement);
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !selectedImage) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, selectedImage, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="image-gallery-overlay" role="dialog" aria-modal="true" aria-label="Image gallery">
      <div className="image-gallery-container">
        {/* Header */}
        <div className="image-gallery-header">
          <h2 className="image-gallery-title">Gallery</h2>
          <div className="image-gallery-controls">
            <button
              className="image-gallery-view-toggle"
              onClick={handleViewModeToggle}
              aria-label={`Switch to ${galleryViewMode === "grid" ? "timeline" : "grid"} view`}
            >
              {galleryViewMode === "grid" ? "Timeline" : "Grid"}
            </button>
            <button
              className="image-gallery-close"
              onClick={onClose}
              aria-label="Close gallery"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filters (Requirements 2.1, 2.2, 2.3, 2.4, 2.5) */}
        <GalleryFilters
          activeFilter={galleryFilter}
          onFilterChange={handleFilterChange}
        />

        {/* Content */}
        <div className="image-gallery-content">
          {loadError ? (
            // Error state with retry (Requirement 15.1)
            <div className="image-gallery-error" role="alert">
              <p>{loadError}</p>
              <button
                className="image-gallery-retry-button"
                onClick={handleRetry}
                disabled={isRetrying}
                aria-label="Retry loading images"
              >
                {isRetrying ? "Retrying..." : "Retry"}
              </button>
            </div>
          ) : filteredImages.length === 0 ? (
            // Empty state (Requirement 2.4, 15.1)
            <div className="image-gallery-empty" role="status">
              <p>
                {galleryFilter === "all"
                  ? "No images generated yet. Images will appear here as your pet's story unfolds."
                  : `No images for this event type`}
              </p>
            </div>
          ) : galleryViewMode === "grid" ? (
            // Grid view (Requirements 1.1, 1.2, 1.5, 1.6)
            <GalleryGrid images={filteredImages} onImageClick={handleImageClick} />
          ) : (
            // Timeline view (Requirements 3.1, 3.2, 3.3, 3.4, 3.5)
            <GalleryTimeline images={filteredImages} onImageClick={handleImageClick} />
          )}
        </div>
      </div>

      {/* Modal (Requirements 1.3, 1.4, 10.2, 10.3) */}
      {selectedImage && (
        <GalleryModal
          image={selectedImage}
          images={filteredImages}
          onClose={handleModalClose}
          onNavigate={handleModalNavigate}
        />
      )}
    </div>
  );
}
