import { describe, it, expect } from 'vitest';
import { composePreview, composePreviewBundle, generateAudioWaveform, generateVideoThumbnails, assetPreviewSeed, formatAssetFileSize, formatAssetDuration } from '../AssetPreviewDescriptors';
import type { AnimationAssetItem } from '../AnimationAssetRegistry';

function makeAsset(assetId: string, name: string, payload: object): AnimationAssetItem {
  return {
    metadata: {
      assetId, name, description: '', category: 'custom', tags: [],
      preview: { thumbnailUri: `thumb_${assetId}.png` },
      version: '1.0.0', author: 'user', createdAt: 1000, updatedAt: 1000,
    },
    payloadRef: payload,
  };
}

describe('AssetPreviewDescriptors (S25)', () => {
  it('composes an image preview with dimensions + aspect ratio', () => {
    const item = makeAsset('img_1', 'Hero.png', {
      mimeType: 'image/png', fileSizeBytes: 2048, sourceUri: 'hero.png',
      extracted: { widthPx: 1920, heightPx: 1080 },
    });
    const p = composePreview(item);
    expect(p.kind).toBe('image');
    expect(p.metrics.widthPx).toBe(1920);
    expect(p.metrics.heightPx).toBe(1080);
    expect(p.aspectRatio).toBe('1920:1080');
    expect(p.fileInfo.mimeType).toBe('image/png');
    expect(p.fileInfo.fileSizeBytes).toBe(2048);
    expect(p.thumbnailUri).toBe('thumb_img_1.png');
  });

  it('composes a video preview with duration + dimensions', () => {
    const item = makeAsset('vid_1', 'Clip.mp4', {
      mimeType: 'video/mp4', fileSizeBytes: 5_000_000,
      extracted: { widthPx: 1280, heightPx: 720, durationMs: 10000, fps: 30 },
    });
    const p = composePreview(item);
    expect(p.kind).toBe('video');
    expect(p.metrics.durationMs).toBe(10000);
    expect(p.metrics.fps).toBe(30);
    expect(p.metrics.widthPx).toBe(1280);
  });

  it('composes an audio preview with duration', () => {
    const item = makeAsset('aud_1', 'SFX.mp3', {
      mimeType: 'audio/mpeg', fileSizeBytes: 256000,
      extracted: { durationMs: 4500, sampleRate: 44100 },
    });
    const p = composePreview(item);
    expect(p.kind).toBe('audio');
    expect(p.metrics.durationMs).toBe(4500);
    expect(p.metrics.sampleRate).toBe(44100);
  });

  it('composes a vector (svg) preview with viewBox', () => {
    const item = makeAsset('vec_1', 'Logo.svg', {
      mimeType: 'image/svg+xml', fileSizeBytes: 1200,
      extracted: { viewBox: '0 0 400 400', widthPx: 400, heightPx: 400 },
    });
    const p = composePreview(item);
    expect(p.kind).toBe('svg');
    expect(p.metrics.viewBox).toBe('0 0 400 400');
  });

  it('composes a font preview with fontFamily', () => {
    const item = makeAsset('fnt_1', 'Hero.ttf', {
      mimeType: 'font/ttf', fileSizeBytes: 80000,
      extracted: { fontFamily: 'HeroSans' },
    });
    const p = composePreview(item);
    expect(p.kind).toBe('font');
    expect(p.metrics.fontFamily).toBe('HeroSans');
  });

  it('generates a deterministic audio waveform from assetId seed', () => {
    const item = makeAsset('aud_1', 'SFX.mp3', { mimeType: 'audio/mpeg', extracted: { durationMs: 5000 } });
    const a = generateAudioWaveform(item);
    const b = generateAudioWaveform(item);
    expect(a).toEqual(b); // deterministic
    expect(a.bars.length).toBe(50);
    expect(a.durationMs).toBe(5000);
    // waveform amplitudes normalized to [0,1]
    expect(a.bars.every((v) => v >= 0 && v <= 1)).toBe(true);
  });

  it('derive seed is stable per assetId', () => {
    expect(assetPreviewSeed('aud_1')).toBe(assetPreviewSeed('aud_1'));
    expect(assetPreviewSeed('aud_1')).not.toBe(assetPreviewSeed('aud_2'));
  });

  it('generates video thumbnail keyframe times', () => {
    const item = makeAsset('vid_1', 'Clip.mp4', { mimeType: 'video/mp4', extracted: { durationMs: 10000 } });
    const thumbs = generateVideoThumbnails(item, 5);
    expect(thumbs.thumbnailFrameTimesMs.length).toBe(5);
    expect(thumbs.durationMs).toBe(10000);
    expect(thumbs.widthPx).toBe(1920); // headless default
  });

  it('composePreviewBundle attaches waveform for audio and thumbnails for video', () => {
    const audio = makeAsset('aud_1', 'SFX.mp3', { mimeType: 'audio/mpeg', extracted: { durationMs: 5000 } });
    const video = makeAsset('vid_1', 'Clip.mp4', { mimeType: 'video/mp4', extracted: { durationMs: 10000 } });
    const image = makeAsset('img_1', 'Hero.png', { mimeType: 'image/png', extracted: { widthPx: 1920, heightPx: 1080 } });

    expect(composePreviewBundle(audio).waveform).toBeDefined();
    expect(composePreviewBundle(audio).videoThumbnails).toBeUndefined();
    expect(composePreviewBundle(video).videoThumbnails).toBeDefined();
    expect(composePreviewBundle(image).waveform).toBeUndefined();
    expect(composePreviewBundle(image).videoThumbnails).toBeUndefined();
  });

  it('formats file sizes and durations', () => {
    expect(formatAssetFileSize(512)).toBe('512 B');
    expect(formatAssetFileSize(2048)).toBe('2.0 KB');
    expect(formatAssetFileSize(5_000_000)).toBe('4.77 MB');
        expect(formatAssetDuration(5000)).toBe('00:05');
    expect(formatAssetDuration(65000)).toBe('01:05');
    expect(formatAssetDuration(undefined)).toBe('—');
  });
});
