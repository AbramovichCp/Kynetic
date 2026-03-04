import { useState } from "react";
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
  open: boolean;
  onToggle: () => void;
}

export function SettingsPanel({
  config,
  onChange,
  onExport,
  isRecording,
  open,
  onToggle,
}: SettingsPanelProps) {
  const resolutionKey =
    Object.entries(RESOLUTION_PRESETS).find(
      ([, v]) => v.width === config.width && v.height === config.height,
    )?.[0] ?? "2160p";

  const handleBgImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange({ backgroundImage: reader.result as string });
    reader.readAsDataURL(file);
  };

  if (!open) return null;

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col overflow-hidden border-l border-border bg-card text-card-foreground">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-lg font-semibold tracking-tight">Settings</h2>
        <button
          onClick={onToggle}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Close settings"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
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

          {/* ---------- Appearance ---------- */}
          <Section title="Appearance">
            <Field label="Text color">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.letterColor}
                  onChange={(e) => onChange({ letterColor: e.target.value })}
                  className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent p-0.5"
                />
                <span className="text-xs text-muted-foreground">
                  {config.letterColor}
                </span>
              </div>
            </Field>

            <Field
              label={`Text opacity — ${Math.round(config.letterColorAlpha * 100)}%`}
            >
              <Slider
                min={0}
                max={1}
                step={0.01}
                value={[config.letterColorAlpha]}
                onValueChange={([v]) => onChange({ letterColorAlpha: v })}
              />
            </Field>

            <Field label="Background color">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.backgroundColor}
                  onChange={(e) => onChange({ backgroundColor: e.target.value })}
                  className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent p-0.5"
                />
                <span className="text-xs text-muted-foreground">
                  {config.backgroundColor}
                </span>
              </div>
            </Field>

            <Field
              label={`Background opacity — ${Math.round(config.backgroundColorAlpha * 100)}%`}
            >
              <Slider
                min={0}
                max={1}
                step={0.01}
                value={[config.backgroundColorAlpha]}
                onValueChange={([v]) => onChange({ backgroundColorAlpha: v })}
              />
            </Field>

            <Field label="Background image">
              <div className="flex flex-col gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleBgImage}
                  className="text-xs"
                />
                {config.backgroundImage && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => onChange({ backgroundImage: null })}
                  >
                    Remove image
                  </Button>
                )}
              </div>
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
