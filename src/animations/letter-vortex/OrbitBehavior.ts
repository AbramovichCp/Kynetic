import { MathUtils, Vector3 } from "three";
import type { OrbitConfig } from "./types";

/**
 * Computes chaotic 3D orbit positions around a configurable axis.
 *
 * Each particle receives a unique phase offset, radius and speed so the
 * overall motion looks organic.  A configurable `chaosIntensity` injects
 * simplex-like randomness on top of the base orbit.
 */
export class OrbitBehavior {
  /* ==================================================================== */
  /*  Public helpers                                                      */
  /* ==================================================================== */

  /**
   * Compute the orbit position for a given particle at `time`.
   *
   * @param orbitRadius   Particle-specific orbit radius.
   * @param orbitSpeed    Particle-specific angular speed (radians / s).
   * @param phaseOffset   Unique offset so particles don't bunch.
   * @param heightOffset  Vertical oscillation offset.
   * @param time          Global elapsed time (seconds).
   * @param config        Orbit section of LetterVortex config.
   * @returns             World-space position Vector3.
   */
  static computeOrbitPosition(
    orbitRadius: number,
    orbitSpeed: number,
    phaseOffset: number,
    heightOffset: number,
    time: number,
    config: OrbitConfig,
  ): Vector3 {
    const angle = (time * orbitSpeed + phaseOffset) * config.speedMultiplier;

    // Base circular orbit in XZ plane
    const x = Math.cos(angle) * orbitRadius;
    const z = Math.sin(angle) * orbitRadius;
    // Vertical bob
    const y = Math.sin(angle * 0.5 + phaseOffset) * heightOffset;

    const pos = new Vector3(x, y, z);

    // Apply axis tilt
    const axis = OrbitBehavior.applyAxisTilt(
      new Vector3(config.axis.x, config.axis.y, config.axis.z).normalize(),
      config.tiltAngle,
    );

    // Rotate the position so the orbit plane is perpendicular to the tilted axis
    if (axis.y < 0.999) {
      const defaultUp = new Vector3(0, 1, 0);
      const rotAxis = new Vector3().crossVectors(defaultUp, axis).normalize();
      const rotAngle = Math.acos(MathUtils.clamp(defaultUp.dot(axis), -1, 1));
      pos.applyAxisAngle(rotAxis, rotAngle);
    }

    // Add chaos
    return OrbitBehavior.addChaos(
      pos,
      config.chaosIntensity,
      time,
      phaseOffset,
    );
  }

  /**
   * Rotate the orbit axis by `tiltDegrees` around the X axis.
   */
  static applyAxisTilt(axis: Vector3, tiltDegrees: number): Vector3 {
    if (tiltDegrees === 0) return axis.clone();
    return axis
      .clone()
      .applyAxisAngle(new Vector3(1, 0, 0), MathUtils.degToRad(tiltDegrees))
      .normalize();
  }

  /**
   * Add pseudo-random displacement to a position.
   *
   * @param position   Base position to perturb.
   * @param intensity  0 = no chaos, 1 = maximum displacement.
   * @param time       Elapsed seconds (drives temporal variation).
   * @param seed       Per-particle seed for spatial variation.
   */
  static addChaos(
    position: Vector3,
    intensity: number,
    time: number,
    seed: number,
  ): Vector3 {
    if (intensity <= 0) return position;

    const scale = intensity * 40; // max displacement in world units

    // Use sin/cos with different frequencies to approximate noise
    const dx = Math.sin(time * 1.3 + seed * 17.1) * scale;
    const dy = Math.cos(time * 0.9 + seed * 31.7) * scale * 0.6;
    const dz = Math.sin(time * 1.7 + seed * 53.3) * scale;

    return position.clone().add(new Vector3(dx, dy, dz));
  }
}
