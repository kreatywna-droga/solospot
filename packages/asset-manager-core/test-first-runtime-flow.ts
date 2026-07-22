// test-first-runtime-flow.ts
import { LocalAssetStorage } from './src/providers/LocalAssetStorage';
import { AssetLibrary, MemoryAssetLibrary } from './src/AssetLibrary';
import { SimpleAssetResolver } from './src/AssetResolver';
import { AssetReference } from './src/AssetReference';
import { AssetType, Asset } from './src/AssetTypes';

async function runFirstRuntimeFlowTest() {
  console.log('Starting First Runtime Flow Test...');
  
  // 1. Create an asset reference
  const assetRef = new AssetReference('test-asset-1', 'image');
  console.log('Created AssetReference:', assetRef.id, assetRef.type);
  
  // 2. Create storage instance
  const storage = new LocalAssetStorage({ basePath: 'test' });
  console.log('Created LocalAssetStorage');
  
  // 3. Create library instance
  const library = new MemoryAssetLibrary(storage);
  console.log('Created MemoryAssetLibrary');
  
  // 4. Create resolver instance
  const resolver = new SimpleAssetResolver(storage, library);
  console.log('Created SimpleAssetResolver');
  
  // 5. Upload an asset file
  const testData = new Uint8Array([1, 2, 3, 4, 5]);
  const blob = new Blob([testData]);
  const file = new File([blob], 'test-image.png', { type: 'image/png' });
  
  console.log('Uploading file...');
  const uploadResult = await storage.upload(file, {
    contentType: 'image/png',
    fileName: 'test-image.png'
  });
  
  console.log('Upload completed:', uploadResult.storageKey);
  console.log('File size:', uploadResult.size);
  
  // 6. Add asset to library (simulating what upload would do)
  const asset: Asset = {
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
  
  library['assets'].set(asset.id, asset);
  console.log('Added asset to library');
  
  // 7. Resolve the asset reference to a URL
  console.log('Resolving asset reference...');
  const url = await resolver.resolve(assetRef, {
    width: 800,
    height: 600,
    quality: 85,
    format: 'webp'
  });
  
  console.log('URL resolved:', url);
  console.log('URL contains storageKey:', url.includes(uploadResult.storageKey));
  console.log('URL contains width parameter:', url.includes('width=800'));
  console.log('URL contains height parameter:', url.includes('height=600'));
  console.log('URL contains quality parameter:', url.includes('quality=85'));
  console.log('URL contains format parameter:', url.includes('format=webp'));
  
  console.log('First Runtime Flow Test completed successfully!');
}

runFirstRuntimeFlowTest().catch(console.error);