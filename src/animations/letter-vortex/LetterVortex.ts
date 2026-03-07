import {
  Color,
  Group,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three';
import { LETTER_VORTEX_CONFIG } from './config';
import { Phase } from './types';
import type {
  DeepPartial,
  LetterVortexConfig,
  QualityPreset,
} from './types';
import { AnimationLoop } from './AnimationLoop';
import { ParticleSystem } from './ParticleSystem';
import { WordLayoutBuilder } from './WordLayoutBuilder';
import { VideoExporter } from './VideoExporter';

/* ------------------------------------------------------------------ */
/*  Deep-merge helper                                                 */
/* ------------------------------------------------------------------ */

function deepMerge<T>(target: T, source: DeepPartial<T>): T {
  if (
    typeof target !== 'object' ||
    target === null ||
    typeof source !== 'object' ||
    source === null
  ) {
    return (source ?? target) as T;
  }

  const result: Record<string, unknown> = {
    ...(target as Record<string, unknown>),
  };

  for (const key of Object.keys(source as Record<string, unknown>)) {
    const srcVal = (source as Record<string, unknown>)[key];
    if (srcVal === undefined) continue;

    const tgtVal = (target as Record<string, unknown>)[key];
    if (
      typeof srcVal === 'object' &&
      srcVal !== null &&
      !Array.isArray(srcVal) &&
      typeof tgtVal === 'object' &&
      tgtVal !== null &&
      !Array.isArray(tgtVal)
    ) {
      result[key] = deepMerge(tgtVal, srcVal as DeepPartial<typeof tgtVal>);
    } else {
      result[key] = srcVal;
    }
  }

  return result as T;
}

/* ------------------------------------------------------------------ */
/*  LetterVortex — main orchestrator                                  */
/* ------------------------------------------------------------------ */

/**
 * Main entry-point class for the LetterVortex animation.
 *
 * Manages the Three.js scene, camera, renderer, particle population, phase
 * transitions and video export.
 *
 * @example
 * ```ts
 * const lv = new LetterVortex(document.getElementById('container')!);
 * lv.init();
 * // later …
 * lv.dispose();
 * ```
 */
export class LetterVortex {
  /* ---- dependencies ---------------------------------------------------- */
  private container: HTMLElement;
  private config: LetterVortexConfig;

  private animationLoop: AnimationLoop;
  private particleSystem!: ParticleSystem;
  private layoutBuilder: WordLayoutBuilder;
  private videoExporter: VideoExporter;

  /* ---- Three.js objects ------------------------------------------------ */
  private scene!: Scene;
  private camera!: PerspectiveCamera;
  private renderer!: WebGLRenderer;
  private group!: Group;

  /* ---- layout cache ---------------------------------------------------- */
  private wordPositions: Vector3[] = [];
  private wordChars: string[] = [];

  /* ---- misc ------------------------------------------------------------ */
  private resizeObserver: ResizeObserver | null = null;

  /* ==================================================================== */
  /*  Constructor                                                         */
  /* ==================================================================== */

  constructor(
    container: HTMLElement,
    config?: DeepPartial<LetterVortexConfig>,
  ) {
    this.container = container;
    this.config = config
      ? deepMerge<LetterVortexConfig>(
          structuredClone(LETTER_VORTEX_CONFIG) as LetterVortexConfig,
          config,
        )
      : (structuredClone(LETTER_VORTEX_CONFIG) as LetterVortexConfig);

    this.animationLoop = new AnimationLoop(this.config);
    this.layoutBuilder = new WordLayoutBuilder();
    this.videoExporter = new VideoExporter();
  }

  /* ==================================================================== */
  /*  Lifecycle                                                           */
  /* ==================================================================== */

  /** Set up the Three.js scene, populate particles and optionally auto-play. */
  init(): void {
    this.setupThreeJS();
    this.buildParticles();
    this.computeWordLayout();
    this.setupResizeObserver();

    if (this.config.animation.autoPlay) {
      this.start();
    }
  }

  /** Begin (or restart) the animation loop. */
  start(): void {
    this.animationLoop.start({
      onFrame: this.onFrame,
    });
  }

  /** Stop the animation loop. */
  stop(): void {
    this.animationLoop.stop();
  }

  /** Tear down everything — textures, renderer, observers, DOM nodes. */
  dispose(): void {
    this.animationLoop.stop();
    this.videoExporter.dispose();
    this.resizeObserver?.disconnect();
    this.particleSystem.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  /* ==================================================================== */
  /*  Configuration                                                       */
  /* ==================================================================== */

  /** Apply a partial config update; rebuilds when structural values change. */
  updateConfig(patch: DeepPartial<LetterVortexConfig>): void {
    const prev = this.config;
    this.config = deepMerge<LetterVortexConfig>(
      structuredClone(this.config),
      patch,
    );

    this.animationLoop.updateConfig(this.config);

    // Structural changes → full rebuild
    const needsRebuild =
      prev.particles.orbitCount !== this.config.particles.orbitCount ||
      prev.particles.sourceChars !== this.config.particles.sourceChars ||
      prev.particles.gridResolution !== this.config.particles.gridResolution ||
      prev.word.target !== this.config.word.target ||
      prev.word.letterSpacing !== this.config.word.letterSpacing ||
      prev.word.targetFontSize !== this.config.word.targetFontSize ||
      prev.word.letterHeight !== this.config.word.letterHeight;

    if (needsRebuild) {
      this.particleSystem.dispose();
      this.buildParticles();
      this.computeWordLayout();
    } else {
      // Visual-only refresh
      const needsRefresh =
        prev.word.color !== this.config.word.color ||
        prev.word.fontFamily !== this.config.word.fontFamily;
      if (needsRefresh) {
        this.particleSystem.refreshTextures(this.config);
      }
    }

    // Camera distance
    this.camera.position.z = this.config.orbit.radius.max * 2.2;
  }

  /** Reset all config back to the built-in defaults and rebuild. */
  resetConfig(): void {
    this.config = structuredClone(LETTER_VORTEX_CONFIG) as LetterVortexConfig;
    this.animationLoop.updateConfig(this.config);
    this.particleSystem.dispose();
    this.buildParticles();
    this.computeWordLayout();
    this.camera.position.z = this.config.orbit.radius.max * 2.2;
  }

  /**
   * Hot-swap the target word mid-animation.
   *
   * Triggers a layout recomputation and particle rebuild so the next
   * assemble phase uses the new word.
   */
  setTargetWord(word: string): void {
    this.updateConfig({ word: { target: word } });
  }

  /* ==================================================================== */
  /*  Playback                                                            */
  /* ==================================================================== */

  /** Jump directly to a specific animation phase. */
  goToPhase(phase: Phase): void {
    this.animationLoop.setPhase(phase);
  }

  /* ==================================================================== */
  /*  Video export                                                        */
  /* ==================================================================== */

  /** Start recording the canvas. */
  startRecording(): void {
    this.videoExporter.startCapture(this.renderer.domElement, this.config);
  }

  /** Stop recording and trigger a browser download. */
  stopRecording(): void {
    this.videoExporter.stopCapture().then((blob) => {
      const ext = this.config.export.format;
      this.videoExporter.downloadBlob(blob, `letter-vortex.${ext}`);
    });
  }

  /**
   * Record for `config.export.duration` seconds at the given quality and
   * return the blob.
   */
  async exportVideo(quality: QualityPreset): Promise<Blob> {
    this.videoExporter.startCapture(
      this.renderer.domElement,
      this.config,
      quality,
    );

    return new Promise((resolve) => {
      const durationMs = this.config.export.duration * 1000;
      setTimeout(async () => {
        const blob = await this.videoExporter.stopCapture();
        resolve(blob);
      }, durationMs);
    });
  }

  /* ==================================================================== */
  /*  Accessors                                                           */
  /* ==================================================================== */

  /** Direct access to the renderer's `<canvas>` element. */
  getCanvas(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  /** Snapshot of the current config (deep clone). */
  getConfig(): LetterVortexConfig {
    return structuredClone(this.config);
  }

  /* ==================================================================== */
  /*  Private — Three.js setup                                            */
  /* ==================================================================== */

  private setupThreeJS(): void {
    const { width, height } = this.container.getBoundingClientRect();

    this.scene = new Scene();
    this.scene.background = new Color(0x000000);

    this.camera = new PerspectiveCamera(75, width / height || 1, 0.1, 5000);
    this.camera.position.z = this.config.orbit.radius.max * 2.2;

    this.renderer = new WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    this.group = new Group();
    this.scene.add(this.group);
  }

  /* ==================================================================== */
  /*  Private — particles                                                 */
  /* ==================================================================== */

  private buildParticles(): void {
    this.particleSystem = new ParticleSystem(this.group);
    this.particleSystem.spawn(this.config.particles.orbitCount, this.config);
  }

  private computeWordLayout(): void {
    this.layoutBuilder.buildGridSlots(this.config.word.target, this.config);
    this.wordPositions = this.layoutBuilder.getSlotPositions();
    this.wordChars = this.layoutBuilder.getSlotChars();
  }

  /* ==================================================================== */
  /*  Private — per-frame update                                          */
  /* ==================================================================== */

  private onFrame = (
    delta: number,
    phase: Phase,
    progress: number,
  ): void => {
    this.particleSystem.update(
      delta,
      phase,
      progress,
      this.config,
      this.camera,
      this.wordPositions,
      this.wordChars,
    );

    this.renderer.render(this.scene, this.camera);
  };

  /* ==================================================================== */
  /*  Private — resize handling                                           */
  /* ==================================================================== */

  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width === 0 || height === 0) continue;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
      }
    });
    this.resizeObserver.observe(this.container);
  }
}
