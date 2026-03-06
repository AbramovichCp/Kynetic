import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { LiteraSphereConfig, DeepPartial } from '@/animations/litera-sphere';

/* ------------------------------------------------------------------ */
/*  Props                                                             */
/* ------------------------------------------------------------------ */

interface SettingsPanelProps {
  config: LiteraSphereConfig;
  onChange: (patch: DeepPartial<LiteraSphereConfig>) => void;
  onExport: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isRecording: boolean;
  open: boolean;
  onToggle: () => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
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
          {/* ---------------------------------------------------------- */}
          {/*  Sphere Settings                                           */}
          {/* ---------------------------------------------------------- */}
          <Section title="Sphere Settings">
            <SliderField
              label="Radius"
              value={config.sphere.radius}
              min={50}
              max={800}
              step={10}
              tooltip="Controls the overall size of the sphere. Larger values create a bigger sphere."
              onChange={(v) => onChange({ sphere: { radius: v } })}
            />
            <SliderField
              label="Rotation Speed X"
              value={config.sphere.rotationSpeedX}
              min={0}
              max={0.02}
              step={0.001}
              tooltip="How fast the sphere rotates around the horizontal axis."
              onChange={(v) => onChange({ sphere: { rotationSpeedX: v } })}
            />
            <SliderField
              label="Rotation Speed Y"
              value={config.sphere.rotationSpeedY}
              min={0}
              max={0.02}
              step={0.001}
              tooltip="How fast the sphere rotates around the vertical axis."
              onChange={(v) => onChange({ sphere: { rotationSpeedY: v } })}
            />
            <SliderField
              label="Tilt Angle X"
              value={config.sphere.rotationAngleX}
              min={-90}
              max={90}
              step={1}
              tooltip="Initial tilt of the sphere in degrees on the X axis."
              onChange={(v) => onChange({ sphere: { rotationAngleX: v } })}
            />
            <SliderField
              label="Cycle Duration"
              value={config.animation.cycleDuration}
              min={1000}
              max={30000}
              step={500}
              format={(v) => `${(v / 1000).toFixed(1)}s`}
              tooltip="Duration of one full animation loop in milliseconds."
              onChange={(v) => onChange({ animation: { cycleDuration: v } })}
            />
          </Section>

          <Separator />

          {/* ---------------------------------------------------------- */}
          {/*  Characters                                                */}
          {/* ---------------------------------------------------------- */}
          <Section title="Characters">
            <SliderField
              label="Character Count"
              value={config.characters.count}
              min={50}
              max={2000}
              step={10}
              tooltip="Total number of characters distributed across the sphere surface."
              onChange={(v) => onChange({ characters: { count: v } })}
            />
            <SliderField
              label="Base Font Size"
              value={config.characters.baseFontSize}
              min={10}
              max={80}
              step={1}
              tooltip="Base size of characters. Actual size varies with depth."
              onChange={(v) => onChange({ characters: { baseFontSize: v } })}
            />
            <SliderField
              label="Min Font Size"
              value={config.characters.fontSizeRange[0]}
              min={5}
              max={50}
              step={1}
              tooltip="Minimum character size (for characters furthest from the viewer)."
              onChange={(v) =>
                onChange({
                  characters: {
                    fontSizeRange: [v, config.characters.fontSizeRange[1]],
                  },
                })
              }
            />
            <SliderField
              label="Max Font Size"
              value={config.characters.fontSizeRange[1]}
              min={20}
              max={100}
              step={1}
              tooltip="Maximum character size (for characters closest to the viewer)."
              onChange={(v) =>
                onChange({
                  characters: {
                    fontSizeRange: [config.characters.fontSizeRange[0], v],
                  },
                })
              }
            />
            <SliderField
              label="Density"
              value={config.characters.density}
              min={0.1}
              max={3.0}
              step={0.1}
              tooltip="Controls spacing between characters. Higher = more packed."
              onChange={(v) => onChange({ characters: { density: v } })}
            />
            <Field
              label="Color"
              tooltip="Color of all characters on the sphere."
            >
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.characters.color}
                  onChange={(e) =>
                    onChange({ characters: { color: e.target.value } })
                  }
                  className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent p-0.5"
                />
                <span className="text-xs text-muted-foreground">
                  {config.characters.color}
                </span>
              </div>
            </Field>
            <SliderField
              label="Min Opacity"
              value={config.characters.opacity.min}
              min={0}
              max={1}
              step={0.01}
              tooltip="Opacity for characters furthest from the viewer."
              onChange={(v) =>
                onChange({ characters: { opacity: { min: v } } })
              }
            />
            <SliderField
              label="Max Opacity"
              value={config.characters.opacity.max}
              min={0}
              max={1}
              step={0.01}
              tooltip="Opacity for characters closest to the viewer."
              onChange={(v) =>
                onChange({ characters: { opacity: { max: v } } })
              }
            />
          </Section>

          <Separator />

          {/* ---------------------------------------------------------- */}
          {/*  Words                                                     */}
          {/* ---------------------------------------------------------- */}
          <Section title="Words">
            <Field
              label="Enable Words"
              tooltip="If enabled, letters from the word list will be grouped together on the sphere surface so words are readable."
            >
              <button
                type="button"
                onClick={() =>
                  onChange({ words: { enabled: !config.words.enabled } })
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  config.words.enabled ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                    config.words.enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </Field>

            <Field
              label="Word List"
              tooltip="Comma-separated list of words. Their letters will appear adjacent on the sphere."
            >
              <Input
                value={config.words.list.join(', ')}
                onChange={(e) =>
                  onChange({
                    words: {
                      list: e.target.value
                        .split(',')
                        .map((w) => w.trim().toUpperCase())
                        .filter(Boolean),
                    },
                  })
                }
                disabled={!config.words.enabled}
              />
            </Field>

            <SliderField
              label="Word Spacing"
              value={config.words.wordSpacing}
              min={0.5}
              max={3.0}
              step={0.1}
              tooltip="Controls spacing between letters within a word."
              onChange={(v) => onChange({ words: { wordSpacing: v } })}
            />
          </Section>

          <Separator />

          {/* ---------------------------------------------------------- */}
          {/*  Export                                                     */}
          {/* ---------------------------------------------------------- */}
          <Section title="Export">
            <Field
              label="Quality Preset"
              tooltip="Resolution and bitrate of the exported video. Higher quality = larger file."
            >
              <Select
                value={config.export.defaultQuality}
                onValueChange={(v) =>
                  onChange({
                    export: {
                      defaultQuality: v as LiteraSphereConfig['export']['defaultQuality'],
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
              format={(v) => `${v}s`}
              tooltip="How many seconds of animation to export."
              onChange={(v) => onChange({ export: { duration: v } })}
            />

            <Field
              label="FPS"
              tooltip="Frames per second of the exported video."
            >
              <Select
                value={String(config.export.fps)}
                onValueChange={(v) =>
                  onChange({ export: { fps: Number(v) } })
                }
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

            <Field
              label="Export Format"
              tooltip="Video format: WebM (browser-native) or MP4."
            >
              <Select
                value={config.export.format}
                onValueChange={(v) =>
                  onChange({
                    export: {
                      format: v as LiteraSphereConfig['export']['format'],
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
              <Button className="w-full" onClick={onExport} disabled={isRecording}>
                Export Video
              </Button>
              <Button
                className="w-full"
                variant={isRecording ? 'destructive' : 'outline'}
                onClick={isRecording ? onStopRecording : onStartRecording}
              >
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </Button>
            </div>
          </Section>
        </div>
      </ScrollArea>
    </aside>
  );
}

/* ==================================================================== */
/*  Reusable sub-components                                             */
/* ==================================================================== */

/** Collapsible section with a chevron toggle. */
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
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && <div className="flex flex-col gap-3 pt-1">{children}</div>}
    </div>
  );
}

/** Label + children wrapper with an optional "?" tooltip button. */
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

/** Slider with label, value display, and tooltip. */
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
  const display = format ? format(value) : String(Math.round(value * 1000) / 1000);
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

/** Small "?" icon that reveals a tooltip on hover. */
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
