import { useRef, useEffect } from "react";
import type { AnimationConfig } from "@/lib/canvas";
import { useCanvasAnimation } from "@/hooks/useCanvasAnimation";

interface CanvasViewportProps {
  config: AnimationConfig;
  canvasRefCallback?: (ref: React.RefObject<HTMLCanvasElement | null>) => void;
  engineRefCallback?: (
    ref: React.RefObject<import("@/lib/canvas").ParticleEngine | null>,
  ) => void;
}

export function CanvasViewport({
  config,
  canvasRefCallback,
  engineRefCallback,
}: CanvasViewportProps) {
  const { canvasRef, engineRef } = useCanvasAnimation(config);
  const containerRef = useRef<HTMLDivElement>(null);

  // Expose refs to parent
  useEffect(() => {
    canvasRefCallback?.(canvasRef);
    engineRefCallback?.(engineRef);
  }, [canvasRef, engineRef, canvasRefCallback, engineRefCallback]);

  return (
    <div
      ref={containerRef}
      className="relative flex flex-1 items-center justify-center overflow-hidden bg-black"
    >
      <canvas
        ref={canvasRef}
        className="max-h-full max-w-full"
        style={{
          aspectRatio: `${config.width}/${config.height}`,
          objectFit: "contain",
        }}
      />
    </div>
  );
}
