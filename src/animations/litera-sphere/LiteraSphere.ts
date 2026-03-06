import {
  Color,
  Group,
  MathUtils,
  PerspectiveCamera,
  Scene,
  Sprite,
  SpriteMaterial,
  WebGLRenderer,
} from 'three';
import { LITERA_SPHERE_CONFIG } from './config';
import type {
  DeepPartial,
  LiteraSphereConfig,
  QualityPreset,
} from './types';
import { SphereGeometryBuilder } from './SphereGeometryBuilder';
import { CharacterRenderer } from './CharacterRenderer';
import { WordClusterManager } from './WordClusterManager';
import { AnimationLoop } from './AnimationLoop';
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

  const result: Record<string, unknown> = { ...(target as Record<string, unknown>) };

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
/*  LiteraSphere — main orchestrator                                  */
/* ------------------------------------------------------------------ */

/**
 * Main entry-point class for the LiteraSphere animation.
 *
 * Manages the Three.js scene, camera, renderer, sprite population, rotation
 * animation, depth effects and video export.
 *
 * @example
 * ```ts
 * const ls = new LiteraSphere(document.getElementById('container')!);
 * ls.init();
 * // later …
 * ls.dispose();
 * ```
 */
export class LiteraSphere {
  /* ---- dependencies ---------------------------------------------------- */
  private container: HTMLElement;
  private config: LiteraSphereConfig;

  private geometryBuilder: SphereGeometryBuilder;
  private characterRenderer: CharacterRenderer;
  private wordClusterManager: WordClusterManager;
  private animationLoop: AnimationLoop;
  private videoExporter: VideoExporter;

  /* ---- Three.js objects ------------------------------------------------ */
  private scene!: Scene;
  private camera!: PerspectiveCamera;
  private renderer!: WebGLRenderer;
  private sphereGroup!: Group;
  private sprites: Sprite[] = [];

  /* ---- misc ------------------------------------------------------------ */
  private resizeObserver: ResizeObserver | null = null;

  /* ==================================================================== */
  /*  Constructor                                                         */
  /* ==================================================================== */

  constructor(
    container: HTMLElement,
    config?: DeepPartial<LiteraSphereConfig>,
  ) {
    this.container = container;
    this.config = config
      ? deepMerge<LiteraSphereConfig>(
          structuredClone(LITERA_SPHERE_CONFIG) as LiteraSphereConfig,
          config,
        )
      : (structuredClone(LITERA_SPHERE_CONFIG) as LiteraSphereConfig);

    this.geometryBuilder = new SphereGeometryBuilder();
    this.characterRenderer = new CharacterRenderer();
    this.wordClusterManager = new WordClusterManager(this.geometryBuilder);
    this.animationLoop = new AnimationLoop(this.config.animation.cycleDuration);
    this.videoExporter = new VideoExporter();
  }

  /* ==================================================================== */
  /*  Lifecycle                                                           */
  /* ==================================================================== */

  /** Set up the Three.js scene, populate the sphere and optionally auto-play. */
  init(): void {
    this.setupThreeJS();
    this.buildSphere();
    this.setupResizeObserver();

    if (this.config.animation.autoPlay) {
      this.start();
    }
  }

  /** Begin (or restart) the animation loop. */
  start(): void {
    this.animationLoop.start(this.onFrame);
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
    this.clearSphere();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  /* ==================================================================== */
  /*  Configuration                                                       */
  /* ==================================================================== */

  /** Apply a partial config update; rebuilds the sphere when structural values change. */
  updateConfig(patch: DeepPartial<LiteraSphereConfig>): void {
    const prev = this.config;
    this.config = deepMerge<LiteraSphereConfig>(
      structuredClone(this.config),
      patch,
    );

    this.animationLoop.setCycleDuration(this.config.animation.cycleDuration);

    // Structural changes → full rebuild
    const needsRebuild =
      prev.characters.count !== this.config.characters.count ||
      prev.sphere.radius !== this.config.sphere.radius ||
      prev.words.enabled !== this.config.words.enabled ||
      JSON.stringify(prev.words.list) !== JSON.stringify(this.config.words.list) ||
      prev.words.wordSpacing !== this.config.words.wordSpacing ||
      prev.characters.density !== this.config.characters.density;

    if (needsRebuild) {
      this.clearSphere();
      this.buildSphere();
    } else {
      // Visual-only refresh (colour / font)
      const needsRefresh =
        prev.characters.color !== this.config.characters.color ||
        prev.characters.fontFamily !== this.config.characters.fontFamily;
      if (needsRefresh) {
        this.characterRenderer.refreshCharacters(this.sprites, this.config);
      }
    }

    // Camera distance may need updating when radius changes
    this.camera.position.z = this.config.sphere.radius * 2.6;

    // Apply initial tilt
    this.sphereGroup.rotation.x = MathUtils.degToRad(
      this.config.sphere.rotationAngleX,
    );
    this.sphereGroup.rotation.y = MathUtils.degToRad(
      this.config.sphere.rotationAngleY,
    );
  }

  /** Reset all config back to the built-in defaults and rebuild. */
  resetConfig(): void {
    this.config = structuredClone(
      LITERA_SPHERE_CONFIG,
    ) as LiteraSphereConfig;
    this.animationLoop.setCycleDuration(this.config.animation.cycleDuration);
    this.clearSphere();
    this.buildSphere();
    this.camera.position.z = this.config.sphere.radius * 2.6;
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
      this.videoExporter.downloadBlob(blob, `litera-sphere.${ext}`);
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
  getConfig(): LiteraSphereConfig {
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
    this.camera.position.z = this.config.sphere.radius * 2.6;

    this.renderer = new WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true, // required for MediaRecorder capture
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    this.sphereGroup = new Group();
    this.sphereGroup.rotation.x = MathUtils.degToRad(
      this.config.sphere.rotationAngleX,
    );
    this.sphereGroup.rotation.y = MathUtils.degToRad(
      this.config.sphere.rotationAngleY,
    );
    this.scene.add(this.sphereGroup);
  }

  /* ==================================================================== */
  /*  Private — sphere building                                           */
  /* ==================================================================== */

  private buildSphere(): void {
    const effectiveCount = Math.max(
      1,
      Math.floor(this.config.characters.count * this.config.characters.density),
    );

    const points = this.geometryBuilder.generatePoints(
      effectiveCount,
      this.config.sphere.radius,
    );

    const characterMap = this.wordClusterManager.buildCharacterMap(
      points,
      this.config,
    );

    for (const entry of characterMap) {
      const sprite = this.characterRenderer.createCharacterSprite(
        entry.char,
        entry.position,
        this.config,
      );
      sprite.userData['char'] = entry.char;
      sprite.userData['isPartOfWord'] = entry.isPartOfWord;
      sprite.userData['wordIndex'] = entry.wordIndex;
      this.sphereGroup.add(sprite);
      this.sprites.push(sprite);
    }
  }

  private clearSphere(): void {
    for (const sprite of this.sprites) {
      (sprite.material as SpriteMaterial).map?.dispose();
      (sprite.material as SpriteMaterial).dispose();
      this.sphereGroup.remove(sprite);
    }
    this.sprites = [];
    this.characterRenderer.dispose();
  }

  /* ==================================================================== */
  /*  Private — per-frame update                                          */
  /* ==================================================================== */

  private onFrame = (_deltaTime: number, _elapsedTime: number): void => {
    // Rotate the group — character orientations stay fixed (Sprites billboard)
    this.sphereGroup.rotation.x += this.config.sphere.rotationSpeedX;
    this.sphereGroup.rotation.y += this.config.sphere.rotationSpeedY;

    // Depth-based opacity & size
    this.characterRenderer.updateDepthEffects(
      this.sprites,
      this.camera,
      this.config,
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
