/**
 * ViewportPreviewController.test.ts — Sprint S31 Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { createViewportPreviewState } from '../ViewportPreviewModel';
import {
  switchBreakpoint,
  setZoomLevel,
  zoomIn,
  zoomOut,
  resetZoom,
  fitToContainer,
  panBy,
} from '../ViewportPreviewController';

describe('ViewportPreviewController', () => {
  it('switches active breakpoint to mobile and updates viewport dimensions', () => {
    let state = createViewportPreviewState({ breakpointId: 'desktop' });
    expect(state.viewportWidthPx).toBe(1440);

    state = switchBreakpoint(state, 'mobile');
    expect(state.activeBreakpointId).toBe('mobile');
    expect(state.viewportWidthPx).toBe(375);
  });

  it('adjusts zoom level and pans position cleanly', () => {
    let state = createViewportPreviewState();
    expect(state.zoomLevel).toBe(1.0);

    state = zoomIn(state, 0.5);
    expect(state.zoomLevel).toBe(1.5);

    state = zoomOut(state, 0.2);
    expect(state.zoomLevel).toBe(1.3);

    state = panBy(state, 100, -50);
    expect(state.panPosition).toEqual({ x: 100, y: -50 });

    state = resetZoom(state);
    expect(state.zoomLevel).toBe(1.0);

    state = fitToContainer(state);
    expect(state.zoomLevel).toBe(1.0);
    expect(state.panPosition).toEqual({ x: 0, y: 0 });
  });
});
