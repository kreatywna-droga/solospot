import { describe, it, expect } from 'vitest';
import { TextEditingEngine } from '../TextEditingEngine';

describe('Text History Command Integration (S17 ETAP 3)', () => {
  it('records text style mutations as clean DTO snapshots for HistoryStack', () => {
    const initial = TextEditingEngine.createText('t1', 'Undo Test', 0, 0);
    const step1 = TextEditingEngine.updateStyle(initial, { fontSize: 32 });
    const step2 = TextEditingEngine.updateStyle(step1, { fill: '#00ff00' });

    expect(initial.style.fontSize).toBe(24);
    expect(step1.style.fontSize).toBe(32);
    expect(step2.style.fill).toBe('#00ff00');
  });
});
