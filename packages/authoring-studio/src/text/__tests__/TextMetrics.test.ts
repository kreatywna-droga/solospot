import { describe, it, expect } from 'vitest';
import { TypographyEngine } from '../TypographyEngine';
import { createTextNode } from '../TextDomainModel';

describe('Typography Layout Metrics (S17 ETAP 2)', () => {
  it('computes line metrics, baseline, and alignment offsets for multi-line text', () => {
    const node = createTextNode('t1', 'First Line\nSecond Line', 0, 0, 300, 100, {
      fontSize: 20,
      lineHeight: 1.5,
      align: 'center',
    });

    const metrics = TypographyEngine.computeLayoutMetrics(node);

    expect(metrics.lineCount).toBe(2);
    expect(metrics.lines[0].text).toBe('First Line');
    expect(metrics.lines[1].text).toBe('Second Line');
    expect(metrics.lines[0].baselinePx).toBeGreaterThan(0);
    expect(metrics.lines[0].xOffset).toBeGreaterThan(0); // center aligned offset
  });
});
