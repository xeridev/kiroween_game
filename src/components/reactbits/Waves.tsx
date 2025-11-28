/**
 * Waves background component - adapted from React Bits
 * Creates animated wave patterns using canvas
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

import { useEffect, useRef, useCallback } from 'react';
import { logError } from '../../utils/errorLogger';

export interface WavesProps {
  /** Color of the wave lines */
  lineColor?: string;
  /** Background color of the canvas */
  backgroundColor?: string;
  /** Horizontal speed factor for wave animation */
  waveSpeedX?: number;
  /** Vertical speed factor for wave animation */
  waveSpeedY?: number;
  /** Horizontal amplitude of waves */
  waveAmpX?: number;
  /** Vertical amplitude of waves */
  waveAmpY?: number;
  /** Horizontal gap between wave lines */
  xGap?: number;
  /** Vertical gap between points on each wave */
  yGap?: number;
  /** Friction for cursor interaction */
  friction?: number;
  /** Tension for cursor interaction */
  tension?: number;
  /** Max cursor movement effect */
  maxCursorMove?: number;
  /** Custom inline styles */
  style?: React.CSSProperties;
  /** Custom class name */
  className?: string;
  /** Whether to disable animation (for reduce motion) */
  disableAnimation?: boolean;
}

interface Point {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
}

/**
 * Waves component - creates animated wave background
 * Supports reduce motion preference (Requirement 1.5)
 */
export function Waves({
  lineColor = '#333333',
  backgroundColor = 'transparent',
  waveSpeedX = 0.02,
  waveSpeedY = 0.01,
  waveAmpX = 40,
  waveAmpY = 20,
  xGap = 12,
  yGap = 36,
  friction = 0.9,
  tension = 0.01,
  maxCursorMove = 120,
  style = {},
  className = '',
  disableAnimation = false,
}: WavesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const pointsRef = useRef<Point[][]>([]);
  const timeRef = useRef(0);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  // Initialize points grid
  const initPoints = useCallback((width: number, height: number) => {
    const points: Point[][] = [];
    const cols = Math.ceil(width / xGap) + 1;
    const rows = Math.ceil(height / yGap) + 1;

    for (let i = 0; i < cols; i++) {
      points[i] = [];
      for (let j = 0; j < rows; j++) {
        const x = i * xGap;
        const y = j * yGap;
        points[i][j] = {
          x,
          y,
          baseX: x,
          baseY: y,
          vx: 0,
          vy: 0,
        };
      }
    }
    return points;
  }, [xGap, yGap]);

  // Update point positions based on time and cursor
  const updatePoints = useCallback((points: Point[][], time: number, mouse: { x: number; y: number }) => {
    for (let i = 0; i < points.length; i++) {
      for (let j = 0; j < points[i].length; j++) {
        const point = points[i][j];
        
        // Wave motion
        const waveX = Math.sin(time * waveSpeedX + j * 0.3) * waveAmpX;
        const waveY = Math.cos(time * waveSpeedY + i * 0.3) * waveAmpY;
        
        // Target position with wave
        const targetX = point.baseX + waveX;
        const targetY = point.baseY + waveY;
        
        // Cursor interaction
        const dx = mouse.x - point.x;
        const dy = mouse.y - point.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < maxCursorMove) {
          const force = (maxCursorMove - dist) / maxCursorMove;
          point.vx -= dx * force * tension;
          point.vy -= dy * force * tension;
        }
        
        // Spring back to target
        point.vx += (targetX - point.x) * tension;
        point.vy += (targetY - point.y) * tension;
        
        // Apply friction
        point.vx *= friction;
        point.vy *= friction;
        
        // Update position
        point.x += point.vx;
        point.y += point.vy;
      }
    }
  }, [waveSpeedX, waveSpeedY, waveAmpX, waveAmpY, friction, tension, maxCursorMove]);

  // Draw the wave lines
  const draw = useCallback((ctx: CanvasRenderingContext2D, points: Point[][], width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);
    
    if (backgroundColor !== 'transparent') {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
    }
    
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1;
    
    // Draw vertical wave lines
    for (let i = 0; i < points.length; i++) {
      ctx.beginPath();
      for (let j = 0; j < points[i].length; j++) {
        const point = points[i][j];
        if (j === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          // Smooth curve through points
          const prev = points[i][j - 1];
          const cpX = (prev.x + point.x) / 2;
          const cpY = (prev.y + point.y) / 2;
          ctx.quadraticCurveTo(prev.x, prev.y, cpX, cpY);
        }
      }
      ctx.stroke();
    }
  }, [lineColor, backgroundColor]);


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      logError('Failed to get canvas 2d context', undefined, { component: 'Waves' });
      return;
    }

    // Handle resize
    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      pointsRef.current = initPoints(rect.width, rect.height);
    };

    // Handle mouse move
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    // Handle mouse leave
    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    // Animation loop
    const animate = () => {
      if (disableAnimation) {
        // Static render for reduce motion
        const rect = canvas.getBoundingClientRect();
        draw(ctx, pointsRef.current, rect.width, rect.height);
        return;
      }

      timeRef.current += 1;
      updatePoints(pointsRef.current, timeRef.current, mouseRef.current);
      
      const rect = canvas.getBoundingClientRect();
      draw(ctx, pointsRef.current, rect.width, rect.height);
      
      animationRef.current = requestAnimationFrame(animate);
    };

    // Initialize
    handleResize();
    window.addEventListener('resize', handleResize);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    // Start animation
    if (!disableAnimation) {
      animate();
    } else {
      // Single static render
      const rect = canvas.getBoundingClientRect();
      draw(ctx, pointsRef.current, rect.width, rect.height);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [initPoints, updatePoints, draw, disableAnimation]);

  return (
    <canvas
      ref={canvasRef}
      className={`waves-background ${className}`.trim()}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        ...style,
      }}
    />
  );
}

export default Waves;
