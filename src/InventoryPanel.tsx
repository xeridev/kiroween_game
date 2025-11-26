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

      <div className="inventory-cards" role="list" aria-label="Inventory items">
        {inventory.length === 0 ? (
          <div className="empty-inventory" role="status">
            No offerings found
          </div>
        ) : (
          inventory.map((offering) => (
            <div
              key={offering.id}
              className="offering-card"
              onClick={() => onFeed(offering.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onFeed(offering.id);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`Feed offering: ${offering.description}`}
            >
              <div className="card-icon" aria-hidden="true">
                {offering.icon}
              </div>
              <div className="card-title">Mystery Item</div>
              <div className="card-description">{offering.description}</div>
            </div>
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
