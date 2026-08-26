import { describe, expect, it } from 'vitest';
import { createCamera } from '../../camera/CameraModel';
import { InteractionCoordinateMapper } from '../InteractionCoordinateMapper';

describe('InteractionCoordinateMapper Engine', () => {
  it('should convert pointer screen coordinates to world coordinates through camera', () => {
    const camera = createCamera({ id: 'cam1', viewport: { width: 1000, height: 1000, devicePixelRatio: 1 } });
    const worldPt = InteractionCoordinateMapper.screenToWorld({ x: 500, y: 500 }, camera);

    expect(worldPt.x).toBe(0);
    expect(worldPt.y).toBe(0);
  });

  it('should map world point to layer local space coordinates', () => {
    const layerNode: any = {
      id: 'l1',
      transform: { position: { x: 200, y: 300 } },
    };

    const localPt = InteractionCoordinateMapper.worldToLayerLocal({ x: 250, y: 380 }, layerNode);
    expect(localPt.x).toBe(50);
    expect(localPt.y).toBe(80);
  });
});
