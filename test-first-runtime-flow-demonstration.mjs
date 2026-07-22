/**
 * First Runtime Flow Demonstration
 * 
 * This script demonstrates the complete asset lifecycle:
 * 1. Create AssetReference
 * 2. Upload asset to storage
 * 3. Create asset metadata in library
 * 4. Resolve to public URL with transformations
 */

import { LocalAssetStorage } from './src/providers/LocalAssetStorage';
import { AssetLibrary } from './src/AssetLibrary';
import { SimpleAssetResolver } from './src/AssetResolver';
import { AssetReference } from './src/AssetReference';
import { AssetType } from './src/AssetTypes';

// Create storage
const storage = new LocalAssetStorage({ basePath: 'demo' });

// Create library
const library = new AssetLibrary(storage);

// Create resolver
const resolver = new SimpleAssetResolver(storage, library);

// Create asset reference
const assetRef = new AssetReference('demo-image', 'image');
console.log('Created AssetReference:', assetRef.id, assetRef.type);

// Upload asset
const testData = new Uint8Array([1, 2, 3, 4, 5]);
const blob = new Blob([testData]);
const file = new File([blob], 'demo-image.png', { type: 'image/png' });

console.log('Uploading asset...');
const uploadResult = await storage.upload(file, {
  contentType: 'image/png',
  fileName: 'demo-image.png'
});

console.log('Upload successful!');
console.log('Storage key:', uploadResult.storageKey);
console.log('File size:', uploadResult.size);

// Simulate creating asset in library
const asset = {
  id: 'demo-image',
  type: 'image',
  name: 'Demo Image',
  description: 'Demo image for runtime flow',
  tags: ['demo', 'image'],
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
console.log('Asset added to library');

// Resolve to URL with transformations
console.log('Resolving to URL...');
const url = await resolver.resolve(assetRef, {
  width: 800,
  height: 600,
  quality: 85,
  format: 'webp'
});

console.log('Resolved URL:', url);
console.log('URL contains transformations:', 
  url.includes('width=800') && 
  url.includes('height=600') && 
  url.includes('quality=85') && 
  url.includes('format=webp')
);

console.log('First Runtime Flow demonstration complete!');