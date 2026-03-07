import type { LetterVortexConfig } from "@/animations/letter-vortex";
import type { LetterVortex } from "@/animations/letter-vortex";
import { useLetterVortex } from "../hooks/useLetterVortex";

interface CanvasViewportProps {
  config: LetterVortexConfig;
  onInstanceReady?: (instance: LetterVortex) => void;
}

export function CanvasViewport({
  config,
  onInstanceReady,
}: CanvasViewportProps) {
  const { containerRef, instanceRef } = useLetterVortex(config);

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
