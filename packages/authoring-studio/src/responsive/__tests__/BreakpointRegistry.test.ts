/**
 * BreakpointRegistry.test.ts — Sprint S28
 *
 * Unit tests for BreakpointRegistry builtin definitions, custom registrations,
 * unregistering breakpoints, and matching numeric viewport widths.
 */

import { describe, it, expect } from 'vitest';
import { BreakpointRegistry, BUILTIN_BREAKPOINTS } from '../BreakpointRegistry';

describe('BreakpointRegistry', () => {
  it('contains standard builtin breakpoints', () => {
    const registry = new BreakpointRegistry();
    const all = registry.getAllBreakpoints();

    expect(all.length).toBeGreaterThanOrEqual(5);
    expect(registry.getBreakpoint('desktop')).toBeDefined();
    expect(registry.getBreakpoint('tablet')).toBeDefined();
    expect(registry.getBreakpoint('mobile')).toBeDefined();
  });

  it('resolves correct BreakpointId for numeric viewport widths', () => {
    const registry = new BreakpointRegistry();

    expect(registry.resolveBreakpointForWidth(1920)).toBe('desktop');
    expect(registry.resolveBreakpointForWidth(1200)).toBe('laptop');
    expect(registry.resolveBreakpointForWidth(800)).toBe('tablet');
    expect(registry.resolveBreakpointForWidth(400)).toBe('mobile');
    expect(registry.resolveBreakpointForWidth(350)).toBe('mobile_small');
  });

  it('allows registering custom breakpoints', () => {
    const registry = new BreakpointRegistry();
    const updated = registry.registerBreakpoint({
      id: 'ultrawide',
      name: 'Ultrawide 4K',
      minWidthPx: 2560,
      isDefault: false,
    });

    expect(updated.getBreakpoint('ultrawide')).toBeDefined();
    expect(updated.resolveBreakpointForWidth(3840)).toBe('ultrawide');
  });

  it('prevents unregistering default desktop base breakpoint', () => {
    const registry = new BreakpointRegistry();
    expect(() => registry.unregisterBreakpoint('desktop')).toThrow(
      'Cannot unregister default desktop base breakpoint'
    );
  });
});
