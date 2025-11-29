/**
 * ActionDock component - Modern floating action buttons using Dock
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { useMemo } from 'react';
import { Dock, type DockItemData } from './reactbits/Dock';
import { useTheme } from '../contexts/ThemeContext';
import './ActionDock.css';

export interface ActionDockProps {
  /** Handler for scavenge action */
  onScavenge: () => void;
  /** Handler for settings action */
  onSettings: () => void;
  /** Handler for zen mode action */
  onZenMode: () => void;
  /** Handler for placate action */
  onPlacate: () => void;
  /** Whether scavenging is currently in progress */
  isScavenging?: boolean;
  /** Whether scavenge is disabled (inventory full) */
  canScavenge?: boolean;
  /** Whether placate is on cooldown */
  isPlacateOnCooldown?: boolean;
  /** Remaining cooldown time in game minutes */
  placateCooldownRemaining?: number;
  /** Whether to disable animations (reduce motion) */
  reduceMotion?: boolean;
  /** Whether retro mode is enabled (disables React Bits animations) */
  retroMode?: boolean;
}

/**
 * ActionDock - Floating action dock with Scavenge, Settings, and Zen Mode buttons
 * Uses the Dock component with magnification on hover
 * Responsive: bottom on mobile, right side on desktop
 */
export function ActionDock({
  onScavenge,
  onSettings,
  onZenMode,
  onPlacate,
  isScavenging = false,
  canScavenge = true,
  isPlacateOnCooldown = false,
  placateCooldownRemaining = 0,
  reduceMotion = false,
  retroMode = false,
}: ActionDockProps) {
  const { mode } = useTheme();

  // Build dock items with action handlers
  // Requirement 5.1: Display Scavenge, Settings, Zen Mode actions
  // Requirement 5.3: Execute corresponding action on click
  // Requirement 6.7: Display Placate button with cooldown timer
  const dockItems: DockItemData[] = useMemo(() => [
    {
      icon: isScavenging ? '⏳' : '🔍',
      label: isScavenging ? 'Scavenging...' : (canScavenge ? 'Scavenge' : 'Inventory Full'),
      onClick: () => {
        if (canScavenge && !isScavenging) {
          onScavenge();
        }
      },
      className: `action-scavenge ${!canScavenge || isScavenging ? 'action-disabled' : ''}`,
    },
    {
      // Requirement 6.7: Show cooldown timer when on cooldown, disable button during cooldown
      icon: isPlacateOnCooldown ? '⏳' : '🤲',
      label: isPlacateOnCooldown ? `Cooldown: ${placateCooldownRemaining}s` : 'Placate',
      onClick: () => {
        if (!isPlacateOnCooldown) {
          onPlacate();
        }
      },
      className: `action-placate ${isPlacateOnCooldown ? 'action-disabled' : ''}`,
    },
    {
      icon: '⚙️',
      label: 'Settings',
      onClick: onSettings,
      className: 'action-settings',
    },
    {
      icon: '🧘',
      label: 'Zen Mode',
      onClick: onZenMode,
      className: 'action-zen',
    },
  ], [onScavenge, onSettings, onZenMode, onPlacate, isScavenging, canScavenge, isPlacateOnCooldown, placateCooldownRemaining]);

  return (
    <div 
      className={`action-dock-wrapper action-dock-${mode}`}
      data-mode={mode}
    >
      {/* Requirement 5.2: Magnification on hover via Dock component */}
      {/* Requirement 5.4, 5.5: Responsive positioning handled via CSS */}
      {/* Requirement 8.3: Disable animations in retro mode */}
      <Dock
        items={dockItems}
        className="action-dock"
        baseItemSize={50}
        magnification={70}
        panelHeight={68}
        distance={150}
        orientation="vertical"
        disableAnimation={reduceMotion || retroMode}
      />
    </div>
  );
}

export default ActionDock;
