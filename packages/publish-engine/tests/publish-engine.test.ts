import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { StoreConfig } from '../../runtime-core/src/RuntimeContext';
import { createPublishRequest } from '../../publish-core/src';
import { 
  CryptoAssetHasher, 
  DefaultSEOBuilder, 
  DefaultAssetPipeline, 
  AssetBuilder 
} from '../../asset-builder/src';
import { 
  DefaultDeploymentRegistry, 
  LocalProvider, 
  StaticExportProvider 
} from '../../deployment-core/src';
import { 
  PublishEngineBuilder, 
  PublishEngineEvent, 
  PublishReport 
} from '../src';

const mockStoreConfig: StoreConfig = {
  storeId: 'store-mc',
  storeName: 'Mission Control Shop',
  branding: {
    primaryColor: '#7c3aed',
    secondaryColor: '#ec4899',
    font: 'Outfit'
  },
  publicationStatus: 'PUBLISHED',
  pages: [
    { id: 'page-home', slug: '', name: 'Main Storefront', sections: [] },
    { id: 'page-contact', slug: 'contact', name: 'Contact Us', sections: [] }
  ]
};

async function safeCleanup(dirPath: string) {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
  } catch {
    // ignore
  }
}

describe('PublishEngine End-to-End Integration', () => {
  let tempLocalDir: string;
  let tempStaticDir: string;
  let eventLog: PublishEngineEvent[];
  let loadStoreConfigMock: any;
  let registry: DefaultDeploymentRegistry;
  let assetPipeline: DefaultAssetPipeline;

  beforeEach(async () => {
    tempLocalDir = path.join(__dirname, 'e2e_local_deploy');
    tempStaticDir = path.join(__dirname, 'e2e_static_export');
    await safeCleanup(tempLocalDir);
    await safeCleanup(tempStaticDir);

    eventLog = [];
    loadStoreConfigMock = vi.fn().mockResolvedValue(mockStoreConfig);

    // Setup real/mock hybrid sub-systems
    const mockAssetBuilder: AssetBuilder = {
      build: async () => {
        const encoder = new TextEncoder();
        return [
          {
            path: 'assets/bundle.css',
            contentType: 'text/css',
            content: encoder.encode('.btn { color: #7c3aed; }'),
            size: 24
          }
        ];
      }
    };

    assetPipeline = new DefaultAssetPipeline({
      builder: mockAssetBuilder,
      hasher: new CryptoAssetHasher(),
      seoBuilder: new DefaultSEOBuilder()
    });

    registry = new DefaultDeploymentRegistry();
    registry.register('local', new LocalProvider());
    registry.register('static-export', new StaticExportProvider());
  });

  afterEach(async () => {
    await safeCleanup(tempLocalDir);
    await safeCleanup(tempStaticDir);
  });

  it('should run a successful LIVE publication flow', async () => {
    const engine = new PublishEngineBuilder()
      .withStoreConfigLoader(loadStoreConfigMock)
      .withAssetPipeline(assetPipeline)
      .withDeploymentRegistry(registry)
      .withTargetResolver(async (tenantId, storeId) => ({
        type: 'local',
        destination: tempLocalDir
      }))
      .withEventListener((event) => eventLog.push(event))
      .build();

    const request = createPublishRequest({
      tenantId: 'tenant-99',
      storeId: 'store-mc',
      mode: 'LIVE'
    });

    const result = await engine.publish(request);

    // Verify orchestration output
    expect(result.success).toBe(true);
    expect(result.artifactsCount).toBe(7);
    // Wait, let's list them:
    // Page 1: index.html
    // Page 2: contact/index.html
    // Builder: assets/bundle.[hash].css
    // SEO: robots.txt, sitemap.xml, manifest.webmanifest
    // AssetPipeline Manifest: manifest.json
    // Total is indeed 7. Let's make sure it generated all of them.
    expect(result.artifactsCount).toBe(7);

    // Verify files physically exist on local disk
    const indexExists = await fs.access(path.join(tempLocalDir, 'index.html')).then(() => true).catch(() => false);
    const contactExists = await fs.access(path.join(tempLocalDir, 'contact/index.html')).then(() => true).catch(() => false);
    const manifestExists = await fs.access(path.join(tempLocalDir, 'manifest.json')).then(() => true).catch(() => false);
    
    expect(indexExists).toBe(true);
    expect(contactExists).toBe(true);
    expect(manifestExists).toBe(true);

    // Verify Event Log sequence (Observability check)
    const eventTypes = eventLog.map(e => e.type);
    expect(eventTypes).toContain('PublishStarted');
    expect(eventTypes).toContain('RuntimeCompleted');
    expect(eventTypes).toContain('AssetsBuilt');
    expect(eventTypes).toContain('DeploymentStarted');
    expect(eventTypes).toContain('DeploymentCompleted');
    expect(eventTypes).toContain('PublishCompleted');

    // Verify Publish Report details
    const report: PublishReport = result.metadata?.publishReport as PublishReport;
    expect(report).toBeDefined();
    expect(report.status).toBe('SUCCESS');
    expect(report.pagesCount).toBe(2);
    expect(report.artifactsCount).toBe(7);
    expect(report.providerType).toBe('local');
    expect(report.deploymentUrl).toContain('file:///');
  });

  it('should run a successful PREVIEW publication flow', async () => {
    const engine = new PublishEngineBuilder()
      .withStoreConfigLoader(loadStoreConfigMock)
      .withAssetPipeline(assetPipeline)
      .withDeploymentRegistry(registry)
      .withTargetResolver(async (tenantId, storeId) => ({
        type: 'local',
        destination: tempLocalDir
      }))
      .withEventListener((event) => eventLog.push(event))
      .build();

    const request = createPublishRequest({
      tenantId: 'tenant-99',
      storeId: 'store-mc',
      mode: 'PREVIEW'
    });

    const result = await engine.publish(request);
    expect(result.success).toBe(true);
    
    const report: PublishReport = result.metadata?.publishReport as PublishReport;
    expect(report.status).toBe('SUCCESS');
  });

  it('should run a successful EXPORT_STATIC flow using StaticExportProvider', async () => {
    const engine = new PublishEngineBuilder()
      .withStoreConfigLoader(loadStoreConfigMock)
      .withAssetPipeline(assetPipeline)
      .withDeploymentRegistry(registry)
      .withTargetResolver(async (tenantId, storeId) => ({
        type: 'static-export',
        destination: tempStaticDir
      }))
      .withEventListener((event) => eventLog.push(event))
      .build();

    const request = createPublishRequest({
      tenantId: 'tenant-99',
      storeId: 'store-mc',
      mode: 'EXPORT_STATIC'
    });

    const result = await engine.publish(request);
    expect(result.success).toBe(true);

    const indexExists = await fs.access(path.join(tempStaticDir, 'index.html')).then(() => true).catch(() => false);
    expect(indexExists).toBe(true);
  });

  it('should rollback deployed files and fail gracefully on deployment failure', async () => {
    // Inject a failing provider target
    const engine = new PublishEngineBuilder()
      .withStoreConfigLoader(loadStoreConfigMock)
      .withAssetPipeline(assetPipeline)
      .withDeploymentRegistry(registry)
      .withTargetResolver(async () => ({
        type: 'local',
        destination: '' // invalid path will trigger error in LocalProvider
      }))
      .withEventListener((event) => eventLog.push(event))
      .build();

    const request = createPublishRequest({
      tenantId: 'tenant-99',
      storeId: 'store-mc'
    });

    const result = await engine.publish(request);

    // Verify result is failed
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('Deployment failed');

    // Verify events log failed
    const eventTypes = eventLog.map(e => e.type);
    expect(eventTypes).toContain('PublishStarted');
    expect(eventTypes).toContain('RuntimeCompleted');
    expect(eventTypes).toContain('AssetsBuilt');
    expect(eventTypes).toContain('DeploymentStarted');
    expect(eventTypes).toContain('PublishFailed');

    const report: PublishReport = result.metadata?.publishReport as PublishReport;
    expect(report.status).toBe('FAILED');
    expect(report.error).toBeDefined();
  });

  it('should halt execution on asset builder failure and skip deployment stage', async () => {
    const failingAssetPipeline = new DefaultAssetPipeline({
      builder: {
        build: async () => {
          throw new Error('Webpack bundle failed');
        }
      },
      hasher: new CryptoAssetHasher()
    });

    const engine = new PublishEngineBuilder()
      .withStoreConfigLoader(loadStoreConfigMock)
      .withAssetPipeline(failingAssetPipeline)
      .withDeploymentRegistry(registry)
      .withTargetResolver(async () => ({
        type: 'local',
        destination: tempLocalDir
      }))
      .withEventListener((event) => eventLog.push(event))
      .build();

    const request = createPublishRequest({
      tenantId: 'tenant-99',
      storeId: 'store-mc'
    });

    const result = await engine.publish(request);

    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('Webpack bundle failed');

    // Verify that deploy was not run
    const eventTypes = eventLog.map(e => e.type);
    expect(eventTypes).not.toContain('DeploymentStarted');
    expect(eventTypes).toContain('PublishFailed');
  });

  it('should halt execution on store config validation failure', async () => {
    loadStoreConfigMock.mockRejectedValue(new Error('Database unavailable'));

    const engine = new PublishEngineBuilder()
      .withStoreConfigLoader(loadStoreConfigMock)
      .withAssetPipeline(assetPipeline)
      .withDeploymentRegistry(registry)
      .withTargetResolver(async () => ({
        type: 'local',
        destination: tempLocalDir
      }))
      .withEventListener((event) => eventLog.push(event))
      .build();

    const request = createPublishRequest({
      tenantId: 'tenant-99',
      storeId: 'store-mc'
    });

    const result = await engine.publish(request);

    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('Database unavailable');

    const eventTypes = eventLog.map(e => e.type);
    expect(eventTypes).not.toContain('RuntimeCompleted');
    expect(eventTypes).not.toContain('AssetsBuilt');
    expect(eventTypes).toContain('PublishFailed');
  });
});
