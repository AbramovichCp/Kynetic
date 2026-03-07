# Three.js Animation — Copilot Instructions

Apply these instructions for ALL tasks involving Three.js animations, particle systems,
3D visual effects, canvas-based motion graphics, WebGL scenes, or video export from canvas.

---

## Module File Structure

Every animation is a fully isolated module. Never share code between animation modules.

```
src/animations/<animation-name>/
  index.ts                  ← public entry point, exports main class
  <AnimationName>.ts        ← orchestrator: lifecycle, config, coordinates subsystems
  config.ts                 ← ALL hardcoded values live here only — never elsewhere
  types.ts                  ← TypeScript interfaces, enums, type aliases
  AnimationLoop.ts          ← rAF wrapper with phase/timing management
  VideoExporter.ts          ← MediaRecorder-based canvas video export
  <Domain>Renderer.ts       ← creates/updates Three.js objects (Sprites, Meshes)
  <Domain>Builder.ts        ← computes geometry/layout data (positions, grids)
  <Domain>Behavior.ts       ← pure math: easing, physics, orbit, interpolation
  <Domain>System.ts         ← manages lifecycle of many particles/instances
```

---

## Non-Negotiable Rules

1. `config.ts` is the single source of truth — zero hardcoded values anywhere else
2. One responsibility per class — never mix rendering + physics + layout in one class
3. Every class has a `dispose()` method — cleans all Three.js objects, textures, listeners
4. Full TypeScript strict mode — JSDoc on all public methods
5. No shared code with other animation modules — fully isolated
6. Dependency injection — no global state, no module-level singletons
7. No `new THREE.*` calls inside the render loop — allocate once, reuse

---

## config.ts Pattern

```typescript
export const MY_ANIMATION_CONFIG = {
  rendering: {
    background: "#000000",
    antialias: true,
  },
  animation: {
    cycleDuration: 8000,
    autoPlay: true,
    loop: true,
    phases: {
      scatter: { duration: 3000, speedCurve: "easeInOut" },
      assemble: { duration: 2500, speedCurve: "easeOut", staggerDelay: 30 },
      hold: { duration: 1500 },
      dissolve: { duration: 1000, speedCurve: "easeIn" },
    },
  },
  export: {
    defaultQuality: "high" as QualityPreset,
    qualityPresets: {
      low: { width: 854, height: 480, bitrate: 1_000_000 },
      medium: { width: 1280, height: 720, bitrate: 4_000_000 },
      high: { width: 1920, height: 1080, bitrate: 8_000_000 },
      ultra: { width: 3840, height: 2160, bitrate: 20_000_000 },
    },
    duration: 10,
    fps: 60,
    format: "webm" as "webm" | "mp4",
  },
};

export type AnimationConfig = typeof MY_ANIMATION_CONFIG;
```

---

## Main Orchestrator Pattern

```typescript
class MyAnimation {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private loop: AnimationLoop;
  private config: AnimationConfig;

  constructor(container: HTMLElement, config?: DeepPartial<AnimationConfig>) {
    this.config = mergeConfig(DEFAULT_CONFIG, config);
  }

  init(): void; // setup scene, camera, renderer, subsystems, ResizeObserver
  start(): void; // begin animation loop
  stop(): void; // pause loop
  dispose(): void; // full cleanup of all subsystems + renderer + ResizeObserver

  updateConfig(patch: DeepPartial<AnimationConfig>): void; // hot-swap, no reinit
  resetConfig(): void;

  exportVideo(quality: QualityPreset): Promise<Blob>;
}
```

---

## Phase State Machine

For animations with distinct phases, always use an explicit state machine:

```
SCATTER → ASSEMBLE → HOLD → DISSOLVE → SCATTER (loop)
```

---

## AnimationLoop — Complete Implementation

```typescript
export type Phase = "SCATTER" | "ASSEMBLE" | "HOLD" | "DISSOLVE";
export type EasingCurve =
  | "linear"
  | "easeIn"
  | "easeOut"
  | "easeInOut"
  | "easeInOutCubic";

export interface LoopCallbacks {
  onFrame: (delta: number, phase: Phase, phaseProgress: number) => void;
  onPhaseChange?: (newPhase: Phase, prevPhase: Phase) => void;
  onCycleComplete?: () => void;
}

const PHASE_ORDER: Phase[] = ["SCATTER", "ASSEMBLE", "HOLD", "DISSOLVE"];

export class AnimationLoop {
  private rafId = 0;
  private lastTimestamp = 0;
  private phaseStartTime = 0;
  private currentPhase: Phase = "SCATTER";
  private callbacks: LoopCallbacks | null = null;
  private running = false;
  private phases: AnimationPhases;

  constructor(phases: AnimationPhases) {
    this.phases = phases;
  }

  start(callbacks: LoopCallbacks): void {
    this.callbacks = callbacks;
    this.running = true;
    this.lastTimestamp = performance.now();
    this.phaseStartTime = this.lastTimestamp;
    this.rafId = requestAnimationFrame(this.tick);
  }

  pause(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }
  resume(): void {
    if (this.running) return;
    this.running = true;
    this.lastTimestamp = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }
  stop(): void {
    this.pause();
    this.callbacks = null;
  }
  forcePhase(phase: Phase): void {
    const prev = this.currentPhase;
    this.currentPhase = phase;
    this.phaseStartTime = performance.now();
    this.callbacks?.onPhaseChange?.(phase, prev);
  }

  private tick = (timestamp: number): void => {
    if (!this.running) return;
    const delta = Math.min((timestamp - this.lastTimestamp) / 1000, 0.1); // capped at 100ms
    this.lastTimestamp = timestamp;
    const elapsed = timestamp - this.phaseStartTime;
    const duration =
      this.phases[this.currentPhase.toLowerCase() as keyof AnimationPhases]
        .duration;
    const progress = Math.min(elapsed / duration, 1);
    this.callbacks?.onFrame(delta, this.currentPhase, progress);
    if (elapsed >= duration) this.advancePhase(timestamp);
    this.rafId = requestAnimationFrame(this.tick);
  };

  private advancePhase(timestamp: number): void {
    const prev = this.currentPhase;
    const idx = PHASE_ORDER.indexOf(this.currentPhase);
    const nextIdx = (idx + 1) % PHASE_ORDER.length;
    if (nextIdx === 0) this.callbacks?.onCycleComplete?.();
    this.currentPhase = PHASE_ORDER[nextIdx];
    this.phaseStartTime = timestamp;
    this.callbacks?.onPhaseChange?.(this.currentPhase, prev);
  }
}
```

---

## VideoExporter — Complete Implementation

```typescript
export type QualityPreset = "low" | "medium" | "high" | "ultra";

export class VideoExporter {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private offscreenCtx: CanvasRenderingContext2D | null = null;
  private scalingRafId = 0;
  private config: ExportConfig;

  constructor(config: ExportConfig) {
    this.config = config;
  }

  startCapture(sourceCanvas: HTMLCanvasElement, quality: QualityPreset): void {
    const preset = this.config.qualityPresets[quality];
    this.offscreenCanvas = document.createElement("canvas");
    this.offscreenCanvas.width = preset.width;
    this.offscreenCanvas.height = preset.height;
    this.offscreenCtx = this.offscreenCanvas.getContext("2d")!;

    const stream = this.offscreenCanvas.captureStream(this.config.fps);
    const mimeType = this.getSupportedMimeType();
    this.chunks = [];
    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: preset.bitrate,
    });
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };
    this.mediaRecorder.start(100);
    this.startScalingLoop(sourceCanvas);
  }

  stopCapture(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) return reject(new Error("Not recording"));
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, {
          type: this.getSupportedMimeType(),
        });
        this.cleanup();
        resolve(blob);
      };
      this.mediaRecorder.stop();
    });
  }

  downloadBlob(blob: Blob, filename = "animation.webm"): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async captureAndDownload(
    canvas: HTMLCanvasElement,
    quality: QualityPreset,
    filename?: string,
  ): Promise<void> {
    this.startCapture(canvas, quality);
    await new Promise((r) => setTimeout(r, this.config.duration * 1000));
    const blob = await this.stopCapture();
    this.downloadBlob(blob, filename ?? `animation-${quality}.webm`);
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === "recording";
  }

  private startScalingLoop(src: HTMLCanvasElement): void {
    const scale = () => {
      if (!this.offscreenCtx || !this.offscreenCanvas) return;
      this.offscreenCtx.drawImage(
        src,
        0,
        0,
        this.offscreenCanvas.width,
        this.offscreenCanvas.height,
      );
      this.scalingRafId = requestAnimationFrame(scale);
    };
    this.scalingRafId = requestAnimationFrame(scale);
  }

  private cleanup(): void {
    cancelAnimationFrame(this.scalingRafId);
    this.offscreenCanvas = null;
    this.offscreenCtx = null;
    this.mediaRecorder = null;
    this.chunks = [];
  }

  private getSupportedMimeType(): string {
    for (const t of [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
      "video/mp4",
    ])
      if (MediaRecorder.isTypeSupported(t)) return t;
    return "video/webm";
  }
}
```

---

## Three.js Sprite / CanvasTexture Pattern

For character-based animations (letters, digits, symbols):

```typescript
function createCharSprite(
  char: string,
  fontSize: number,
  color: string,
): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = fontSize * 2;
  canvas.height = fontSize * 2;
  const ctx = canvas.getContext("2d")!;
  ctx.font = `${fontSize}px monospace`;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(char, fontSize, fontSize);
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(fontSize, fontSize, 1);
  return sprite;
}

// ALWAYS dispose when removing a sprite:
function disposeSprite(sprite: THREE.Sprite): void {
  (sprite.material as THREE.SpriteMaterial).map?.dispose();
  sprite.material.dispose();
}
```

**Sprite rules:**

- Sprites auto-face the camera (billboard) — never rotate them manually
- Scale in world units, not pixels
- Never share a CanvasTexture between sprites with different characters
- Set `texture.needsUpdate = true` only when canvas content changes

---

## Depth Effect Pattern

```typescript
function updateDepthAppearance(
  sprite: THREE.Sprite,
  camera: THREE.Camera,
  config: ParticleConfig,
): void {
  const dist = sprite.position.distanceTo(camera.position);
  const t = 1 - Math.min(dist / (config.orbit.radius.max * 2), 1); // 0=far, 1=close
  sprite.scale.setScalar(
    lerp(config.particles.minSize, config.particles.maxSize, t),
  );
  (sprite.material as THREE.SpriteMaterial).opacity = lerp(
    config.particles.minOpacity,
    config.particles.maxOpacity,
    t,
  );
}
```

---

## Fibonacci Sphere Distribution

```typescript
function fibonacciSphere(count: number, radius: number): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = goldenAngle * i;
    points.push(
      new THREE.Vector3(
        Math.cos(theta) * r * radius,
        y * radius,
        Math.sin(theta) * r * radius,
      ),
    );
  }
  return points;
}
```

---

## Dot-Matrix Letter Sampling

For animations where small particles fill the pixel shape of large letters:

```typescript
function sampleLetterPixels(
  char: string,
  fontSize: number,
  gridResolution: number,
): THREE.Vector2[] {
  const canvas = document.createElement("canvas");
  canvas.width = fontSize;
  canvas.height = fontSize * 1.2;
  const ctx = canvas.getContext("2d")!;
  ctx.font = `bold ${fontSize * 0.9}px monospace`;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(char, canvas.width / 2, canvas.height / 2);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const slots: THREE.Vector2[] = [];
  for (let y = 0; y < canvas.height; y += gridResolution)
    for (let x = 0; x < canvas.width; x += gridResolution)
      if (data[(y * canvas.width + x) * 4 + 3] > 128)
        slots.push(new THREE.Vector2(x, y));
  return slots;
}
```

---

## OrbitBehavior — 3D Orbit Math

```typescript
export interface OrbitParams {
  orbitRadius: number;
  angularSpeed: number;
  verticalOffset: number;
  verticalOscillation: number;
  verticalFrequency: number;
  phaseOffset: number;
  chaosSeeds: [number, number, number];
}

export class OrbitBehavior {
  static initParams(config: OrbitConfig, seed = Math.random()): OrbitParams {
    const rand = seededRandom(seed);
    return {
      orbitRadius: lerp(config.radius.min, config.radius.max, rand()),
      angularSpeed: (0.3 + rand() * 0.7) * config.speedMultiplier,
      verticalOffset: (rand() - 0.5) * config.radius.max * 0.8,
      verticalOscillation: rand() * config.radius.max * 0.15,
      verticalFrequency: 0.3 + rand() * 0.7,
      phaseOffset: rand() * Math.PI * 2,
      chaosSeeds: [rand(), rand(), rand()],
    };
  }

  static computePosition(
    params: OrbitParams,
    time: number,
    config: OrbitConfig,
  ): THREE.Vector3 {
    const angle = time * params.angularSpeed + params.phaseOffset;
    let pos = new THREE.Vector3(
      Math.cos(angle) * params.orbitRadius,
      params.verticalOffset +
        Math.sin(time * params.verticalFrequency + params.phaseOffset) *
          params.verticalOscillation,
      Math.sin(angle) * params.orbitRadius,
    );
    if (config.tiltAngle !== 0)
      pos = OrbitBehavior.applyAxisTilt(pos, config.tiltAngle);
    if (config.chaosIntensity > 0)
      pos = OrbitBehavior.applyChaos(
        pos,
        config.chaosIntensity,
        time,
        params.chaosSeeds,
      );
    return pos;
  }

  static applyAxisTilt(pos: THREE.Vector3, tiltDeg: number): THREE.Vector3 {
    const q = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(1, 0, 0),
      THREE.MathUtils.degToRad(tiltDeg),
    );
    return pos.clone().applyQuaternion(q);
  }

  static applyChaos(
    pos: THREE.Vector3,
    intensity: number,
    time: number,
    seeds: [number, number, number],
  ): THREE.Vector3 {
    const s = pos.length() * intensity * 0.3;
    return new THREE.Vector3(
      pos.x + Math.sin(time * 1.3 + seeds[0] * 100) * s,
      pos.y + Math.sin(time * 0.9 + seeds[1] * 100) * s,
      pos.z + Math.sin(time * 1.7 + seeds[2] * 100) * s,
    );
  }
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
```

---

## Particle State Machine

```
ORBITING ──► ASSEMBLING ──► ASSEMBLED ──► DISSOLVING ──► ORBITING
```

Each `LetterParticle` manages its own state. `ParticleSystem` triggers transitions.

```typescript
type ParticleState = "ORBITING" | "ASSEMBLING" | "ASSEMBLED" | "DISSOLVING";

class LetterParticle {
  sprite: THREE.Sprite;
  state: ParticleState = "ORBITING";
  orbitParams!: OrbitParams;

  // State transitions (called by ParticleSystem):
  startAssemble(
    target: THREE.Vector3,
    delay: number,
    easingFn: (t: number) => number,
  ): void;
  startDissolve(): void;

  // Called every frame:
  update(
    delta: number,
    time: number,
    camera: THREE.Camera,
    config: ParticleConfig,
  ): void;
  updateDepthAppearance(camera: THREE.Camera): void;

  setCharacter(char: string): void; // re-renders CanvasTexture
  dispose(): void;
}
```

---

## Easing Functions

```typescript
// Place in AssembleBehavior.ts
const Easing = {
  linear: (t: number) => t,
  easeIn: (t: number) => t * t,
  easeOut: (t: number) => t * (2 - t),
  easeInOut: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeInOutCubic: (t: number) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeOutElastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0
      ? 0
      : t === 1
        ? 1
        : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
};
```

---

## Resize Handling

```typescript
// Always add to every animation module:
private resizeObserver = new ResizeObserver(() => {
  const w = this.container.clientWidth
  const h = this.container.clientHeight
  this.camera.aspect = w / h
  this.camera.updateProjectionMatrix()
  this.renderer.setSize(w, h)
})

// in init():   this.resizeObserver.observe(this.container)
// in dispose(): this.resizeObserver.disconnect()
```

---

## Deep Merge Config Utility

```typescript
function mergeConfig<T>(base: T, override?: DeepPartial<T>): T {
  if (!override) return { ...base };
  const result = { ...base } as any;
  for (const key in override) {
    if (override[key] !== undefined) {
      result[key] =
        typeof override[key] === "object" && !Array.isArray(override[key])
          ? mergeConfig(result[key], override[key] as any)
          : override[key];
    }
  }
  return result;
}
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};
```

---

## UI Side Panel Rules

When building a configuration side panel:

1. Reuse the existing panel structure from the project — never create a new one
2. Every field must have a `?` icon button — hover shows a tooltip describing the parameter
3. Input types:
   - Number range → `<input type="range">` + numeric label
   - Color → `<input type="color">`
   - Toggle → `<input type="checkbox">`
   - Enum → `<select>`
   - Free text → `<input type="text">`
   - Vector3 → three number inputs labeled X / Y / Z
4. Section order: Word Settings → Particles → Orbit → Animation Phases → Export

---

## Performance Checklist

Before finalizing any animation module:

- [ ] No `new THREE.*` allocations inside the render loop
- [ ] `CanvasTexture.needsUpdate = true` only when canvas actually changed
- [ ] Use `object.visible = false` instead of scene.remove/add for toggling
- [ ] `dispose()` calls: `renderer`, `geometry`, `material`, `texture` for everything
- [ ] Pool and reuse CanvasTextures for identical characters
- [ ] `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))`
- [ ] Prefer `Sprite` over `PlaneGeometry` for billboard text
- [ ] For 500+ particles: use `InstancedMesh` instead of individual sprites
