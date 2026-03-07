import { useEffect, useRef } from 'react';
import { LetterVortex } from '@/animations/letter-vortex';
import type { LetterVortexConfig } from '@/animations/letter-vortex';

/**
 * React hook that creates and manages a {@link LetterVortex} instance.
 *
 * - Creates the instance once on mount.
 * - Hot-patches config whenever it changes.
 * - Disposes on unmount.
 */
export function useLetterVortex(config: LetterVortexConfig) {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<LetterVortex | null>(null);

  // Create + init once
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const instance = new LetterVortex(el);
    instance.init();
    instanceRef.current = instance;

    return () => {
      instance.dispose();
      instanceRef.current = null;
    };
  }, []);

  // Hot-patch config on every change
  useEffect(() => {
    instanceRef.current?.updateConfig(config);
  }, [config]);

  return { containerRef, instanceRef };
}
