import {
  CanvasTexture,
  MathUtils,
  Sprite,
  SpriteMaterial,
  Vector3,
  type Camera,
} from "three";
import type { LetterVortexConfig, OrbitConfig, EasingCurve } from "./types";
import { OrbitBehavior } from "./OrbitBehavior";
import { AssembleBehavior } from "./AssembleBehavior";

/**
 * A single letter entity in the LetterVortex animation.
 *
 * Wraps a Three.js `Sprite` and manages its own position, velocity,
 * state-machine (orbit / assemble / hold / dissolve) and visual appearance.
 */
export class LetterParticle {
  /* ---- Three.js object ------------------------------------------------ */
  readonly sprite: Sprite;

  /* ---- character data ------------------------------------------------- */
  char: string;

  /* ---- orbit parameters (randomised per particle) --------------------- */
  readonly orbitRadius: number;
  readonly orbitSpeed: number;
  readonly phaseOffset: number;
  readonly heightOffset: number;

  /* ---- assembly state ------------------------------------------------- */
  targetPosition: Vector3 | null = null;
  targetChar: string | null = null;
  /** Position the particle was at when assembly started. */
  assembleOrigin: Vector3 | null = null;
  /** Per-particle stagger delay (normalised 0-1 within assemble phase). */
  staggerOffset = 0;
  /** Whether this particle is currently locked to a grid slot. */
  isAssembled = false;

  /* ---- dissolve state ------------------------------------------------- */
  dissolveOrigin: Vector3 | null = null;

  /* ---- texture cache -------------------------------------------------- */
  private textureCache = new Map<string, CanvasTexture>();

  /* ==================================================================== */
  /*  Constructor                                                         */
  /* ==================================================================== */

  constructor(char: string, config: LetterVortexConfig) {
    this.char = char;

    // Randomise orbit parameters
    this.orbitRadius = MathUtils.lerp(
      config.orbit.radius.min,
      config.orbit.radius.max,
      Math.random(),
    );
    this.orbitSpeed = (0.5 + Math.random()) * 1.5; // rad/s base
    this.phaseOffset = Math.random() * Math.PI * 2;
    this.heightOffset = MathUtils.lerp(40, 200, Math.random());

    // Create sprite
    const texture = this.renderTexture(char, config);
    const material = new SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: config.particles.maxOpacity,
      depthWrite: false,
      depthTest: true,
    });
    this.sprite = new Sprite(material);

    // Initial position via orbit
    const pos = OrbitBehavior.computeOrbitPosition(
      this.orbitRadius,
      this.orbitSpeed,
      this.phaseOffset,
      this.heightOffset,
      0,
      config.orbit,
    );
    this.sprite.position.copy(pos);

    const scale = config.particles.orbitMaxSize;
    this.sprite.scale.set(scale, scale, 1);
  }

  /* ==================================================================== */
  /*  Update methods (called per-frame by ParticleSystem)                 */
  /* ==================================================================== */

  /**
   * Move the particle along its chaotic orbit.
   *
   * @param time   Elapsed time in seconds.
   * @param config Orbit config section.
   */
  updateOrbit(time: number, config: OrbitConfig): void {
    const pos = OrbitBehavior.computeOrbitPosition(
      this.orbitRadius,
      this.orbitSpeed,
      this.phaseOffset,
      this.heightOffset,
      time,
      config,
    );
    this.sprite.position.copy(pos);
  }

  /**
   * Interpolate from orbit origin toward the target assembly position.
   * Also interpolate size from orbit size to assembled size.
   *
   * @param progress  Normalised phase progress [0,1].
   * @param curve     Easing curve name to apply.
   * @param config    Full config for size interpolation.
   */
  updateAssemble(
    progress: number,
    curve: EasingCurve,
    config: LetterVortexConfig,
  ): void {
    if (!this.assembleOrigin || !this.targetPosition) return;

    // Account for per-particle stagger
    const adjusted = Math.max(
      0,
      (progress - this.staggerOffset) / (1 - this.staggerOffset),
    );

    const pos = AssembleBehavior.interpolate(
      this.assembleOrigin,
      this.targetPosition,
      adjusted,
      curve,
    );
    this.sprite.position.copy(pos);

    // Interpolate size: orbit size → assembled size
    const easedT = AssembleBehavior.getEasingFn(curve)(Math.min(adjusted, 1));
    const orbitSize = config.particles.orbitMaxSize;
    const assembledSize = config.particles.assembledSize;
    const size = MathUtils.lerp(orbitSize, assembledSize, easedT);
    this.sprite.scale.set(size, size, 1);
  }

  /**
   * Interpolate from hold position back out to a new orbit position.
   * Also interpolate size from assembled size back to orbit size.
   *
   * @param progress  Normalised phase progress [0,1].
   * @param curve     Easing curve name.
   * @param time      Current elapsed time (for orbit target computation).
   * @param config    Full config.
   */
  updateDissolve(
    progress: number,
    curve: EasingCurve,
    time: number,
    config: LetterVortexConfig,
  ): void {
    if (!this.dissolveOrigin) return;

    const orbitTarget = OrbitBehavior.computeOrbitPosition(
      this.orbitRadius,
      this.orbitSpeed,
      this.phaseOffset,
      this.heightOffset,
      time,
      config.orbit,
    );

    const pos = AssembleBehavior.interpolate(
      this.dissolveOrigin,
      orbitTarget,
      progress,
      curve,
    );
    this.sprite.position.copy(pos);

    // Size: assembled → orbit
    const easedT = AssembleBehavior.getEasingFn(curve)(Math.min(progress, 1));
    const assembledSize = config.particles.assembledSize;
    const orbitSize = config.particles.orbitMaxSize;
    const size = MathUtils.lerp(assembledSize, orbitSize, easedT);
    this.sprite.scale.set(size, size, 1);
  }

  /**
   * Snap size to assembled size (used during HOLD phase).
   */
  applyAssembledSize(config: LetterVortexConfig): void {
    const s = config.particles.assembledSize;
    this.sprite.scale.set(s, s, 1);
  }

  /* ==================================================================== */
  /*  Character rendering                                                 */
  /* ==================================================================== */

  /**
   * Change the displayed character.  Re-renders the canvas texture.
   */
  setCharacter(char: string, config: LetterVortexConfig): void {
    this.char = char;
    const texture = this.renderTexture(char, config);
    (this.sprite.material as SpriteMaterial).map?.dispose();
    (this.sprite.material as SpriteMaterial).map = texture;
    (this.sprite.material as SpriteMaterial).needsUpdate = true;
  }

  /* ==================================================================== */
  /*  Depth-based appearance (orbit phase only)                           */
  /* ==================================================================== */

  /**
   * Adjust size and opacity based on the particle's Z position relative to
   * the camera.  Only applied during orbit (not when assembled).
   */
  updateDepthAppearance(_camera: Camera, config: LetterVortexConfig): void {
    if (!config.particles.depthScale) return;

    const worldPos = new Vector3();
    this.sprite.getWorldPosition(worldPos);

    const maxDist = config.orbit.radius.max * 2;
    const t = MathUtils.clamp((worldPos.z + maxDist) / (2 * maxDist), 0, 1);

    // opacity: further → more transparent
    const opacity = MathUtils.lerp(
      config.particles.minOpacity,
      config.particles.maxOpacity,
      t,
    );
    (this.sprite.material as SpriteMaterial).opacity = opacity;

    // size: further → smaller (orbit range)
    const size = MathUtils.lerp(
      config.particles.orbitMinSize,
      config.particles.orbitMaxSize,
      t,
    );
    this.sprite.scale.set(size, size, 1);
  }

  /* ==================================================================== */
  /*  Cleanup                                                             */
  /* ==================================================================== */

  /** Dispose textures and material. */
  dispose(): void {
    this.textureCache.forEach((tex) => tex.dispose());
    this.textureCache.clear();
    (this.sprite.material as SpriteMaterial).map?.dispose();
    (this.sprite.material as SpriteMaterial).dispose();
  }

  /* ==================================================================== */
  /*  Private — texture rendering                                        */
  /* ==================================================================== */

  private renderTexture(
    char: string,
    config: LetterVortexConfig,
  ): CanvasTexture {
    const key = `${char}_${config.word.color}_${config.word.fontFamily}`;
    const cached = this.textureCache.get(key);
    if (cached) return cached;

    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, size, size);
    ctx.font = `bold ${size * 0.7}px ${config.word.fontFamily}`;
    ctx.fillStyle = config.word.color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(char, size / 2, size / 2);

    const texture = new CanvasTexture(canvas);
    texture.needsUpdate = true;
    this.textureCache.set(key, texture);
    return texture;
  }
}
