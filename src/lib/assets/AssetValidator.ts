import type { AssetCategory, AssetValidationResult } from './AssetTypes';

const MAX_IMAGE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB
const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export interface FileToValidate {
  name: string;
  size: number;
  type: string;
  buffer: Uint8Array;
}

export class AssetValidator {
  static sanitizeFilename(rawName: string): string {
    const base = rawName
      .replace(/\\/g, '/')
      .split('/')
      .pop() || 'unnamed';
    // Remove null bytes and control chars
    const cleaned = base.replace(/[\x00-\x1f\x80-\x9f]/g, '');
    // Strip dangerous special chars, keep alphanumeric, dots, dashes, underscores
    const safe = cleaned.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    return safe || `asset_${Date.now()}`;
  }

  static validate(file: FileToValidate): AssetValidationResult {
    const sanitizedFilename = this.sanitizeFilename(file.name);
    const extension = (sanitizedFilename.split('.').pop() || '').toLowerCase();
    const declaredMime = (file.type || '').toLowerCase();
    const size = file.size;

    if (size <= 0) {
      return { valid: false, error: 'Plik jest pusty (0 bajtów).' };
    }

    // Sniff magic bytes
    const bytes = file.buffer.slice(0, 32);

    // 1. JPEG: FF D8 FF
    if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
      if (size > MAX_IMAGE_SIZE_BYTES) {
        return { valid: false, error: `Rozmiar obrazu JPEG przekracza limit ${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)}MB.` };
      }
      return {
        valid: true,
        type: 'image',
        mimeType: 'image/jpeg',
        sanitizedFilename,
      };
    }

    // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4E &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0D &&
      bytes[5] === 0x0A &&
      bytes[6] === 0x1A &&
      bytes[7] === 0x0A
    ) {
      if (size > MAX_IMAGE_SIZE_BYTES) {
        return { valid: false, error: `Rozmiar obrazu PNG przekracza limit ${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)}MB.` };
      }
      return {
        valid: true,
        type: 'image',
        mimeType: 'image/png',
        sanitizedFilename,
      };
    }

    // 3. GIF: 47 49 46 38 (GIF87a / GIF89a)
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
      if (size > MAX_IMAGE_SIZE_BYTES) {
        return { valid: false, error: `Rozmiar pliku GIF przekracza limit ${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)}MB.` };
      }
      return {
        valid: true,
        type: 'image',
        mimeType: 'image/gif',
        sanitizedFilename,
      };
    }

    // 4. WebP: 52 49 46 46 (RIFF) + 57 45 42 50 (WEBP at bytes 8-11)
    if (
      bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
    ) {
      if (size > MAX_IMAGE_SIZE_BYTES) {
        return { valid: false, error: `Rozmiar obrazu WebP przekracza limit ${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)}MB.` };
      }
      return {
        valid: true,
        type: 'image',
        mimeType: 'image/webp',
        sanitizedFilename,
      };
    }

    // 5. SVG: textual XML with <svg> tag and sanitization
    if (declaredMime.includes('svg') || extension === 'svg') {
      if (size > MAX_IMAGE_SIZE_BYTES) {
        return { valid: false, error: `Rozmiar pliku SVG przekracza limit ${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)}MB.` };
      }
      const text = new TextDecoder('utf-8', { fatal: false }).decode(file.buffer);
      const lower = text.toLowerCase();
      if (!lower.includes('<svg') && !lower.includes('<?xml')) {
        return { valid: false, error: 'Nieprawidłowa zawartość pliku SVG.' };
      }
      // Security check: reject SVGs with embedded executable scripts
      if (
        lower.includes('<script') ||
        lower.includes('onload=') ||
        lower.includes('onerror=') ||
        lower.includes('javascript:')
      ) {
        return { valid: false, error: 'Plik SVG zawiera niedozwolone skrypty (Security Policy).' };
      }
      return {
        valid: true,
        type: 'image',
        mimeType: 'image/svg+xml',
        sanitizedFilename,
      };
    }

    // 6. MP4 video: 'ftyp' at bytes 4-7
    if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
      if (size > MAX_VIDEO_SIZE_BYTES) {
        return { valid: false, error: `Rozmiar wideo MP4 przekracza limit ${MAX_VIDEO_SIZE_BYTES / (1024 * 1024)}MB.` };
      }
      return {
        valid: true,
        type: 'video',
        mimeType: 'video/mp4',
        sanitizedFilename,
      };
    }

    // 7. WebM video: 1A 45 DF A3 (EBML header)
    if (bytes[0] === 0x1A && bytes[1] === 0x45 && bytes[2] === 0xDF && bytes[3] === 0xA3) {
      if (size > MAX_VIDEO_SIZE_BYTES) {
        return { valid: false, error: `Rozmiar wideo WebM przekracza limit ${MAX_VIDEO_SIZE_BYTES / (1024 * 1024)}MB.` };
      }
      return {
        valid: true,
        type: 'video',
        mimeType: 'video/webm',
        sanitizedFilename,
      };
    }

    return {
      valid: false,
      error: `Nieobsługiwany format pliku (${declaredMime || extension || 'nieznany'}). Dozwolone: JPG, PNG, WebP, SVG, GIF, MP4, WebM.`,
    };
  }
}
