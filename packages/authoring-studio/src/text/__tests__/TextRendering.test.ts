import { describe, it, expect } from 'vitest';
import { TextRenderingBridge } from '../../rendering/TextRenderingBridge';
import { createTextNode } from '../TextDomainModel';

describe('TextRenderingBridge (S17 ETAP 5)', () => {
  it('builds text render instruction with typography layout metrics for CanvasRenderer', () => {
    const node = createTextNode('t1', 'Rendered Text', 10, 20, 200, 60, {
      fontSize: 24,
      fill: '#123456',
      align: 'left',
    });

    const instruction = TextRenderingBridge.buildRenderInstruction(node);

    expect(instruction.nodeId).toBe('t1');
    expect(instruction.content).toBe('Rendered Text');
    expect(instruction.style.fill).toBe('#123456');
    expect(instruction.layoutMetrics.lines.length).toBeGreaterThan(0);
  });
});
