// ---------- Kinetic animation config & types ----------

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
  phaseDuration: number; // ms per phase

  // Appearance
  letterColor: string;
  letterColorAlpha: number; // 0–1
  backgroundColor: string;
  backgroundColorAlpha: number; // 0–1
  backgroundImage: string | null; // data-URL or null

  // Word bank
  wordList: string[];

  // Canvas resolution
  width: number;
  height: number;
}

export const DEFAULT_CONFIG: AnimationConfig = {
  targetText: "KINETIC",
  fontFamily: "Anonymous Pro",
  fontSize: 520,
  letterSize: 25,
  totalBackgroundLetters: 130,
  logoLettersCount: 140,
  duplicationPercent: 100,
  particleSpeed: 1,
  phaseDuration: 2000,
  letterColor: "#ffffff",
  letterColorAlpha: 1,
  backgroundColor: "#000000",
  backgroundColorAlpha: 1,
  backgroundImage: null,
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
  width: 3840,
  height: 2160,
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

// ---------- Centralised field metadata ----------

export type FieldType =
  | "slider"
  | "text"
  | "color"
  | "file"
  | "select"
  | "wordlist";

export interface SliderFieldMeta {
  type: "slider";
  key: keyof AnimationConfig;
  label: string;
  section: string;
  min: number;
  max: number;
  step: number;
  default: number;
  format?: (v: number) => string;
}

export interface TextFieldMeta {
  type: "text";
  key: keyof AnimationConfig;
  label: string;
  section: string;
  default: string;
}

export interface ColorFieldMeta {
  type: "color";
  key: keyof AnimationConfig;
  label: string;
  section: string;
  default: string;
}

export interface FileFieldMeta {
  type: "file";
  key: keyof AnimationConfig;
  label: string;
  section: string;
  accept: string;
}

export interface WordlistFieldMeta {
  type: "wordlist";
  key: keyof AnimationConfig;
  label: string;
  section: string;
  default: string[];
}

export type FieldMeta =
  | SliderFieldMeta
  | TextFieldMeta
  | ColorFieldMeta
  | FileFieldMeta
  | WordlistFieldMeta;

export const FIELD_CONFIG: FieldMeta[] = [
  // ── Text ───────────────────────────────────────────
  {
    type: "text",
    key: "targetText",
    label: "Target text",
    section: "Text",
    default: "KINETIC",
  },
  {
    type: "text",
    key: "fontFamily",
    label: "Font family",
    section: "Text",
    default: "Anonymous Pro",
  },
  {
    type: "slider",
    key: "fontSize",
    label: "Silhouette size",
    section: "Text",
    min: 200,
    max: 1200,
    step: 10,
    default: 500,
    format: (v) => `${v}px`,
  },
  {
    type: "slider",
    key: "letterSize",
    label: "Letter size",
    section: "Text",
    min: 5,
    max: 50,
    step: 1,
    default: 25,
    format: (v) => `${v}px`,
  },

  // ── Particles ──────────────────────────────────────
  {
    type: "slider",
    key: "totalBackgroundLetters",
    label: "Background letters",
    section: "Particles",
    min: 50,
    max: 1000,
    step: 5,
    default: 250,
  },
  {
    type: "slider",
    key: "logoLettersCount",
    label: "Logo letters",
    section: "Particles",
    min: 10,
    max: 600,
    step: 1,
    default: 250,
  },
  {
    type: "slider",
    key: "duplicationPercent",
    label: "Duplication",
    section: "Particles",
    min: 0,
    max: 100,
    step: 1,
    default: 100,
    format: (v) => `${v}%`,
  },

  // ── Animation ──────────────────────────────────────
  {
    type: "slider",
    key: "particleSpeed",
    label: "Speed",
    section: "Animation",
    min: 0.01,
    max: 2,
    step: 0.01,
    default: 0.5,
    format: (v) => `${v.toFixed(2)}×`,
  },
  {
    type: "slider",
    key: "phaseDuration",
    label: "Phase duration",
    section: "Animation",
    min: 500,
    max: 8000,
    step: 100,
    default: 3000,
    format: (v) => `${v}ms`,
  },

  // ── Appearance ─────────────────────────────────────
  {
    type: "color",
    key: "letterColor",
    label: "Text color",
    section: "Appearance",
    default: "#ffffff",
  },
  {
    type: "slider",
    key: "letterColorAlpha",
    label: "Text opacity",
    section: "Appearance",
    min: 0,
    max: 1,
    step: 0.01,
    default: 1,
    format: (v) => `${Math.round(v * 100)}%`,
  },
  {
    type: "color",
    key: "backgroundColor",
    label: "Background color",
    section: "Appearance",
    default: "#000000",
  },
  {
    type: "slider",
    key: "backgroundColorAlpha",
    label: "Background opacity",
    section: "Appearance",
    min: 0,
    max: 1,
    step: 0.01,
    default: 1,
    format: (v) => `${Math.round(v * 100)}%`,
  },
  {
    type: "file",
    key: "backgroundImage",
    label: "Background image",
    section: "Appearance",
    accept: "image/*",
  },

  // ── Word bank ──────────────────────────────────────
  {
    type: "wordlist",
    key: "wordList",
    label: "Words (comma-separated)",
    section: "Word bank",
    default: [
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
  },
];
