/**
 * useCanvasAnimation — React hook that bridges the ParticleEngine
 * with a <canvas> element via requestAnimationFrame.
 */

import { useCallback, useEffect, useRef } from "react";
import type { AnimationConfig } from "@/lib/canvas";
import { ParticleEngine } from "@/lib/canvas";

export interface UseCanvasAnimationReturn {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** Restart the animation from scratch. */
  restart: () => void;
  /** Access underlying engine (e.g. for export). */
  engineRef: React.RefObject<ParticleEngine | null>;
}

export function useCanvasAnimation(
  config: AnimationConfig,
): UseCanvasAnimationReturn {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<ParticleEngine | null>(null);
  const rafRef = useRef<number>(0);

  // Keep latest config in a ref so the loop always reads fresh values
  const configRef = useRef(config);
  configRef.current = config;

  const restart = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.config = { ...configRef.current };
      engineRef.current.init();
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Create engine once
    if (!engineRef.current) {
      engineRef.current = new ParticleEngine(config);
    } else {
      engineRef.current.updateConfig(config);
    }

    const engine = engineRef.current;

    // Resize canvas element to match config
    canvas.width = config.width;
    canvas.height = config.height;

    let running = true;

    const loop = () => {
      if (!running) return;

      // Hot-update lightweight config changes on every frame
      engine.config.particleSpeed = configRef.current.particleSpeed;
      engine.config.jitter = configRef.current.jitter;
      engine.config.phaseDuration = configRef.current.phaseDuration;
      engine.config.logoLettersCount = configRef.current.logoLettersCount;
      engine.config.duplicationPercent = configRef.current.duplicationPercent;
      engine.config.letterColor = configRef.current.letterColor;
      engine.config.letterColorAlpha = configRef.current.letterColorAlpha;
      engine.config.backgroundColor = configRef.current.backgroundColor;
      engine.config.backgroundColorAlpha = configRef.current.backgroundColorAlpha;

      // Background image — load once when URL changes
      if (configRef.current.backgroundImage !== engine.config.backgroundImage) {
        engine.config.backgroundImage = configRef.current.backgroundImage;
        engine.loadBackgroundImage(configRef.current.backgroundImage);
      }

      engine.update(performance.now());
      engine.draw(ctx);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
    // Re-run effect when resolution, text, font or letter count change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    config.width,
    config.height,
    config.targetText,
    config.fontFamily,
    config.fontSize,
    config.letterSize,
    config.totalBackgroundLetters,
  ]);

  return { canvasRef, restart, engineRef };
}
