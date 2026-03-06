import {
  CanvasTexture,
  MathUtils,
  Sprite,
  SpriteMaterial,
  Vector3,
  type Camera,
} from 'three';
import type { LiteraSphereConfig } from './types';

/**
 * Creates and manages Three.js `Sprite` objects that represent individual
 * characters on the sphere.  Each sprite uses a `CanvasTexture` so that the
 * character bitmap is resolution-independent and cache-friendly.
 */
export class CharacterRenderer {
  /** Texture cache keyed by `char_color_fontFamily`. */
  private textureCache = new Map<string, CanvasTexture>();

  /** Reusable scratch vector to avoid per-frame allocations. */
  private readonly _worldPos = new Vector3();

  /**
   * Create a billboard sprite for a single character.
   *
   * @param char     The character to render (single letter or digit).
   * @param position World-space position on the sphere surface.
   * @param config   Current LiteraSphere configuration.
   * @returns A configured `Sprite` ready to be added to the scene graph.
   */
  createCharacterSprite(
    char: string,
    position: Vector3,
    config: LiteraSphereConfig,
  ): Sprite {
    const texture = this.getOrCreateTexture(char, config);
    const material = new SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: config.characters.opacity.max,
      depthWrite: false,
      depthTest: true,
    });

    const sprite = new Sprite(material);
    sprite.position.copy(position);

    const scale = config.characters.baseFontSize;
    sprite.scale.set(scale, scale, 1);

    return sprite;
  }

  /**
   * Update every sprite's opacity and scale based on its depth relative to
   * the camera.  Characters closer to the viewer appear larger and more
   * opaque; those further away become smaller and translucent.
   *
   * @param sprites Array of all character sprites.
   * @param camera  The active Three.js camera.
   * @param config  Current configuration (provides radius + opacity range).
   */
  updateDepthEffects(
    sprites: Sprite[],
    _camera: Camera,
    config: LiteraSphereConfig,
  ): void {
    const worldPos = this._worldPos;
    const radius = config.sphere.radius;
    const { min: minOpacity, max: maxOpacity } = config.characters.opacity;
    const [minSize, maxSize] = config.characters.fontSizeRange;

    for (const sprite of sprites) {
      sprite.getWorldPosition(worldPos);

      // Camera sits on +Z looking at the origin, so higher Z ⇒ closer.
      const t = MathUtils.clamp(
        (worldPos.z + radius) / (2 * radius),
        0,
        1,
      );

      (sprite.material as SpriteMaterial).opacity = MathUtils.lerp(
        minOpacity,
        maxOpacity,
        t,
      );

      const fontSize = MathUtils.lerp(minSize, maxSize, t);
      sprite.scale.set(fontSize, fontSize, 1);
    }
  }

  /**
   * Re-create textures for every sprite (e.g. after font/colour change).
   */
  refreshCharacters(sprites: Sprite[], config: LiteraSphereConfig): void {
    this.disposeTextures();

    for (const sprite of sprites) {
      const char = sprite.userData['char'] as string;
      const texture = this.getOrCreateTexture(char, config);
      (sprite.material as SpriteMaterial).map = texture;
      (sprite.material as SpriteMaterial).needsUpdate = true;
    }
  }

  /** Release all GPU textures held by this renderer. */
  dispose(): void {
    this.disposeTextures();
  }

  /* ---------------------------------------------------------------------- */
  /*  Private helpers                                                       */
  /* ---------------------------------------------------------------------- */

  private disposeTextures(): void {
    this.textureCache.forEach((tex) => tex.dispose());
    this.textureCache.clear();
  }

  private getOrCreateTexture(
    char: string,
    config: LiteraSphereConfig,
  ): CanvasTexture {
    const key = `${char}_${config.characters.color}_${config.characters.fontFamily}`;
    const cached = this.textureCache.get(key);
    if (cached) return cached;

    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, size, size);
    ctx.font = `bold ${size * 0.7}px ${config.characters.fontFamily}`;
    ctx.fillStyle = config.characters.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(char, size / 2, size / 2);

    const texture = new CanvasTexture(canvas);
    texture.needsUpdate = true;
    this.textureCache.set(key, texture);
    return texture;
  }
}
