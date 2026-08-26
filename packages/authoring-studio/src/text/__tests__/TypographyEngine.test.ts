import { describe, it, expect } from 'vitest';
import { TypographyEngine } from '../TypographyEngine';
import { createTextNode } from '../TextDomainModel';

describe('TypographyEngine Word Wrap & Line Breaking (S17 ETAP 2)', () => {
  it('wraps text into multiple lines when exceeding container width', () => {
    const longText = 'The quick brown fox jumps over the lazy dog';
    const lines = TypographyEngine.computeWordWrap(longText, 20, 0, 150);

    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join(' ')).toBe(longText);
  });

  it('calculates auto-fit bounding box dimensions', () => {
    const node = createTextNode('t1', 'Heading Sample', 0, 0, 200, 50, { fontSize: 32 });
    const autoBounds = TypographyEngine.computeAutoFitBounds(node);

    expect(autoBounds.width).toBeGreaterThan(50);
    expect(autoBounds.height).toBeGreaterThan(30);
  });
});
