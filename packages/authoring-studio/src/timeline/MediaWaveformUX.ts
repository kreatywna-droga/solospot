/**
 * MediaWaveformUX.ts — Sprint S26 Waveform Display & Navigation Engine
 *
 * Provides headless calculations for:
 * - Timeline waveform display scaling & zoom levels
 * - Viewport bounds and scroll offset calculations
 * - Bi-directional time-to-pixel and pixel-to-time conversions
 * - Amplitude array window slicing and resampling for rendered tracks
 *
 * NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

export interface WaveformViewportConfig {
  readonly zoomLevel: number;       // Zoom multiplier (0.1x to 10x, default 1.0)
  readonly scrollOffsetMs: number;  // Viewport scroll start time in ms
  readonly viewWidthPx: number;     // Rendered track width in pixels
  readonly baseMsPerPixel?: number; // Unscaled ms per pixel (default 10 ms/px)
}

export interface WaveformViewportState {
  readonly zoomLevel: number;
  readonly scrollOffsetMs: number;
  readonly viewWidthPx: number;
  readonly visibleStartMs: number;
  readonly visibleEndMs: number;
  readonly msPerPixel: number;
  readonly pixelPerMs: number;
}

export const DEFAULT_BASE_MS_PER_PIXEL = 10; // 100px = 1 sec at zoom 1.0

/**
 * Computes viewport bounds, scale factors, and time ranges for a timeline track view.
 */
export function computeWaveformViewport(
  totalDurationMs: number,
  config: WaveformViewportConfig
): WaveformViewportState {
  const zoom = Math.max(0.1, Math.min(10.0, config.zoomLevel));
  const baseMsPx = config.baseMsPerPixel ?? DEFAULT_BASE_MS_PER_PIXEL;
  
  const msPerPixel = Math.max(0.1, baseMsPx / zoom);
  const pixelPerMs = 1 / msPerPixel;

  const scrollOffsetMs = Math.max(0, Math.min(totalDurationMs, config.scrollOffsetMs));
  const visibleDurationMs = config.viewWidthPx * msPerPixel;
  const visibleEndMs = Math.min(totalDurationMs, scrollOffsetMs + visibleDurationMs);

  return {
    zoomLevel: zoom,
    scrollOffsetMs,
    viewWidthPx: Math.max(1, config.viewWidthPx),
    visibleStartMs: scrollOffsetMs,
    visibleEndMs,
    msPerPixel,
    pixelPerMs,
  };
}

/**
 * Converts a time offset in milliseconds to viewport X coordinate in pixels.
 */
export function timeToPixel(timeMs: number, viewport: WaveformViewportState): number {
  return (timeMs - viewport.scrollOffsetMs) * viewport.pixelPerMs;
}

/**
 * Converts a viewport X pixel position to time offset in milliseconds.
 */
export function pixelToTime(pixelX: number, viewport: WaveformViewportState): number {
  return Math.max(0, viewport.scrollOffsetMs + pixelX * viewport.msPerPixel);
}

/**
 * Window-slices and resamples an array of amplitude samples to match the visible viewport window.
 */
export function sliceWaveformAmplitudes(
  amplitudes: readonly number[],
  clipInPointMs: number,
  clipOutPointMs: number,
  viewport: WaveformViewportState,
  targetBarCount?: number
): readonly number[] {
  if (amplitudes.length === 0) return [];

  const clipDurationMs = Math.max(1, clipOutPointMs - clipInPointMs);
  const startRatio = Math.max(0, Math.min(1, (viewport.visibleStartMs - clipInPointMs) / clipDurationMs));
  const endRatio = Math.max(0, Math.min(1, (viewport.visibleEndMs - clipInPointMs) / clipDurationMs));

  const startIndex = Math.floor(startRatio * amplitudes.length);
  const endIndex = Math.min(amplitudes.length, Math.ceil(endRatio * amplitudes.length));

  const sliced = amplitudes.slice(startIndex, Math.max(startIndex + 1, endIndex));
  const count = targetBarCount ?? sliced.length;

  if (count <= 0 || sliced.length === 0) return [];
  if (sliced.length === count) return sliced;

  // Resample to target bar count
  const resampled: number[] = [];
  const step = sliced.length / count;

  for (let i = 0; i < count; i++) {
    const srcIndex = Math.min(sliced.length - 1, Math.floor(i * step));
    resampled.push(sliced[srcIndex]);
  }

  return resampled;
}
