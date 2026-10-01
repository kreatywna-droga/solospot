import { describe, it, expect } from 'vitest';
import { primaryFamily, fontStack, getGoogleFontUrl } from '../FontCatalog';

describe('FontCatalog — font stack / FOUT guard', () => {
  it('primaryFamily extracts the bare family and is idempotent', () => {
    expect(primaryFamily('Playfair Display')).toBe('Playfair Display');
    expect(primaryFamily('"Playfair Display", serif')).toBe('Playfair Display');
    expect(primaryFamily("'Lora', serif")).toBe('Lora');
    expect(primaryFamily(undefined)).toBe('');
  });

  it('fontStack appends the catalog generic fallback so the interim glyphs match', () => {
    // Serif font → serif fallback (Playfair Display is a serif in the catalog).
    expect(fontStack('Playfair Display')).toBe('"Playfair Display", serif');
    // Sans font → sans-serif fallback.
    expect(fontStack('Inter')).toBe('Inter, sans-serif');
    // Monospace catalog font keeps a monospace fallback.
    expect(fontStack('Space Mono')).toBe('"Space Mono", monospace');
    // Unknown font falls back to sans-serif rather than the UA default.
    expect(fontStack('Totally Unknown Face')).toBe('"Totally Unknown Face", sans-serif');
    // Already-stacked input does not double up (single-word family needs no quotes).
    expect(fontStack('"Lora", serif')).toBe('Lora, serif');
    expect(fontStack('')).toBeUndefined();
  });

  it('getGoogleFontUrl accepts a stacked value and requests the right family + weights', () => {
    const url = getGoogleFontUrl('"Playfair Display", serif');
    expect(url).toContain('family=Playfair%20Display');
    expect(url).toContain('display=swap');
    // Playfair Display has multiple weights in the catalog (not the 400;700 fallback).
    expect(url).toContain('400;500;600;700;800;900');
  });
});
