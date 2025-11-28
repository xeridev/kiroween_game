/**
 * InventoryStack component - Interactive card stack for inventory items
 * Uses React Bits Stack component for drag and click interactions
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { useCallback, useMemo, useRef } from 'react';
import { gsap } from 'gsap';
import { Stack, type CardData } from './reactbits/Stack';
import type { Offering } from '../utils/types';
import { useTheme } from '../contexts/ThemeContext';
import { logError } from '../utils/errorLogger';
import './InventoryStack.css';

export interface InventoryStackProps {
  /** Array of inventory offerings */
  inventory: Offering[];
  /** Callback when an item is fed to the pet */
  onFeed: (itemId: string) => void;
  /** Callback when a card is clicked */
  onCardClick?: (itemId: string) => void;
  /** Whether to disable animations (reduce motion) */
  disableAnimation?: boolean;
  /** Custom class name */
  className?: string;
  /** Reference to the pet canvas for feed animation target */
  petCanvasRef?: React.RefObject<HTMLElement>;
}

/**
 * InventoryStack - Displays inventory items as an interactive card stack
 * Supports drag to dismiss, click to cycle, and feed animation
 */
export function InventoryStack({
  inventory,
  onFeed,
  onCardClick,
  disableAnimation = false,
  className = '',
  petCanvasRef,
}: InventoryStackProps) {
  const { mode } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  // Convert offerings to card data format for Stack component
  const cardsData: CardData[] = useMemo(() => {
    return inventory.map((offering) => ({
      id: offering.id,
      content: (
        <div 
          className={`inventory-card-content ${mode}`}
          data-card-id={offering.id}
        >
          <div className="inventory-card-icon" aria-hidden="true">
            {offering.icon}
          </div>
          <div className="inventory-card-title">Mystery Item</div>
          <div className="inventory-card-description">
            {offering.description}
          </div>
          <button
            className="inventory-card-feed-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleFeedClick(offering.id);
            }}
            aria-label={`Feed ${offering.description} to pet`}
          >
            Feed
          </button>
        </div>
      ),
    }));
  }, [inventory, mode]);

  // Animate card flying to pet canvas on feed
  const animateFeedToCanvas = useCallback((cardElement: HTMLElement | null) => {
    if (!cardElement || !petCanvasRef?.current || disableAnimation) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      try {
        const cardRect = cardElement.getBoundingClientRect();
        const canvasRect = petCanvasRef.current!.getBoundingClientRect();

        // Calculate target position (center of pet canvas)
        const targetX = canvasRect.left + canvasRect.width / 2 - cardRect.left - cardRect.width / 2;
        const targetY = canvasRect.top + canvasRect.height / 2 - cardRect.top - cardRect.height / 2;

        gsap.to(cardElement, {
          x: targetX,
          y: targetY,
          scale: 0.3,
          opacity: 0,
          rotation: 360,
          duration: 0.5,
          ease: 'power2.in',
          onComplete: resolve,
        });
      } catch (error) {
        logError('Feed animation failed', error instanceof Error ? error : new Error(String(error)));
        resolve();
      }
    });
  }, [petCanvasRef, disableAnimation]);

  // Handle feed button click with animation
  const handleFeedClick = useCallback(async (itemId: string) => {
    // Find the card content element and get its parent stack-card for animation
    const cardContent = containerRef.current?.querySelector(`[data-card-id="${itemId}"]`) as HTMLElement | null;
    const cardElement = cardContent?.closest('.stack-card') as HTMLElement | null;
    
    if (cardElement && !disableAnimation) {
      await animateFeedToCanvas(cardElement);
    }
    
    onFeed(itemId);
  }, [onFeed, animateFeedToCanvas, disableAnimation]);

  // Handle card click (cycle to next)
  const handleCardClick = useCallback((card: CardData) => {
    onCardClick?.(String(card.id));
  }, [onCardClick]);

  // Handle card sent to back (drag dismiss)
  const handleCardSentToBack = useCallback((_card: CardData) => {
    // Optional: could trigger some visual feedback here
  }, []);

  // Empty state
  if (inventory.length === 0) {
    return (
      <div 
        className={`inventory-stack-container inventory-stack-empty ${mode} ${className}`.trim()}
        role="region"
        aria-label="Inventory stack - empty"
      >
        <div className="inventory-stack-placeholder">
          <span className="placeholder-icon">📦</span>
          <span className="placeholder-text">No offerings found</span>
          <span className="placeholder-hint">Scavenge to find items</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`inventory-stack-container ${mode} ${className}`.trim()}
      role="region"
      aria-label={`Inventory stack with ${inventory.length} item${inventory.length !== 1 ? 's' : ''}`}
    >
      <Stack
        cardsData={cardsData}
        cardDimensions={{ width: 160, height: 200 }}
        randomRotation={true}
        sensitivity={80}
        sendToBackOnClick={true}
        onCardClick={handleCardClick}
        onCardSentToBack={handleCardSentToBack}
        disableAnimation={disableAnimation}
        className="inventory-stack"
      />
      <div className="inventory-stack-count" aria-live="polite">
        {inventory.length}/3
      </div>
    </div>
  );
}

export default InventoryStack;
