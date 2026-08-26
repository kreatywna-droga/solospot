import { describe, it, expect } from 'vitest';
import { TextAnimationEngine } from '../TextAnimationEngine';
import { createTextNode } from '../TextDomainModel';

describe('TextAnimationEngine (S17 ETAP 4)', () => {
  it('interpolates text property keyframes and applies animated properties to TextNode', () => {
    const node = createTextNode('t1', 'Animated Text', 0, 0, 200, 50, { fontSize: 20 });

    const fontVal = TextAnimationEngine.interpolateTextProperty(20, 40, 0.5);
    expect(fontVal).toBe(30);

    const animatedNode = TextAnimationEngine.applyAnimatedProperties(node, {
      fontSize: fontVal,
      opacity: 0.8,
      x: 150,
    });

    expect(animatedNode.style.fontSize).toBe(30);
    expect(animatedNode.style.opacity).toBe(0.8);
    expect(animatedNode.bounds.x).toBe(150);
  });
});
