import { useState, useCallback } from 'react';
import {
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import type { Offering } from "../utils/types";
import { SortableItem } from './SortableItem';
import { InventoryStack } from './InventoryStack';
import { useGameStore } from '../store';
import "./InventoryPanel.css";

interface InventoryPanelProps {
  inventory: Offering[];
  onFeed: (itemId: string) => void;
  canScavenge: boolean;
  onScavenge: () => void;
  isScavenging?: boolean;
  activeId?: string | null; // Currently dragged item ID (from parent DndContext)
  /** Use modern Stack-based UI (default: true) */
  useStackUI?: boolean;
  /** Reference to pet canvas for feed animation */
  petCanvasRef?: React.RefObject<HTMLElement>;
}

export function InventoryPanel({
  inventory,
  onFeed,
  canScavenge,
  onScavenge,
  isScavenging = false,
  activeId = null,
  useStackUI = true,
  petCanvasRef,
}: InventoryPanelProps) {
  // Track which item is being fed for fade-out animation (Requirement 5.3)
  const [feedingItemId, setFeedingItemId] = useState<string | null>(null);
  const reduceMotion = useGameStore((state) => state.reduceMotion);
  const retroMode = useGameStore((state) => state.retroMode);

  // Wrap onFeed to trigger fade-out animation before actual feed
  const handleFeed = useCallback((itemId: string) => {
    setFeedingItemId(itemId);
    // Delay actual feed to allow animation to play
    setTimeout(() => {
      onFeed(itemId);
      setFeedingItemId(null);
    }, 250); // Slightly less than animation duration for smooth transition
  }, [onFeed]);

  const maxInventory = 3;
  const currentCount = inventory.length;

  return (
    <div className="inventory-panel" role="region" aria-label="Inventory">
      <div className="inventory-header">
        <h3>Inventory</h3>
        <span
          className="inventory-capacity"
          aria-label={`${currentCount} of ${maxInventory} slots used`}
        >
          {currentCount}/{maxInventory}
        </span>
      </div>

      {useStackUI ? (
        /* Modern Stack-based UI (Requirements 4.1, 4.2, 4.3, 4.4, 4.5) */
        <div className="inventory-stack-wrapper">
          <InventoryStack
            inventory={inventory}
            onFeed={onFeed}
            disableAnimation={reduceMotion || retroMode}
            petCanvasRef={petCanvasRef}
          />
        </div>
      ) : (
        /* Legacy grid-based UI with drag-and-drop */
        <SortableContext
          items={inventory.map(item => item.id)}
          strategy={rectSortingStrategy}
        >
          <div 
            className={`inventory-cards ${activeId ? 'has-active-drag' : ''}`}
            role="list" 
            aria-label="Inventory items"
          >
            {inventory.length === 0 ? (
              <div className="empty-inventory" role="status">
                No offerings found
              </div>
            ) : (
              inventory.map((offering) => (
                <SortableItem
                  key={offering.id}
                  item={offering}
                  onFeed={handleFeed}
                  isFeedingOut={feedingItemId === offering.id}
                />
              ))
            )}
          </div>
        </SortableContext>
      )}

      <button
        className={`scavenge-button ${isScavenging ? 'is-scavenging' : ''}`}
        onClick={onScavenge}
        disabled={!canScavenge || isScavenging}
        aria-label={
          isScavenging
            ? "Scavenging for offerings..."
            : canScavenge
            ? "Scavenge for new offerings"
            : "Cannot scavenge, inventory is full"
        }
      >
        {isScavenging ? "Scavenging..." : canScavenge ? "Scavenge for Offerings" : "Inventory Full"}
      </button>
    </div>
  );
}
