import { Vector2, Vector3 } from 'three';
import type { LetterSlot, LetterVortexConfig } from './types';

/**
 * Generates a dot-matrix grid of 3D positions that form the shape of each
 * target letter.
 *
 * Algorithm:
 * 1. Render each letter of the target word onto an offscreen Canvas2D at
 *    `targetFontSize`.
 * 2. Sample the canvas pixel data on a grid with step = `gridResolution`.
 * 3. Every grid cell where alpha > threshold becomes one particle slot.
 * 4. Map canvas (col, row) into 3D world positions (x, y, 0).
 * 5. Centre the combined layout at the world origin.
 */
export class WordLayoutBuilder {
  private slots: LetterSlot[] = [];

  /* ==================================================================== */
  /*  Public API                                                          */
  /* ==================================================================== */

  /**
   * Build the complete set of grid slots for `word`.
   *
   * @returns Array of `{ char, position }` where char is a random source
   *          character and position is the 3D world coordinate of the slot.
   */
  buildGridSlots(word: string, config: LetterVortexConfig): LetterSlot[] {
    const allSlots: LetterSlot[] = [];
    const letterWidths: number[] = [];

    const fontSize = config.word.targetFontSize;
    const gridRes = config.particles.gridResolution;
    const pool = config.particles.sourceChars;

    // Phase 1: Sample each letter individually and collect pixel positions
    const perLetterPixels: Vector2[][] = [];
    for (const ch of word) {
      const pixels = this.sampleLetterPixels(ch, fontSize, gridRes, config.word.fontFamily);
      perLetterPixels.push(pixels);
      // Compute the bounding width of this letter's pixels
      let maxX = 0;
      for (const p of pixels) {
        if (p.x > maxX) maxX = p.x;
      }
      letterWidths.push(maxX + gridRes); // one cell of padding
    }

    // Phase 2: Lay out letters side by side with letterSpacing, centred at origin
    const spacing = config.word.letterSpacing;
    const totalWidth =
      letterWidths.reduce((sum, w) => sum + w, 0) +
      Math.max(0, word.length - 1) * spacing;
    let cursorX = -totalWidth / 2;

    for (let li = 0; li < word.length; li++) {
      const pixels = perLetterPixels[li];
      // Find vertical bounds to centre vertically
      let minY = Infinity;
      let maxY = -Infinity;
      for (const p of pixels) {
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }
      const verticalCenter = (minY + maxY) / 2;

      for (const p of pixels) {
        const worldX = cursorX + p.x;
        const worldY = -(p.y - verticalCenter) * config.word.letterHeight; // flip Y
        const char = pool[Math.floor(Math.random() * pool.length)];
        allSlots.push({
          char,
          position: new Vector3(worldX, worldY, 0),
        });
      }

      cursorX += letterWidths[li] + spacing;
    }

    this.slots = allSlots;
    return allSlots;
  }

  /**
   * Sample pixels of a single character to discover which grid cells are
   * "filled" (alpha above threshold).
   *
   * @param char       Single character to render.
   * @param fontSize   Font size to render at.
   * @param gridRes    Grid step in px.
   * @param fontFamily Font family string.
   * @returns          Array of (col, row) pixel coordinates that are filled.
   */
  sampleLetterPixels(
    char: string,
    fontSize: number,
    gridRes: number,
    fontFamily: string,
  ): Vector2[] {
    // Create offscreen canvas large enough for the character
    const padding = Math.ceil(fontSize * 0.15);
    const canvasSize = fontSize + padding * 2;
    const canvas = document.createElement('canvas');
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.clearRect(0, 0, canvasSize, canvasSize);
    ctx.font = `bold ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(char, canvasSize / 2, canvasSize / 2);

    const imageData = ctx.getImageData(0, 0, canvasSize, canvasSize);
    const { data, width } = imageData;
    const threshold = 128; // alpha threshold to consider a pixel "filled"

    const filled: Vector2[] = [];

    for (let row = 0; row < canvasSize; row += gridRes) {
      for (let col = 0; col < canvasSize; col += gridRes) {
        // Sample the centre of the grid cell
        const sx = Math.min(col + Math.floor(gridRes / 2), canvasSize - 1);
        const sy = Math.min(row + Math.floor(gridRes / 2), canvasSize - 1);
        const idx = (sy * width + sx) * 4;
        const alpha = data[idx + 3]; // A channel

        if (alpha >= threshold) {
          filled.push(new Vector2(col, row));
        }
      }
    }

    return filled;
  }

  /** Flat array of slot positions from the last `buildGridSlots`. */
  getSlotPositions(): Vector3[] {
    return this.slots.map((s) => s.position);
  }

  /** Flat array of slot characters from the last `buildGridSlots`. */
  getSlotChars(): string[] {
    return this.slots.map((s) => s.char);
  }

  /** Total slot count from the last build. */
  getSlotCount(): number {
    return this.slots.length;
  }
}
