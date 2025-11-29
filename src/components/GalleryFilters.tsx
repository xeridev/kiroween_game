import type { GalleryFilter } from "../utils/types";
import "./GalleryFilters.css";

interface GalleryFiltersProps {
  activeFilter: GalleryFilter;
  onFilterChange: (filter: GalleryFilter) => void;
}

const EVENT_FILTERS: Array<{ value: GalleryFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "evolution", label: "Evolution" },
  { value: "death", label: "Death" },
  { value: "placate", label: "Placate" },
  { value: "vomit", label: "Vomit" },
  { value: "insanity", label: "Insanity" },
  { value: "haunt", label: "Haunt" },
  { value: "feed", label: "Feed" },
];

/**
 * GalleryFilters Component
 * 
 * Filter buttons for each event type + "All"
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */
export function GalleryFilters({ activeFilter, onFilterChange }: GalleryFiltersProps) {
  return (
    <div className="gallery-filters" role="group" aria-label="Filter images by event type">
      {EVENT_FILTERS.map((filter) => (
        <button
          key={filter.value}
          className={`gallery-filter-button ${activeFilter === filter.value ? "active" : ""}`}
          onClick={() => onFilterChange(filter.value)}
          aria-pressed={activeFilter === filter.value}
          aria-label={`Filter by ${filter.label}`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
