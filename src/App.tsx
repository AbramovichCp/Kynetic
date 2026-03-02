import { useCallback, useRef, useState } from "react";
import type { AnimationConfig } from "@/lib/canvas";
import { DEFAULT_CONFIG } from "@/lib/canvas";
import type { ParticleEngine } from "@/lib/canvas";
import { CanvasViewport } from "@/components/CanvasViewport";
import { SettingsPanel } from "@/components/SettingsPanel";
import { useVideoExport } from "@/hooks/useVideoExport";

export default function App() {
  const [config, setConfig] = useState<AnimationConfig>(DEFAULT_CONFIG);
  const { isRecording, startExport } = useVideoExport();

  const canvasRefHolder =
    useRef<React.RefObject<HTMLCanvasElement | null> | null>(null);
  const engineRefHolder = useRef<React.RefObject<ParticleEngine | null> | null>(
    null,
  );

  const handleConfigChange = useCallback((patch: Partial<AnimationConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleExport = useCallback(() => {
    const canvas = canvasRefHolder.current?.current;
    if (!canvas) return;

    // Record 4 full phase cycles
    const durationMs = config.phaseDuration * 4;
    // Restart animation so the recording starts from phase 0
    const engine = engineRefHolder.current?.current;
    if (engine) {
      engine.phase = 0;
      engine.phaseStart = performance.now();
      engine.formingLetters = [];
    }

    startExport(canvas, durationMs);
  }, [config.phaseDuration, startExport]);

  return (
    <div className="flex h-screen w-screen dark">
      {/* Canvas Viewport */}
      <CanvasViewport
        config={config}
        canvasRefCallback={(ref) => {
          canvasRefHolder.current = ref;
        }}
        engineRefCallback={(ref) => {
          engineRefHolder.current = ref;
        }}
      />

      {/* Settings Sidebar */}
      <SettingsPanel
        config={config}
        onChange={handleConfigChange}
        onExport={handleExport}
        isRecording={isRecording}
      />
    </div>
  );
}
