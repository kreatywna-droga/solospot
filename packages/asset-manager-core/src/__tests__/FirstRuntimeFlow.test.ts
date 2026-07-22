import { describe, test, expect, beforeEach } from 'vitest';
import { LocalAssetStorage } from '../providers/LocalAssetStorage';
import { AssetLibrary, MemoryAssetLibrary } from '../AssetLibrary';
import { SimpleAssetResolver } from '../AssetResolver';
import { AssetReference } from '../AssetReference';
import { AssetType, Asset } from '../AssetTypes';

describe('First Runtime Flow Test', () => {
  let storage: LocalAssetStorage;
  let library: AssetLibrary;
  let resolver: SimpleAssetResolver;
  
  beforeEach(() => {
    // Create storage instance
    storage = new LocalAssetStorage({ basePath: 'test' });
    
    // Create library instance using the storage
    library = new MemoryAssetLibrary(storage);
    
    // Create resolver instance
    resolver = new SimpleAssetResolver(storage, library);
  });

  test('should complete full asset lifecycle flow', async () => {
    // 1. Create an asset reference
    const assetRef = new AssetReference('test-asset-1', 'image');
    
    // 2. Upload an asset file
    const testData = new Uint8Array([1, 2, 3, 4, 5]);
    const blob = new Blob([testData]);
    const file = new File([blob], 'test-image.png', { type: 'image/png' });
    
    // Upload to storage
    const uploadResult = await storage.upload(file, {
      contentType: 'image/png',
      fileName: 'test-image.png'
    });
    
    expect(uploadResult).toHaveProperty('storageKey');
    expect(uploadResult.size).toBe(5);
    
    // 3. Create asset in library (this would normally be done through upload method)
    const asset = {
      id: 'test-asset-1',
      type: 'image',
      name: 'Test Image',
      description: 'Test image for runtime flow',
      tags: ['test', 'image'],
      metadata: {
        width: 800,
        height: 600,
        mimeType: 'image/png'
      },
      storageKey: uploadResult.storageKey,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add to library (in a real implementation, this would be done through upload method)
    (library as any)['assets'].set(asset.id, asset); // Direct access for test
    
    // 4. Resolve the asset reference to a URL
    const url = await resolver.resolve(assetRef, {
      width: 800,
      height: 600,
      quality: 85,
      format: 'webp'
    });
    
    expect(decodeURIComponent(url)).toContain(uploadResult.storageKey);
    expect(url).toContain('w=800');
    expect(url).toContain('h=600');
    expect(url).toContain('q=85');
    expect(url).toContain('f=webp');
  });
});