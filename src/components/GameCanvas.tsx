import { useEffect, useRef, useState, useCallback } from "react";
import * as PIXI from "pixi.js";
import { useDroppable } from "@dnd-kit/core";
import type { PetTraits, PetStage } from "../utils/types";
import { logError } from "../utils/errorLogger";
import {
  generatePetArt,
  loadCachedArt,
  saveCachedArt,
  getPlaceholderPath,
  placeholderExists,
} from "../utils/petArtGenerator";
import { AnimatedPetName } from "./AnimatedPetName";
import { AnimatedStageIndicator } from "./AnimatedStageIndicator";
import "./GameCanvas.css";

interface GameCanvasProps {
  traits: PetTraits;
  stage: PetStage;
  sanity: number;
  corruption: number;
  petName: string;
  isDropTarget?: boolean; // Whether an item is being dragged over this canvas
  reduceMotion?: boolean; // Whether to disable animations (Requirement 3.4)
  retroMode?: boolean; // Whether retro mode is enabled (Requirement 8.3)
}

// Mobile breakpoint constant
const MOBILE_BREAKPOINT = 768;
// Minimum canvas dimensions to prevent rendering issues
const MIN_CANVAS_WIDTH = 320;
const MIN_CANVAS_HEIGHT = 240;

/**
 * Calculate canvas dimensions based on container element
 * If containerElement is provided, use its dimensions
 * Otherwise fall back to viewport-based calculations
 */
export function calculateCanvasSize(containerElement?: HTMLElement | null): { width: number; height: number } {
  // If we have a container element, use its dimensions
  if (containerElement) {
    const rect = containerElement.getBoundingClientRect();
    return {
      width: Math.max(rect.width, MIN_CANVAS_WIDTH),
      height: Math.max(rect.height, MIN_CANVAS_HEIGHT),
    };
  }

  // Fallback to viewport-based calculations
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const isMobile = viewportWidth <= MOBILE_BREAKPOINT;

  const width = isMobile
    ? viewportWidth // 100vw on mobile
    : viewportWidth * 0.5; // 50vw on desktop

  const height = isMobile
    ? viewportHeight * 0.5 // 50vh on mobile
    : viewportHeight * 0.7; // 70vh on desktop

  // Enforce minimum dimensions
  return {
    width: Math.max(width, MIN_CANVAS_WIDTH),
    height: Math.max(height, MIN_CANVAS_HEIGHT),
  };
}

export function GameCanvas({
  traits,
  stage,
  sanity,
  corruption,
  petName,
  isDropTarget = false,
  reduceMotion = false,
  retroMode = false,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Set up droppable zone for drag-to-feed (Requirement 2.1)
  const { setNodeRef, isOver } = useDroppable({
    id: 'game-canvas',
  });
  
  // Combine refs for both PixiJS and droppable
  const combinedRef = useCallback((node: HTMLDivElement | null) => {
    // Set the ref for PixiJS
    (canvasRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    // Set the ref for droppable
    setNodeRef(node);
  }, [setNodeRef]);
  
  // Show drop indicator when dragging over (Requirement 2.1, 2.4)
  const showDropIndicator = isOver || isDropTarget;
  const appRef = useRef<PIXI.Application | null>(null);
  const petGraphicsRef = useRef<PIXI.Graphics | null>(null);
  const petSpriteRef = useRef<PIXI.Sprite | null>(null);
  const animationTimeRef = useRef<number>(0);
  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState(calculateCanvasSize);
  const [petArtUrl, setPetArtUrl] = useState<string | null>(null);
  const [useAIArt, setUseAIArt] = useState(true); // Toggle for AI art vs shapes

  // Debounced resize handler to prevent rapid successive calls
  const handleResize = useCallback(() => {
    // Clear any pending resize timeout
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }

    // Debounce resize by 100ms
    resizeTimeoutRef.current = setTimeout(() => {
      const newSize = calculateCanvasSize(canvasRef.current);
      setCanvasSize(newSize);

      if (appRef.current) {
        try {
          // Update PixiJS renderer dimensions
          appRef.current.renderer.resize(newSize.width, newSize.height);

          // Recenter and rescale pet graphics/sprite after resize
          if (petGraphicsRef.current) {
            petGraphicsRef.current.x = newSize.width / 2;
            petGraphicsRef.current.y = newSize.height / 2;
          }

          // Rescale sprite to cover new canvas size
          if (petSpriteRef.current) {
            const sprite = petSpriteRef.current;
            const texture = sprite.texture;

            if (texture && texture.width > 0 && texture.height > 0) {
              const scaleX = newSize.width / texture.width;
              const scaleY = newSize.height / texture.height;
              const scale = Math.max(scaleX, scaleY);

              sprite.scale.set(scale, scale);
              sprite.x = newSize.width / 2;
              sprite.y = newSize.height / 2;
            }
          }
        } catch (error) {
          logError(
            "Error during canvas resize",
            error instanceof Error ? error : undefined,
            { width: newSize.width, height: newSize.height }
          );
        }
      }
    }, 100);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Get initial canvas size from container
    const initialSize = calculateCanvasSize(canvasRef.current);

    // Initialize PixiJS application
    const app = new PIXI.Application();

    app
      .init({
        width: initialSize.width,
        height: initialSize.height,
        backgroundColor: 0x1a1a1a,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      })
      .then(() => {
        if (canvasRef.current && app.canvas) {
          canvasRef.current.appendChild(app.canvas);
          appRef.current = app;

          // Create pet graphics centered in canvas
          const petGraphics = new PIXI.Graphics();
          petGraphics.x = app.screen.width / 2;
          petGraphics.y = app.screen.height / 2;
          app.stage.addChild(petGraphics);
          petGraphicsRef.current = petGraphics;

          // Start animation loop with error handling
          app.ticker.add((ticker) => {
            try {
              animationTimeRef.current += ticker.deltaTime;
              updatePetGraphics();
            } catch (error) {
              logError(
                "Error during animation frame",
                error instanceof Error ? error : undefined,
                { stage, sanity }
              );
              // Fallback to static rendering
              setRenderError("Animation error - using static rendering");
            }
          });
        }
      })
      .catch((error) => {
        logError(
          "Failed to initialize PixiJS",
          error instanceof Error ? error : undefined
        );
        setRenderError("Failed to initialize graphics renderer");
      });

    // Add resize event listener with debouncing
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      // Clear any pending resize timeout
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      if (appRef.current) {
        appRef.current.destroy(true, { children: true });
        appRef.current = null;
      }
    };
  }, [handleResize]);

  // Load or generate AI art when stage changes
  useEffect(() => {
    if (!useAIArt) return;

    const loadArt = async () => {
      // 1. Try to load placeholder immediately (instant feedback)
      const hasPlaceholder = await placeholderExists(traits.archetype, stage);
      if (hasPlaceholder) {
        setPetArtUrl(getPlaceholderPath(traits.archetype, stage));
      }

      // 2. Check cache for AI-generated art
      const cached = loadCachedArt(petName, traits.archetype, stage);
      if (cached) {
        setPetArtUrl(cached);
        return;
      }

      // 3. Generate new AI art (replaces placeholder when ready)
      try {
        const colorHex = `#${traits.color.toString(16).padStart(6, "0")}`;
        const artUrl = await generatePetArt(
          traits.archetype,
          stage,
          colorHex,
          petName
        );
        setPetArtUrl(artUrl);
        saveCachedArt(petName, traits.archetype, stage, artUrl);
      } catch (error) {
        logError(
          "Failed to generate pet art, falling back to shapes",
          error instanceof Error ? error : undefined
        );
        // If placeholder exists, keep using it; otherwise fall back to shapes
        if (!hasPlaceholder) {
          setUseAIArt(false);
        }
      }
    };

    loadArt();
  }, [traits, stage, petName, useAIArt]);

  // Update pet graphics when props change
  useEffect(() => {
    updatePetGraphics();
  }, [traits, stage, sanity, corruption, petArtUrl]);

  const updatePetGraphics = async () => {
    const app = appRef.current;
    if (!app) return;

    // If using AI art and we have a URL, display sprite
    if (useAIArt && petArtUrl) {
      // Remove old graphics if they exist
      if (petGraphicsRef.current) {
        app.stage.removeChild(petGraphicsRef.current);
        petGraphicsRef.current = null;
      }

      // Create or update sprite
      try {
        if (!petSpriteRef.current) {
          // Load texture and create sprite
          const texture = await PIXI.Assets.load(petArtUrl);

          if (!texture || !texture.source) {
            throw new Error(`Failed to load texture from: ${petArtUrl}`);
          }

          const sprite = new PIXI.Sprite(texture);

          // Scale sprite to cover entire canvas
          // Calculate scale to cover (not contain) the canvas
          const scaleX = app.screen.width / texture.width;
          const scaleY = app.screen.height / texture.height;
          const scale = Math.max(scaleX, scaleY); // Use max to cover, not contain

          sprite.scale.set(scale, scale);
          sprite.anchor.set(0.5, 0.5);
          sprite.x = app.screen.width / 2;
          sprite.y = app.screen.height / 2;

          // Apply horror effects
          if (sanity < 30) {
            const shakeIntensity = (30 - sanity) / 30;
            sprite.x += (Math.random() - 0.5) * 20 * shakeIntensity;
            sprite.y += (Math.random() - 0.5) * 20 * shakeIntensity;
            sprite.alpha = 0.7 + Math.random() * 0.3;
          }

          app.stage.addChild(sprite);
          petSpriteRef.current = sprite;
        } else {
          // Update existing sprite position for horror effects
          const sprite = petSpriteRef.current;
          sprite.x = app.screen.width / 2;
          sprite.y = app.screen.height / 2;

          if (sanity < 30) {
            const shakeIntensity = (30 - sanity) / 30;
            sprite.x += (Math.random() - 0.5) * 20 * shakeIntensity;
            sprite.y += (Math.random() - 0.5) * 20 * shakeIntensity;
            sprite.alpha = 0.7 + Math.random() * 0.3;
          } else {
            sprite.alpha = 1;
          }
        }
      } catch (error) {
        logError(
          "Failed to load pet sprite",
          error instanceof Error ? error : undefined
        );
        setUseAIArt(false); // Fall back to shapes
      }
      return;
    }

    // Fall back to shape rendering
    const petGraphics = petGraphicsRef.current;
    if (!petGraphics) return;

    petGraphics.clear();

    // Get base size based on stage
    const baseSize = getStageSize(stage);

    // Apply horror effects when sanity < 30
    const horrorActive = sanity < 30;
    let offsetX = 0;
    let offsetY = 0;

    if (horrorActive) {
      // Position shake effect
      const shakeIntensity = (30 - sanity) / 30; // 0 to 1
      offsetX = (Math.random() - 0.5) * 20 * shakeIntensity;
      offsetY = (Math.random() - 0.5) * 20 * shakeIntensity;
    }

    // Draw pet based on archetype
    switch (traits.archetype) {
      case "GLOOM":
        drawGloomPet(
          petGraphics,
          baseSize,
          traits.color,
          horrorActive,
          offsetX,
          offsetY
        );
        break;
      case "SPARK":
        drawSparkPet(
          petGraphics,
          baseSize,
          traits.color,
          horrorActive,
          offsetX,
          offsetY
        );
        break;
      case "ECHO":
        drawEchoPet(
          petGraphics,
          baseSize,
          traits.color,
          horrorActive,
          offsetX,
          offsetY
        );
        break;
    }
  };

  const getStageSize = (stage: PetStage): number => {
    switch (stage) {
      case "EGG":
        return 80;
      case "BABY":
        return 120;
      case "TEEN":
        return 160;
      case "ABOMINATION":
        return 240;
      default:
        return 120;
    }
  };

  const drawGloomPet = (
    graphics: PIXI.Graphics,
    baseSize: number,
    color: number,
    horrorActive: boolean,
    offsetX: number,
    offsetY: number
  ) => {
    // GLOOM: circle with squash/stretch animation
    const time = animationTimeRef.current * 0.05;
    const squash = Math.sin(time) * 0.2 + 1; // Oscillates between 0.8 and 1.2
    const stretch = 1 / squash; // Maintain volume

    const radiusX = baseSize * squash;
    const radiusY = baseSize * stretch;

    // Main body
    const bodyAlpha = horrorActive ? 0.7 + Math.random() * 0.3 : 1;
    graphics.ellipse(offsetX, offsetY, radiusX, radiusY);
    graphics.fill({ color, alpha: bodyAlpha });

    // Eyes
    const eyeSize = baseSize * 0.15;
    const eyeSpacing = baseSize * 0.4;

    // Left eye
    graphics.circle(offsetX - eyeSpacing, offsetY - baseSize * 0.2, eyeSize);
    graphics.fill({ color: 0x000000 });

    // Right eye
    graphics.circle(offsetX + eyeSpacing, offsetY - baseSize * 0.2, eyeSize);
    graphics.fill({ color: 0x000000 });

    // Glow effect (outer ring)
    graphics.ellipse(offsetX, offsetY, radiusX * 1.2, radiusY * 1.2);
    graphics.stroke({ width: 3, color, alpha: 0.3 });
  };

  const drawSparkPet = (
    graphics: PIXI.Graphics,
    baseSize: number,
    color: number,
    horrorActive: boolean,
    offsetX: number,
    offsetY: number
  ) => {
    // SPARK: triangle with jitter/glitch animation
    const jitterIntensity = horrorActive ? 10 : 3;
    const jitterX = (Math.random() - 0.5) * jitterIntensity;
    const jitterY = (Math.random() - 0.5) * jitterIntensity;

    const height = baseSize * 1.5;
    const halfBase = baseSize * 0.866; // sqrt(3)/2 for equilateral triangle

    // Main triangle body
    const bodyAlpha = horrorActive ? 0.6 + Math.random() * 0.4 : 1;

    graphics.moveTo(offsetX + jitterX, offsetY - height / 2 + jitterY);
    graphics.lineTo(
      offsetX - halfBase + jitterX,
      offsetY + height / 2 + jitterY
    );
    graphics.lineTo(
      offsetX + halfBase + jitterX,
      offsetY + height / 2 + jitterY
    );
    graphics.closePath();
    graphics.fill({ color, alpha: bodyAlpha });

    // Eyes
    const eyeSize = baseSize * 0.12;
    const eyeY = offsetY - baseSize * 0.2;

    // Left eye
    graphics.circle(offsetX - baseSize * 0.25, eyeY, eyeSize);
    graphics.fill({ color: 0x000000 });

    // Right eye
    graphics.circle(offsetX + baseSize * 0.25, eyeY, eyeSize);
    graphics.fill({ color: 0x000000 });

    // Energy outline
    graphics.moveTo(offsetX + jitterX, offsetY - height / 2 + jitterY - 15);
    graphics.lineTo(
      offsetX - halfBase + jitterX - 15,
      offsetY + height / 2 + jitterY + 15
    );
    graphics.lineTo(
      offsetX + halfBase + jitterX + 15,
      offsetY + height / 2 + jitterY + 15
    );
    graphics.closePath();
    graphics.stroke({ width: 4, color, alpha: 0.5 });

    // Electric spark lines
    const time = animationTimeRef.current * 0.1;
    for (let i = 0; i < 3; i++) {
      const angle = (time + i * 2) % 6.28;
      const sparkLength = baseSize * 0.5;
      graphics.moveTo(offsetX, offsetY);
      graphics.lineTo(
        offsetX + Math.cos(angle) * sparkLength,
        offsetY + Math.sin(angle) * sparkLength
      );
    }
    graphics.stroke({ width: 2, color: 0xffffff, alpha: 0.8 });
  };

  const drawEchoPet = (
    graphics: PIXI.Graphics,
    baseSize: number,
    color: number,
    horrorActive: boolean,
    offsetX: number,
    offsetY: number
  ) => {
    // ECHO: diamond with opacity pulse animation
    const time = animationTimeRef.current * 0.03;
    const pulse = Math.sin(time) * 0.3 + 0.7; // Oscillates between 0.4 and 1.0

    const size = baseSize * 1.2;

    // Main diamond body
    const bodyAlpha = horrorActive ? pulse * (0.3 + Math.random() * 0.4) : pulse;

    graphics.moveTo(offsetX, offsetY - size);
    graphics.lineTo(offsetX + size, offsetY);
    graphics.lineTo(offsetX, offsetY + size);
    graphics.lineTo(offsetX - size, offsetY);
    graphics.closePath();
    graphics.fill({ color, alpha: bodyAlpha });

    // Eyes
    const eyeSize = baseSize * 0.12;

    // Left eye
    graphics.circle(offsetX - baseSize * 0.3, offsetY - baseSize * 0.15, eyeSize);
    graphics.fill({ color: 0x000000 });

    // Right eye
    graphics.circle(offsetX + baseSize * 0.3, offsetY - baseSize * 0.15, eyeSize);
    graphics.fill({ color: 0x000000 });

    // Echo trail effect (multiple fading diamonds)
    for (let i = 1; i <= 2; i++) {
      const trailSize = size * (1 + i * 0.15);
      const trailAlpha = pulse * (0.3 / i);

      graphics.moveTo(offsetX, offsetY - trailSize);
      graphics.lineTo(offsetX + trailSize, offsetY);
      graphics.lineTo(offsetX, offsetY + trailSize);
      graphics.lineTo(offsetX - trailSize, offsetY);
      graphics.closePath();
      graphics.stroke({ width: 3, color, alpha: trailAlpha });
    }

    // Floating particles around ECHO
    for (let i = 0; i < 4; i++) {
      const angle = (time * 2 + i * Math.PI / 2) % (Math.PI * 2);
      const distance = baseSize * 1.5;
      const particleX = offsetX + Math.cos(angle) * distance;
      const particleY = offsetY + Math.sin(angle) * distance;

      graphics.circle(particleX, particleY, 5);
      graphics.fill({ color, alpha: 0.6 });
    }
  };

  // Render error fallback if PixiJS fails
  if (renderError) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          backgroundColor: "#1a1a1a",
          color: "#e94560",
          fontFamily: '"Courier New", monospace',
          padding: "20px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "3rem", marginBottom: "20px" }}>👾</div>
        <div style={{ fontSize: "1.2rem", marginBottom: "10px" }}>
          {traits.name}
        </div>
        <div style={{ fontSize: "0.9rem", color: "#aaa" }}>Stage: {stage}</div>
        <div
          style={{
            marginTop: "20px",
            fontSize: "0.85rem",
            color: "#ff6b81",
          }}
        >
          {renderError}
        </div>
      </div>
    );
  }

  return (
    <div className="game-canvas-wrapper">
      <div className="canvas-overlay">
        {/* Requirement 3.1: Animated pet name with character-by-character fade-in */}
        {/* Requirement 3.3: Glitch effect when sanity < 30 */}
        {/* Requirement 8.3: Disable React Bits animations in retro mode */}
        <AnimatedPetName
          name={petName}
          sanity={sanity}
          disableAnimation={reduceMotion || retroMode}
          className="overlay-pet-name"
        />
        {/* Requirement 3.2: Animated stage indicator with dramatic reveal */}
        {/* Requirement 8.3: Disable React Bits animations in retro mode */}
        <AnimatedStageIndicator
          stage={stage}
          disableAnimation={reduceMotion || retroMode}
          className="overlay-stage-indicator"
        />
      </div>
      <div
        ref={combinedRef}
        className={`game-canvas-container ${showDropIndicator ? 'drop-target-active' : ''}`}
        role="img"
        aria-label={`${petName}, a ${
          traits.archetype
        } pet at ${stage} stage. Sanity: ${sanity.toFixed(0)}%`}
        aria-dropeffect={showDropIndicator ? "execute" : "none"}
        style={{
          width: canvasSize.width,
          height: canvasSize.height,
        }}
      >
        {/* Drop indicator overlay (Requirement 2.1) */}
        {showDropIndicator && (
          <div 
            className="drop-indicator" 
            aria-hidden="true"
          >
            <span className="drop-indicator-text">Drop to Feed</span>
          </div>
        )}
      </div>
    </div>
  );
}
