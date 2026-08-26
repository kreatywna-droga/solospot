import { describe, it, expect } from 'vitest';
import { MediaImportEngine } from '../MediaImportEngine';
import { AssetProcessingPipeline } from '../AssetProcessingPipeline';
import { INITIAL_ASSET_REGISTRY_STATE } from '../AnimationAssetRegistry';

describe('BatchImport & Processing Pipeline (S15 ETAP 1 & 2)', () => {
  it('imports batch array of media files and processes pipeline', () => {
    const rawFiles = [
      { fileName: 'img1.png', mimeType: 'image/png', fileSizeBytes: 1024, sourceUri: 'img1.png' },
      { fileName: 'audio1.mp3', mimeType: 'audio/mpeg', fileSizeBytes: 5120, sourceUri: 'audio1.mp3' },
      { fileName: 'icon.svg', mimeType: 'image/svg+xml', fileSizeBytes: 800, sourceUri: 'icon.svg' },
    ];

    const importedBatch = MediaImportEngine.importBatch(rawFiles);
    expect(importedBatch.length).toBe(3);

    let regState = INITIAL_ASSET_REGISTRY_STATE;

    for (const imported of importedBatch) {
      const { nextRegistryState, result } = AssetProcessingPipeline.processAsset(imported, regState);
      regState = nextRegistryState;
      expect(result.isValid).toBe(true);
    }

    expect(regState.assets.length).toBe(3);
  });
});
