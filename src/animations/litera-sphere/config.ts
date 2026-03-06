/**
 * LiteraSphere — default configuration.
 * This is the single source of truth for all tunable parameters.
 */
export const LITERA_SPHERE_CONFIG: import('./types').LiteraSphereConfig = {
  sphere: {
    radius: 300,
    rotationSpeedX: 0.002,
    rotationSpeedY: 0.004,
    rotationAngleX: 15,
    rotationAngleY: 0,
  },
  characters: {
    count: 400,
    baseFontSize: 28,
    fontSizeRange: [14, 48],
    density: 1.0,
    fontFamily: 'monospace',
    color: '#ffffff',
    opacity: {
      min: 0.15,
      max: 1.0,
    },
  },
  words: {
    enabled: true,
    list: ['MATRIX', 'DATA', 'CODE', 'ZERO', 'ONE'],
    wordSpacing: 1.2,
  },
  animation: {
    cycleDuration: 10000,
    autoPlay: true,
  },
  export: {
    defaultQuality: 'high',
    qualityPresets: {
      low:    { width: 854,  height: 480,  bitrate: 1_000_000  },
      medium: { width: 1280, height: 720,  bitrate: 4_000_000  },
      high:   { width: 1920, height: 1080, bitrate: 8_000_000  },
      ultra:  { width: 3840, height: 2160, bitrate: 20_000_000 },
    },
    duration: 10,
    fps: 60,
    format: 'webm',
  },
};
