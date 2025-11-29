import { describe, it, expect } from 'vitest';
import type {
  GalleryViewMode,
  GalleryFilter,
  GenerationProgress,
  DialogueChoice,
  DialogueChoicePoint,
  VisualTraits,
  StorySummary,
  NarrativeContext,
  NarrativeLog,

} from './types';

describe('Narrative Enhancements Type Definitions', () => {
  it('should define GalleryViewMode type correctly', () => {
    const gridMode: GalleryViewMode = 'grid';
    const timelineMode: GalleryViewMode = 'timeline';
    
    expect(gridMode).toBe('grid');
    expect(timelineMode).toBe('timeline');
  });

  it('should define GalleryFilter type correctly', () => {
    const allFilter: GalleryFilter = 'all';
    const evolutionFilter: GalleryFilter = 'evolution';
    const deathFilter: GalleryFilter = 'death';
    
    expect(allFilter).toBe('all');
    expect(evolutionFilter).toBe('evolution');
    expect(deathFilter).toBe('death');
  });

  it('should define GenerationProgress interface correctly', () => {
    const progress: GenerationProgress = {
      startTime: Date.now(),
      pollCount: 5,
      estimatedTimeRemaining: 60,
    };
    
    expect(progress.startTime).toBeGreaterThan(0);
    expect(progress.pollCount).toBe(5);
    expect(progress.estimatedTimeRemaining).toBe(60);
  });

  it('should define DialogueChoice interface correctly', () => {
    const choice: DialogueChoice = {
      id: 'choice-1',
      text: 'Comfort the creature',
      emotionalTone: 'comforting',
      statDelta: { sanity: 2 },
    };
    
    expect(choice.id).toBe('choice-1');
    expect(choice.emotionalTone).toBe('comforting');
    expect(choice.statDelta.sanity).toBe(2);
  });

  it('should define DialogueChoicePoint interface correctly', () => {
    const choicePoint: DialogueChoicePoint = {
      logId: 'log-123',
      choices: [
        {
          id: 'choice-1',
          text: 'Comfort',
          emotionalTone: 'comforting',
          statDelta: { sanity: 2 },
        },
      ],
      selectedChoiceId: null,
      timestamp: Date.now(),
    };
    
    expect(choicePoint.logId).toBe('log-123');
    expect(choicePoint.choices).toHaveLength(1);
    expect(choicePoint.selectedChoiceId).toBeNull();
  });

  it('should define VisualTraits interface correctly', () => {
    const traits: VisualTraits = {
      archetype: 'GLOOM',
      stage: 'BABY',
      colorPalette: ['#000000', '#333333'],
      keyFeatures: ['glowing eyes', 'translucent body'],
      styleKeywords: ['ethereal', 'shadowy'],
    };
    
    expect(traits.archetype).toBe('GLOOM');
    expect(traits.stage).toBe('BABY');
    expect(traits.colorPalette).toHaveLength(2);
    expect(traits.keyFeatures).toContain('glowing eyes');
  });

  it('should define StorySummary interface correctly', () => {
    const summary: StorySummary = {
      petName: 'Shadow',
      summaryText: 'A tale of darkness...',
      generatedAt: Date.now(),
      keyEvents: ['Born', 'Evolved', 'Died'],
      finalStats: { hunger: 50, sanity: 30, corruption: 80 },
      totalAge: 1440,
    };
    
    expect(summary.petName).toBe('Shadow');
    expect(summary.keyEvents).toHaveLength(3);
    expect(summary.finalStats.corruption).toBe(80);
  });

  it('should define NarrativeContext interface correctly', () => {
    const context: NarrativeContext = {
      recentLogs: [],
      keyEvents: [
        { type: 'evolution', text: 'Evolved to BABY', age: 100 },
      ],
      statChanges: { sanity: -10, corruption: 5 },
      timeElapsed: 60,
    };
    
    expect(context.keyEvents).toHaveLength(1);
    expect(context.statChanges.sanity).toBe(-10);
    expect(context.timeElapsed).toBe(60);
  });

  it('should extend NarrativeLog with new optional fields', () => {
    const log: NarrativeLog = {
      id: 'log-1',
      text: 'Test log',
      source: 'SYSTEM',
      timestamp: 0,
      generationProgress: {
        startTime: Date.now(),
        pollCount: 3,
        estimatedTimeRemaining: 45,
      },
      dialogueChoice: {
        logId: 'log-1',
        choices: [],
        selectedChoiceId: null,
        timestamp: Date.now(),
      },
      visualTraits: {
        archetype: 'SPARK',
        stage: 'TEEN',
        colorPalette: ['#ffcc00'],
        keyFeatures: ['bright aura'],
        styleKeywords: ['luminous'],
      },
    };
    
    expect(log.generationProgress).toBeDefined();
    expect(log.dialogueChoice).toBeDefined();
    expect(log.visualTraits).toBeDefined();
    expect(log.visualTraits?.archetype).toBe('SPARK');
  });

  it('should allow all emotional tones for DialogueChoice', () => {
    const tones: Array<DialogueChoice['emotionalTone']> = [
      'comforting',
      'fearful',
      'loving',
      'neutral',
    ];
    
    expect(tones).toHaveLength(4);
    expect(tones).toContain('comforting');
    expect(tones).toContain('fearful');
    expect(tones).toContain('loving');
    expect(tones).toContain('neutral');
  });
});
