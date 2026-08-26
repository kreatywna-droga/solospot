import { describe, expect, it } from 'vitest';
import {
  createAlphaMask,
  createClippingMask,
  createShapeMask,
  createTextMask,
} from '../../masks/MaskModel';

describe('MaskModel DTOs', () => {
  it('should create an AlphaMask with correct default values', () => {
    const mask = createAlphaMask({ id: 'm1', sourceLayerId: 'layer_src' });
    expect(mask.id).toBe('m1');
    expect(mask.type).toBe('alpha');
    expect(mask.mode).toBe('alpha');
    expect(mask.enabled).toBe(true);
    expect(mask.opacity).toBe(1.0);
    expect(mask.sourceLayerId).toBe('layer_src');
  });

  it('should create a ClippingMask with specified parameters', () => {
    const mask = createClippingMask({
      id: 'm2',
      maskLayerId: 'layer_mask',
      clipPath: 'M 0 0 L 100 100 Z',
      opacity: 0.8,
    });
    expect(mask.id).toBe('m2');
    expect(mask.type).toBe('clipping');
    expect(mask.maskLayerId).toBe('layer_mask');
    expect(mask.clipPath).toBe('M 0 0 L 100 100 Z');
    expect(mask.opacity).toBe(0.8);
  });

  it('should create a ShapeMask for geometric clipping', () => {
    const mask = createShapeMask({
      id: 'm3',
      shapeType: 'ellipse',
      bounds: { x: 10, y: 10, width: 200, height: 200 },
    });
    expect(mask.id).toBe('m3');
    expect(mask.type).toBe('shape');
    expect(mask.shapeType).toBe('ellipse');
    expect(mask.bounds).toEqual({ x: 10, y: 10, width: 200, height: 200 });
  });

  it('should create a TextMask for typographic masking', () => {
    const mask = createTextMask({
      id: 'm4',
      text: 'HERO TITLE',
      font: '32px Roboto',
    });
    expect(mask.id).toBe('m4');
    expect(mask.type).toBe('text');
    expect(mask.text).toBe('HERO TITLE');
    expect(mask.font).toBe('32px Roboto');
  });
});
