/**
 * Sound Manager - Howler.js wrapper for game audio
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 7.1, 7.4
 */

import { Howl, Howler } from 'howler';
import { logError, logWarning, logInfo } from './errorLogger';
import type { SoundCatalog, SoundEntry } from './types';

// Critical sounds to preload for zero-latency playback (Requirement 7.4)
const CRITICAL_SOUNDS = [
  // Feeding sounds (most frequent action)
  'cute_a', 'cute_b', 'cute_c',           // PURITY feeding
  'liquid_slosh', 'liquid_bubbles',        // ROT feeding
  
  // Evolution stingers (important moments)
  'stinger_harmonized_tone_pleasant_but_spooky',  // BABY evolution
  'stinger_slow_stinger',                          // TEEN evolution
  'monster_monster_roar_4',                        // ABOMINATION transformation
  
  // UI feedback
  'character_woosh',                       // Scavenge discovery
  'character_coin_flip_3',                 // UI interaction
  
  // Sanity threshold transition
  'ambient_creepy_ambience_3',             // Low sanity ambient
  'ambient_suburban_neighborhood_morning'  // Normal ambient
];

export interface PlayOptions {
  volume?: number;         // Override volume (0-1)
  loop?: boolean;          // Override loop setting
  fade?: number;           // Fade in duration (ms)
  onEnd?: () => void;      // Callback when sound ends
}

interface SoundInstance {
  howl: Howl;
  entry: SoundEntry;
}

interface QueuedSound {
  soundId: string;
  options?: PlayOptions;
}

/**
 * SoundManager class - singleton wrapper for Howler.js
 * Handles playback, volume control, and browser autoplay policies
 */
class SoundManager {
  private catalog: SoundCatalog | null = null;
  private sounds: Map<string, SoundInstance> = new Map();
  private playbackIds: Map<string, number> = new Map(); // playbackId -> howl sound id
  private playbackCounter = 0;
  
  // Volume state (Requirement 2.5)
  private masterVolume = 0.7;
  private sfxVolume = 0.8;
  private ambientVolume = 0.5;
  private isMuted = false;
  
  // Ambient management (Requirement 2.6)
  private currentAmbient: { soundId: string; howl: Howl } | null = null;
  private crossfadeDuration = 2000; // 2 seconds
  
  // Autoplay policy handling (Requirements 2.3, 2.4)
  private unlocked = false;
  private queuedSounds: QueuedSound[] = [];


  /**
   * Initialize the sound manager with a catalog
   * Requirement 2.1: Create Howler.js instances for sounds in Sound_Pool
   */
  async initialize(catalog: SoundCatalog): Promise<void> {
    this.catalog = catalog;
    
    // Set initial Howler global volume
    Howler.volume(this.masterVolume);
    
    // Preload critical sounds (Requirement 7.4)
    await this.preloadSounds(CRITICAL_SOUNDS);
    
    logInfo('Sound manager initialized', { 
      catalogSize: catalog.sounds.length,
      preloadedCount: this.sounds.size 
    });
  }

  /**
   * Preload specific sounds for instant playback
   * Requirement 7.4: Preload critical sounds on game start
   */
  async preloadSounds(soundIds: string[]): Promise<void> {
    const loadPromises = soundIds.map(id => this.preloadSound(id));
    await Promise.allSettled(loadPromises);
  }

  /**
   * Preload a single sound
   * Requirement 7.1: Handle load errors gracefully
   */
  private async preloadSound(soundId: string): Promise<boolean> {
    if (!this.catalog) {
      logWarning('Cannot preload sound: catalog not initialized', { soundId });
      return false;
    }

    // Already loaded
    if (this.sounds.has(soundId)) {
      return true;
    }

    const entry = this.catalog.sounds.find(s => s.id === soundId);
    if (!entry) {
      logWarning('Sound not found in catalog', { soundId });
      return false;
    }

    return new Promise((resolve) => {
      try {
        const howl = new Howl({
          src: [`/${entry.path}`],
          loop: entry.loop,
          preload: true,
          onload: () => {
            this.sounds.set(soundId, { howl, entry });
            resolve(true);
          },
          onloaderror: (_id, error) => {
            logError(`Failed to load sound: ${soundId}`, 
              error instanceof Error ? error : new Error(String(error)),
              { soundId, path: entry.path }
            );
            resolve(false);
          }
        });
        
        // Store even before load completes for tracking
        this.sounds.set(soundId, { howl, entry });
      } catch (error) {
        logError(`Exception loading sound: ${soundId}`,
          error instanceof Error ? error : new Error(String(error)),
          { soundId }
        );
        resolve(false);
      }
    });
  }

  /**
   * Play a sound by ID
   * Requirement 2.2: Play sound with specified volume and loop settings
   * Requirement 7.1: Log error and return null without crashing on invalid ID
   */
  play(soundId: string, options?: PlayOptions): string | null {
    // If not unlocked, queue the sound (Requirement 2.3)
    if (!this.unlocked) {
      this.queuedSounds.push({ soundId, options });
      logInfo('Sound queued (audio locked)', { soundId });
      return null;
    }

    if (!this.catalog) {
      logError('Cannot play sound: catalog not initialized', undefined, { soundId });
      return null;
    }

    // Get or load the sound
    let instance = this.sounds.get(soundId);
    
    if (!instance) {
      const entry = this.catalog.sounds.find(s => s.id === soundId);
      if (!entry) {
        logError('Sound not found in catalog', undefined, { soundId });
        return null;
      }

      // Create on-demand
      try {
        const howl = new Howl({
          src: [`/${entry.path}`],
          loop: options?.loop ?? entry.loop,
        });
        instance = { howl, entry };
        this.sounds.set(soundId, instance);
      } catch (error) {
        logError(`Failed to create sound: ${soundId}`,
          error instanceof Error ? error : new Error(String(error)),
          { soundId }
        );
        return null;
      }
    }

    // Calculate effective volume: master * channel * sound-specific
    const soundVolume = options?.volume ?? 1;
    const channelVolume = instance.entry.category === 'ambient' ? this.ambientVolume : this.sfxVolume;
    const effectiveVolume = this.isMuted ? 0 : this.masterVolume * channelVolume * soundVolume;

    // Apply loop override if specified
    if (options?.loop !== undefined) {
      instance.howl.loop(options.loop);
    }

    // Play the sound
    const howlId = instance.howl.play();
    instance.howl.volume(effectiveVolume, howlId);

    // Handle fade in
    if (options?.fade && options.fade > 0) {
      instance.howl.fade(0, effectiveVolume, options.fade, howlId);
    }

    // Handle onEnd callback
    if (options?.onEnd) {
      instance.howl.once('end', options.onEnd, howlId);
    }

    // Generate playback ID
    const playbackId = `pb_${++this.playbackCounter}`;
    this.playbackIds.set(playbackId, howlId);

    return playbackId;
  }


  /**
   * Stop a specific sound by playback ID
   */
  stop(playbackId: string): void {
    const howlId = this.playbackIds.get(playbackId);
    if (howlId === undefined) {
      return;
    }

    // Find the howl instance that has this sound
    for (const instance of this.sounds.values()) {
      if (instance.howl.playing(howlId)) {
        instance.howl.stop(howlId);
        break;
      }
    }

    this.playbackIds.delete(playbackId);
  }

  /**
   * Stop all currently playing sounds
   */
  stopAll(): void {
    for (const instance of this.sounds.values()) {
      instance.howl.stop();
    }
    this.playbackIds.clear();
    
    // Also stop ambient
    if (this.currentAmbient) {
      this.currentAmbient.howl.stop();
      this.currentAmbient = null;
    }
  }

  // ============================================
  // Volume Control Methods (Requirement 2.5)
  // ============================================

  /**
   * Set master volume (affects all audio)
   * Requirement 2.5: Independent volume controls
   */
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    this.updateAllVolumes();
  }

  /**
   * Set SFX volume (affects non-ambient sounds)
   * Requirement 2.5: Independent volume controls
   */
  setSfxVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    this.updateAllVolumes();
  }

  /**
   * Set ambient volume (affects ambient/background sounds)
   * Requirement 2.5: Independent volume controls
   */
  setAmbientVolume(volume: number): void {
    this.ambientVolume = Math.max(0, Math.min(1, volume));
    this.updateAmbientVolume();
  }

  /**
   * Set muted state
   */
  setMuted(muted: boolean): void {
    this.isMuted = muted;
    this.updateAllVolumes();
  }

  /**
   * Get current volume settings
   */
  getVolumes(): { master: number; sfx: number; ambient: number; muted: boolean } {
    return {
      master: this.masterVolume,
      sfx: this.sfxVolume,
      ambient: this.ambientVolume,
      muted: this.isMuted
    };
  }

  /**
   * Update volumes for all playing sounds
   */
  private updateAllVolumes(): void {
    for (const instance of this.sounds.values()) {
      const channelVolume = instance.entry.category === 'ambient' ? this.ambientVolume : this.sfxVolume;
      const effectiveVolume = this.isMuted ? 0 : this.masterVolume * channelVolume;
      instance.howl.volume(effectiveVolume);
    }
    
    // Update ambient separately
    this.updateAmbientVolume();
  }

  /**
   * Update ambient sound volume specifically
   */
  private updateAmbientVolume(): void {
    if (this.currentAmbient) {
      const effectiveVolume = this.isMuted ? 0 : this.masterVolume * this.ambientVolume;
      this.currentAmbient.howl.volume(effectiveVolume);
    }
  }

  // ============================================
  // Ambient Sound Management (Requirement 2.6)
  // ============================================

  /**
   * Set ambient sound with crossfade
   * Requirement 2.6: Crossfade between ambient sounds over 2 seconds
   */
  setAmbient(soundId: string, crossfadeDuration?: number): void {
    if (!this.catalog) {
      logWarning('Cannot set ambient: catalog not initialized', { soundId });
      return;
    }

    // If same ambient is already playing, do nothing
    if (this.currentAmbient?.soundId === soundId) {
      return;
    }

    const entry = this.catalog.sounds.find(s => s.id === soundId);
    if (!entry) {
      logWarning('Ambient sound not found in catalog', { soundId });
      return;
    }

    const fadeDuration = crossfadeDuration ?? this.crossfadeDuration;
    const effectiveVolume = this.isMuted ? 0 : this.masterVolume * this.ambientVolume;

    // Create new ambient howl
    const newAmbient = new Howl({
      src: [`/${entry.path}`],
      loop: true,
      volume: 0, // Start at 0 for fade in
    });

    // Fade out old ambient
    if (this.currentAmbient) {
      const oldAmbient = this.currentAmbient.howl;
      oldAmbient.fade(oldAmbient.volume(), 0, fadeDuration);
      
      // Stop and unload after fade completes
      setTimeout(() => {
        oldAmbient.stop();
        oldAmbient.unload();
      }, fadeDuration);
    }

    // Play and fade in new ambient
    newAmbient.play();
    newAmbient.fade(0, effectiveVolume, fadeDuration);

    this.currentAmbient = { soundId, howl: newAmbient };
    
    logInfo('Ambient changed', { soundId, fadeDuration });
  }

  /**
   * Stop ambient sound
   */
  stopAmbient(): void {
    if (this.currentAmbient) {
      const fadeDuration = this.crossfadeDuration;
      const ambient = this.currentAmbient.howl;
      
      ambient.fade(ambient.volume(), 0, fadeDuration);
      
      setTimeout(() => {
        ambient.stop();
        ambient.unload();
      }, fadeDuration);
      
      this.currentAmbient = null;
    }
  }


  // ============================================
  // Browser Autoplay Policy Handling (Requirements 2.3, 2.4)
  // ============================================

  /**
   * Handle user interaction to unlock audio
   * Requirement 2.4: Unmute audio on first user interaction
   */
  handleUserInteraction(): void {
    if (this.unlocked) {
      return;
    }

    // Resume Howler's audio context
    if (Howler.ctx && Howler.ctx.state === 'suspended') {
      Howler.ctx.resume().then(() => {
        logInfo('Audio context resumed');
      }).catch((error) => {
        logError('Failed to resume audio context', 
          error instanceof Error ? error : new Error(String(error))
        );
      });
    }

    this.unlocked = true;
    logInfo('Audio unlocked by user interaction');

    // Play queued sounds
    this.playQueuedSounds();
  }

  /**
   * Check if audio is unlocked
   * Requirement 2.3: Track autoplay policy state
   */
  isUnlocked(): boolean {
    return this.unlocked;
  }

  /**
   * Play all queued sounds that were waiting for unlock
   */
  private playQueuedSounds(): void {
    const queue = [...this.queuedSounds];
    this.queuedSounds = [];

    for (const { soundId, options } of queue) {
      this.play(soundId, options);
    }

    if (queue.length > 0) {
      logInfo('Played queued sounds', { count: queue.length });
    }
  }

  // ============================================
  // Cleanup
  // ============================================

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.stopAll();
    
    for (const instance of this.sounds.values()) {
      instance.howl.unload();
    }
    
    this.sounds.clear();
    this.playbackIds.clear();
    this.queuedSounds = [];
    this.catalog = null;
    
    logInfo('Sound manager disposed');
  }

  // ============================================
  // Utility Methods
  // ============================================

  /**
   * Get a sound entry from the catalog
   */
  getSoundEntry(soundId: string): SoundEntry | undefined {
    return this.catalog?.sounds.find(s => s.id === soundId);
  }

  /**
   * Get sounds by category
   */
  getSoundsByCategory(category: string): SoundEntry[] {
    return this.catalog?.categories[category] ?? [];
  }

  /**
   * Get sounds by tag
   */
  getSoundsByTag(tag: string): SoundEntry[] {
    return this.catalog?.sounds.filter(s => s.tags.includes(tag)) ?? [];
  }

  /**
   * Check if a sound is currently playing
   */
  isPlaying(playbackId: string): boolean {
    const howlId = this.playbackIds.get(playbackId);
    if (howlId === undefined) {
      return false;
    }

    for (const instance of this.sounds.values()) {
      if (instance.howl.playing(howlId)) {
        return true;
      }
    }

    return false;
  }
}

// Export singleton instance
export const soundManager = new SoundManager();

// Export class for testing
export { SoundManager };

// Export critical sounds list for reference
export { CRITICAL_SOUNDS };
