/**
 * HeadlessMediaPreviewEngine.ts — Sprint S15 Headless Media Preview (ETAP 6)
 *
 * Provides pure mathematical & data descriptor generation for media previews:
 * - Image preview descriptors
 * - SVG vector structure metadata
 * - Audio waveform amplitude bar array generation
 * - Video thumbnail keyframe descriptors
 *
 * 100% Headless — zero DOM bindings or browser dependencies.
 */

import { ImportedMediaAsset } from './MediaImportEngine';

export interface AudioWaveformMetadata {
  readonly sampleCount: number;
  readonly bars: readonly number[]; // Normalized amplitudes in [0, 1]
  readonly durationMs: number;
}

export interface VideoPreviewDescriptor {
  readonly thumbnailFrameTimesMs: readonly number[];
  readonly widthPx: number;
  readonly heightPx: number;
  readonly durationMs: number;
}

export class HeadlessMediaPreviewEngine {
  /**
   * Generates a normalized amplitude waveform array for audio visualization.
   */
  public static generateAudioWaveform(
    durationMs: number,
    barsCount: number = 50,
    seed: number = 42
  ): AudioWaveformMetadata {
    const bars: number[] = [];
    let state = seed;

    for (let i = 0; i < barsCount; i++) {
      // Deterministic pseudo-random amplitude generation for headless testing
      state = (state * 9301 + 49297) % 233280;
      const rnd = state / 233280;
      const amplitude = Math.max(0.05, Math.min(1.0, Math.sin((i / barsCount) * Math.PI) * 0.7 + rnd * 0.3));
      bars.push(Number(amplitude.toFixed(3)));
    }

    return {
      sampleCount: barsCount,
      bars,
      durationMs,
    };
  }

  /**
   * Generates video thumbnail frame keyframe time offsets.
   */
  public static generateVideoThumbnails(
    durationMs: number,
    frameCount: number = 5
  ): VideoPreviewDescriptor {
    const step = durationMs / Math.max(1, frameCount);
    const times: number[] = [];

    for (let i = 0; i < frameCount; i++) {
      times.push(Math.round(i * step));
    }

    return {
      thumbnailFrameTimesMs: times,
      widthPx: 1920,
      heightPx: 1080,
      durationMs,
    };
  }

  /**
   * Parses basic SVG viewbox and dimensions from raw SVG string.
   */
  public static parseSvgStructure(svgString: string): { viewBox?: string; width?: number; height?: number } {
    const viewBoxMatch = svgString.match(/viewBox=["']([^"']+)["']/i);
    const widthMatch = svgString.match(/width=["'](\d+)["']/i);
    const heightMatch = svgString.match(/height=["'](\d+)["']/i);

    return {
      viewBox: viewBoxMatch ? viewBoxMatch[1] : undefined,
      width: widthMatch ? parseInt(widthMatch[1], 10) : undefined,
      height: heightMatch ? parseInt(heightMatch[1], 10) : undefined,
    };
  }
}
