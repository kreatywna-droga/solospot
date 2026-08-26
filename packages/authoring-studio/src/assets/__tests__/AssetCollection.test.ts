import { describe, it, expect } from 'vitest';
import {
  createAssetCollection,
  validateAssetCollection,
} from '../AnimationAssetCollection';

describe('AnimationAssetCollection (PM42, ETAP 8)', () => {
  it('creates and validates asset collection payloads', () => {
    const collection = createAssetCollection(
      'col-intro-pack',
      'Intro Pack',
      'Collection of entrance presets',
      []
    );

    expect(collection.manifest.name).toBe('Intro Pack');
    expect(collection.manifest.assetCount).toBe(0);

    const report = validateAssetCollection(collection);
    expect(report.isValid).toBe(true);

    const invalidReport = validateAssetCollection(null);
    expect(invalidReport.isValid).toBe(false);
  });
});
