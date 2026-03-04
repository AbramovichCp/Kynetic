/**
 * useVideoExport — hook to capture the canvas as WebM video using MediaRecorder API.
 */

import { useCallback, useRef, useState } from "react";

export interface UseVideoExportReturn {
  isRecording: boolean;
  startExport: (canvas: HTMLCanvasElement, durationMs: number) => void;
}

export function useVideoExport(): UseVideoExportReturn {
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);

  const startExport = useCallback(
    (canvas: HTMLCanvasElement, durationMs: number) => {
      if (isRecording) return;

      const stream = canvas.captureStream(60);
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 8_000_000,
      });

      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `kinetic-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setIsRecording(false);
      };

      recorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);

      setTimeout(() => {
        if (recorder.state === "recording") {
          recorder.stop();
        }
      }, durationMs);
    },
    [isRecording],
  );

  return { isRecording, startExport };
}
