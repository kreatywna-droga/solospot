import { describe, it, expect } from 'vitest';
import { TextEditingEngine } from '../TextEditingEngine';

describe('TextEditingEngine Operations (S17 ETAP 3)', () => {
  it('creates, edits content, and updates typography styles', () => {
    const node = TextEditingEngine.createText('t1', 'Initial', 10, 20);

    const edited = TextEditingEngine.updateContent(node, 'Updated Title Content');
    expect(edited.content).toBe('Updated Title Content');

    const styled = TextEditingEngine.updateStyle(edited, { fontSize: 36, fill: '#ff0000', align: 'center' });
    expect(styled.style.fontSize).toBe(36);
    expect(styled.style.fill).toBe('#ff0000');
    expect(styled.style.align).toBe('center');
  });

  it('duplicates text node with offset', () => {
    const node = TextEditingEngine.createText('t1', 'Title', 100, 100);
    const dup = TextEditingEngine.duplicateText(node, 30, 30);

    expect(dup.id).not.toBe(node.id);
    expect(dup.bounds.x).toBe(130);
    expect(dup.bounds.y).toBe(130);
  });
});
