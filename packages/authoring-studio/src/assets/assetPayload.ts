/**
 * assetPayload.ts — Sprint S25 Shared Asset Payload Descriptor Reader
 *
 * Single, centralized helper for safely reading structured information out of an
 * `AnimationAssetItem`'s opaque `payloadRef` (`unknown`) and its `AnimationAssetMetadata`.
 *
 * DECISION-075: Asset Registry stores metadata only — binary/media payloads live inside
 * `payloadRef` / `AssetStorage`, never inside `BuilderDocument`. This reader never mutates
 * and never copies binary data — it only derives typed descriptors used by the professional
 * Media Library UX layer (sorting, filtering, preview composition, drop-intent resolution).
 *
 * NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import type { AnimationAssetItem } from './AnimationAssetRegistry';
import type { ExtractedMediaMetadata } from './AssetProcessingPipeline';

export type AssetMediaType = 'image' | 'svg' | 'video' | 'audio' | 'font' | 'unknown';

export interface AssetPayloadInfo {
  readonly mimeType?: string;
  readonly fileSizeBytes?: number;
  readonly sourceUri?: string;
  /** Normalized extracted technical metadata (dimensions, duration, etc.). */
  readonly extracted?: ExtractedMediaMetadata | null;
}

interface PayloadLike {
  mimeType?: string;
  fileSizeBytes?: number;
  sourceUri?: string;
  extracted?: ExtractedMediaMetadata;
}

/**
 * Safely reads structured payload metadata from an asset item's opaque `payloadRef`.
 * Returns an empty descriptor for assets without a recognizable payload shape.
 */
export function readAssetPayload(item: AnimationAssetItem): AssetPayloadInfo {
  const payload = item.payloadRef as PayloadLike | undefined | null;
  if (!payload || typeof payload !== 'object') {
    return { extracted: null };
  }

  return {
    mimeType: typeof payload.mimeType === 'string' ? payload.mimeType : undefined,
    fileSizeBytes: typeof payload.fileSizeBytes === 'number' ? payload.fileSizeBytes : undefined,
    sourceUri: typeof payload.sourceUri === 'string' ? payload.sourceUri : undefined,
    extracted: payload.extracted,
  };
}

/**
 * Classifies the effective media type of an asset from its MIME type (preferred)
 * and, as a fallback, its metadata category. Deterministic.
 */
export function detectAssetMediaType(item: AnimationAssetItem): AssetMediaType {
  const { mimeType } = readAssetPayload(item);
  const candidate = typeof mimeType === 'string' ? mimeType.toLowerCase() : '';

  if (candidate.includes('image/svg+xml')) return 'svg';
  if (candidate.startsWith('image/')) return 'image';
  if (candidate.startsWith('audio/')) return 'audio';
  if (candidate.startsWith('video/')) return 'video';
  if (candidate.includes('font') || candidate === 'font/woff2' || candidate === 'font/ttf') {
    return 'font';
  }

  // Fallback: infer from category when MIME type is unavailable.
  const cat = item.metadata.category;
  if (cat === 'sound_effect') return 'audio';
  if (cat === 'vector_graphics') return 'svg';
  return 'unknown';
}

/**
 * Human-readable short kind label used by the UI (image/video/audio/vector/font).
 */
export function assetMediaTypeLabel(kind: AssetMediaType): string {
  switch (kind) {
    case 'image':
      return 'image';
    case 'svg':
      return 'vector';
    case 'video':
      return 'video';
    case 'audio':
      return 'audio';
    case 'font':
      return 'font';
    default:
      return 'unknown';
  }
}
