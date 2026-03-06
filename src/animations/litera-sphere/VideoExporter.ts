import type { QualityPreset, LiteraSphereConfig } from './types';

/**
 * Handles `MediaRecorder`-based video capture from a `<canvas>` element.
 * Supports quality presets defined in the LiteraSphere config.
 */
export class VideoExporter {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private resolveCapture: ((blob: Blob) => void) | null = null;

  /**
   * Begin recording the canvas stream.
   *
   * @param canvas  The canvas element to capture.
   * @param config  Full configuration (used for fps, bitrate look-up, format).
   * @param quality Optional quality override; falls back to `config.export.defaultQuality`.
   */
  startCapture(
    canvas: HTMLCanvasElement,
    config: LiteraSphereConfig,
    quality?: QualityPreset,
  ): void {
    const preset =
      config.export.qualityPresets[quality ?? config.export.defaultQuality];
    const stream = canvas.captureStream(config.export.fps);

    const preferredMime =
      config.export.format === 'webm'
        ? 'video/webm;codecs=vp9'
        : 'video/mp4';

    this.chunks = [];
    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported(preferredMime)
        ? preferredMime
        : 'video/webm',
      videoBitsPerSecond: preset.bitrate,
    });

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };

    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.chunks, {
        type: this.mediaRecorder?.mimeType ?? 'video/webm',
      });
      this.resolveCapture?.(blob);
    };

    this.mediaRecorder.start();
  }

  /**
   * Stop recording and return the captured video as a `Blob`.
   */
  stopCapture(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state !== 'recording') {
        resolve(new Blob());
        return;
      }
      this.resolveCapture = resolve;
      this.mediaRecorder.stop();
    });
  }

  /**
   * Trigger a browser download for the given blob.
   *
   * @param blob     The video blob to save.
   * @param filename Suggested filename (including extension).
   */
  downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /** Clean up any in-flight recording. */
  dispose(): void {
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.stop();
    }
    this.mediaRecorder = null;
    this.chunks = [];
    this.resolveCapture = null;
  }
}
