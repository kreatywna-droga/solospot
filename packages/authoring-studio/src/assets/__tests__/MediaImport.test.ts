import { describe, it, expect } from 'vitest';
import { MediaImportEngine } from '../MediaImportEngine';

describe('MediaImportEngine (S15 ETAP 1)', () => {
  it('detects media kind correctly from filename and mime type', () => {
    expect(MediaImportEngine.detectMediaKind('hero.png', 'image/png')).toBe('image');
    expect(MediaImportEngine.detectMediaKind('logo.svg', 'image/svg+xml')).toBe('svg');
    expect(MediaImportEngine.detectMediaKind('track.mp3', 'audio/mpeg')).toBe('audio');
    expect(MediaImportEngine.detectMediaKind('clip.mp4', 'video/mp4')).toBe('video');
    expect(MediaImportEngine.detectMediaKind('font.woff2', 'font/woff2')).toBe('font');
  });

  it('imports single raw file and assigns stable Asset ID', () => {
    const imported = MediaImportEngine.importFile({
      fileName: 'banner.webp',
      mimeType: 'image/webp',
      fileSizeBytes: 20480,
      sourceUri: 'https://example.com/banner.webp',
    });

    expect(imported.assetId).toContain('asset_image_banner_webp');
    expect(imported.mediaKind).toBe('image');
    expect(imported.fileSizeBytes).toBe(20480);
    expect(imported.sourceUri).toBe('https://example.com/banner.webp');
  });
});
