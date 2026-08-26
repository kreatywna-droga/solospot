import { describe, expect, it } from 'vitest';
import { createCamera } from '../CameraModel';
import { createMultiViewportLayout, createViewportConfiguration } from '../ViewportModel';

describe('MultiViewport Layout & Configuration Engine', () => {
  it('should create default single viewport layout', () => {
    const layout = createMultiViewportLayout();
    expect(layout.layoutMode).toBe('single');
    expect(layout.viewports.length).toBe(1);
    expect(layout.primaryViewportId).toBe('primary_vp');
  });

  it('should support multi-viewport split layout configuration', () => {
    const mainCamera = createCamera({ id: 'cam_main' });
    const sideCamera = createCamera({ id: 'cam_side', transform: { zoom: 2.0 } });

    const vp1 = createViewportConfiguration({ id: 'vp_main', type: 'primary', camera: mainCamera });
    const vp2 = createViewportConfiguration({ id: 'vp_side', type: 'secondary', camera: sideCamera });

    const layout = createMultiViewportLayout({
      layoutMode: 'split-vertical',
      viewports: [vp1, vp2],
      primaryViewportId: 'vp_main',
    });

    expect(layout.layoutMode).toBe('split-vertical');
    expect(layout.viewports.length).toBe(2);
    expect(layout.viewports[0].camera.transform.zoom).toBe(1.0);
    expect(layout.viewports[1].camera.transform.zoom).toBe(2.0);
  });
});
