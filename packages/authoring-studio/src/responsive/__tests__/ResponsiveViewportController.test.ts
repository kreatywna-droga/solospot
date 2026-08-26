/**
 * ResponsiveViewportController.test.ts — Sprint S28
 *
 * Unit tests for ResponsiveViewportController state creation, active breakpoint switching,
 * S21 Viewport configuration generation, and container bounds updates.
 */

import { describe, it, expect } from 'vitest';
import {
  createResponsiveViewportState,
  switchActiveBreakpoint,
  updateContainerBounds,
} from '../ResponsiveViewportController';

describe('ResponsiveViewportController', () => {
  it('creates initial responsive viewport state for desktop', () => {
    const state = createResponsiveViewportState('desktop', 1600, 1000);

    expect(state.activeBreakpointId).toBe('desktop');
    expect(state.viewportWidthPx).toBe(1440);
    expect(state.s21ViewportConfig.id).toContain('vp_responsive_desktop');
    expect(state.scaleFactor).toBe(1.0);
  });

  it('switches active breakpoint to mobile and updates S21 viewport configuration', () => {
    const desktopState = createResponsiveViewportState('desktop', 1600, 1000);
    const mobileState = switchActiveBreakpoint(desktopState, 'mobile');

    expect(mobileState.activeBreakpointId).toBe('mobile');
    expect(mobileState.viewportWidthPx).toBe(375);
    expect(mobileState.s21ViewportConfig.id).toContain('vp_responsive_mobile');
    expect(mobileState.s21ViewportConfig.camera.viewport.width).toBe(375);
  });

  it('recalculates scale factor when canvas container bounds update', () => {
    // Mobile viewport is 375x812. In a 300px wide container, scale factor should scale down.
    const state = createResponsiveViewportState('mobile', 300, 600);
    expect(state.scaleFactor).toBeLessThan(1.0);

    const resized = updateContainerBounds(state, 1000, 1000);
    expect(resized.scaleFactor).toBe(1.0);
  });
});
