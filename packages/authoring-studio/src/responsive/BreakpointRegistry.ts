/**
 * BreakpointRegistry.ts — Sprint S28 Breakpoint Registry & Viewport Resolution
 *
 * Manages standard multi-device breakpoint definitions (Desktop, Laptop, Tablet, Mobile),
 * custom breakpoint registration, and matching numeric viewport widths to target Breakpoints.
 *
 * NO DOM, NO React, NO requestAnimationFrame, NO Browser API, ZERO Runtime execution.
 */

import type { Breakpoint, BreakpointId } from './ResponsiveValueModel';

export const BUILTIN_BREAKPOINTS: ReadonlyArray<Breakpoint> = [
  { id: 'desktop', name: 'Desktop (Base)', minWidthPx: 1440, isDefault: true, icon: 'monitor' },
  { id: 'laptop', name: 'Laptop', minWidthPx: 1024, maxWidthPx: 1439, isDefault: false, icon: 'laptop' },
  { id: 'tablet', name: 'Tablet', minWidthPx: 768, maxWidthPx: 1023, isDefault: false, icon: 'tablet' },
  { id: 'mobile', name: 'Mobile', minWidthPx: 375, maxWidthPx: 767, isDefault: false, icon: 'smartphone' },
  { id: 'mobile_small', name: 'Mobile Small', minWidthPx: 320, maxWidthPx: 374, isDefault: false, icon: 'smartphone-small' },
];

export class BreakpointRegistry {
  private readonly breakpointsMap: Map<BreakpointId, Breakpoint>;

  constructor(initialBreakpoints: ReadonlyArray<Breakpoint> = BUILTIN_BREAKPOINTS) {
    this.breakpointsMap = new Map();
    for (const bp of initialBreakpoints) {
      this.breakpointsMap.set(bp.id, bp);
    }
  }

  /**
   * Retrieves a breakpoint definition by ID.
   */
  public getBreakpoint(id: BreakpointId): Breakpoint | undefined {
    return this.breakpointsMap.get(id);
  }

  /**
   * Returns all registered breakpoints ordered by minWidthPx descending (Desktop-first).
   */
  public getAllBreakpoints(): ReadonlyArray<Breakpoint> {
    return Array.from(this.breakpointsMap.values()).sort(
      (a, b) => b.minWidthPx - a.minWidthPx
    );
  }

  /**
   * Registers or updates a breakpoint.
   */
  public registerBreakpoint(breakpoint: Breakpoint): BreakpointRegistry {
    const nextMap = new Map(this.breakpointsMap);
    nextMap.set(breakpoint.id, breakpoint);
    return new BreakpointRegistry(Array.from(nextMap.values()));
  }

  /**
   * Unregisters a custom breakpoint (cannot remove default desktop breakpoint).
   */
  public unregisterBreakpoint(id: BreakpointId): BreakpointRegistry {
    if (id === 'desktop') {
      throw new Error('Cannot unregister default desktop base breakpoint.');
    }
    const nextMap = new Map(this.breakpointsMap);
    nextMap.delete(id);
    return new BreakpointRegistry(Array.from(nextMap.values()));
  }

  /**
   * Resolves the matching BreakpointId for a given numeric viewport width in pixels.
   */
  public resolveBreakpointForWidth(widthPx: number): BreakpointId {
    const sorted = this.getAllBreakpoints();
    for (const bp of sorted) {
      if (widthPx >= bp.minWidthPx) {
        if (bp.maxWidthPx === undefined || widthPx <= bp.maxWidthPx) {
          return bp.id;
        }
      }
    }

    // Default fallback to narrowest or mobile_small
    return sorted[sorted.length - 1]?.id ?? 'desktop';
  }
}
