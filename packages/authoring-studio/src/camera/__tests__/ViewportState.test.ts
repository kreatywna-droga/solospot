import { describe, expect, it } from 'vitest';
import { createCamera } from '../CameraModel';
import { createMultiViewportLayout, createViewportConfiguration } from '../ViewportModel';

describe('ViewportState Domain Model', () => {
  it('should create default viewport configuration', () => {
    const vp = createViewportConfiguration({ id: 'vp_main', name: 'Main' });
    expect(vp.id).toBe('vp_main');
    expect(vp.type).toBe('primary');
    expect(vp.visible).toBe(true);
    expect(vp.active).toBe(true);
    expect(vp.camera).toBeDefined();
  });

  it('should support secondary and preview viewports referencing distinct cameras', () => {
    const camPrimary = createCamera({ id: 'cam_1', name: 'PrimaryCam' });
    const camPreview = createCamera({ id: 'cam_2', name: 'PreviewCam' });

    const vpPrimary = createViewportConfiguration({ id: 'vp1', type: 'primary', camera: camPrimary });
    const vpPreview = createViewportConfiguration({ id: 'vp2', type: 'preview', camera: camPreview });

    expect(vpPrimary.camera.id).toBe('cam_1');
    expect(vpPreview.camera.id).toBe('cam_2');
    expect(vpPreview.type).toBe('preview');
  });

  it('should build multi-viewport layout configurations', () => {
    const layout = createMultiViewportLayout({
      layoutMode: 'split-vertical',
      primaryViewportId: 'vp1',
    });

    expect(layout.layoutMode).toBe('split-vertical');
    expect(layout.primaryViewportId).toBe('vp1');
    expect(layout.viewports.length).toBeGreaterThan(0);
  });
});
