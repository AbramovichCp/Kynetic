import { useCallback, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { AnimationConfig } from "./engine";
import type { ParticleEngine } from "./engine";
import { CanvasViewport } from "./components/CanvasViewport";
import { SettingsPanel } from "./components/SettingsPanel";
import { useVideoExport } from "./hooks/useVideoExport";
import { useConfigFromUrl } from "./hooks/useConfigFromUrl";

export default function KineticAnimationPage() {
  const { config, setConfig } = useConfigFromUrl();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { isRecording, startExport } = useVideoExport();

  const canvasRefHolder =
    useRef<React.RefObject<HTMLCanvasElement | null> | null>(null);
  const engineRefHolder = useRef<React.RefObject<ParticleEngine | null> | null>(
    null,
  );

  const handleConfigChange = useCallback((patch: Partial<AnimationConfig>) => {
    setConfig(patch);
  }, [setConfig]);

  const handleExport = useCallback(() => {
    const canvas = canvasRefHolder.current?.current;
    if (!canvas) return;

    const durationMs = config.phaseDuration * 4;
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
      <CanvasViewport
        config={config}
        canvasRefCallback={(ref) => {
          canvasRefHolder.current = ref;
        }}
        engineRefCallback={(ref) => {
          engineRefHolder.current = ref;
        }}
      />

      {/* Back to home */}
      <Link
        to="/"
        className="absolute left-4 top-4 z-10 rounded-md border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground shadow-md hover:bg-muted hover:text-foreground"
      >
        ← Home
      </Link>

      {/* Floating toggle when sidebar is closed */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="absolute right-4 top-4 z-10 rounded-md border border-border bg-card p-2 text-muted-foreground shadow-md hover:bg-muted hover:text-foreground"
          aria-label="Open settings"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      )}

      <SettingsPanel
        config={config}
        onChange={handleConfigChange}
        onExport={handleExport}
        isRecording={isRecording}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(false)}
      />
    </div>
  );
}
