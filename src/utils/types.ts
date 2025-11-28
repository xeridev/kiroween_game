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
}

// Game State Interface
export interface GameState {
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
  feed: (itemId: string) => void;
  addLog: (text: string, source: LogSource) => void;
  reset: () => void;
}
