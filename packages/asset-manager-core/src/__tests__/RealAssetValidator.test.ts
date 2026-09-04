import { describe, it, expect } from 'vitest';
import { AssetValidator } from '../../../../src/lib/assets/AssetValidator';

describe('Stage 4 — Strict File Validation Engine', () => {
  it('validates JPEG image with correct magic bytes (FF D8 FF)', () => {
    const buffer = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]);
    const res = AssetValidator.validate({
      name: 'banner.jpg',
      size: buffer.length,
      type: 'image/jpeg',
      buffer,
    });
    expect(res.valid).toBe(true);
    expect(res.type).toBe('image');
    expect(res.mimeType).toBe('image/jpeg');
    expect(res.sanitizedFilename).toBe('banner.jpg');
  });

  it('validates PNG image with 8-byte PNG signature', () => {
    const buffer = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00]);
    const res = AssetValidator.validate({
      name: 'logo.png',
      size: buffer.length,
      type: 'image/png',
      buffer,
    });
    expect(res.valid).toBe(true);
    expect(res.type).toBe('image');
    expect(res.mimeType).toBe('image/png');
  });

  it('validates GIF image with GIF87a/89a signature', () => {
    const buffer = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
    const res = AssetValidator.validate({
      name: 'animation.gif',
      size: buffer.length,
      type: 'image/gif',
      buffer,
    });
    expect(res.valid).toBe(true);
    expect(res.type).toBe('image');
    expect(res.mimeType).toBe('image/gif');
  });

  it('validates WebP image with RIFF....WEBP signature', () => {
    const buffer = new Uint8Array(16);
    buffer[0] = 0x52; buffer[1] = 0x49; buffer[2] = 0x46; buffer[3] = 0x46; // RIFF
    buffer[8] = 0x57; buffer[9] = 0x45; buffer[10] = 0x42; buffer[11] = 0x50; // WEBP
    const res = AssetValidator.validate({
      name: 'product.webp',
      size: buffer.length,
      type: 'image/webp',
      buffer,
    });
    expect(res.valid).toBe(true);
    expect(res.type).toBe('image');
    expect(res.mimeType).toBe('image/webp');
  });

  it('validates safe SVG markup', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100"/></svg>';
    const buffer = new TextEncoder().encode(svg);
    const res = AssetValidator.validate({
      name: 'graphic.svg',
      size: buffer.length,
      type: 'image/svg+xml',
      buffer,
    });
    expect(res.valid).toBe(true);
    expect(res.mimeType).toBe('image/svg+xml');
  });

  it('rejects malicious SVG containing embedded script tags or event handlers', () => {
    const attack1 = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert("xss")</script></svg>';
    const res1 = AssetValidator.validate({
      name: 'exploit.svg',
      size: attack1.length,
      type: 'image/svg+xml',
      buffer: new TextEncoder().encode(attack1),
    });
    expect(res1.valid).toBe(false);
    expect(res1.error).toContain('niedozwolone skrypty');

    const attack2 = '<svg xmlns="http://www.w3.org/2000/svg" onload="fetch(\'/steal\')"></svg>';
    const res2 = AssetValidator.validate({
      name: 'exploit2.svg',
      size: attack2.length,
      type: 'image/svg+xml',
      buffer: new TextEncoder().encode(attack2),
    });
    expect(res2.valid).toBe(false);
  });

  it('validates MP4 and WebM video formats', () => {
    // MP4 with ftyp box
    const mp4 = new Uint8Array([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70]);
    const resMp4 = AssetValidator.validate({
      name: 'promo.mp4',
      size: mp4.length,
      type: 'video/mp4',
      buffer: mp4,
    });
    expect(resMp4.valid).toBe(true);
    expect(resMp4.type).toBe('video');

    // WebM with EBML box
    const webm = new Uint8Array([0x1A, 0x45, 0xDF, 0xA3, 0x01]);
    const resWebm = AssetValidator.validate({
      name: 'promo.webm',
      size: webm.length,
      type: 'video/webm',
      buffer: webm,
    });
    expect(resWebm.valid).toBe(true);
    expect(resWebm.type).toBe('video');
  });

  it('enforces file size constraints', () => {
    const bigBuffer = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0]);
    const res = AssetValidator.validate({
      name: 'giant.jpg',
      size: 25 * 1024 * 1024, // 25 MB
      type: 'image/jpeg',
      buffer: bigBuffer,
    });
    expect(res.valid).toBe(false);
    expect(res.error).toContain('przekracza limit');
  });

  it('sanitizes filenames preventing directory traversal attacks', () => {
    const raw = '../../../../etc/cron.d/evil.jpg';
    const clean = AssetValidator.sanitizeFilename(raw);
    expect(clean).toBe('evil.jpg');
    expect(clean).not.toContain('..');
    expect(clean).not.toContain('/');
  });
});
