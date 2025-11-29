import { useState, useRef, useEffect } from "react";
import type { NarrativeLog } from "../utils/types";
import "./GalleryGrid.css";

interface GalleryGridProps {
  images: NarrativeLog[];
  onImageClick: (image: NarrativeLog) => void;
}

const IMAGES_PER_PAGE = 20;

/**
 * GalleryGrid Component
 * 
 * Responsive grid layout for images with lazy loading
 * Requirements: 1.1, 1.2, 1.5, 1.6
 * Performance: Lazy loading with IntersectionObserver (Requirement 1.5)
 */
export function GalleryGrid({ images, onImageClick }: GalleryGridProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Pagination (Requirement 1.5)
  const totalPages = Math.ceil(images.length / IMAGES_PER_PAGE);
  const startIndex = currentPage * IMAGES_PER_PAGE;
  const endIndex = startIndex + IMAGES_PER_PAGE;
  const visibleImages = images.slice(startIndex, endIndex);

  // Setup IntersectionObserver for lazy loading
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const imageId = entry.target.getAttribute("data-image-id");
            if (imageId) {
              setLoadedImages((prev) => new Set(prev).add(imageId));
            }
          }
        });
      },
      {
        rootMargin: "50px", // Load images 50px before they enter viewport
        threshold: 0.01,
      }
    );

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  // Observe image containers
  const imageContainerRef = (element: HTMLDivElement | null, _imageId: string) => {
    if (element && observerRef.current) {
      observerRef.current.observe(element);
    }
  };

  // Format age for display
  const formatAge = (ageInMinutes: number): string => {
    const hours = Math.floor(ageInMinutes / 60);
    const minutes = Math.floor(ageInMinutes % 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  if (images.length === 0) {
    return (
      <div className="gallery-grid-empty" role="status">
        <p>No images to display</p>
      </div>
    );
  }

  return (
    <div className="gallery-grid-container">
      {/* Grid (Requirements 1.1, 1.2, 1.6) */}
      <div className="gallery-grid" role="list">
        {visibleImages.map((image) => {
          const isLoaded = loadedImages.has(image.id);
          
          return (
            <div
              key={image.id}
              ref={(el) => imageContainerRef(el, image.id)}
              data-image-id={image.id}
              className="gallery-grid-item"
              role="listitem"
              onClick={() => onImageClick(image)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onImageClick(image);
                }
              }}
              tabIndex={0}
              aria-label={`View image from ${image.eventType || "event"} at age ${formatAge(image.timestamp)}`}
            >
              {isLoaded ? (
                <img
                  src={image.imageUrl || ""}
                  alt={`${image.eventType || "Event"} at age ${formatAge(image.timestamp)}`}
                  className="gallery-grid-image"
                />
              ) : (
                <div className="gallery-grid-placeholder" aria-label="Loading image">
                  <div className="gallery-grid-spinner" />
                </div>
              )}
              {image.eventType && (
                <div className="gallery-grid-badge" aria-label={`Event type: ${image.eventType}`}>
                  {image.eventType.toUpperCase()}
                </div>
              )}
              <div className="gallery-grid-age">{formatAge(image.timestamp)}</div>
            </div>
          );
        })}
      </div>

      {/* Pagination (Requirement 1.5) */}
      {totalPages > 1 && (
        <div className="gallery-grid-pagination" role="navigation" aria-label="Gallery pagination">
          <button
            className="gallery-pagination-button"
            onClick={handlePrevPage}
            disabled={currentPage === 0}
            aria-label="Previous page"
          >
            ‹ Prev
          </button>
          <span className="gallery-pagination-info" aria-live="polite">
            Page {currentPage + 1} of {totalPages}
          </span>
          <button
            className="gallery-pagination-button"
            onClick={handleNextPage}
            disabled={currentPage === totalPages - 1}
            aria-label="Next page"
          >
            Next ›
          </button>
        </div>
      )}
    </div>
  );
}
