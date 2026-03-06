import type { Vector3 } from 'three';
import type { LiteraSphereConfig, CharacterEntry } from './types';
import type { SphereGeometryBuilder } from './SphereGeometryBuilder';

/** The ten decimal digits used to fill non-word positions. */
const DIGITS = '0123456789';

/**
 * Manages the assignment of characters to sphere-surface positions.
 *
 * Word letters are grouped spatially so they form readable arcs on the sphere.
 * Remaining positions are filled with random digits (0–9).
 */
export class WordClusterManager {
  private geometryBuilder: SphereGeometryBuilder;

  constructor(geometryBuilder: SphereGeometryBuilder) {
    this.geometryBuilder = geometryBuilder;
  }

  /**
   * Build the full character map — word letters placed on arcs, digits
   * everywhere else.
   *
   * @param points All Fibonacci-sphere points (one per potential character).
   * @param config Current LiteraSphere configuration.
   * @returns An array of `CharacterEntry` objects ready for rendering.
   */
  buildCharacterMap(
    points: Vector3[],
    config: LiteraSphereConfig,
  ): CharacterEntry[] {
    const entries: CharacterEntry[] = [];
    const usedIndices = new Set<number>();

    if (config.words.enabled && config.words.list.length > 0) {
      const wordCount = config.words.list.length;
      const pointsPerWord = Math.floor(points.length / (wordCount + 1));

      for (let wi = 0; wi < wordCount; wi++) {
        const word = config.words.list[wi];

        // Pick an anchor evenly spaced among the Fibonacci points
        const anchorIndex = Math.min(
          Math.floor((wi + 0.5) * pointsPerWord),
          points.length - 1,
        );
        const anchorPoint = points[anchorIndex];

        // Generate arc positions for the word letters
        const wordPositions = this.geometryBuilder.generateWordClusterPoints(
          word,
          anchorPoint,
          config.sphere.radius,
          config.words.wordSpacing,
        );

        for (let i = 0; i < word.length; i++) {
          entries.push({
            char: word[i],
            position: wordPositions[i],
            isPartOfWord: true,
            wordIndex: wi,
          });
        }

        // Mark the closest original points as "used" so they don't get
        // a random digit assigned on top of the word letter.
        for (const wp of wordPositions) {
          let closestIdx = -1;
          let closestDist = Infinity;
          for (let i = 0; i < points.length; i++) {
            if (usedIndices.has(i)) continue;
            const dist = points[i].distanceTo(wp);
            if (dist < closestDist) {
              closestDist = dist;
              closestIdx = i;
            }
          }
          if (closestIdx >= 0) usedIndices.add(closestIdx);
        }
      }
    }

    // Fill remaining positions with random digits
    for (let i = 0; i < points.length; i++) {
      if (usedIndices.has(i)) continue;
      entries.push({
        char: DIGITS[Math.floor(Math.random() * DIGITS.length)],
        position: points[i],
        isPartOfWord: false,
      });
    }

    return entries;
  }

  /**
   * Convenience wrapper — get arc positions for a single word.
   *
   * @param word        The word to place.
   * @param anchorPoint Centre of the arc on the sphere surface.
   * @param radius      Sphere radius.
   * @param spacing     Letter-spacing multiplier.
   */
  getWordPositions(
    word: string,
    anchorPoint: Vector3,
    radius: number,
    spacing: number,
  ): Vector3[] {
    return this.geometryBuilder.generateWordClusterPoints(
      word,
      anchorPoint,
      radius,
      spacing,
    );
  }
}
