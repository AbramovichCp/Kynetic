import type { QualityPreset, LetterVortexConfig } from './types';

/**
 * MediaRecorder-based video exporter for the LetterVortex animation.
 *
 * Captures frames from a `<canvas>` element and produces a downloadable
 * video blob.
 */
export class VideoExporter {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private resolveCapture: ((blob: Blob) => void) | null = null;

  /* ==================================================================== */
  /*  Public API                                                          */
  /* ==================================================================== */

  /**
   * Start capturing the canvas stream.
   *
   * @param canvas   The renderer's `<canvas>` element.
   * @param config   Current LetterVortex config (used for format / fps / bitrate).
   * @param quality  Override quality preset (defaults to `config.export.defaultQuality`).
   */
  startCapture(
    canvas: HTMLCanvasElement,
    config: LetterVortexConfig,
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

  /** Stop the active recording and return the resulting blob. */
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

  /** Trigger a browser download of the given blob. */
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

  /** Clean up any active recording. */
  dispose(): void {
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.stop();
    }
    this.mediaRecorder = null;
    this.chunks = [];
    this.resolveCapture = null;
  }
}
