import { Vector3 } from "three";
import type { EasingCurve, EasingFn } from "./types";

/**
 * Pure easing / interpolation utilities used during the ASSEMBLE and DISSOLVE
 * phases.  Has **no** Three.js scene dependencies — operates only on vectors
 * and numbers.
 */
export class AssembleBehavior {
  /* ==================================================================== */
  /*  Easing functions                                                    */
  /* ==================================================================== */

  /** Linear — identity mapping. */
  static easeLinear(t: number): number {
    return t;
  }

  /** Quadratic ease-in. */
  static easeIn(t: number): number {
    return t * t;
  }

  /** Quadratic ease-out. */
  static easeOut(t: number): number {
    return t * (2 - t);
  }

  /** Quadratic ease-in-out. */
  static easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  /** Cubic ease-in-out (smoother than quadratic). */
  static easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /* ==================================================================== */
  /*  Resolver                                                            */
  /* ==================================================================== */

  /**
   * Return the easing function that matches the given curve name.
   *
   * @param curve  One of the predefined {@link EasingCurve} names.
   */
  static getEasingFn(curve: EasingCurve): EasingFn {
    switch (curve) {
      case "linear":
        return AssembleBehavior.easeLinear;
      case "easeIn":
        return AssembleBehavior.easeIn;
      case "easeOut":
        return AssembleBehavior.easeOut;
      case "easeInOut":
        return AssembleBehavior.easeInOut;
      case "easeInOutCubic":
        return AssembleBehavior.easeInOutCubic;
      default:
        return AssembleBehavior.easeLinear;
    }
  }

  /* ==================================================================== */
  /*  Interpolation                                                       */
  /* ==================================================================== */

  /**
   * Interpolate between two Vector3 positions using the specified easing
   * curve.
   *
   * @param from   Start position.
   * @param to     End position.
   * @param t      Normalised time [0,1].
   * @param curve  Easing curve to apply before interpolating.
   * @returns      New Vector3 with the interpolated position.
   */
  static interpolate(
    from: Vector3,
    to: Vector3,
    t: number,
    curve: EasingCurve,
  ): Vector3 {
    const easedT = AssembleBehavior.getEasingFn(curve)(
      Math.max(0, Math.min(1, t)),
    );
    return new Vector3().lerpVectors(from, to, easedT);
  }
}
