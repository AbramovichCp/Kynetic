/**
 * LiteraSphere — public API surface.
 *
 * ```ts
 * import { LiteraSphere, LITERA_SPHERE_CONFIG } from '@/animations/litera-sphere';
 * ```
 */
export { LiteraSphere } from './LiteraSphere';
export { LITERA_SPHERE_CONFIG } from './config';
export { SphereGeometryBuilder } from './SphereGeometryBuilder';
export { CharacterRenderer } from './CharacterRenderer';
export { WordClusterManager } from './WordClusterManager';
export { AnimationLoop } from './AnimationLoop';
export { VideoExporter } from './VideoExporter';

export type {
  LiteraSphereConfig,
  DeepPartial,
  QualityPreset,
  ExportFormat,
  CharacterEntry,
  FrameCallback,
  SphereConfig,
  CharactersConfig,
  WordsConfig,
  AnimationConfig,
  ExportConfig,
  QualityPresetConfig,
} from './types';
