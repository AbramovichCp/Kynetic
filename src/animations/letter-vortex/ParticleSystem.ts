import { Vector3, type Camera, type Group } from "three";
import { Phase } from "./types";
import type { LetterVortexConfig } from "./types";
import { LetterParticle } from "./LetterParticle";

/**
 * Manages the full population of {@link LetterParticle} instances.
 *
 * Responsibilities:
 * - Spawning particles with random characters from the source pool.
 * - Assigning target particles to assembled-letter positions.
 * - Delegating per-frame updates to the correct behaviour based on the
 *   current animation phase.
 */
export class ParticleSystem {
  private particles: LetterParticle[] = [];
  private group: Group;

  /** Indices into `particles` that are assigned to word letters. */
  private targetIndices: number[] = [];

  /** Elapsed time tracker (seconds). */
  private elapsedTime = 0;

  /** Previous phase — used to detect phase transitions. */
  private prevPhase: Phase | null = null;

  /* ==================================================================== */
  /*  Constructor                                                         */
  /* ==================================================================== */

  constructor(group: Group) {
    this.group = group;
  }

  /* ==================================================================== */
  /*  Lifecycle                                                           */
  /* ==================================================================== */

  /**
   * Create `count` particles with random characters from the source pool.
   */
  spawn(count: number, config: LetterVortexConfig): void {
    const pool = config.particles.sourceChars;
    for (let i = 0; i < count; i++) {
      const char = pool[Math.floor(Math.random() * pool.length)];
      const particle = new LetterParticle(char, config);
      this.particles.push(particle);
      this.group.add(particle.sprite);
    }
  }

  /**
   * Assign specific particles to become the letters of the target word.
   *
   * Picks the first N particles (where N = positions.length), swaps their
   * character to the correct letter, sets their target position, and records
   * their current position as assembleOrigin.
   */
  assignTargets(
    positions: Vector3[],
    chars: string[],
    config: LetterVortexConfig,
  ): void {
    this.targetIndices = [];
    const count = Math.min(positions.length, this.particles.length);

    for (let i = 0; i < count; i++) {
      const p = this.particles[i];
      p.targetPosition = positions[i].clone();
      p.targetChar = chars[i];
      p.assembleOrigin = p.sprite.position.clone();
      p.staggerOffset =
        (i * config.animation.phases.assemble.staggerDelay) /
        config.animation.phases.assemble.duration;
      p.staggerOffset = Math.min(p.staggerOffset, 0.7); // cap so last letters still have time

      // Swap displayed character to the target letter
      p.setCharacter(chars[i], config);
      this.targetIndices.push(i);
    }
  }

  /**
   * Release all target assignments — particles return to random-letter orbit.
   */
  releaseTargets(config: LetterVortexConfig): void {
    const pool = config.particles.sourceChars;
    for (const idx of this.targetIndices) {
      const p = this.particles[idx];
      p.dissolveOrigin = p.sprite.position.clone();
      p.targetPosition = null;
      p.targetChar = null;
      p.assembleOrigin = null;

      // Restore a random character
      const char = pool[Math.floor(Math.random() * pool.length)];
      p.setCharacter(char, config);
    }
    this.targetIndices = [];
  }

  /* ==================================================================== */
  /*  Per-frame update                                                    */
  /* ==================================================================== */

  /**
   * Called every frame by the orchestrator.
   *
   * @param delta     Delta time in seconds.
   * @param phase     Current animation phase.
   * @param progress  Normalised progress [0,1] within the phase.
   * @param config    Current config.
   * @param camera    Camera for depth effects.
   * @param wordPositions  Pre-computed target positions.
   * @param wordChars      Matching character array for targets.
   */
  update(
    delta: number,
    phase: Phase,
    progress: number,
    config: LetterVortexConfig,
    camera: Camera,
    wordPositions: Vector3[],
    wordChars: string[],
  ): void {
    this.elapsedTime += delta;

    // Detect phase transitions
    if (phase !== this.prevPhase) {
      this.onPhaseEnter(phase, config, wordPositions, wordChars);
      this.prevPhase = phase;
    }

    const orbitCfg = config.orbit;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const isTarget = this.targetIndices.includes(i);

      switch (phase) {
        case Phase.Scatter:
          p.updateOrbit(this.elapsedTime, orbitCfg);
          break;

        case Phase.Assemble:
          if (isTarget) {
            p.updateAssemble(
              progress,
              config.animation.phases.assemble.speedCurve,
              config,
            );
          } else {
            p.updateOrbit(this.elapsedTime, orbitCfg);
          }
          break;

        case Phase.Hold:
          if (isTarget) {
            // Snap to assembled size
            p.applyAssembledSize(config);
          } else {
            p.updateOrbit(this.elapsedTime, orbitCfg);
          }
          break;

        case Phase.Dissolve:
          if (isTarget) {
            p.updateDissolve(
              progress,
              config.animation.phases.dissolve.speedCurve,
              this.elapsedTime,
              config,
            );
          } else {
            p.updateOrbit(this.elapsedTime, orbitCfg);
          }
          break;
      }

      // Depth-based visual updates (orbit phase only — assembled particles have fixed size)
      if (!isTarget || phase === Phase.Scatter) {
        p.updateDepthAppearance(camera, config);
      }
    }
  }

  /* ==================================================================== */
  /*  Cleanup                                                             */
  /* ==================================================================== */

  /** Dispose all particles and remove from the scene group. */
  dispose(): void {
    for (const p of this.particles) {
      this.group.remove(p.sprite);
      p.dispose();
    }
    this.particles = [];
    this.targetIndices = [];
  }

  /** Re-render all particle textures (e.g. after colour / font change). */
  refreshTextures(config: LetterVortexConfig): void {
    for (const p of this.particles) {
      p.setCharacter(p.char, config);
    }
  }

  /* ==================================================================== */
  /*  Private — phase transition handlers                                */
  /* ==================================================================== */

  private onPhaseEnter(
    phase: Phase,
    config: LetterVortexConfig,
    wordPositions: Vector3[],
    wordChars: string[],
  ): void {
    switch (phase) {
      case Phase.Assemble:
        this.assignTargets(wordPositions, wordChars, config);
        break;
      case Phase.Dissolve:
        // Record current positions as dissolve origins
        for (const idx of this.targetIndices) {
          this.particles[idx].dissolveOrigin =
            this.particles[idx].sprite.position.clone();
        }
        break;
      case Phase.Scatter:
        // Release targets when entering scatter after dissolve
        if (this.targetIndices.length > 0) {
          this.releaseTargets(config);
        }
        break;
      default:
        break;
    }
  }
}
