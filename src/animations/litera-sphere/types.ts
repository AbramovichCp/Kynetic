import type { Vector3 } from 'three';

/* ------------------------------------------------------------------ */
/*  Quality & export                                                  */
/* ------------------------------------------------------------------ */

/** Available quality presets for video export. */
export type QualityPreset = 'low' | 'medium' | 'high' | 'ultra';

/** Supported export container formats. */
export type ExportFormat = 'webm' | 'mp4';

/** Resolution + bitrate description for one quality level. */
export interface QualityPresetConfig {
  width: number;
  height: number;
  bitrate: number;
}

/* ------------------------------------------------------------------ */
/*  Config sub-interfaces                                             */
/* ------------------------------------------------------------------ */

export interface SphereConfig {
  radius: number;
  rotationSpeedX: number;
  rotationSpeedY: number;
  rotationAngleX: number;
  rotationAngleY: number;
}

export interface CharactersConfig {
  count: number;
  baseFontSize: number;
  fontSizeRange: [number, number];
  density: number;
  fontFamily: string;
  color: string;
  opacity: {
    min: number;
    max: number;
  };
}

export interface WordsConfig {
  enabled: boolean;
  list: string[];
  wordSpacing: number;
}

export interface AnimationConfig {
  cycleDuration: number;
  autoPlay: boolean;
}

export interface ExportConfig {
  defaultQuality: QualityPreset;
  qualityPresets: Record<QualityPreset, QualityPresetConfig>;
  duration: number;
  fps: number;
  format: ExportFormat;
}

/* ------------------------------------------------------------------ */
/*  Root config                                                       */
/* ------------------------------------------------------------------ */

/** Full configuration object for LiteraSphere. */
export interface LiteraSphereConfig {
  sphere: SphereConfig;
  characters: CharactersConfig;
  words: WordsConfig;
  animation: AnimationConfig;
  export: ExportConfig;
}

/* ------------------------------------------------------------------ */
/*  Utility types                                                     */
/* ------------------------------------------------------------------ */

/** Recursively makes every property optional. */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? U[]
    : T[P] extends object
      ? DeepPartial<T[P]>
      : T[P];
};

/** A single character entry placed on the sphere. */
export interface CharacterEntry {
  char: string;
  position: Vector3;
  isPartOfWord: boolean;
  wordIndex?: number;
}

/** Callback signature used by `AnimationLoop`. */
export type FrameCallback = (deltaTime: number, elapsedTime: number) => void;
