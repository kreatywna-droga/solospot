import { describe, it, expect } from 'vitest';
import {
  EASING_PRESETS,
  validateBezierControlPoints,
  clampBezierControlPoints,
  createPresetEasingCurve,
  createCustomCubicBezierEasingCurve,
  formatEasingCurveToCSS,
  extractBezierControlPoints,
} from '../TimelineEasingEditor';

describe('TimelineEasingEditor (PM39, ETAP 1 & DECISION-058)', () => {
  it('provides cubic bezier control points for all standard presets', () => {
    expect(EASING_PRESETS.linear).toEqual({ x1: 0, y1: 0, x2: 1, y2: 1 });
    expect(EASING_PRESETS.ease).toEqual({ x1: 0.25, y1: 0.1, x2: 0.25, y2: 1.0 });
    expect(EASING_PRESETS.easeIn).toEqual({ x1: 0.42, y1: 0, x2: 1.0, y2: 1.0 });
    expect(EASING_PRESETS.easeOut).toEqual({ x1: 0, y1: 0, x2: 0.58, y2: 1.0 });
    expect(EASING_PRESETS.easeInOut).toEqual({ x1: 0.42, y1: 0, x2: 0.58, y2: 1.0 });
  });

  it('validates and clamps bezier control points (x1, x2 in [0, 1])', () => {
    expect(validateBezierControlPoints({ x1: 0.5, y1: -0.2, x2: 0.8, y2: 1.5 })).toBe(true);
    expect(validateBezierControlPoints({ x1: -0.1, y1: 0, x2: 1.2, y2: 1 })).toBe(false);

    const clamped = clampBezierControlPoints({ x1: -0.5, y1: -0.2, x2: 1.5, y2: 1.5 });
    expect(clamped.x1).toBe(0);
    expect(clamped.x2).toBe(1);
    expect(clamped.y1).toBe(-0.2); // y values allowed outside [0, 1] for overshoot
  });

  it('creates preset EasingCurve DTOs and formats to CSS string', () => {
    const easeIn = createPresetEasingCurve('easeIn');
    expect(easeIn.type).toBe('ease-in');
    expect(formatEasingCurveToCSS(easeIn)).toBe('ease-in');

    const custom = createCustomCubicBezierEasingCurve({ x1: 0.2, y1: 0.5, x2: 0.8, y2: 1.2 });
    expect(custom.type).toBe('cubic-bezier');
    expect(formatEasingCurveToCSS(custom)).toBe('cubic-bezier(0.2, 0.5, 0.8, 1.2)');
  });

  it('extracts control points from EasingCurve DTOs', () => {
    const points = extractBezierControlPoints({ type: 'ease-out' });
    expect(points).toEqual(EASING_PRESETS.easeOut);

    const customPoints = extractBezierControlPoints({
      type: 'cubic-bezier',
      controlPoints: [0.1, 0.2, 0.3, 0.4],
    });
    expect(customPoints).toEqual({ x1: 0.1, y1: 0.2, x2: 0.3, y2: 0.4 });
  });
});
