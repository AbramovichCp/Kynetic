import { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { LITERA_SPHERE_CONFIG } from '@/animations/litera-sphere';
import type {
  LiteraSphereConfig,
  DeepPartial,
  LiteraSphere,
} from '@/animations/litera-sphere';
import { CanvasViewport } from './components/CanvasViewport';
import { SettingsPanel } from './components/SettingsPanel';

/* ------------------------------------------------------------------ */
/*  Deep-merge helper (mirrors the one in the engine)                 */
/* ------------------------------------------------------------------ */

function deepMerge<T>(target: T, source: DeepPartial<T>): T {
  if (
    typeof target !== 'object' ||
    target === null ||
    typeof source !== 'object' ||
    source === null
  ) {
    return (source ?? target) as T;
  }

  const result: Record<string, unknown> = { ...(target as Record<string, unknown>) };

  for (const key of Object.keys(source as Record<string, unknown>)) {
    const srcVal = (source as Record<string, unknown>)[key];
    if (srcVal === undefined) continue;

    const tgtVal = (target as Record<string, unknown>)[key];
    if (
      typeof srcVal === 'object' &&
      srcVal !== null &&
      !Array.isArray(srcVal) &&
      typeof tgtVal === 'object' &&
      tgtVal !== null &&
      !Array.isArray(tgtVal)
    ) {
      result[key] = deepMerge(tgtVal, srcVal as DeepPartial<typeof tgtVal>);
    } else {
      result[key] = srcVal;
    }
  }

  return result as T;
}

/* ------------------------------------------------------------------ */
/*  Page component                                                    */
/* ------------------------------------------------------------------ */

export default function LiteraSpherePage() {
  const [config, setConfig] = useState<LiteraSphereConfig>(
    structuredClone(LITERA_SPHERE_CONFIG) as LiteraSphereConfig,
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const instanceRef = useRef<LiteraSphere | null>(null);

  /* ---- config helpers ------------------------------------------------ */

  const handleConfigChange = useCallback(
    (patch: DeepPartial<LiteraSphereConfig>) => {
      setConfig((prev) =>
        deepMerge<LiteraSphereConfig>(structuredClone(prev), patch),
      );
    },
    [],
  );

  /* ---- export helpers ------------------------------------------------ */

  const handleExport = useCallback(() => {
    const inst = instanceRef.current;
    if (!inst) return;
    inst.exportVideo(config.export.defaultQuality).then((blob) => {
      const ext = config.export.format;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `litera-sphere.${ext}`;
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }, [config.export.defaultQuality, config.export.format]);

  const handleStartRecording = useCallback(() => {
    instanceRef.current?.startRecording();
    setIsRecording(true);
  }, []);

  const handleStopRecording = useCallback(() => {
    instanceRef.current?.stopRecording();
    setIsRecording(false);
  }, []);

  /* ---- render -------------------------------------------------------- */

  return (
    <div className="flex h-screen w-screen dark">
      <CanvasViewport
        config={config}
        onInstanceReady={(inst) => {
          instanceRef.current = inst;
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
        onStartRecording={handleStartRecording}
        onStopRecording={handleStopRecording}
        isRecording={isRecording}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(false)}
      />
    </div>
  );
}
