import type { Vector3 } from "three";

/* ------------------------------------------------------------------ */
/*  Utility types                                                     */
/* ------------------------------------------------------------------ */

/** Recursively make every property optional. */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? U[]
    : T[P] extends object
      ? DeepPartial<T[P]>
      : T[P];
};

/* ------------------------------------------------------------------ */
/*  Quality / export                                                  */
/* ------------------------------------------------------------------ */

export type QualityPreset = "low" | "medium" | "high" | "ultra";
export type ExportFormat = "webm" | "mp4";

export interface QualityPresetConfig {
  width: number;
  height: number;
  bitrate: number;
}

/* ------------------------------------------------------------------ */
/*  Easing                                                            */
/* ------------------------------------------------------------------ */

export type EasingCurve =
  | "linear"
  | "easeIn"
  | "easeOut"
  | "easeInOut"
  | "easeInOutCubic";

/** A function mapping normalised time [0,1] → [0,1]. */
export type EasingFn = (t: number) => number;

/* ------------------------------------------------------------------ */
/*  Animation phases                                                  */
/* ------------------------------------------------------------------ */

export const Phase = {
  Scatter: "scatter",
  Assemble: "assemble",
  Hold: "hold",
  Dissolve: "dissolve",
} as const;

export type Phase = (typeof Phase)[keyof typeof Phase];

/* ------------------------------------------------------------------ */
/*  Config sub-sections                                               */
/* ------------------------------------------------------------------ */

export interface WordConfig {
  /** The BIG word rendered as a dot-matrix of particles. */
  target: string;
  fontFamily: string;
  /**
   * Size of targeted letters used to generate the dot grid.
   * Larger = more detailed letter shape = more particles needed.
   */
  targetFontSize: number;
  /**
   * Vertical scale multiplier for target letters.
   * 1.0 = normal, 1.5 = tall, 0.7 = compressed.
   */
  letterHeight: number;
  /** Horizontal gap between assembled big letters (world units). */
  letterSpacing: number;
  /** Colour of all particles. */
  color: string;
}

export interface ParticlesConfig {
  /**
   * Pool of small characters randomly assigned to flying particles.
   * These are the individual letters visible up close inside each big letter shape.
   */
  sourceChars: string;
  /** Number of particles flying in orbit during scatter phase. */
  orbitCount: number;
  /**
   * Dot-matrix grid cell size in px.
   * Lower = more particles fill each letter shape with finer detail.
   * Higher = coarser, fewer particles needed.
   */
  gridResolution: number;
  /** Particle size when far from camera (orbit phase). */
  orbitMinSize: number;
  /** Particle size when close to camera (orbit phase). */
  orbitMaxSize: number;
  /**
   * Fixed size of each particle in assembled state.
   * Small so many fit inside the big letter shape.
   */
  assembledSize: number;
  minOpacity: number;
  maxOpacity: number;
  /** Scale size + opacity based on Z depth during orbit. */
  depthScale: boolean;
}

export interface OrbitAxisConfig {
  x: number;
  y: number;
  z: number;
}

export interface OrbitConfig {
  /** Axis direction (normalised internally). */
  axis: OrbitAxisConfig;
  /** Tilt of orbit axis in degrees (0 = vertical Y). */
  tiltAngle: number;
  /** Orbit radius range. */
  radius: { min: number; max: number };
  /** Global speed multiplier. */
  speedMultiplier: number;
  /** Randomness of individual letter paths (0–1). */
  chaosIntensity: number;
}

export interface PhaseTimingConfig {
  /** Duration in ms. */
  duration: number;
  /** Easing curve name. */
  speedCurve: EasingCurve;
}

export interface AssemblePhaseConfig extends PhaseTimingConfig {
  /** Delay between each letter starting its fly-in (ms). */
  staggerDelay: number;
}

export interface HoldPhaseConfig {
  /** Duration in ms. */
  duration: number;
}

export interface PhasesConfig {
  scatter: PhaseTimingConfig;
  assemble: AssemblePhaseConfig;
  hold: HoldPhaseConfig;
  dissolve: PhaseTimingConfig;
}

export interface AnimationConfig {
  /** Total cycle length in ms. */
  cycleDuration: number;
  phases: PhasesConfig;
  autoPlay: boolean;
  loop: boolean;
}

export interface ExportConfig {
  defaultQuality: QualityPreset;
  qualityPresets: Record<QualityPreset, QualityPresetConfig>;
  /** Export duration in seconds. */
  duration: number;
  fps: number;
  format: ExportFormat;
}

/* ------------------------------------------------------------------ */
/*  Top-level config                                                  */
/* ------------------------------------------------------------------ */

export interface LetterVortexConfig {
  word: WordConfig;
  particles: ParticlesConfig;
  orbit: OrbitConfig;
  animation: AnimationConfig;
  export: ExportConfig;
}

/* ------------------------------------------------------------------ */
/*  Dot-matrix layout data                                            */
/* ------------------------------------------------------------------ */

/** A single slot in the dot-matrix grid for a target letter. */
export interface LetterSlot {
  /** Random source character assigned to this slot. */
  char: string;
  /** 3D position where the particle should assemble. */
  position: Vector3;
}

/** Old alias kept for backward compat within barrel exports. */
export interface LetterLayout {
  char: string;
  position: Vector3;
}

/* ------------------------------------------------------------------ */
/*  Callbacks                                                         */
/* ------------------------------------------------------------------ */

export interface LoopCallbacks {
  onFrame: (delta: number, phase: Phase, progress: number) => void;
  onPhaseChange?: (newPhase: Phase) => void;
}

export type FrameCallback = (deltaTime: number, elapsedTime: number) => void;
