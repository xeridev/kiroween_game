import { useState } from "react";
import type { Offering } from "./types";
import "./InventoryPanel.css";

interface InventoryPanelProps {
  inventory: Offering[];
  onFeed: (itemId: string) => void;
  canScavenge: boolean;
  onScavenge: () => void;
}

export function InventoryPanel({
  inventory,
  onFeed,
  canScavenge,
  onScavenge,
}: InventoryPanelProps) {
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

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

      <div className="inventory-grid" role="list" aria-label="Inventory items">
        {inventory.length === 0 ? (
          <div className="empty-inventory" role="status">
            No offerings found
          </div>
        ) : (
          inventory.map((offering) => (
            <button
              key={offering.id}
              className="inventory-item"
              onClick={() => onFeed(offering.id)}
              onMouseEnter={() => setHoveredItemId(offering.id)}
              onMouseLeave={() => setHoveredItemId(null)}
              onFocus={() => setHoveredItemId(offering.id)}
              onBlur={() => setHoveredItemId(null)}
              role="listitem"
              aria-label={`Feed offering: ${offering.description}`}
              title={offering.description}
            >
              <span className="item-icon" aria-hidden="true">
                {offering.icon}
              </span>
              {hoveredItemId === offering.id && (
                <div className="item-tooltip" role="tooltip">
                  {offering.description}
                </div>
              )}
            </button>
          ))
        )}
      </div>

      <button
        className="scavenge-button"
        onClick={onScavenge}
        disabled={!canScavenge}
        aria-label={
          canScavenge
            ? "Scavenge for new offerings"
            : "Cannot scavenge, inventory is full"
        }
      >
        {canScavenge ? "Scavenge for Offerings" : "Inventory Full"}
      </button>
    </div>
  );
}
