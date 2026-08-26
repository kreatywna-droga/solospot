import { describe, it, expect } from 'vitest';
import { createTextNode, DEFAULT_TEXT_STYLE } from '../TextDomainModel';

describe('TextDomainModel (S17 ETAP 1)', () => {
  it('creates default TextNode DTO with proper bounds and style', () => {
    const node = createTextNode('t1', 'Hello World', 50, 100, 200, 80);

    expect(node.id).toBe('t1');
    expect(node.type).toBe('text');
    expect(node.content).toBe('Hello World');
    expect(node.bounds.x).toBe(50);
    expect(node.bounds.y).toBe(100);
    expect(node.style.fontFamily).toBe(DEFAULT_TEXT_STYLE.fontFamily);
    expect(node.style.fontSize).toBe(DEFAULT_TEXT_STYLE.fontSize);
  });
});
