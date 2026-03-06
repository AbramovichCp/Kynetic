import { useEffect, useRef } from 'react';
import { LiteraSphere } from '@/animations/litera-sphere';
import type { LiteraSphereConfig } from '@/animations/litera-sphere';

/**
 * React hook that creates, manages and tears down a `LiteraSphere` instance.
 *
 * Attach `containerRef` to a `<div>` — the Three.js canvas will be appended
 * inside it.  When `config` changes the instance is hot-patched via
 * `updateConfig`.
 */
export function useLiteraSphere(config: LiteraSphereConfig) {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<LiteraSphere | null>(null);

  // Create + init once
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const instance = new LiteraSphere(el);
    instance.init();
    instanceRef.current = instance;

    return () => {
      instance.dispose();
      instanceRef.current = null;
    };
  }, []);

  // Hot-patch config every time it changes
  useEffect(() => {
    instanceRef.current?.updateConfig(config);
  }, [config]);

  return { containerRef, instanceRef };
}
