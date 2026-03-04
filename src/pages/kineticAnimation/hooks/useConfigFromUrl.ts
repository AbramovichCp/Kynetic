/**
 * useConfigFromUrl — reads AnimationConfig from URL search-params on mount,
 * and writes every config change back so the URL always reflects current state.
 *
 * Fields that cannot be represented in a URL (backgroundImage) are skipped.
 */

import { useCallback, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { AnimationConfig } from "../engine";
import { DEFAULT_CONFIG } from "../engine";

/** Keys we never persist in the URL (too large / binary). */
const SKIP_KEYS = new Set<keyof AnimationConfig>(["backgroundImage"]);

// ---------- serialisation helpers -------------------------------------------

function serialiseValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(",");
  return String(value);
}

function parseValue(
  key: keyof AnimationConfig,
  raw: string,
  defaults: AnimationConfig,
): unknown {
  const sample = defaults[key];

  if (typeof sample === "number") {
    const n = Number(raw);
    return Number.isFinite(n) ? n : sample;
  }
  if (typeof sample === "string") return raw;
  if (typeof sample === "boolean") return raw === "true";
  if (Array.isArray(sample))
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  // null-able string (backgroundImage would land here, but we skip it)
  if (sample === null) return raw || null;

  return raw;
}

// ---------- build initial config from URL -----------------------------------

function configFromParams(params: URLSearchParams): AnimationConfig {
  const config = { ...DEFAULT_CONFIG };

  for (const key of Object.keys(DEFAULT_CONFIG) as (keyof AnimationConfig)[]) {
    if (SKIP_KEYS.has(key)) continue;
    const raw = params.get(key);
    if (raw !== null) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (config as any)[key] = parseValue(key, raw, DEFAULT_CONFIG);
    }
  }

  return config;
}

// ---------- hook -------------------------------------------------------------

export function useConfigFromUrl() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialise once from URL
  const [config, setConfigState] = useState<AnimationConfig>(() =>
    configFromParams(searchParams),
  );

  const setConfig = useCallback(
    (patchOrFn: Partial<AnimationConfig> | ((prev: AnimationConfig) => AnimationConfig)) => {
      setConfigState((prev) => {
        const next =
          typeof patchOrFn === "function"
            ? patchOrFn(prev)
            : { ...prev, ...patchOrFn };

        // Write changed non-default values to URL (replace, don't push)
        setSearchParams(
          (prevParams) => {
            const params = new URLSearchParams(prevParams);
            for (const key of Object.keys(next) as (keyof AnimationConfig)[]) {
              if (SKIP_KEYS.has(key)) continue;
              const val = next[key];
              const def = DEFAULT_CONFIG[key];
              // Remove param if it equals default, otherwise set it
              if (
                val === def ||
                (Array.isArray(val) &&
                  Array.isArray(def) &&
                  val.join(",") === def.join(","))
              ) {
                params.delete(key);
              } else {
                params.set(key, serialiseValue(val));
              }
            }
            return params;
          },
          { replace: true },
        );

        return next;
      });
    },
    [setSearchParams],
  );

  return { config, setConfig };
}
