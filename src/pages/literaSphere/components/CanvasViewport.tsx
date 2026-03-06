import type { LiteraSphereConfig } from '@/animations/litera-sphere';
import { useLiteraSphere } from '../hooks/useLiteraSphere';
import type { LiteraSphere } from '@/animations/litera-sphere';

interface CanvasViewportProps {
  config: LiteraSphereConfig;
  /** Called once the LiteraSphere instance is available. */
  onInstanceReady?: (instance: LiteraSphere) => void;
}

/**
 * Full-bleed viewport that hosts the Three.js `<canvas>`.
 * A `ResizeObserver` inside `LiteraSphere` keeps the canvas responsive.
 */
export function CanvasViewport({ config, onInstanceReady }: CanvasViewportProps) {
  const { containerRef, instanceRef } = useLiteraSphere(config);

  // Expose instance to parent once it exists
  if (onInstanceReady && instanceRef.current) {
    onInstanceReady(instanceRef.current);
  }

  return (
    <div
      ref={containerRef}
      className="relative flex flex-1 items-center justify-center overflow-hidden bg-black"
    />
  );
}
