// Core Enums
export type PetStage = "EGG" | "BABY" | "TEEN" | "ABOMINATION";
export type Archetype = "GLOOM" | "SPARK" | "ECHO";
export type ItemType = "PURITY" | "ROT";
export type LogSource = "SYSTEM" | "PET";

// Pet Identity
export interface PetTraits {
  name: string;
  archetype: Archetype;
  color: number; // Hex color value
}

// Pet Status
export interface PetStats {
  hunger: number; // 0-100 (0 = satisfied, 100 = starving)
  sanity: number; // 0-100 (100 = stable, 0 = psychotic)
  corruption: number; // 0-100 (hidden from UI)
}

// Inventory Item
export interface Offering {
  id: string; // UUID
  type: ItemType; // Hidden from player
  description: string; // AI-generated, visible on hover
  icon: string; // Emoji or icon identifier
}

// Narrative System
export interface NarrativeLog {
  id: string;
  text: string;
  source: LogSource;
  timestamp: number; // Game time in minutes
  isPending?: boolean; // True while AI is generating text
}

// Sound System Types
export type SoundCategory =
  | "ambient"    // Background atmosphere
  | "monster"    // Creature sounds (Abyssal Horror, Monsters & Ghosts)
  | "cute"       // Positive/gentle sounds
  | "stinger"    // Jump scares and transitions
  | "character"  // Player action sounds
  | "household"  // Environmental sounds
  | "liquid"     // Wet/fluid sounds
  | "ui";        // Interface feedback

export interface SoundEntry {
  id: string;                    // Unique identifier (e.g., "ambient_creepy_3")
  path: string;                  // Relative path from public/ (e.g., "sounds/Ambient/Creepy_ambience_3.wav")
  category: SoundCategory;       // Primary category
  tags: string[];                // Searchable tags for AI selection
  loop: boolean;                 // Whether sound should loop
  description: string;           // Human-readable description for AI context
  duration?: number;             // Duration in seconds (optional)
}

export interface SoundCatalog {
  version: string;
  generatedAt: string;
  categories: {
    [category: string]: SoundEntry[];
  };
  sounds: SoundEntry[];
}

// Sound Context for AI selection
export interface SoundContext {
  petName?: string;
  stage?: PetStage;
  archetype?: Archetype;
  itemType?: ItemType;
  sanity?: number;
  corruption?: number;
  narrativeText?: string;
}

// Audio State Types
export interface AudioState {
  masterVolume: number;       // 0-1, global volume multiplier
  sfxVolume: number;          // 0-1, sound effects volume
  ambientVolume: number;      // 0-1, ambient/background volume
  isMuted: boolean;           // Whether all audio is muted
  hasUserInteracted: boolean; // Track autoplay unlock
}

export interface AudioActions {
  setMasterVolume: (volume: number) => void;
  setSfxVolume: (volume: number) => void;
  setAmbientVolume: (volume: number) => void;
  toggleMute: () => void;
  setUserInteracted: () => void;
  playSound: (eventType: string, context?: SoundContext) => Promise<void>;
}

// Drag-and-drop types
export type DragItemType = 'inventory-item';

export interface DragData {
  type: DragItemType;
  item: Offering;
}

// Animation component props
export interface CountUpProps {
  value: number;
  duration?: number;        // Default: 500ms
  decimals?: number;        // Default: 1
  onComplete?: () => void;
  className?: string;
}

export interface FadeInProps {
  children: React.ReactNode;
  duration?: number;        // Default: 400ms
  delay?: number;           // Default: 0ms
  blur?: boolean;           // Default: true
  className?: string;
  onComplete?: () => void;  // Callback when animation completes
}

// Droppable zone identifiers
export type DroppableId = 'game-canvas' | `inventory-slot-${number}`;

// Settings State Types
export interface SettingsState {
  gameSpeed: number;        // 0.5, 1, 2, 4 - game time multiplier
  crtEnabled: boolean;      // CRT scanline effect toggle
  reduceMotion: boolean;    // Disable animations
  retroMode: boolean;       // Retro mode: CRT overlay + disable React Bits animations
}

export interface SettingsActions {
  setGameSpeed: (speed: number) => void;
  setCrtEnabled: (enabled: boolean) => void;
  setReduceMotion: (enabled: boolean) => void;
  setRetroMode: (enabled: boolean) => void;
}

// Game State Interface (includes Audio State and Actions)
export interface GameState extends AudioState, AudioActions, SettingsState, SettingsActions {
  // Initialization
  isInitialized: boolean;

  // Pet Identity
  traits: PetTraits;

  // Pet Status
  stats: PetStats;
  stage: PetStage;
  age: number; // In game minutes
  isAlive: boolean;

  // Inventory & Economy
  inventory: Offering[];
  dailyFeeds: number;
  gameDay: number;

  // Narrative
  logs: NarrativeLog[];

  // Timestamps
  lastTickTime: number; // Real-world timestamp for offline decay

  // Actions
  initializePet: (name: string, archetype: Archetype, color: number) => void;
  tick: () => void;
  scavenge: () => Promise<void>;
  feed: (itemId: string) => Promise<void>;
  reorderInventory: (newInventory: Offering[]) => void;
  addLog: (text: string, source: LogSource, isPending?: boolean) => string;
  updateLogText: (logId: string, newText: string) => void;
  reset: () => void;
}
