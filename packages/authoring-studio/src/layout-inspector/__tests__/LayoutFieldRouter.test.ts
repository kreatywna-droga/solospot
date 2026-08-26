/**
 * LayoutFieldRouter.test.ts — Sprint S30 Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { routeFieldChange } from '../LayoutFieldRouter';

describe('LayoutFieldRouter', () => {
  it('routes layout style fields to style kind', () => {
    const rGap = routeFieldChange('layout.gap');
    expect(rGap).toBeDefined();
    expect(rGap?.kind).toBe('style');
    expect(rGap?.key).toBe('gap');
    expect(rGap?.responsive?.breakpointKey).toBe('gap');
  });

  it('routes constraint fields to constraint kind', () => {
    const rLeft = routeFieldChange('layout.left');
    expect(rLeft).toBeDefined();
    expect(rLeft?.kind).toBe('constraint');
    expect(rLeft?.key).toBe('left');
    expect(rLeft?.responsive?.breakpointKey).toBe('x');
  });

  it('routes sizing fields to sizing kind', () => {
    const rSizingW = routeFieldChange('layout.sizingWidth');
    expect(rSizingW).toBeDefined();
    expect(rSizingW?.kind).toBe('sizing');
    expect(rSizingW?.key).toBe('width');
  });

  it('returns undefined for unknown fieldId', () => {
    expect(routeFieldChange('unknown.field')).toBeUndefined();
  });
});
