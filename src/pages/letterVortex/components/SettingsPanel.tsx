import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type {
  LetterVortexConfig,
  DeepPartial,
  EasingCurve,
} from "@/animations/letter-vortex";

/* ------------------------------------------------------------------ */
/*  Props                                                             */
/* ------------------------------------------------------------------ */

interface SettingsPanelProps {
  config: LetterVortexConfig;
  onChange: (patch: DeepPartial<LetterVortexConfig>) => void;
  onExport: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isRecording: boolean;
  open: boolean;
  onToggle: () => void;
}

/* ------------------------------------------------------------------ */
/*  Easing curve options                                              */
/* ------------------------------------------------------------------ */

const EASING_OPTIONS: { value: EasingCurve; label: string }[] = [
  { value: "linear", label: "Linear" },
  { value: "easeIn", label: "Ease In" },
  { value: "easeOut", label: "Ease Out" },
  { value: "easeInOut", label: "Ease In-Out" },
  { value: "easeInOutCubic", label: "Ease In-Out Cubic" },
];

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function SettingsPanel({
  config,
  onChange,
  onExport,
  onStartRecording,
  onStopRecording,
  isRecording,
  open,
  onToggle,
}: SettingsPanelProps) {
  if (!open) return null;

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col overflow-hidden border-l border-border bg-card text-card-foreground">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-lg font-semibold tracking-tight">Settings</h2>
        <button
          onClick={onToggle}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Close settings"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>

      <Separator />

      <ScrollArea className="flex-1 min-h-0">
        <div className="flex flex-col gap-6 p-4">
          {/* ── Word Settings ── */}
          <Section title="Word Settings">
            <Field
              label="Target Word"
              tooltip="The word that will be assembled from small letter pixels (dot-matrix style)."
            >
              <Input
                value={config.word.target}
                onChange={(e) =>
                  onChange({ word: { target: e.target.value.toUpperCase() } })
                }
              />
            </Field>
            <Field
              label="Font Family"
              tooltip="Font used to render all letters."
            >
              <Select
                value={config.word.fontFamily}
                onValueChange={(v) => onChange({ word: { fontFamily: v } })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monospace">Monospace</SelectItem>
                  <SelectItem value="sans-serif">Sans-serif</SelectItem>
                  <SelectItem value="serif">Serif</SelectItem>
                  <SelectItem value="'Courier New', monospace">
                    Courier New
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <SliderField
              label="Target Font Size"
              value={config.word.targetFontSize}
              min={100}
              max={600}
              step={10}
              tooltip="Font size used for Canvas2D pixel sampling. Larger = more detail/slots."
              onChange={(v) => onChange({ word: { targetFontSize: v } })}
            />
            <SliderField
              label="Letter Height"
              value={config.word.letterHeight}
              min={0.3}
              max={3.0}
              step={0.05}
              tooltip="Y-axis multiplier for assembled word height in 3D space."
              onChange={(v) => onChange({ word: { letterHeight: v } })}
            />
            <SliderField
              label="Letter Spacing"
              value={config.word.letterSpacing}
              min={20}
              max={200}
              step={1}
              tooltip="Horizontal distance between letters in the assembled word."
              onChange={(v) => onChange({ word: { letterSpacing: v } })}
            />
            <Field label="Color" tooltip="Color of all letters.">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.word.color}
                  onChange={(e) =>
                    onChange({ word: { color: e.target.value } })
                  }
                  className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent p-0.5"
                />
                <span className="text-xs text-muted-foreground">
                  {config.word.color}
                </span>
              </div>
            </Field>
          </Section>

          <Separator />

          {/* ── Particles ── */}
          <Section title="Particles">
            <Field
              label="Source Characters"
              tooltip="Pool of characters used for the flying letter-pixels."
            >
              <Input
                value={config.particles.sourceChars}
                onChange={(e) =>
                  onChange({
                    particles: { sourceChars: e.target.value.toUpperCase() },
                  })
                }
              />
            </Field>
            <SliderField
              label="Orbit Count"
              value={config.particles.orbitCount}
              min={50}
              max={2000}
              step={10}
              tooltip="Total number of flying letter-particles in the scene. More = denser dot-matrix."
              onChange={(v) => onChange({ particles: { orbitCount: v } })}
            />
            <SliderField
              label="Grid Resolution"
              value={config.particles.gridResolution}
              min={4}
              max={24}
              step={1}
              tooltip="Pixel sampling step in the Canvas2D grid. Lower = more slots per letter."
              onChange={(v) => onChange({ particles: { gridResolution: v } })}
            />
            <SliderField
              label="Orbit Min Size"
              value={config.particles.orbitMinSize}
              min={2}
              max={40}
              step={1}
              tooltip="Smallest sprite size when far from camera (orbit phase)."
              onChange={(v) => onChange({ particles: { orbitMinSize: v } })}
            />
            <SliderField
              label="Orbit Max Size"
              value={config.particles.orbitMaxSize}
              min={10}
              max={120}
              step={1}
              tooltip="Largest sprite size when close to camera (orbit phase)."
              onChange={(v) => onChange({ particles: { orbitMaxSize: v } })}
            />
            <SliderField
              label="Assembled Size"
              value={config.particles.assembledSize}
              min={4}
              max={40}
              step={1}
              tooltip="Fixed sprite size when locked into a dot-matrix grid slot."
              onChange={(v) => onChange({ particles: { assembledSize: v } })}
            />
            <SliderField
              label="Min Opacity"
              value={config.particles.minOpacity}
              min={0}
              max={1}
              step={0.01}
              tooltip="Opacity range based on depth — far letters are more transparent."
              onChange={(v) => onChange({ particles: { minOpacity: v } })}
            />
            <SliderField
              label="Max Opacity"
              value={config.particles.maxOpacity}
              min={0}
              max={1}
              step={0.01}
              tooltip="Maximum opacity for letters closest to the camera."
              onChange={(v) => onChange({ particles: { maxOpacity: v } })}
            />
            <Field
              label="Depth Scale"
              tooltip="Toggle whether size and opacity change based on Z position during orbit."
            >
              <button
                type="button"
                onClick={() =>
                  onChange({
                    particles: { depthScale: !config.particles.depthScale },
                  })
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${config.particles.depthScale ? "bg-primary" : "bg-muted"}`}
              >
                <span
                  className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${config.particles.depthScale ? "translate-x-5" : "translate-x-0"}`}
                />
              </button>
            </Field>
          </Section>

          <Separator />

          {/* ── Orbit ── */}
          <Section title="Orbit">
            <SliderField
              label="Axis X"
              value={config.orbit.axis.x}
              min={-1}
              max={1}
              step={0.01}
              tooltip="Direction vector of the axis letters orbit around (X component)."
              onChange={(v) => onChange({ orbit: { axis: { x: v } } })}
            />
            <SliderField
              label="Axis Y"
              value={config.orbit.axis.y}
              min={-1}
              max={1}
              step={0.01}
              tooltip="Direction vector of the axis letters orbit around (Y component)."
              onChange={(v) => onChange({ orbit: { axis: { y: v } } })}
            />
            <SliderField
              label="Axis Z"
              value={config.orbit.axis.z}
              min={-1}
              max={1}
              step={0.01}
              tooltip="Direction vector of the axis letters orbit around (Z component)."
              onChange={(v) => onChange({ orbit: { axis: { z: v } } })}
            />
            <SliderField
              label="Tilt Angle"
              value={config.orbit.tiltAngle}
              min={-90}
              max={90}
              step={1}
              tooltip="Tilt the orbit axis in degrees. 0 = vertical, 90 = horizontal."
              format={(v) => `${v}°`}
              onChange={(v) => onChange({ orbit: { tiltAngle: v } })}
            />
            <SliderField
              label="Radius Min"
              value={config.orbit.radius.min}
              min={50}
              max={500}
              step={5}
              tooltip="Minimum orbit distance from the central axis."
              onChange={(v) => onChange({ orbit: { radius: { min: v } } })}
            />
            <SliderField
              label="Radius Max"
              value={config.orbit.radius.max}
              min={100}
              max={800}
              step={5}
              tooltip="Maximum orbit distance from the central axis."
              onChange={(v) => onChange({ orbit: { radius: { max: v } } })}
            />
            <SliderField
              label="Speed Multiplier"
              value={config.orbit.speedMultiplier}
              min={0.1}
              max={5.0}
              step={0.1}
              tooltip="Global speed factor applied to all letter movement."
              onChange={(v) => onChange({ orbit: { speedMultiplier: v } })}
            />
            <SliderField
              label="Chaos Intensity"
              value={config.orbit.chaosIntensity}
              min={0}
              max={1}
              step={0.01}
              tooltip="How randomly letters deviate from a perfect orbit. 0 = clean, 1 = wild."
              onChange={(v) => onChange({ orbit: { chaosIntensity: v } })}
            />
          </Section>

          <Separator />

          {/* ── Animation Phases ── */}
          <Section title="Animation Phases">
            <SliderField
              label="Cycle Duration"
              value={config.animation.cycleDuration}
              min={2000}
              max={30000}
              step={500}
              tooltip="Total length of one full animation cycle in milliseconds."
              format={(v) => `${(v / 1000).toFixed(1)}s`}
              onChange={(v) => onChange({ animation: { cycleDuration: v } })}
            />

            {/* Scatter */}
            <SliderField
              label="Scatter Duration"
              value={config.animation.phases.scatter.duration}
              min={500}
              max={10000}
              step={100}
              tooltip="Time letters spend flying freely in orbit."
              format={(v) => `${(v / 1000).toFixed(1)}s`}
              onChange={(v) =>
                onChange({
                  animation: { phases: { scatter: { duration: v } } },
                })
              }
            />
            <Field
              label="Scatter Curve"
              tooltip="Easing function for scatter phase movement."
            >
              <Select
                value={config.animation.phases.scatter.speedCurve}
                onValueChange={(v) =>
                  onChange({
                    animation: {
                      phases: { scatter: { speedCurve: v as EasingCurve } },
                    },
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EASING_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* Assemble */}
            <SliderField
              label="Assemble Duration"
              value={config.animation.phases.assemble.duration}
              min={500}
              max={10000}
              step={100}
              tooltip="Time letters take to fly into their target positions."
              format={(v) => `${(v / 1000).toFixed(1)}s`}
              onChange={(v) =>
                onChange({
                  animation: { phases: { assemble: { duration: v } } },
                })
              }
            />
            <Field
              label="Assemble Curve"
              tooltip="Easing function controlling the fly-in motion."
            >
              <Select
                value={config.animation.phases.assemble.speedCurve}
                onValueChange={(v) =>
                  onChange({
                    animation: {
                      phases: { assemble: { speedCurve: v as EasingCurve } },
                    },
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EASING_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <SliderField
              label="Stagger Delay"
              value={config.animation.phases.assemble.staggerDelay}
              min={0}
              max={200}
              step={5}
              tooltip="Delay between each letter starting its fly-in, in milliseconds."
              format={(v) => `${v}ms`}
              onChange={(v) =>
                onChange({
                  animation: { phases: { assemble: { staggerDelay: v } } },
                })
              }
            />

            {/* Hold */}
            <SliderField
              label="Hold Duration"
              value={config.animation.phases.hold.duration}
              min={200}
              max={5000}
              step={100}
              tooltip="How long the assembled word is displayed before dissolving."
              format={(v) => `${(v / 1000).toFixed(1)}s`}
              onChange={(v) =>
                onChange({ animation: { phases: { hold: { duration: v } } } })
              }
            />

            {/* Dissolve */}
            <SliderField
              label="Dissolve Duration"
              value={config.animation.phases.dissolve.duration}
              min={200}
              max={5000}
              step={100}
              tooltip="Time letters take to break apart and return to orbit."
              format={(v) => `${(v / 1000).toFixed(1)}s`}
              onChange={(v) =>
                onChange({
                  animation: { phases: { dissolve: { duration: v } } },
                })
              }
            />
            <Field
              label="Dissolve Curve"
              tooltip="Easing function for the dissolve phase."
            >
              <Select
                value={config.animation.phases.dissolve.speedCurve}
                onValueChange={(v) =>
                  onChange({
                    animation: {
                      phases: { dissolve: { speedCurve: v as EasingCurve } },
                    },
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EASING_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </Section>

          <Separator />

          {/* ── Export ── */}
          <Section title="Export">
            <Field
              label="Quality Preset"
              tooltip="Resolution and bitrate of exported video."
            >
              <Select
                value={config.export.defaultQuality}
                onValueChange={(v) =>
                  onChange({
                    export: {
                      defaultQuality:
                        v as LetterVortexConfig["export"]["defaultQuality"],
                    },
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.keys(config.export.qualityPresets) as Array<
                      keyof typeof config.export.qualityPresets
                    >
                  ).map((key) => {
                    const p = config.export.qualityPresets[key];
                    return (
                      <SelectItem key={key} value={key}>
                        {key} ({p.width}×{p.height})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </Field>
            <SliderField
              label="Duration"
              value={config.export.duration}
              min={1}
              max={60}
              step={1}
              tooltip="How many seconds to export."
              format={(v) => `${v}s`}
              onChange={(v) => onChange({ export: { duration: v } })}
            />
            <Field
              label="FPS"
              tooltip="Frames per second for the exported video."
            >
              <Select
                value={String(config.export.fps)}
                onValueChange={(v) => onChange({ export: { fps: Number(v) } })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[24, 30, 60].map((fps) => (
                    <SelectItem key={fps} value={String(fps)}>
                      {fps} fps
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Format" tooltip="WebM (browser-native) or MP4.">
              <Select
                value={config.export.format}
                onValueChange={(v) =>
                  onChange({
                    export: {
                      format: v as LetterVortexConfig["export"]["format"],
                    },
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="webm">WebM</SelectItem>
                  <SelectItem value="mp4">MP4</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <div className="flex flex-col gap-2 pt-1">
              <Button
                className="w-full"
                onClick={onExport}
                disabled={isRecording}
              >
                Export Video
              </Button>
              <Button
                className="w-full"
                variant={isRecording ? "destructive" : "outline"}
                onClick={isRecording ? onStopRecording : onStartRecording}
              >
                {isRecording ? "Stop Recording" : "Start Recording"}
              </Button>
            </div>
          </Section>
        </div>
      </ScrollArea>
    </aside>
  );
}

/* ================================================================== */
/*  Reusable sub-components                                           */
/* ================================================================== */

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        {title}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && <div className="flex flex-col gap-3 pt-1">{children}</div>}
    </div>
  );
}

function Field({
  label,
  tooltip,
  children,
}: {
  label: string;
  tooltip?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <Label className="text-xs">{label}</Label>
        {tooltip && <HelpTip text={tooltip} />}
      </div>
      {children}
    </div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  tooltip,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  tooltip: string;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}) {
  const display = format
    ? format(value)
    : String(Math.round(value * 1000) / 1000);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Label className="text-xs">{label}</Label>
          <HelpTip text={tooltip} />
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">
          {display}
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  );
}

function HelpTip({ text }: { text: string }) {
  return (
    <div className="group relative inline-flex">
      <HelpCircle className="h-3.5 w-3.5 shrink-0 cursor-help text-muted-foreground/60 transition-colors group-hover:text-muted-foreground" />
      <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 rounded-lg bg-popover px-3 py-2 text-xs leading-relaxed text-popover-foreground shadow-lg opacity-0 transition-opacity group-hover:opacity-100">
        {text}
      </div>
    </div>
  );
}
