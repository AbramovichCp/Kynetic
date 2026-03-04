/**
 * ParticleEngine — pure-logic animation system for Kinetic text animation.
 * Operates on typed data; completely decoupled from React.
 */

import type {
  AnimationConfig,
  BackgroundLetter,
  FormingLetter,
  Point,
} from "./types";

// ---- helpers ----------------------------------------------------------------

function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function dist(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// ---- engine -----------------------------------------------------------------

export class ParticleEngine {
  config: AnimationConfig;

  letters: BackgroundLetter[] = [];
  formingLetters: FormingLetter[] = [];
  silhouettePoints: Point[] = [];

  phase = 0; // 0–3 cycling
  phaseStart = 0;
  private lastTime = 0;

  private offscreen: OffscreenCanvas | null = null;

  /** Loaded background image element (if any). */
  bgImage: HTMLImageElement | null = null;
  private bgImageSrc: string | null = null;

  constructor(config: AnimationConfig) {
    this.config = { ...config };
    this.init();
  }

  // ---- public ---------------------------------------------------------------

  /** Full re-initialisation (new config, new letters, new silhouette). */
  init(): void {
    this.letters = [];
    this.formingLetters = [];
    this.phase = 0;
    this.phaseStart = performance.now();
    this.lastTime = 0;

    const {
      width,
      height,
      totalBackgroundLetters,
      wordList,
      logoLettersCount,
      duplicationPercent,
    } = this.config;

    // Background letters
    for (let i = 0; i < totalBackgroundLetters; i++) {
      const word = wordList[Math.floor(Math.random() * wordList.length)];
      const char = word.charAt(Math.floor(Math.random() * word.length));
      const angle = Math.random() * Math.PI * 2;
      this.letters.push({
        char,
        x: randomRange(0, width),
        y: randomRange(0, height),
        vx: Math.cos(angle),
        vy: Math.sin(angle),
      });
    }

    this.createSilhouette();

    // Forming letters — created up-front so they drift from the start
    const effectiveCount = Math.round(
      (logoLettersCount * duplicationPercent) / 100,
    );
    const nLetters = Math.min(effectiveCount, this.silhouettePoints.length);

    for (let i = 0; i < nLetters; i++) {
      const word = wordList[Math.floor(Math.random() * wordList.length)];
      const char = word.charAt(Math.floor(Math.random() * word.length));
      const angle = Math.random() * Math.PI * 2;
      this.formingLetters.push({
        char,
        x: randomRange(0, width),
        y: randomRange(0, height),
        vx: Math.cos(angle),
        vy: Math.sin(angle),
        startX: 0,
        startY: 0,
        tx: 0,
        ty: 0,
      });
    }
  }

  /** Update config at runtime without full re-init when possible. */
  updateConfig(next: AnimationConfig): void {
    const needsReinit =
      next.targetText !== this.config.targetText ||
      next.fontFamily !== this.config.fontFamily ||
      next.fontSize !== this.config.fontSize ||
      next.width !== this.config.width ||
      next.height !== this.config.height ||
      next.totalBackgroundLetters !== this.config.totalBackgroundLetters ||
      next.logoLettersCount !== this.config.logoLettersCount ||
      next.duplicationPercent !== this.config.duplicationPercent ||
      next.wordList.join(",") !== this.config.wordList.join(",");

    this.config = { ...next };

    if (needsReinit) {
      this.init();
    }
  }

  /** Called every animation frame. Returns nothing — caller reads state. */
  update(now: number): void {
    const { phaseDuration, width, height, freeFlightSpeed } = this.config;

    // Delta time in seconds, clamped to avoid huge jumps after tab switches
    const dt =
      this.lastTime === 0 ? 0 : Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    // Phase transitions
    if (now - this.phaseStart > phaseDuration) {
      this.phase = (this.phase + 1) % 4;
      this.phaseStart = now;

      if (this.phase === 1) {
        this.assignFormingTargets();
      }
    }

    // Background letters — drift controlled by freeFlightSpeed
    const bgDrift = freeFlightSpeed * dt;
    for (const l of this.letters) {
      l.x += l.vx * bgDrift;
      l.y += l.vy * bgDrift;

      // Wrap around
      if (l.x < -20) l.x = width + 20;
      if (l.x > width + 20) l.x = -20;
      if (l.y < -20) l.y = height + 20;
      if (l.y > height + 20) l.y = -20;
    }

    if (this.phase === 0 || this.phase === 3) {
      // Forming letters — free drift
      const drift = freeFlightSpeed * dt;
      for (const l of this.formingLetters) {
        l.x += l.vx * drift;
        l.y += l.vy * drift;

        // Wrap around
        if (l.x < -20) l.x = width + 20;
        if (l.x > width + 20) l.x = -20;
        if (l.y < -20) l.y = height + 20;
        if (l.y > height + 20) l.y = -20;
      }
    } else {
      // Forming letters — move towards / away from target
      const speed = this.config.particleSpeed;
      for (const l of this.formingLetters) {
        const targetX = this.phase === 1 ? l.tx : l.startX;
        const targetY = this.phase === 1 ? l.ty : l.startY;

        const dx = targetX - l.x;
        const dy = targetY - l.y;
        const d = Math.sqrt(dx * dx + dy * dy);

        if (d > 0.5) {
          const step = (d / 15) * speed;
          l.x += (dx / d) * step;
          l.y += (dy / d) * step;
        }
      }
    }
  }

  /** Render current state onto provided CanvasRenderingContext2D. */
  draw(ctx: CanvasRenderingContext2D): void {
    const {
      width,
      height,
      fontFamily,
      letterSize,
      letterColor,
      letterColorAlpha,
      backgroundColor,
      backgroundColorAlpha,
    } = this.config;

    ctx.clearRect(0, 0, width, height);

    // 1) Background image (if loaded)
    if (
      this.bgImage &&
      this.bgImage.complete &&
      this.bgImage.naturalWidth > 0
    ) {
      ctx.drawImage(this.bgImage, 0, 0, width, height);
    }

    // 2) Background colour overlay
    ctx.globalAlpha = backgroundColorAlpha;
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 1;

    // 3) Letters
    ctx.globalAlpha = letterColorAlpha;
    ctx.fillStyle = letterColor;
    ctx.font = `${letterSize}px ${fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (const l of this.letters) {
      ctx.fillText(l.char, l.x, l.y);
    }

    for (const l of this.formingLetters) {
      ctx.fillText(l.char, l.x, l.y);
    }
    ctx.globalAlpha = 1;
  }

  /** Load a new background image from a data-URL (or clear it). */
  loadBackgroundImage(src: string | null): void {
    if (src === this.bgImageSrc) return;
    this.bgImageSrc = src;
    if (!src) {
      this.bgImage = null;
      return;
    }
    const img = new Image();
    img.onload = () => {
      this.bgImage = img;
    };
    img.src = src;
  }

  // ---- private --------------------------------------------------------------

  private createSilhouette(): void {
    const { width, height, targetText, fontFamily, fontSize } = this.config;

    this.offscreen = new OffscreenCanvas(width, height);
    const ctx = this.offscreen.getContext("2d")!;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);

    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff";
    ctx.fillText(targetText, width / 2, height / 2);

    const imageData = ctx.getImageData(0, 0, width, height);
    const pixels = imageData.data;

    this.silhouettePoints = [];
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) * 0.5;

    const step = 6;
    for (let x = 0; x < width; x += step) {
      for (let y = 0; y < height; y += step) {
        const idx = 4 * (y * width + x);
        if (pixels[idx] > 128) {
          const r = dist(x, y, centerX, centerY);
          if (r < maxRadius) {
            this.silhouettePoints.push({ x, y });
          }
        }
      }
    }

    this.silhouettePoints.sort(
      (a, b) =>
        dist(a.x, a.y, centerX, centerY) - dist(b.x, b.y, centerX, centerY),
    );
  }

  /** Assign silhouette target positions to existing forming letters. */
  private assignFormingTargets(): void {
    const nLetters = this.formingLetters.length;
    const points = shuffle(this.silhouettePoints).slice(0, nLetters);

    for (let i = 0; i < nLetters; i++) {
      const l = this.formingLetters[i];
      const pt = points[i] ?? { x: l.x, y: l.y };
      l.startX = l.x;
      l.startY = l.y;
      l.tx = pt.x;
      l.ty = pt.y;
    }
  }
}
