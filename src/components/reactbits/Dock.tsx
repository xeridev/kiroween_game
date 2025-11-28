/**
 * Dock component - adapted from React Bits
 * Creates a macOS-style dock with magnification effect
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { useState, useRef, useCallback, useMemo } from 'react';
import { gsap } from 'gsap';
import { logError } from '../../utils/errorLogger';
import './Dock.css';

export interface DockItemData {
  /** Icon element or component */
  icon: React.ReactNode;
  /** Label for the item */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Optional custom class name */
  className?: string;
}

export interface SpringOptions {
  mass?: number;
  stiffness?: number;
  damping?: number;
}

export interface DockProps {
  /** Array of dock items */
  items: DockItemData[];
  /** Custom class name */
  className?: string;
  /** Distance for magnification calculation */
  distance?: number;
  /** Height of the dock panel */
  panelHeight?: number;
  /** Base size of each item */
  baseItemSize?: number;
  /** Maximum dock height */
  dockHeight?: number;
  /** Magnified size on hover */
  magnification?: number;
  /** Spring animation options */
  spring?: SpringOptions;
  /** Dock orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Whether to disable animations */
  disableAnimation?: boolean;
  /** Debug: Hidden */
  hidden?: boolean
}

/**
 * Dock component - macOS-style dock with magnification
 * Supports horizontal and vertical orientations
 */
export function Dock({
  items,
  className = '',
  distance = 200,
  panelHeight = 68,
  baseItemSize = 50,
  dockHeight = 256,
  magnification = 70,
  spring: _spring = { mass: 0.1, stiffness: 150, damping: 12 },
  orientation = 'horizontal',
  disableAnimation = false,
  hidden = true,
}: DockProps) {

  if (hidden) {
    return null
  }

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [itemSizes, setItemSizes] = useState<number[]>(items.map(() => baseItemSize));
  const dockRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Calculate magnification based on mouse distance
  const calculateMagnification = useCallback((mousePos: number, itemCenter: number) => {
    const dist = Math.abs(mousePos - itemCenter);
    if (dist > distance) return baseItemSize;
    
    const scale = 1 - (dist / distance);
    const sizeDiff = magnification - baseItemSize;
    return baseItemSize + sizeDiff * scale * scale; // Quadratic falloff
  }, [distance, baseItemSize, magnification]);

  // Handle mouse move over dock
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (disableAnimation) return;

    const dock = dockRef.current;
    if (!dock) return;

    const rect = dock.getBoundingClientRect();
    const mousePos = orientation === 'horizontal' 
      ? e.clientX - rect.left 
      : e.clientY - rect.top;

    const newSizes = items.map((_, index) => {
      const itemEl = itemRefs.current[index];
      if (!itemEl) return baseItemSize;

      const itemRect = itemEl.getBoundingClientRect();
      const itemCenter = orientation === 'horizontal'
        ? itemRect.left + itemRect.width / 2 - rect.left
        : itemRect.top + itemRect.height / 2 - rect.top;

      return calculateMagnification(mousePos, itemCenter);
    });

    setItemSizes(newSizes);
  }, [items, orientation, baseItemSize, calculateMagnification, disableAnimation]);

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    setHoveredIndex(null);
    
    if (disableAnimation) {
      setItemSizes(items.map(() => baseItemSize));
      return;
    }

    // Animate back to base size
    try {
      const targets = itemRefs.current.filter(Boolean);
      gsap.to(targets, {
        width: baseItemSize,
        height: baseItemSize,
        duration: 0.3,
        ease: 'power2.out',
        stagger: 0.02,
      });
    } catch (error) {
      logError('Dock animation failed', error instanceof Error ? error : new Error(String(error)));
    }
    
    setItemSizes(items.map(() => baseItemSize));
  }, [items, baseItemSize, disableAnimation]);

  // Handle item click
  const handleItemClick = useCallback((item: DockItemData, index: number) => {
    try {
      item.onClick();
    } catch (error) {
      logError(
        'Dock item click failed',
        error instanceof Error ? error : new Error(String(error)),
        { label: item.label, index }
      );
    }
  }, []);

  // Memoize dock styles
  const dockStyle = useMemo(() => ({
    height: orientation === 'horizontal' ? panelHeight : dockHeight,
    width: orientation === 'vertical' ? panelHeight : 'auto',
    flexDirection: orientation === 'horizontal' ? 'row' as const : 'column' as const,
  }), [orientation, panelHeight, dockHeight]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div
      ref={dockRef}
      className={`dock dock-${orientation} ${className}`.trim()}
      style={dockStyle}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      role="toolbar"
      aria-label="Action dock"
    >
      <div className="dock-panel">
        {items.map((item, index) => {
          const size = itemSizes[index];
          const isHovered = hoveredIndex === index;

          return (
            <button
              key={item.label}
              ref={(el) => { itemRefs.current[index] = el; }}
              className={`dock-item ${item.className || ''} ${isHovered ? 'dock-item-hovered' : ''}`.trim()}
              style={{
                width: size,
                height: size,
                transition: disableAnimation ? 'none' : undefined,
              }}
              onClick={() => handleItemClick(item, index)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              aria-label={item.label}
              title={item.label}
            >
              <span className="dock-item-icon">
                {item.icon}
              </span>
              {isHovered && (
                <span className="dock-item-tooltip">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default Dock;
