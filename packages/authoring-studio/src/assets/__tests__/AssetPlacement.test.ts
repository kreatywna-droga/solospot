import { describe, it, expect } from 'vitest';
import { CanvasAssetPlacementEngine } from '../CanvasAssetPlacementEngine';

describe('CanvasAssetPlacementEngine (S15 ETAP 3)', () => {
  it('creates asset node placement and reference link', () => {
    const { placement, linkState } = CanvasAssetPlacementEngine.createPlacement(
      'asset_img_hero',
      'image',
      50,
      100,
      400,
      300,
      'cover'
    );

    expect(placement.assetId).toBe('asset_img_hero');
    expect(placement.type).toBe('image');
    expect(placement.width).toBe(400);
    expect(placement.fitMode).toBe('cover');
    expect(linkState.links.length).toBe(1);
    expect(linkState.links[0].assetId).toBe('asset_img_hero');
  });

  it('replaces asset and scales with aspect ratio lock', () => {
    const { placement } = CanvasAssetPlacementEngine.createPlacement('asset_1', 'image', 0, 0, 200, 100);

    const replaced = CanvasAssetPlacementEngine.replaceAsset(placement, 'asset_2');
    expect(replaced.assetId).toBe('asset_2');

    const scaled = CanvasAssetPlacementEngine.scalePlacement(replaced, 400, 200, true);
    expect(scaled.width).toBe(400);
    expect(scaled.height).toBe(200); // 2:1 aspect ratio preserved
  });

  it('duplicates placement with position offset', () => {
    const { placement } = CanvasAssetPlacementEngine.createPlacement('asset_1', 'image', 100, 100);
    const duplicated = CanvasAssetPlacementEngine.duplicatePlacement(placement, 30, 30);

    expect(duplicated.nodeId).not.toBe(placement.nodeId);
    expect(duplicated.x).toBe(130);
    expect(duplicated.y).toBe(130);
  });
});
