// Core Enums
export type PetStage = "EGG" | "BABY" | "TEEN" | "ABOMINATION";
export type Archetype = "GLOOM" | "SPARK" | "ECHO";
export type ItemType = "PURITY" | "ROT";
export type LogSource = "SYSTEM" | "PET";
export type Theme = "cute" | "horror";

// Death System Types
export type DeathCause = "STARVATION" | "INSANITY";

export interface DeathData {
  petName: string;
  archetype: Archetype;
  stage: PetStage;
  age: number;
  cause: DeathCause;
  finalStats: PetStats;
  timestamp: number;
  deathNarrative: string;
  epitaph: string;
}

export interface GhostData {
  id: string;
  petName: string;
  archetype: Archetype;
  stage: PetStage;
  color: number;
  deathCause: DeathCause;
  deathTimestamp: number;
  finalCorruption: number;
  epitaph: string;
}

// Insanity Event Types
export type InsanityEventType = "WHISPERS" | "SHADOWS" | "GLITCH" | "INVERSION";

// Placate and Haunt State Types
export interface PlacateState {
  lastPlacateTime: number | null;
  cooldownDuration: number; // 30 game minutes
}

// Placate Visual Effect State (Requirement 7.1)
export interface PlacateEffectState {
  isActive: boolean;
  archetype: Archetype | null;
  timestamp: number | null;
}

// Vomit Visual Effect State (Requirement 9.2)
export interface VomitEffectState {
  isActive: boolean;
  timestamp: number | null;
}

// Insanity Visual Effect State (Requirement 10.6)
export interface InsanityEffectState {
  isActive: boolean;
  eventType: InsanityEventType | null;
  timestamp: number | null;
}

export interface HauntState {
  lastHauntGameDay: number;
  hauntsEnabled: boolean;
}

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
export type ImageStatus = "idle" | "generating" | "completed" | "failed";

// Reaction System Types
export type ReactionType = "COMFORT" | "FEAR" | "LOVE" | "DREAD" | "HOPE";

export interface StatDelta {
  sanity?: number;
  corruption?: number;
  hunger?: number;
}

export interface ReactionData {
  reactionType: ReactionType;
  timestamp: number;
  statDelta: StatDelta;
}

export type ToneInfluence = string[];

// Event types for specialized image prompts
export type EventType = "evolution" | "death" | "placate" | "vomit" | "insanity" | "haunt" | "feed";

export interface NarrativeLog {
  id: string;
  text: string;
  source: LogSource;
  timestamp: number; // Game time in minutes
  isPending?: boolean; // True while AI is generating text
  imageUrl?: string; // Generated image URL (base64 data URL)
  imageStatus?: ImageStatus; // Image generation status
  sourceImages?: string[]; // Source images used for generation
  // Reaction system fields
  reactions?: ReactionData[];
  canReact?: boolean;
  // Auto-image generation fields
  autoGenerateImage?: boolean;
  eventType?: EventType;
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
  theme: Theme;             // Visual theme: "cute" or "horror"
}

export interface SettingsActions {
  setGameSpeed: (speed: number) => void;
  setCrtEnabled: (enabled: boolean) => void;
  setReduceMotion: (enabled: boolean) => void;
  setRetroMode: (enabled: boolean) => void;
  setTheme: (theme: Theme) => void;
}

// Pet Sprite Capture
export interface PetSpriteState {
  currentPetSpriteUrl: string | null; // Cached pet sprite as base64 data URL
}

export interface PetSpriteActions {
  updatePetSprite: (spriteUrl: string) => void;
  generateLogImage: (logId: string) => Promise<void>;
}

// Game State Interface (includes Audio State and Actions)
export interface GameState extends AudioState, AudioActions, SettingsState, SettingsActions, PetSpriteState, PetSpriteActions {
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

  // Death System State (Requirements 1.4, 6.4, 4.3)
  deathData: DeathData | null;
  lastPlacateTime: number | null;
  lastHauntGameDay: number;
  
  // Placate Visual Effect State (Requirement 7.1)
  placateEffect: PlacateEffectState;
  
  // Vomit Visual Effect State (Requirement 9.2)
  vomitEffect: VomitEffectState;
  
  // Insanity Visual Effect State (Requirement 10.6)
  insanityEffect: InsanityEffectState;
  
  // Auto-image generation flag (Requirement 8.2)
  autoGenerateImages: boolean;

  // Actions
  initializePet: (name: string, archetype: Archetype, color: number) => void;
  tick: () => void;
  scavenge: () => Promise<void>;
  feed: (itemId: string) => Promise<void>;
  reorderInventory: (newInventory: Offering[]) => void;
  addLog: (text: string, source: LogSource, isPending?: boolean, eventType?: EventType) => string;
  updateLogText: (logId: string, newText: string) => void;
  reset: () => void;
  
  // Death System Actions (Requirements 1.3, 5.3, 5.4)
  triggerDeath: (cause: DeathCause) => Promise<void>;
  startNewPet: () => void;
  
  // Placate Action (Requirements 6.1, 6.2, 6.3, 6.4, 6.6)
  placate: () => Promise<void>;
  
  // Placate Visual Effect Actions (Requirement 7.1)
  triggerPlacateEffect: () => void;
  clearPlacateEffect: () => void;
  
  // Vomit Visual Effect Actions (Requirement 9.2)
  clearVomitEffect: () => void;
  
  // Insanity Event Actions (Requirements 10.1, 10.2, 10.6)
  triggerInsanityEvent: () => Promise<void>;
  clearInsanityEffect: () => void;
  
  // Haunt System Actions (Requirements 4.4, 4.5, 4.6)
  triggerHaunt: () => Promise<void>;
  
  // Reaction System Actions (Requirements 1.2, 1.5, 3.1)
  addReaction: (logId: string, reactionType: ReactionType) => Promise<void>;
  getReactionHistory: () => ReactionData[];
}

// Reaction System Constants

// Stat deltas for each reaction type
export const REACTION_STAT_DELTAS: Record<ReactionType, StatDelta> = {
  COMFORT: { sanity: 2 },
  FEAR: { sanity: -3, corruption: 1 },
  LOVE: { sanity: 3, corruption: -1 },
  DREAD: { sanity: -2, corruption: 2 },
  HOPE: { sanity: 1 },
};

// Tone keywords for AI narrative generation
export const REACTION_TONE_KEYWORDS: Record<ReactionType, string> = {
  COMFORT: "comforted",
  FEAR: "terrified",
  LOVE: "cherished",
  DREAD: "haunted",
  HOPE: "hopeful",
};

// Theme-aware emoji mapping for reactions
export const REACTION_EMOJIS: Record<Theme, Record<ReactionType, string>> = {
  cute: {
    COMFORT: "🥰",
    FEAR: "😊",
    LOVE: "💖",
    DREAD: "✨",
    HOPE: "🌸",
  },
  horror: {
    COMFORT: "😨",
    FEAR: "😱",
    LOVE: "🖤",
    DREAD: "👻",
    HOPE: "🩸",
  },
};
