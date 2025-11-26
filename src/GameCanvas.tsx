import { useEffect, useRef, useState, useCallback } from "react";
import * as PIXI from "pixi.js";
import type { PetTraits, PetStage } from "./types";
import { logError } from "./errorLogger";
import "./GameCanvas.css";

interface GameCanvasProps {
  traits: PetTraits;
  stage: PetStage;
  sanity: number;
  corruption: number;
}

// Mobile breakpoint constant
const MOBILE_BREAKPOINT = 768;
// Minimum canvas dimensions to prevent rendering issues
const MIN_CANVAS_WIDTH = 320;
const MIN_CANVAS_HEIGHT = 240;

/**
 * Calculate canvas dimensions based on viewport size
 * Desktop (>768px): 50vw × 70vh
 * Mobile (≤768px): 100vw × 50vh
 */
export function calculateCanvasSize(): { width: number; height: number } {
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
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const petGraphicsRef = useRef<PIXI.Graphics | null>(null);
  const animationTimeRef = useRef<number>(0);
  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState(calculateCanvasSize);

  // Debounced resize handler to prevent rapid successive calls
  const handleResize = useCallback(() => {
    // Clear any pending resize timeout
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }

    // Debounce resize by 100ms
    resizeTimeoutRef.current = setTimeout(() => {
      const newSize = calculateCanvasSize();
      setCanvasSize(newSize);

      if (appRef.current) {
        try {
          // Update PixiJS renderer dimensions
          appRef.current.renderer.resize(newSize.width, newSize.height);

          // Recenter pet graphics after resize
          if (petGraphicsRef.current) {
            petGraphicsRef.current.x = newSize.width / 2;
            petGraphicsRef.current.y = newSize.height / 2;
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

    // Get initial canvas size
    const initialSize = calculateCanvasSize();

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

  // Update pet graphics when props change
  useEffect(() => {
    updatePetGraphics();
  }, [traits, stage, sanity, corruption]);

  const updatePetGraphics = () => {
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
        return 40;
      case "BABY":
        return 60;
      case "TEEN":
        return 80;
      case "ABOMINATION":
        return 120;
      default:
        return 60;
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

    graphics.beginFill(color);

    if (horrorActive) {
      // Add noise/distortion effect
      graphics.alpha = 0.7 + Math.random() * 0.3;
    } else {
      graphics.alpha = 1;
    }

    graphics.drawEllipse(offsetX, offsetY, radiusX, radiusY);
    graphics.endFill();
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

    graphics.beginFill(color);

    if (horrorActive) {
      graphics.alpha = 0.6 + Math.random() * 0.4;
    } else {
      graphics.alpha = 1;
    }

    // Draw triangle with jitter
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
    graphics.endFill();
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

    graphics.beginFill(color);

    if (horrorActive) {
      // Erratic pulsing when horror is active
      graphics.alpha = pulse * (0.3 + Math.random() * 0.4);
    } else {
      graphics.alpha = pulse;
    }

    // Draw diamond (rotated square)
    graphics.moveTo(offsetX, offsetY - size);
    graphics.lineTo(offsetX + size, offsetY);
    graphics.lineTo(offsetX, offsetY + size);
    graphics.lineTo(offsetX - size, offsetY);
    graphics.closePath();
    graphics.endFill();
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
    <div
      ref={canvasRef}
      className="game-canvas-container"
      role="img"
      aria-label={`${traits.name}, a ${
        traits.archetype
      } pet at ${stage} stage. Sanity: ${sanity.toFixed(0)}%`}
      style={{
        width: canvasSize.width,
        height: canvasSize.height,
      }}
    />
  );
}
