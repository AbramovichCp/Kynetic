import { Vector3 } from 'three';

/**
 * Golden angle in radians — ensures even distribution of points on a sphere
 * when used with the Fibonacci-sphere algorithm.
 */
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/**
 * Generates evenly-distributed 3-D points on a sphere surface using the
 * Fibonacci / golden-angle algorithm, and creates word-cluster arcs.
 */
export class SphereGeometryBuilder {
  /**
   * Distribute `count` points as evenly as possible on a sphere of the given
   * `radius` using the Fibonacci-sphere algorithm.
   *
   * @param count  Number of points to generate.
   * @param radius Sphere radius in world units.
   * @returns Array of `Vector3` positions on the sphere surface.
   */
  generatePoints(count: number, radius: number): Vector3[] {
    const points: Vector3[] = [];

    for (let i = 0; i < count; i++) {
      // y goes from +1 (top) to −1 (bottom)
      const y = 1 - (2 * i) / (count - 1 || 1);
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = GOLDEN_ANGLE * i;

      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;

      points.push(new Vector3(x * radius, y * radius, z * radius));
    }

    return points;
  }

  /**
   * Generate positions for the letters of a word arranged in a small arc
   * (great-circle segment) on the sphere surface, centred on `anchorPoint`.
   *
   * @param word        The word whose letters need positions.
   * @param anchorPoint Centre of the arc — must lie on the sphere surface.
   * @param radius      Sphere radius (used to keep the arc on the surface).
   * @param spacing     Multiplier controlling angular gap between letters.
   * @returns Array of `Vector3` — one per letter, in reading order.
   */
  generateWordClusterPoints(
    word: string,
    anchorPoint: Vector3,
    radius: number,
    spacing: number,
  ): Vector3[] {
    const normal = anchorPoint.clone().normalize();

    // Build a tangent vector perpendicular to the surface normal
    let tangent = new Vector3(0, 1, 0).cross(normal);
    if (tangent.lengthSq() < 0.001) {
      tangent = new Vector3(1, 0, 0).cross(normal);
    }
    tangent.normalize();

    // Rotation axis — perpendicular to both normal and tangent,
    // passing through the origin so that rotating the point sweeps
    // along a great-circle arc.
    const axis = new Vector3().crossVectors(normal, tangent).normalize();

    const angleStep = spacing * 0.04;
    const startAngle = -((word.length - 1) / 2) * angleStep;

    const points: Vector3[] = [];
    for (let i = 0; i < word.length; i++) {
      const angle = startAngle + i * angleStep;
      // Clone the anchor and rotate around the axis to slide along the arc
      const point = anchorPoint
        .clone()
        .applyAxisAngle(axis, angle)
        .setLength(radius); // ensure the point stays on the sphere
      points.push(point);
    }

    return points;
  }
}
