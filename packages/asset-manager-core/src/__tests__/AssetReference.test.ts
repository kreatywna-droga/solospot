import { describe, test, expect } from 'vitest';
import { AssetReference } from '../AssetReference';
import { AssetType } from '../AssetTypes';

describe('AssetReference', () => {
  test('should create instance with id and type', () => {
    const ref = new AssetReference('asset_123', 'image');
    expect(ref.id).toBe('asset_123');
    expect(ref.type).toBe('image');
  });

  test('should create from asset object', () => {
    const asset = { id: 'asset_456', type: 'video' as AssetType };
    const ref = AssetReference.fromAsset(asset);
    expect(ref.id).toBe('asset_456');
    expect(ref.type).toBe('video');
  });

  test('should compare equality correctly', () => {
    const ref1 = new AssetReference('asset_123', 'image');
    const ref2 = new AssetReference('asset_123', 'image');
    const ref3 = new AssetReference('asset_123', 'video');
    const ref4 = new AssetReference('asset_456', 'image');

    expect(ref1.equals(ref2)).toBe(true);
    expect(ref1.equals(ref3)).toBe(false);
    expect(ref1.equals(ref4)).toBe(false);
  });

  test('should serialize to JSON', () => {
    const ref = new AssetReference('asset_789', 'font');
    const json = ref.toJSON();
    expect(json).toEqual({ id: 'asset_789', type: 'font' });
  });

  test('should deserialize from JSON', () => {
    const json = { id: 'asset_999', type: 'audio' as AssetType };
    const ref = AssetReference.fromJSON(json);
    expect(ref.id).toBe('asset_999');
    expect(ref.type).toBe('audio');
  });
});