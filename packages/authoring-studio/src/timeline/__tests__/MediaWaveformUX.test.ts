import { describe, it, expect } from 'vitest';
import {
  computeWaveformViewport,
  timeToPixel,
  pixelToTime,
  sliceWaveformAmplitudes,
  DEFAULT_BASE_MS_PER_PIXEL,
} from '../MediaWaveformUX';

describe('MediaWaveformUX — Waveform Display & Navigation Engine', () => {
  it('computes default waveform viewport bounds at 1.0x zoom', () => {
    const viewport = computeWaveformViewport(10000, {
      zoomLevel: 1.0,
      scrollOffsetMs: 0,
      viewWidthPx: 800,
    });

    expect(viewport.zoomLevel).toBe(1.0);
    expect(viewport.visibleStartMs).toBe(0);
    expect(viewport.visibleEndMs).toBe(8000); // 800px * 10 ms/px = 8000ms
    expect(viewport.msPerPixel).toBe(DEFAULT_BASE_MS_PER_PIXEL);
    expect(viewport.pixelPerMs).toBe(0.1);
  });

  it('scales viewport correctly with zoom level', () => {
    const zoomedIn = computeWaveformViewport(10000, {
      zoomLevel: 2.0, // 2x zoom -> 5 ms/px
      scrollOffsetMs: 1000,
      viewWidthPx: 500,
    });

    expect(zoomedIn.msPerPixel).toBe(5);
    expect(zoomedIn.visibleStartMs).toBe(1000);
    expect(zoomedIn.visibleEndMs).toBe(3500); // 1000 + 500 * 5 = 3500
  });

  it('converts time to pixel and pixel to time bi-directionally', () => {
    const viewport = computeWaveformViewport(10000, {
      zoomLevel: 1.0,
      scrollOffsetMs: 2000,
      viewWidthPx: 1000,
    });

    // 2000ms is at pixel 0
    expect(timeToPixel(2000, viewport)).toBe(0);
    // 5000ms is 3000ms past scroll -> 3000ms * 0.1 px/ms = 300px
    expect(timeToPixel(5000, viewport)).toBe(300);

    // Pixel 300 -> 2000ms + 300 / 0.1 = 5000ms
    expect(pixelToTime(300, viewport)).toBe(5000);
  });

  it('window-slices waveform amplitudes for viewport render range', () => {
    const amplitudes = [0.1, 0.3, 0.8, 0.9, 0.5, 0.2, 0.4, 0.7, 0.6, 0.2];
    const viewport = computeWaveformViewport(10000, {
      zoomLevel: 1.0,
      scrollOffsetMs: 2000,
      viewWidthPx: 400, // 4000ms window (2000ms to 6000ms)
    });

    const sliced = sliceWaveformAmplitudes(amplitudes, 0, 10000, viewport);
    expect(sliced.length).toBeGreaterThan(0);
    expect(sliced.length).toBeLessThan(amplitudes.length);
  });

  it('resamples amplitude slice to exact bar count', () => {
    const amplitudes = Array.from({ length: 100 }, (_, i) => (i % 10) / 10);
    const viewport = computeWaveformViewport(10000, {
      zoomLevel: 1.0,
      scrollOffsetMs: 0,
      viewWidthPx: 1000,
    });

    const resampled = sliceWaveformAmplitudes(amplitudes, 0, 10000, viewport, 20);
    expect(resampled.length).toBe(20);
  });
});
