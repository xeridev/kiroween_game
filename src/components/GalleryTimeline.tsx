import { useState, useRef, useEffect } from "react";
import type { NarrativeLog, PetStage } from "../utils/types";
import "./GalleryTimeline.css";

interface GalleryTimelineProps {
  images: NarrativeLog[];
  onImageClick: (image: NarrativeLog) => void;
}

/**
 * GalleryTimeline Component
 * 
 * Vertical timeline with alternating images and lazy loading
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 * Performance: Lazy loading with IntersectionObserver (Requirement 1.5)
 */
export function GalleryTimeline({ images, onImageClick }: GalleryTimelineProps) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

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
        rootMargin: "100px", // Load images 100px before they enter viewport
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

  // Detect stage transitions (Requirement 3.3)
  const getStageTransitions = (): Array<{ index: number; fromStage: PetStage; toStage: PetStage; age: number }> => {
    const transitions: Array<{ index: number; fromStage: PetStage; toStage: PetStage; age: number }> = [];
    
    for (let i = 1; i < images.length; i++) {
      const prevImage = images[i - 1];
      const currentImage = images[i];
      
      // Check if this is an evolution event
      if (currentImage.eventType === "evolution" && prevImage.visualTraits && currentImage.visualTraits) {
        const fromStage = prevImage.visualTraits.stage;
        const toStage = currentImage.visualTraits.stage;
        
        if (fromStage !== toStage) {
          transitions.push({
            index: i,
            fromStage,
            toStage,
            age: currentImage.timestamp,
          });
        }
      }
    }
    
    return transitions;
  };

  // Find death event (Requirement 3.4)
  const deathEventIndex = images.findIndex(img => img.eventType === "death");

  const stageTransitions = getStageTransitions();

  if (images.length === 0) {
    return (
      <div className="gallery-timeline-empty" role="status">
        <p>No images to display</p>
      </div>
    );
  }

  return (
    <div className="gallery-timeline-container">
      <div className="gallery-timeline" role="list">
        {/* Timeline line */}
        <div className="timeline-line" aria-hidden="true" />

        {images.map((image, index) => {
          const isLeft = index % 2 === 0;
          const isDeathEvent = index === deathEventIndex;
          const stageTransition = stageTransitions.find(t => t.index === index);

          return (
            <div key={image.id} className="timeline-item-wrapper">
              {/* Stage transition marker (Requirement 3.3) */}
              {stageTransition && (
                <div className="timeline-stage-marker" role="status">
                  <div className="timeline-stage-marker-content">
                    <span className="timeline-stage-from">{stageTransition.fromStage}</span>
                    <span className="timeline-stage-arrow">→</span>
                    <span className="timeline-stage-to">{stageTransition.toStage}</span>
                  </div>
                </div>
              )}

              {/* Timeline item (Requirements 3.1, 3.2) */}
              <div
                className={`timeline-item ${isLeft ? "timeline-item-left" : "timeline-item-right"} ${isDeathEvent ? "timeline-item-death" : ""}`}
                role="listitem"
              >
                {/* Age marker */}
                <div className="timeline-age" aria-label={`Age: ${formatAge(image.timestamp)}`}>
                  {formatAge(image.timestamp)}
                </div>

                {/* Image */}
                <div
                  ref={(el) => imageContainerRef(el, image.id)}
                  data-image-id={image.id}
                  className="timeline-image-container"
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
                  {loadedImages.has(image.id) ? (
                    <img
                      src={image.imageUrl || ""}
                      alt={`${image.eventType || "Event"} at age ${formatAge(image.timestamp)}`}
                      className="timeline-image"
                    />
                  ) : (
                    <div className="timeline-image-placeholder" aria-label="Loading image">
                      <div className="timeline-image-spinner" />
                    </div>
                  )}
                  {image.eventType && (
                    <div className="timeline-badge" aria-label={`Event type: ${image.eventType}`}>
                      {image.eventType.toUpperCase()}
                    </div>
                  )}
                  {/* Death marker (Requirement 3.4) */}
                  {isDeathEvent && (
                    <div className="timeline-death-marker" aria-label="Death event">
                      ☠
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
