// demo.ts - Demonstration of how the asset management system works
import { AssetReference } from './AssetReference';
import { LocalAssetStorage } from './providers/LocalAssetStorage';
import { MemoryAssetLibrary } from './AssetLibrary';
import { SimpleAssetResolver } from './AssetResolver';

async function demo() {
  console.log('=== WEB FACTOR Asset Management Demo ===\n');
  
  // 1. Create storage backend
  const storage = new LocalAssetStorage({ basePath: 'assets' });
  console.log('✓ Created LocalAssetStorage');
  
  // 2. Create asset library (metadata layer)
  const library = new MemoryAssetLibrary(storage);
  console.log('✓ Created MemoryAssetLibrary');
  
  // 3. Create resolver (bridges references to URLs)
  const resolver = new SimpleAssetResolver(storage, library);
  console.log('✓ Created SimpleAssetResolver\n');
  
  // 4. Upload an image file
  console.log('--- Uploading an image ---');
  const imageBuffer = Buffer.from('fake image data for demonstration');
  const imageFile = new File([imageBuffer], 'logo.png', { type: 'image/png' });
  
  const asset = await library.upload(imageFile, {
    name: 'Company Logo',
    type: 'image' as const
  });
  
  console.log(`✓ Uploaded asset: ${asset.id}`);
  console.log(`  Name: ${asset.name}`);
  console.log(`  Type: ${asset.type}`);
  console.log(`  Storage Key: ${asset.storageKey}\n`);
  
  // 5. Create an AssetReference (this is what gets stored in documents)
  const logoRef = AssetReference.fromAsset(asset);
  console.log('--- Created AssetReference ---');
  console.log(`Reference: ${JSON.stringify(logoRef)}`);
  console.log('(Notice: No URL stored here!)\n');
  
  // 6. Resolve the reference to a URL (this happens at render time)
  console.log('--- Resolving to URL ---');
  const url = await resolver.resolve(logoRef);
  console.log(`Resolved URL: ${url}\n`);
  
  // 7. Resolve with transformation options (for responsive images, etc.)
  console.log('--- Resolving with transformations ---');
  const mobileUrl = await resolver.resolve(logoRef, { width: 320, format: 'webp' });
  const desktopUrl = await resolver.resolve(logoRef, { width: 1920, format: 'webp' });
  
  console.log(`Mobile URL (320px webp): ${mobileUrl}`);
  console.log(`Desktop URL (1920px webp): ${desktopUrl}\n`);
  
  // 8. Show that we can change storage backends without changing references
  console.log('--- Storage Backend Independence ---');
  console.log('The same AssetReference would work with:');
  console.log('- LocalAssetStorage (development)');
  console.log('- S3Storage (production AWS)');
  console.log('- GCSStorage (production Google Cloud)');
  console.log('- R2Storage (production Cloudflare)');
  console.log('- Any future storage backend\n');
  
  console.log('=== Demo Complete ===');
  console.log('Key Benefit: Documents store only {id, type} references,');
  console.log('not URLs, enabling storage/CDN changes without document migration.');
}

// Run the demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demo().catch(console.error);
}