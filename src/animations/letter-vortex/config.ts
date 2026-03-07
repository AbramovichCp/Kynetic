import type { LetterVortexConfig } from './types';

/**
 * Single source of truth for every default value used by the LetterVortex
 * animation.  No other file should contain hard-coded configuration values.
 */
export const LETTER_VORTEX_CONFIG: LetterVortexConfig = {
  word: {
    target: 'N3',
    fontFamily: 'monospace',
    targetFontSize: 300,
    letterHeight: 1.0,
    letterSpacing: 80,
    color: '#ffffff',
  },
  particles: {
    sourceChars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    orbitCount: 200,
    gridResolution: 8,
    orbitMinSize: 10,
    orbitMaxSize: 36,
    assembledSize: 14,
    minOpacity: 0.08,
    maxOpacity: 1.0,
    depthScale: true,
  },
  orbit: {
    axis: { x: 0, y: 1, z: 0 },
    tiltAngle: 0,
    radius: { min: 150, max: 500 },
    speedMultiplier: 1.0,
    chaosIntensity: 0.8,
  },
  animation: {
    cycleDuration: 9000,
    phases: {
      scatter: {
        duration: 3000,
        speedCurve: 'easeInOut',
      },
      assemble: {
        duration: 2500,
        speedCurve: 'easeOut',
        staggerDelay: 8,
      },
      hold: {
        duration: 2000,
      },
      dissolve: {
        duration: 1500,
        speedCurve: 'easeIn',
      },
    },
    autoPlay: true,
    loop: true,
  },
  export: {
    defaultQuality: 'high',
    qualityPresets: {
      low:    { width: 854,  height: 480,  bitrate: 1_000_000  },
      medium: { width: 1280, height: 720,  bitrate: 4_000_000  },
      high:   { width: 1920, height: 1080, bitrate: 8_000_000  },
      ultra:  { width: 3840, height: 2160, bitrate: 20_000_000 },
    },
    duration: 18,
    fps: 60,
    format: 'webm',
  },
};
