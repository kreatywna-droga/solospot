import { describe, it, expect, vi } from 'vitest';
import { StoreConfig } from '../../runtime-core/src/RuntimeContext';
import { createPublishRequest, createPublishContext, PublishArtifact } from '../../publish-core/src';
import { 
  CryptoAssetHasher, 
  DefaultSEOBuilder, 
  DefaultAssetPipeline, 
  AssetBuilder,
  AssetManifest
} from '../src';

const mockStoreConfig: StoreConfig = {
  storeId: 'store-123',
  storeName: 'Mock Store',
  branding: {
    primaryColor: '#ff0055',
    secondaryColor: '#00ff55',
    font: 'Outfit',
    description: 'A premium mock storefront'
  },
  publicationStatus: 'PUBLISHED',
  pages: [
    { id: 'home', slug: '', name: 'Strona Główna', sections: [] },
    { id: 'products', slug: 'products', name: 'Produkty', sections: [] }
  ]
};

describe('Asset Builder Foundation Tests', () => {
  describe('CryptoAssetHasher', () => {
    it('should generate deterministic SHA-256 hashes', () => {
      const hasher = new CryptoAssetHasher();
      const content = 'console.log("hello world");';
      const hash1 = hasher.hash(content);
      const hash2 = hasher.hash(content);
      
      expect(hash1).toBe(hash2);
      expect(hash1.length).toBe(64); // SHA-256 is 64 hex characters
    });

    it('should fingerprint filenames correctly', () => {
      const hasher = new CryptoAssetHasher();
      const filename = 'assets/main.css';
      const hash = 'a67de9ab1234567890abcdef';
      
      const fingerprinted = hasher.fingerprint(filename, hash);
      expect(fingerprinted).toBe('assets/main.a67de9ab.css');
    });

    it('should handle filenames without extension during fingerprinting', () => {
      const hasher = new CryptoAssetHasher();
      const filename = 'LICENSE';
      const hash = 'a67de9ab';
      
      const fingerprinted = hasher.fingerprint(filename, hash);
      expect(fingerprinted).toBe('LICENSE.a67de9ab');
    });
  });

  describe('DefaultSEOBuilder', () => {
    it('should generate valid robots.txt, sitemap.xml, and manifest.webmanifest', async () => {
      const seoBuilder = new DefaultSEOBuilder();
      const req = createPublishRequest({ tenantId: 'tenant-1', storeId: 'store-1' });
      const ctx = createPublishContext(req, mockStoreConfig);

      const artifacts = await seoBuilder.buildSEOArtifacts(ctx);
      expect(artifacts.length).toBe(3);

      const robots = artifacts.find(a => a.path === 'robots.txt');
      const sitemap = artifacts.find(a => a.path === 'sitemap.xml');
      const webmanifest = artifacts.find(a => a.path === 'manifest.webmanifest');

      expect(robots).toBeDefined();
      expect(sitemap).toBeDefined();
      expect(webmanifest).toBeDefined();

      const decoder = new TextDecoder();
      
      // Check robots.txt content
      const robotsContent = decoder.decode(robots!.content as Uint8Array);
      expect(robotsContent).toContain('User-agent: *');
      expect(robotsContent).toContain('Sitemap: https://store.solospot.pl/tenant-1/store-1/sitemap.xml');

      // Check sitemap.xml content
      const sitemapContent = decoder.decode(sitemap!.content as Uint8Array);
      expect(sitemapContent).toContain('<loc>https://store.solospot.pl/tenant-1/store-1/</loc>');
      expect(sitemapContent).toContain('<loc>https://store.solospot.pl/tenant-1/store-1/products</loc>');

      // Check manifest.webmanifest content
      const webmanifestContent = decoder.decode(webmanifest!.content as Uint8Array);
      const manifestObj = JSON.parse(webmanifestContent);
      expect(manifestObj.name).toBe('Mock Store');
      expect(manifestObj.background_color).toBe('#ff0055');
    });
  });

  describe('DefaultAssetPipeline', () => {
    it('should process core assets, add SEO assets, fingerprint non-HTML files, and generate manifest.json', async () => {
      const mockBuilder: AssetBuilder = {
        build: async () => {
          const encoder = new TextEncoder();
          return [
            {
              path: 'index.html',
              contentType: 'text/html',
              content: encoder.encode('<h1>Home</h1>'),
              size: 13
            },
            {
              path: 'products/index.html',
              contentType: 'text/html',
              content: encoder.encode('<h1>Products</h1>'),
              size: 17
            },
            {
              path: 'assets/app.js',
              contentType: 'application/javascript',
              content: encoder.encode('console.log("js");'),
              size: 18
            }
          ];
        }
      };

      const pipeline = new DefaultAssetPipeline({
        builder: mockBuilder,
        hasher: new CryptoAssetHasher(),
        seoBuilder: new DefaultSEOBuilder()
      });

      const req = createPublishRequest({ tenantId: 'tenant-1', storeId: 'store-1' });
      const ctx = createPublishContext(req, mockStoreConfig);

      const outputArtifacts = await pipeline.process(ctx);

      // Verify output artifacts (3 builder artifacts + 3 SEO artifacts + 1 manifest = 7 total)
      expect(outputArtifacts.length).toBe(7);

      // Verify files exists
      const manifestFile = outputArtifacts.find(a => a.path === 'manifest.json');
      const htmlFile = outputArtifacts.find(a => a.path === 'index.html');
      const appJsFile = outputArtifacts.find(a => a.path.startsWith('assets/app.'));
      
      expect(manifestFile).toBeDefined();
      expect(htmlFile).toBeDefined();
      expect(appJsFile).toBeDefined();

      // JS should be fingerprinted
      expect(appJsFile!.path).not.toBe('assets/app.js');
      expect(appJsFile!.hash).toBeDefined();

      // Read manifest
      const decoder = new TextDecoder();
      const manifestJson: AssetManifest = JSON.parse(decoder.decode(manifestFile!.content as Uint8Array));

      expect(manifestJson.version).toBe('1.0.0');
      expect(manifestJson.pages.length).toBe(2);
      expect(manifestJson.assets.length).toBe(1); // the JS asset is listed in assets
      expect(manifestJson.assets[0].originalPath).toBe('assets/app.js');
      expect(manifestJson.assets[0].path).toBe(appJsFile!.path);
      expect(manifestJson.integrity[appJsFile!.path]).toBe(appJsFile!.hash);
    });
  });
});
