import { Phase } from './types';
import type { LoopCallbacks, LetterVortexConfig } from './types';

/**
 * `requestAnimationFrame` wrapper with phase-management for the LetterVortex
 * animation.
 *
 * Phase order: SCATTER → ASSEMBLE → HOLD → DISSOLVE → (loop)
 *
 * Tracks elapsed time, delta time and fires {@link LoopCallbacks.onFrame}
 * with the current phase and normalised progress [0,1] within that phase.
 */
export class AnimationLoop {
  /* ---- state ----------------------------------------------------------- */
  private animationFrameId: number | null = null;
  private isRunning = false;
  private isPaused = false;

  private startTime = 0;
  private lastFrameTime = 0;
  private elapsedBeforePause = 0;

  private callbacks: LoopCallbacks | null = null;

  /* ---- config (hot-updatable) ----------------------------------------- */
  private cycleDuration: number;
  private phaseOffsets: { phase: Phase; start: number; end: number }[] = [];
  private loop: boolean;

  /* ---- forced phase override ------------------------------------------ */
  private forcedPhase: Phase | null = null;

  /* ==================================================================== */
  /*  Constructor                                                         */
  /* ==================================================================== */

  constructor(config: LetterVortexConfig) {
    this.cycleDuration = config.animation.cycleDuration;
    this.loop = config.animation.loop;
    this.rebuildPhaseTable(config);
  }

  /* ==================================================================== */
  /*  Public API                                                          */
  /* ==================================================================== */

  /** Begin the loop from the start. */
  start(callbacks: LoopCallbacks): void {
    this.callbacks = callbacks;
    this.isRunning = true;
    this.isPaused = false;
    this.startTime = performance.now();
    this.lastFrameTime = this.startTime;
    this.elapsedBeforePause = 0;
    this.forcedPhase = null;
    this.tick();
  }

  /** Pause the animation (keeps state). */
  pause(): void {
    if (!this.isRunning || this.isPaused) return;
    this.isPaused = true;
    this.elapsedBeforePause += performance.now() - this.startTime;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /** Resume from paused state. */
  resume(): void {
    if (!this.isRunning || !this.isPaused) return;
    this.isPaused = false;
    this.startTime = performance.now();
    this.lastFrameTime = this.startTime;
    this.tick();
  }

  /** Full stop — clears callbacks. */
  stop(): void {
    this.isRunning = false;
    this.isPaused = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.callbacks = null;
  }

  /** Apply updated config (durations / loop flag). */
  updateConfig(config: LetterVortexConfig): void {
    this.cycleDuration = config.animation.cycleDuration;
    this.loop = config.animation.loop;
    this.rebuildPhaseTable(config);
  }

  /** Force the loop into a specific phase (e.g. from UI). */
  setPhase(phase: Phase): void {
    this.forcedPhase = phase;
    // reset elapsed so the phase starts from 0
    this.elapsedBeforePause = 0;
    this.startTime = performance.now();
    this.lastFrameTime = this.startTime;
  }

  /* ==================================================================== */
  /*  Private — phase table                                               */
  /* ==================================================================== */

  private rebuildPhaseTable(config: LetterVortexConfig): void {
    const p = config.animation.phases;
    const total =
      p.scatter.duration + p.assemble.duration + p.hold.duration + p.dissolve.duration;

    // Normalise durations so they fit into cycleDuration
    const scale = this.cycleDuration / total;

    let cursor = 0;
    this.phaseOffsets = [];

    const phases: { phase: Phase; dur: number }[] = [
      { phase: Phase.Scatter, dur: p.scatter.duration * scale },
      { phase: Phase.Assemble, dur: p.assemble.duration * scale },
      { phase: Phase.Hold, dur: p.hold.duration * scale },
      { phase: Phase.Dissolve, dur: p.dissolve.duration * scale },
    ];

    for (const { phase, dur } of phases) {
      this.phaseOffsets.push({ phase, start: cursor, end: cursor + dur });
      cursor += dur;
    }
  }

  /* ==================================================================== */
  /*  Private — tick                                                      */
  /* ==================================================================== */

  private tick = (): void => {
    if (!this.isRunning || this.isPaused) return;

    const now = performance.now();
    const deltaMs = now - this.lastFrameTime;
    this.lastFrameTime = now;
    const delta = deltaMs / 1000; // seconds

    const totalElapsed = this.elapsedBeforePause + (now - this.startTime);

    // Determine cycle position
    let cyclePos = totalElapsed % this.cycleDuration;
    if (!this.loop && totalElapsed >= this.cycleDuration) {
      // Clamp at end of last phase
      cyclePos = this.cycleDuration - 0.001;
    }

    // Resolve phase + progress
    let currentPhase: Phase = Phase.Scatter;
    let progress = 0;

    if (this.forcedPhase) {
      currentPhase = this.forcedPhase;
      const entry = this.phaseOffsets.find((e) => e.phase === this.forcedPhase);
      if (entry) {
        const dur = entry.end - entry.start;
        progress = dur > 0 ? Math.min((totalElapsed % dur) / dur, 1) : 0;
      }
    } else {
      for (const entry of this.phaseOffsets) {
        if (cyclePos >= entry.start && cyclePos < entry.end) {
          currentPhase = entry.phase;
          const dur = entry.end - entry.start;
          progress = dur > 0 ? (cyclePos - entry.start) / dur : 0;
          break;
        }
      }
    }

    // Notify phase change
    this.callbacks?.onFrame(delta, currentPhase, progress);

    this.animationFrameId = requestAnimationFrame(this.tick);
  };
}
