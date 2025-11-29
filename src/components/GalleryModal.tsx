import { useEffect, useRef } from "react";
import type { NarrativeLog } from "../utils/types";
import "./GalleryModal.css";

interface GalleryModalProps {
  image: NarrativeLog;
  images: NarrativeLog[];
  onClose: () => void;
  onNavigate: (direction: "prev" | "next") => void;
}

/**
 * GalleryModal Component
 * 
 * Full-screen image display with navigation
 * Requirements: 1.3, 1.4, 10.2, 10.3
 */
export function GalleryModal({ image, images, onClose, onNavigate }: GalleryModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  // Find current index
  const currentIndex = images.findIndex(img => img.id === image.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;

  // Keyboard navigation (Requirement 1.4, 10.2)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          if (hasPrev) {
            onNavigate("prev");
          }
          break;
        case "ArrowRight":
          if (hasNext) {
            onNavigate("next");
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasPrev, hasNext, onClose, onNavigate]);

  // Swipe gesture support for mobile (Requirement 1.4)
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
      const swipeThreshold = 50; // Minimum swipe distance in pixels
      const swipeDistance = touchStartX.current - touchEndX.current;

      if (Math.abs(swipeDistance) > swipeThreshold) {
        if (swipeDistance > 0 && hasNext) {
          // Swiped left - go to next
          onNavigate("next");
        } else if (swipeDistance < 0 && hasPrev) {
          // Swiped right - go to previous
          onNavigate("prev");
        }
      }

      // Reset
      touchStartX.current = 0;
      touchEndX.current = 0;
    };

    const modal = modalRef.current;
    if (modal) {
      modal.addEventListener("touchstart", handleTouchStart);
      modal.addEventListener("touchmove", handleTouchMove);
      modal.addEventListener("touchend", handleTouchEnd);

      return () => {
        modal.removeEventListener("touchstart", handleTouchStart);
        modal.removeEventListener("touchmove", handleTouchMove);
        modal.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [hasPrev, hasNext, onNavigate]);

  // Focus trap (Requirement 10.3)
  useEffect(() => {
    // Focus close button on mount
    closeButtonRef.current?.focus();

    // Get all focusable elements
    const getFocusableElements = () => {
      if (!modalRef.current) return [];
      return Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      );
    };

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    window.addEventListener("keydown", handleTabKey);
    return () => window.removeEventListener("keydown", handleTabKey);
  }, []);

  // Format age for display
  const formatAge = (ageInMinutes: number): string => {
    const hours = Math.floor(ageInMinutes / 60);
    const minutes = Math.floor(ageInMinutes % 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div
      className="gallery-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
    >
      <div
        ref={modalRef}
        className="gallery-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          ref={closeButtonRef}
          className="gallery-modal-close"
          onClick={onClose}
          aria-label="Close image viewer"
        >
          ✕
        </button>

        {/* Navigation arrows */}
        {hasPrev && (
          <button
            className="gallery-modal-nav gallery-modal-nav-prev"
            onClick={() => onNavigate("prev")}
            aria-label="Previous image"
          >
            ‹
          </button>
        )}

        {hasNext && (
          <button
            className="gallery-modal-nav gallery-modal-nav-next"
            onClick={() => onNavigate("next")}
            aria-label="Next image"
          >
            ›
          </button>
        )}

        {/* Image */}
        <div className="gallery-modal-image-container">
          <img
            src={image.imageUrl || ""}
            alt={`${image.eventType || "Event"} at age ${formatAge(image.timestamp)}: ${image.text.substring(0, 100)}`}
            className="gallery-modal-image"
          />
        </div>

        {/* Image info */}
        <div className="gallery-modal-info">
          <div className="gallery-modal-meta">
            <span className="gallery-modal-age">Age: {formatAge(image.timestamp)}</span>
            {image.eventType && (
              <span className="gallery-modal-event-type">{image.eventType.toUpperCase()}</span>
            )}
            <span className="gallery-modal-position">
              {currentIndex + 1} / {images.length}
            </span>
          </div>
          <p className="gallery-modal-narrative">{image.text}</p>
        </div>
      </div>
    </div>
  );
}
