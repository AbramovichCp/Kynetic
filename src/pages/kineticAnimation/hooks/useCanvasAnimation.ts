/**
 * useCanvasAnimation — React hook that bridges the ParticleEngine
 * with a <canvas> element via requestAnimationFrame.
 */

import { useCallback, useEffect, useRef } from "react";
import type { AnimationConfig } from "../engine";
import { ParticleEngine } from "../engine";

export interface UseCanvasAnimationReturn {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  restart: () => void;
  engineRef: React.RefObject<ParticleEngine | null>;
}

export function useCanvasAnimation(
  config: AnimationConfig,
): UseCanvasAnimationReturn {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<ParticleEngine | null>(null);
  const rafRef = useRef<number>(0);

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

    if (!engineRef.current) {
      engineRef.current = new ParticleEngine(config);
    } else {
      engineRef.current.updateConfig(config);
    }

    const engine = engineRef.current;

    canvas.width = config.width;
    canvas.height = config.height;

    let running = true;

    const loop = () => {
      if (!running) return;

      engine.config.particleSpeed = configRef.current.particleSpeed;
      engine.config.phaseDuration = configRef.current.phaseDuration;
      engine.config.freeFlightSpeed = configRef.current.freeFlightSpeed;
      engine.config.logoLettersCount = configRef.current.logoLettersCount;
      engine.config.duplicationPercent = configRef.current.duplicationPercent;
      engine.config.letterColor = configRef.current.letterColor;
      engine.config.letterColorAlpha = configRef.current.letterColorAlpha;
      engine.config.backgroundColor = configRef.current.backgroundColor;
      engine.config.backgroundColorAlpha =
        configRef.current.backgroundColorAlpha;

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
