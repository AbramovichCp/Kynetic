// ---------- Canvas animation config & types ----------

export interface AnimationConfig {
  // Text settings
  targetText: string;
  fontFamily: string;
  fontSize: number; // silhouette font size (px)
  letterSize: number; // rendered letter font size (px)

  // Particle settings
  totalBackgroundLetters: number;
  logoLettersCount: number;
  duplicationPercent: number; // 0–100

  // Physics
  particleSpeed: number; // base speed multiplier
  jitter: number; // vibration intensity
  phaseDuration: number; // ms per phase

  // Word bank
  wordList: string[];

  // Canvas resolution
  width: number;
  height: number;
}

export const DEFAULT_CONFIG: AnimationConfig = {
  targetText: "KINETIC",
  fontFamily: "Helvetica",
  fontSize: 520,
  letterSize: 15,
  totalBackgroundLetters: 130,
  logoLettersCount: 140,
  duplicationPercent: 100,
  particleSpeed: 1,
  jitter: 0,
  phaseDuration: 2000,
  wordList: [
    "balance",
    "calm",
    "gentle",
    "tactile",
    "soft",
    "quiet",
    "restorative",
    "sensory",
    "ritual",
  ],
  width: 1920,
  height: 1080,
};

export interface BackgroundLetter {
  char: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface FormingLetter {
  char: string;
  x: number;
  y: number;
  startX: number;
  startY: number;
  tx: number;
  ty: number;
}

export interface Point {
  x: number;
  y: number;
}

export const RESOLUTION_PRESETS: Record<
  string,
  { width: number; height: number }
> = {
  "720p": { width: 1280, height: 720 },
  "1080p": { width: 1920, height: 1080 },
  "1440p": { width: 2560, height: 1440 },
  "2160p": { width: 3840, height: 2160 },
};
