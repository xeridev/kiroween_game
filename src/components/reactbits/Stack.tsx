/**
 * Stack card component - adapted from React Bits
 * Creates an interactive card stack with drag and click interactions
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { useState, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { logError } from '../../utils/errorLogger';
import './Stack.css';

export interface CardData {
  id: string | number;
  img?: string;
  content?: React.ReactNode;
}

export interface StackProps {
  /** Array of card data */
  cardsData: CardData[];
  /** Card dimensions */
  cardDimensions?: { width: number; height: number };
  /** Apply random rotation to cards */
  randomRotation?: boolean;
  /** Drag sensitivity for sending card to back */
  sensitivity?: number;
  /** Send card to back on click */
  sendToBackOnClick?: boolean;
  /** Animation spring config */
  animationConfig?: { stiffness: number; damping: number };
  /** Custom class name */
  className?: string;
  /** Callback when card is clicked */
  onCardClick?: (card: CardData) => void;
  /** Callback when card is sent to back */
  onCardSentToBack?: (card: CardData) => void;
  /** Whether to disable animations */
  disableAnimation?: boolean;
}

/**
 * Stack component - interactive card stack
 * Supports drag to dismiss and click to cycle
 */
export function Stack({
  cardsData,
  cardDimensions = { width: 208, height: 208 },
  randomRotation = true,
  sensitivity = 100,
  sendToBackOnClick = true,
  animationConfig: _animationConfig = { stiffness: 260, damping: 20 },
  className = '',
  onCardClick,
  onCardSentToBack,
  disableAnimation = false,
}: StackProps) {

  const [cards, setCards] = useState(cardsData);
  const [rotations] = useState(() => 
    cardsData.map(() => randomRotation ? (Math.random() - 0.5) * 10 : 0)
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);

  // Send top card to back of stack
  const sendToBack = useCallback((cardIndex: number = 0) => {
    if (cards.length <= 1) return;

    const card = cards[cardIndex];
    const cardElement = containerRef.current?.querySelector(`[data-card-index="${cardIndex}"]`);
    
    if (cardElement && !disableAnimation) {
      try {
        // Animate card flying out
        gsap.to(cardElement, {
          x: 200,
          opacity: 0,
          duration: 0.3,
          ease: 'power2.in',
          onComplete: () => {
            // Move card to back
            setCards(prev => {
              const newCards = [...prev];
              const [removed] = newCards.splice(cardIndex, 1);
              newCards.push(removed);
              return newCards;
            });
            onCardSentToBack?.(card);
            
            // Reset position
            gsap.set(cardElement, { x: 0, opacity: 1 });
          }
        });
      } catch (error) {
        logError('Stack animation failed', error instanceof Error ? error : new Error(String(error)));
        // Fallback: instant move
        setCards(prev => {
          const newCards = [...prev];
          const [removed] = newCards.splice(cardIndex, 1);
          newCards.push(removed);
          return newCards;
        });
        onCardSentToBack?.(card);
      }
    } else {
      // No animation
      setCards(prev => {
        const newCards = [...prev];
        const [removed] = newCards.splice(cardIndex, 1);
        newCards.push(removed);
        return newCards;
      });
      onCardSentToBack?.(card);
    }
  }, [cards, disableAnimation, onCardSentToBack]);

  // Handle card click
  const handleCardClick = useCallback((card: CardData, index: number) => {
    if (isDraggingRef.current) return;
    
    onCardClick?.(card);
    
    if (sendToBackOnClick && index === 0) {
      sendToBack(0);
    }
  }, [onCardClick, sendToBackOnClick, sendToBack]);

  // Handle drag start
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    dragStartRef.current = { x: clientX, y: clientY };
    isDraggingRef.current = false;
  }, []);

  // Handle drag move
  const handleDragMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!dragStartRef.current.x && !dragStartRef.current.y) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const deltaX = clientX - dragStartRef.current.x;
    const deltaY = clientY - dragStartRef.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (distance > 10) {
      isDraggingRef.current = true;
    }
    
    // Update card position during drag
    const topCard = containerRef.current?.querySelector('[data-card-index="0"]');
    if (topCard && isDraggingRef.current) {
      gsap.set(topCard, { x: deltaX * 0.5, y: deltaY * 0.3 });
    }
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
    
    const deltaX = clientX - dragStartRef.current.x;
    
    // Reset drag start
    dragStartRef.current = { x: 0, y: 0 };
    
    // Check if drag exceeded sensitivity threshold
    if (isDraggingRef.current && Math.abs(deltaX) > sensitivity) {
      sendToBack(0);
    } else {
      // Snap back
      const topCard = containerRef.current?.querySelector('[data-card-index="0"]');
      if (topCard) {
        gsap.to(topCard, { x: 0, y: 0, duration: 0.3, ease: 'power2.out' });
      }
    }
    
    // Reset dragging flag after a short delay
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 50);
  }, [sensitivity, sendToBack]);


  if (cards.length === 0) {
    return (
      <div 
        className={`stack-container stack-empty ${className}`.trim()}
        style={{ width: cardDimensions.width, height: cardDimensions.height }}
      >
        <div className="stack-placeholder">
          No items
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`stack-container ${className}`.trim()}
      style={{ 
        width: cardDimensions.width, 
        height: cardDimensions.height,
        position: 'relative',
      }}
    >
      {cards.map((card, index) => {
        const isTop = index === 0;
        const zIndex = cards.length - index;
        const scale = 1 - index * 0.05;
        const yOffset = index * 8;
        const rotation = rotations[cardsData.findIndex(c => c.id === card.id)] || 0;

        return (
          <div
            key={card.id}
            data-card-index={index}
            className={`stack-card ${isTop ? 'stack-card-top' : ''}`}
            style={{
              width: cardDimensions.width,
              height: cardDimensions.height,
              zIndex,
              transform: `translateY(${yOffset}px) scale(${scale}) rotate(${rotation}deg)`,
              cursor: isTop ? 'grab' : 'default',
              pointerEvents: isTop ? 'auto' : 'none',
            }}
            onClick={() => handleCardClick(card, index)}
            onMouseDown={isTop ? handleDragStart : undefined}
            onMouseMove={isTop ? handleDragMove : undefined}
            onMouseUp={isTop ? handleDragEnd : undefined}
            onMouseLeave={isTop ? handleDragEnd : undefined}
            onTouchStart={isTop ? handleDragStart : undefined}
            onTouchMove={isTop ? handleDragMove : undefined}
            onTouchEnd={isTop ? handleDragEnd : undefined}
          >
            {card.img ? (
              <img 
                src={card.img} 
                alt="" 
                className="stack-card-image"
                draggable={false}
              />
            ) : card.content ? (
              <div className="stack-card-content">
                {card.content}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export default Stack;
