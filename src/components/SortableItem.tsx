import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Offering } from '../utils/types';
import './SortableItem.css';

interface SortableItemProps {
  item: Offering;
  onFeed: (itemId: string) => void;
  isDragging?: boolean;
  isFeedingOut?: boolean; // Whether this item is being fed and should fade out
}

export function SortableItem({ item, onFeed, isDragging = false, isFeedingOut = false }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ 
    id: item.id,
    data: {
      type: 'inventory-item' as const,
      item,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Combine isDragging prop (from DragOverlay) with useSortable's isDragging
  const isCurrentlyDragging = isDragging || isSortableDragging;

  const handleClick = () => {
    // Only trigger feed if not dragging
    if (!isCurrentlyDragging) {
      onFeed(item.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter/Space triggers feed when not in drag mode
    // The keyboard sensor handles drag mode separately
    if ((e.key === 'Enter' || e.key === ' ') && !isCurrentlyDragging) {
      e.preventDefault();
      onFeed(item.id);
    }
  };

  // Build class names
  const classNames = [
    'offering-card',
    'sortable-item',
    isCurrentlyDragging ? 'is-dragging' : '',
    isFeedingOut ? 'is-feeding-out' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={classNames}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`Feed offering: ${item.description}`}
      aria-grabbed={isCurrentlyDragging}
      {...attributes}
      {...listeners}
    >
      <div className="card-icon" aria-hidden="true">
        {item.icon}
      </div>
      <div className="card-title">Mystery Item</div>
      <div className="card-description">{item.description}</div>
    </div>
  );
}
