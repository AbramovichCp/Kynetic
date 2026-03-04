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

import type { AnimationConfig, FieldMeta } from "@/lib/canvas";
import { RESOLUTION_PRESETS, FIELD_CONFIG } from "@/lib/canvas";

// Group field configs by section (preserves order)
const SECTIONS = FIELD_CONFIG.reduce<{ name: string; fields: FieldMeta[] }[]>(
  (acc, field) => {
    let section = acc.find((s) => s.name === field.section);
    if (!section) {
      section = { name: field.section, fields: [] };
      acc.push(section);
    }
    section.fields.push(field);
    return acc;
  },
  [],
);

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
          {SECTIONS.map((section, si) => (
            <div key={section.name}>
              {si > 0 && <Separator className="mb-6" />}
              <Section title={section.name}>
                {section.fields.map((meta) => (
                  <ConfigField
                    key={meta.key}
                    meta={meta}
                    config={config}
                    onChange={onChange}
                    onFileChange={handleBgImage}
                  />
                ))}
              </Section>
            </div>
          ))}

          <Separator />

          {/* ---------- Export (special, not in FIELD_CONFIG) ---------- */}
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

// ---- Generic field renderer driven by FieldMeta ----------------------------

function ConfigField({
  meta,
  config,
  onChange,
  onFileChange,
}: {
  meta: FieldMeta;
  config: AnimationConfig;
  onChange: (patch: Partial<AnimationConfig>) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  switch (meta.type) {
    case "slider": {
      const value = config[meta.key] as number;
      const suffix = meta.format ? ` — ${meta.format(value)}` : ` — ${value}`;
      return (
        <Field label={`${meta.label}${suffix}`}>
          <Slider
            min={meta.min}
            max={meta.max}
            step={meta.step}
            value={[value]}
            onValueChange={([v]) => onChange({ [meta.key]: v })}
          />
        </Field>
      );
    }
    case "text":
      return (
        <Field label={meta.label}>
          <Input
            value={config[meta.key] as string}
            onChange={(e) => onChange({ [meta.key]: e.target.value })}
          />
        </Field>
      );
    case "color":
      return (
        <Field label={meta.label}>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={config[meta.key] as string}
              onChange={(e) => onChange({ [meta.key]: e.target.value })}
              className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent p-0.5"
            />
            <span className="text-xs text-muted-foreground">
              {config[meta.key] as string}
            </span>
          </div>
        </Field>
      );
    case "file":
      return (
        <Field label={meta.label}>
          <div className="flex flex-col gap-2">
            <Input
              type="file"
              accept={meta.accept}
              onChange={onFileChange}
              className="text-xs"
            />
            {config[meta.key] && (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => onChange({ [meta.key]: null })}
              >
                Remove image
              </Button>
            )}
          </div>
        </Field>
      );
    case "wordlist":
      return (
        <Field label={meta.label}>
          <Input
            value={(config[meta.key] as string[]).join(", ")}
            onChange={(e) =>
              onChange({
                [meta.key]: e.target.value
                  .split(",")
                  .map((w) => w.trim())
                  .filter(Boolean),
              })
            }
          />
        </Field>
      );
  }
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
