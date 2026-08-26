/**
 * AssetPreviewDescriptors.ts — Sprint S25 Professional Asset Preview Descriptors
 *
 * Composes professional preview descriptors for media assets (image, video,
 * audio, vector, font) including technical metadata: dimensions, duration,
 * file size, MIME type, aspect ratio, deterministic audio waveform bars,
 * and video thumbnail keyframe time offsets.
 *
 * Reuses the S15 `HeadlessMediaPreviewEngine` for waveform/thumbnail math and
 * the S15 registry for asset identity — NO second asset registry. Binary
 * payloads remain in `payloadRef` / registry, never in BuilderDocument.
 *
 * NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import type { AnimationAssetItem } from './AnimationAssetRegistry';
import { HeadlessMediaPreviewEngine, type AudioWaveformMetadata, type VideoPreviewDescriptor } from './HeadlessMediaPreviewEngine';
import { readAssetPayload, detectAssetMediaType, type AssetMediaType } from './assetPayload';

export type PreviewKind = AssetMediaType;

export interface AssetTechnicalMetrics {
  readonly widthPx?: number;
  readonly heightPx?: number;
  readonly durationMs?: number;
  readonly sampleRate?: number;
  readonly fps?: number;
  readonly viewBox?: string;
  readonly fontFamily?: string;
}

export interface AssetFileInfo {
  readonly fileName?: string;
  readonly mimeType?: string;
  readonly fileSizeBytes?: number;
  readonly sourceUri?: string;
}

export interface ProfessionalAssetPreview {
  readonly assetId: string;
  readonly name: string;
  readonly kind: PreviewKind;
  readonly thumbnailUri?: string;
  readonly aspectRatio?: string;
  readonly waveformBars?: ReadonlyArray<number>;
  readonly videoThumbnailFrameTimesMs?: ReadonlyArray<number>;
  readonly fileInfo: AssetFileInfo;
  readonly metrics: AssetTechnicalMetrics;
}

export interface AssetPreviewBundle {
  readonly preview: ProfessionalAssetPreview;
  readonly fileInfo?: AssetFileInfo;
  readonly metrics?: AssetTechnicalMetrics;
  readonly waveform?: AudioWaveformMetadata;
  readonly videoThumbnails?: VideoPreviewDescriptor;
}

/**
 * Deterministic seed derived from assetId so waveform/thumbnail generation is
 * reproducible across calls and across BuilderDocument sessions.
 */
export function assetPreviewSeed(assetId: string): number {
  let hash = 0;
  for (let i = 0; i < assetId.length; i++) {
    hash = (hash * 31 + assetId.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 233280;
}

/**
 * Composes a professional preview descriptor for an asset item.
 */
export function composePreview(item: AnimationAssetItem): ProfessionalAssetPreview {
  const { metadata } = item;
  const payload = readAssetPayload(item);
  const extracted = payload.extracted ?? null;
  const kind = detectAssetMediaType(item);

  const widthPx = extracted?.widthPx;
  const heightPx = extracted?.heightPx;
  const durationMs = extracted?.durationMs ?? metadata.preview.durationMs;

  const aspectRatio =
    widthPx && heightPx ? `${widthPx}:${heightPx}` : metadata.preview.aspectRatio;

  return {
    assetId: metadata.assetId,
    name: metadata.name,
    kind,
    thumbnailUri: metadata.preview.thumbnailUri ?? payload.sourceUri,
    aspectRatio,
    fileInfo: {
      fileName: metadata.name,
      mimeType: payload.mimeType ?? metadata.preview.thumbnailUri?.split('.').pop(),
      fileSizeBytes: payload.fileSizeBytes,
      sourceUri: payload.sourceUri,
    },
    metrics: {
      widthPx,
      heightPx,
      durationMs,
      sampleRate: extracted?.sampleRate,
      fps: extracted?.fps,
      viewBox: extracted?.viewBox,
      fontFamily: extracted?.fontFamily,
    },
  };
}

/**
 * Generates a deterministic audio waveform for an audio asset. Reuses
 * HeadlessMediaPreviewEngine with a seed derived from the assetId.
 */
export function generateAudioWaveform(
  item: AnimationAssetItem,
  barsCount: number = 50
): AudioWaveformMetadata {
  const durationMs = readAssetPayload(item).extracted?.durationMs ?? item.metadata.preview.durationMs ?? 5000;
  return HeadlessMediaPreviewEngine.generateAudioWaveform(
    durationMs,
    barsCount,
    assetPreviewSeed(item.metadata.assetId)
  );
}

/**
 * Generates deterministic video thumbnail frame offsets for a video asset.
 */
export function generateVideoThumbnails(
  item: AnimationAssetItem,
  frameCount: number = 5
): VideoPreviewDescriptor {
  const durationMs = readAssetPayload(item).extracted?.durationMs ?? item.metadata.preview.durationMs ?? 10000;
  return HeadlessMediaPreviewEngine.generateVideoThumbnails(durationMs, frameCount);
}

/**
 * Composes the full preview bundle including generated waveform / thumbnail
 * descriptors where applicable.
 */
export function composePreviewBundle(item: AnimationAssetItem): AssetPreviewBundle {
  const preview = composePreview(item);
  let waveform: AudioWaveformMetadata | undefined;
  let videoThumbnails: VideoPreviewDescriptor | undefined;

  if (preview.kind === 'audio') {
    waveform = generateAudioWaveform(item);
  }
  if (preview.kind === 'video') {
    videoThumbnails = generateVideoThumbnails(item);
  }

  return {
    preview,
    fileInfo: preview.fileInfo,
    metrics: preview.metrics,
    waveform,
    videoThumbnails,
  };
}

/** Convenience: file-size formatter (bytes → human readable). */
export function formatAssetFileSize(bytes?: number): string {
  if (bytes == null || Number.isNaN(bytes)) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** Convenience: duration formatter (ms → mm:ss). */
export function formatAssetDuration(ms?: number): string {
  if (ms == null) return '—';
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60)
    .toString()
    .padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
