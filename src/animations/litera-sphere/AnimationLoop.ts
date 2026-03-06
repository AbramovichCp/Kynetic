import type { FrameCallback } from './types';

/**
 * Wraps `requestAnimationFrame` with pause / resume / stop semantics and
 * cycle-completion tracking.
 */
export class AnimationLoop {
  private animationFrameId: number | null = null;
  private isRunning = false;
  private isPaused = false;

  private startTime = 0;
  private lastFrameTime = 0;
  private elapsedBeforePause = 0;

  private onFrame: FrameCallback | null = null;
  private cycleDuration: number;
  private onCycleComplete: (() => void) | null = null;
  private cycleCount = 0;

  /**
   * @param cycleDuration Duration of one full animation cycle in **milliseconds**.
   */
  constructor(cycleDuration: number) {
    this.cycleDuration = cycleDuration;
  }

  /**
   * Start the animation loop.
   *
   * @param onFrame Callback invoked every frame with `(deltaTime, elapsedTime)`
   *                where both values are in **seconds**.
   */
  start(onFrame: FrameCallback): void {
    this.onFrame = onFrame;
    this.isRunning = true;
    this.isPaused = false;
    this.startTime = performance.now();
    this.lastFrameTime = this.startTime;
    this.elapsedBeforePause = 0;
    this.cycleCount = 0;
    this.tick();
  }

  /** Pause the loop — can be resumed later. */
  pause(): void {
    if (!this.isRunning || this.isPaused) return;
    this.isPaused = true;
    this.elapsedBeforePause += performance.now() - this.startTime;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /** Resume after a `pause()`. */
  resume(): void {
    if (!this.isRunning || !this.isPaused) return;
    this.isPaused = false;
    this.startTime = performance.now();
    this.lastFrameTime = this.startTime;
    this.tick();
  }

  /** Stop the loop entirely and release the frame callback. */
  stop(): void {
    this.isRunning = false;
    this.isPaused = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.onFrame = null;
  }

  /** Dynamically update the cycle duration (in ms). */
  setCycleDuration(duration: number): void {
    this.cycleDuration = duration;
  }

  /** Register (or clear) a callback fired after each full cycle. */
  setOnCycleComplete(callback: (() => void) | null): void {
    this.onCycleComplete = callback;
  }

  /* ---------------------------------------------------------------------- */
  /*  Internal tick                                                         */
  /* ---------------------------------------------------------------------- */

  private tick = (): void => {
    if (!this.isRunning || this.isPaused) return;

    const now = performance.now();
    const deltaTime = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;

    const totalElapsed = this.elapsedBeforePause + (now - this.startTime);

    // Detect cycle completion
    const currentCycle = Math.floor(totalElapsed / this.cycleDuration);
    if (currentCycle > this.cycleCount) {
      this.cycleCount = currentCycle;
      this.onCycleComplete?.();
    }

    this.onFrame?.(deltaTime, totalElapsed / 1000);

    this.animationFrameId = requestAnimationFrame(this.tick);
  };
}
