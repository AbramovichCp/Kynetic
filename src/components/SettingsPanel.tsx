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

import type { AnimationConfig } from "@/lib/canvas";
import { RESOLUTION_PRESETS } from "@/lib/canvas";

interface SettingsPanelProps {
  config: AnimationConfig;
  onChange: (patch: Partial<AnimationConfig>) => void;
  onExport: (resolutionKey: string) => void;
  isRecording: boolean;
}

export function SettingsPanel({
  config,
  onChange,
  onExport,
  isRecording,
}: SettingsPanelProps) {
  const resolutionKey =
    Object.entries(RESOLUTION_PRESETS).find(
      ([, v]) => v.width === config.width && v.height === config.height,
    )?.[0] ?? "1080p";

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-border bg-card text-card-foreground">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-lg font-semibold tracking-tight">Settings</h2>
      </div>

      <Separator />

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-6 p-4">
          {/* ---------- Text ---------- */}
          <Section title="Text">
            <Field label="Target text">
              <Input
                value={config.targetText}
                onChange={(e) => onChange({ targetText: e.target.value })}
              />
            </Field>

            <Field label="Font family">
              <Input
                value={config.fontFamily}
                onChange={(e) => onChange({ fontFamily: e.target.value })}
              />
            </Field>

            <Field label={`Silhouette size — ${config.fontSize}px`}>
              <Slider
                min={100}
                max={1200}
                step={10}
                value={[config.fontSize]}
                onValueChange={([v]) => onChange({ fontSize: v })}
              />
            </Field>

            <Field label={`Letter size — ${config.letterSize}px`}>
              <Slider
                min={6}
                max={40}
                step={1}
                value={[config.letterSize]}
                onValueChange={([v]) => onChange({ letterSize: v })}
              />
            </Field>
          </Section>

          <Separator />

          {/* ---------- Particles ---------- */}
          <Section title="Particles">
            <Field
              label={`Background letters — ${config.totalBackgroundLetters}`}
            >
              <Slider
                min={10}
                max={500}
                step={5}
                value={[config.totalBackgroundLetters]}
                onValueChange={([v]) => onChange({ totalBackgroundLetters: v })}
              />
            </Field>

            <Field label={`Logo letters — ${config.logoLettersCount}`}>
              <Slider
                min={10}
                max={600}
                step={5}
                value={[config.logoLettersCount]}
                onValueChange={([v]) => onChange({ logoLettersCount: v })}
              />
            </Field>

            <Field label={`Duplication — ${config.duplicationPercent}%`}>
              <Slider
                min={0}
                max={100}
                step={1}
                value={[config.duplicationPercent]}
                onValueChange={([v]) => onChange({ duplicationPercent: v })}
              />
            </Field>
          </Section>

          <Separator />

          {/* ---------- Physics ---------- */}
          <Section title="Animation">
            <Field label={`Speed — ${config.particleSpeed.toFixed(1)}×`}>
              <Slider
                min={0.1}
                max={5}
                step={0.1}
                value={[config.particleSpeed]}
                onValueChange={([v]) => onChange({ particleSpeed: v })}
              />
            </Field>

            <Field label={`Jitter — ${config.jitter.toFixed(1)}`}>
              <Slider
                min={0}
                max={5}
                step={0.1}
                value={[config.jitter]}
                onValueChange={([v]) => onChange({ jitter: v })}
              />
            </Field>

            <Field label={`Phase duration — ${config.phaseDuration}ms`}>
              <Slider
                min={500}
                max={8000}
                step={100}
                value={[config.phaseDuration]}
                onValueChange={([v]) => onChange({ phaseDuration: v })}
              />
            </Field>
          </Section>

          <Separator />

          {/* ---------- Word bank ---------- */}
          <Section title="Word bank">
            <Field label="Words (comma-separated)">
              <Input
                value={config.wordList.join(", ")}
                onChange={(e) =>
                  onChange({
                    wordList: e.target.value
                      .split(",")
                      .map((w) => w.trim())
                      .filter(Boolean),
                  })
                }
              />
            </Field>
          </Section>

          <Separator />

          {/* ---------- Export ---------- */}
          <Section title="Export">
            <Field label="Resolution">
              <Select
                value={resolutionKey}
                onValueChange={(key) => {
                  const preset = RESOLUTION_PRESETS[key];
                  if (preset) {
                    onChange({ width: preset.width, height: preset.height });
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(RESOLUTION_PRESETS).map((key) => (
                    <SelectItem key={key} value={key}>
                      {key} ({RESOLUTION_PRESETS[key].width}×
                      {RESOLUTION_PRESETS[key].height})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Button
              className="w-full"
              disabled={isRecording}
              onClick={() => onExport(resolutionKey)}
            >
              {isRecording ? "Recording…" : "Generate & Save Video"}
            </Button>
          </Section>
        </div>
      </ScrollArea>
    </aside>
  );
}

// ---- tiny helpers -----------------------------------------------------------

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
