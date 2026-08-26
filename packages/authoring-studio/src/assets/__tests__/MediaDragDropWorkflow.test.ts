import { describe, it, expect } from 'vitest';
import { createAssetRegistryState, type AnimationAssetItem } from '../AnimationAssetRegistry';
import {
  resolveMediaTargetForAsset,
  createCanvasDropIntent,
  createMediaTimelineDropIntent,
  replaceExistingPlacement,
  resolveAssetDropIntent,
  type CanvasDropIntent,
  type MediaTimelineDropIntent,
} from '../MediaDragDropWorkflow';

function makeAsset(assetId: string, name: string, mimeType: string): AnimationAssetItem {
  return {
    metadata: {
      assetId, name, description: '', category: 'custom', tags: [],
      preview: { thumbnailUri: `thumb_${assetId}.png` },
      version: '1.0.0', author: 'user', createdAt: 1000, updatedAt: 1000,
    },
    payloadRef: { mimeType, fileSizeBytes: 1024, extracted: { widthPx: 1920, heightPx: 1080, durationMs: 5000 } },
  };
}

describe('MediaDragDropWorkflow (S25)', () => {
  it('resolves media target per asset kind', () => {
    expect(resolveMediaTargetForAsset(makeAsset('i', 'a.png', 'image/png'))).toBe('canvas');
    expect(resolveMediaTargetForAsset(makeAsset('v', 'a.mp4', 'video/mp4'))).toBe('video');
    expect(resolveMediaTargetForAsset(makeAsset('a', 'a.mp3', 'audio/mpeg'))).toBe('audio');
            expect(resolveMediaTargetForAsset(makeAsset('s', 'a.svg', 'image/svg+xml'))).toBe('canvas');
    expect(resolveMediaTargetForAsset(makeAsset('f', 'a.ttf', 'font/ttf'))).toBe('canvas');
    expect(resolveMediaTargetForAsset(makeAsset('f', 'a.ttf', 'font/ttf'))).toBe('canvas');
  });

  it('builds a canvas drop intent with assetId-only reference (no payload)', () => {
    const intent = createCanvasDropIntent('asset_img_1', 'image', 50, 60, 320, 240, 'cover');
    expect(intent.target).toBe('canvas');
    expect(intent.placement.assetId).toBe('asset_img_1');
    expect(intent.placement.x).toBe(50);
    expect(intent.placement.width).toBe(320);
    expect(intent.placement.fitMode).toBe('cover');
    expect(intent.referenceLink.assetId).toBe('asset_img_1');
    expect(intent.referenceLink.targetType).toBe('BuilderDocumentNode');
    // payloadRef must NOT be duplicated onto the placement node
    expect((intent.placement as unknown as { payloadRef?: unknown }).payloadRef).toBeUndefined();
  });

  it('builds an audio media timeline drop intent bound to assetId', () => {
    const item = makeAsset('asset_aud', 'SFX.mp3', 'audio/mpeg');
    const intent = createMediaTimelineDropIntent(item, 'audio', 1000, 'SFX.mp3', 'track_1');
    expect(intent.target).toBe('mediaTimeline');
    expect(intent.mediaType).toBe('audio');
    expect(intent.trackId).toBe('track_1');
    expect(intent.clip.assetId).toBe('asset_aud');
    expect(intent.clip.startTimeMs).toBe(1000);
    expect(intent.referenceLink.targetType).toBe('AnimationTimeline');
    expect(intent.referenceLink.assetId).toBe('asset_aud');
    expect(intent.referenceLink.targetId).toBe(intent.clip.clipId);
  });

  it('builds a video media timeline drop intent with video settings', () => {
    const item = makeAsset('asset_vid', 'Clip.mp4', 'video/mp4');
    const intent = createMediaTimelineDropIntent(item, 'video', 2000, 'Clip.mp4', 'track_a');
    expect(intent.mediaType).toBe('video');
    expect(intent.clip.assetId).toBe('asset_vid');
    // video clip carries video settings; audio clip does not
    expect('videoSettings' in intent.clip).toBe(true);
  });

  it('replaces existing placement reference while preserving transform', () => {
    const placement = createCanvasDropIntent('old_asset', 'image', 10, 20, 100, 100, 'contain').placement;
    const next = replaceExistingPlacement(placement, 'new_asset');
    expect(next.assetId).toBe('new_asset');
    expect(next.x).toBe(10);
    expect(next.y).toBe(20);
    expect(next.width).toBe(100);
    expect(next.fitMode).toBe('contain');
  });

  it('resolveAssetDropIntent routes image to canvas and audio/video to timeline', () => {
    const registry = createAssetRegistryState([
      makeAsset('i', 'a.png', 'image/png'),
      makeAsset('a', 'a.mp3', 'audio/mpeg'),
      makeAsset('v', 'a.mp4', 'video/mp4'),
    ]);

    const canvas = resolveAssetDropIntent(registry, 'i', 'canvas', {}) as CanvasDropIntent;
    expect(canvas.target).toBe('canvas');
    expect(canvas.placement.assetId).toBe('i');

    const timeline = resolveAssetDropIntent(registry, 'a', 'mediaTimeline', { startTimeMs: 500 }) as MediaTimelineDropIntent;
    expect(timeline.target).toBe('mediaTimeline');
    expect((timeline.clip as { mediaType: string }).mediaType).toBe('audio');

    const videoTimeline = resolveAssetDropIntent(registry, 'v', 'mediaTimeline', { startTimeMs: 0 }) as MediaTimelineDropIntent;
    expect((videoTimeline.clip as { mediaType: string }).mediaType).toBe('video');

    // image cannot be dropped on the media timeline
    expect(resolveAssetDropIntent(registry, 'i', 'mediaTimeline', {})).toBeNull();
    // missing asset returns null
    expect(resolveAssetDropIntent(registry, 'missing', 'canvas', {})).toBeNull();
  });
});
