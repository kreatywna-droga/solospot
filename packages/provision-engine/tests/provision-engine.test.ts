import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createProvisionRequest } from '../src/ProvisionRequest';
import { DefaultProvisionPipelineBuilder } from '../src/DefaultProvisionPipeline';
import { DefaultProvisionEngine } from '../src/DefaultProvisionEngine';
import { ValidateStage } from '../src/stages/ValidateStage';
import { TenantStage } from '../src/stages/TenantStage';
import { TemplateStage } from '../src/stages/TemplateStage';
import { PackageStage } from '../src/stages/PackageStage';
import { StoreConfigStage } from '../src/stages/StoreConfigStage';
import { PublishEngineBuilder } from '../../publish-engine/src';
import { 
  CryptoAssetHasher, 
  DefaultSEOBuilder, 
  DefaultAssetPipeline, 
  AssetBuilder 
} from '../../asset-builder/src';
import { 
  DefaultDeploymentRegistry, 
  LocalProvider 
} from '../../deployment-core/src';

async function safeCleanup(dirPath: string) {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
  } catch {
    // ignore
  }
}

describe('ProvisionEngine Integration & E2E Flow', () => {
  let tempLocalDir: string;
  let publishEngine: any;
  let registry: DefaultDeploymentRegistry;
  let assetPipeline: DefaultAssetPipeline;

  beforeEach(async () => {
    tempLocalDir = path.join(__dirname, 'e2e_provision_deploy');
    await safeCleanup(tempLocalDir);

    // Mock asset builder
    const mockAssetBuilder: AssetBuilder = {
      build: async () => {
        const encoder = new TextEncoder();
        return [
          {
            path: 'assets/app.css',
            contentType: 'text/css',
            content: encoder.encode('body { background: #000; }'),
            size: 27
          }
        ];
      }
    };

    // Setup asset pipeline
    assetPipeline = new DefaultAssetPipeline({
      builder: mockAssetBuilder,
      hasher: new CryptoAssetHasher(),
      seoBuilder: new DefaultSEOBuilder()
    });

    // Register a deployment provider
    registry = new DefaultDeploymentRegistry();
    registry.register('local', new LocalProvider());
  });

  afterEach(async () => {
    await safeCleanup(tempLocalDir);
  });

  describe('DefaultProvisionPipeline', () => {
    it('should build and execute the pipeline successfully', async () => {
      const pipeline = new DefaultProvisionPipelineBuilder()
        .withName('test-provision-pipeline')
        .withStage(new ValidateStage())
        .withStage(new TenantStage())
        .withStage(new TemplateStage())
        .withStage(new PackageStage())
        .withStage(new StoreConfigStage())
        .build();

      expect(pipeline.name).toBe('test-provision-pipeline');
      expect(pipeline.stages.length).toBe(5);

      const request = createProvisionRequest({
        tenantId: 'tenant-123',
        storeId: 'store-123',
        storeName: 'My Brand Store',
        templateId: 'apparel',
        initialPackages: ['stripe', 'posthog']
      });

      const result = await pipeline.execute(request);
      expect(result.success).toBe(true);
      expect(result.storeConfig).toBeDefined();
      expect(result.storeConfig?.storeName).toBe('My Brand Store');
      expect(result.stageResults.every(r => r.success)).toBe(true);
    });

    it('should rollback all executed stages in LIFO order upon failure', async () => {
      // Create a dummy stage that fails
      const failingStage = {
        name: 'failing-stage',
        execute: async () => {
          throw new Error('Simulation failed');
        }
      };

      const tenantStage = new TenantStage();
      const rollbackSpy = vi.spyOn(tenantStage, 'rollback');

      const pipeline = new DefaultProvisionPipelineBuilder()
        .withStage(tenantStage) // passes
        .withStage(failingStage)      // fails
        .build();

      const request = createProvisionRequest({
        tenantId: 'tenant-fail',
        storeId: 'store-fail',
        storeName: 'Failing Store',
        templateId: 'default'
      });

      const result = await pipeline.execute(request);
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Simulation failed');
      expect(rollbackSpy).toHaveBeenCalled();
    });
  });

  describe('Provision & Publish E2E Integration', () => {
    it('should successfully provision a store config and automatically deploy it using PublishEngine', async () => {
      // 1. Setup Provision Pipeline
      const pipeline = new DefaultProvisionPipelineBuilder()
        .withStage(new ValidateStage())
        .withStage(new TenantStage())
        .withStage(new TemplateStage())
        .withStage(new PackageStage())
        .withStage(new StoreConfigStage())
        .build();

      // 2. Create ProvisionEngine instance
      let provisionEngine: DefaultProvisionEngine;

      // 3. Build PublishEngine with correct builder APIs
      publishEngine = new PublishEngineBuilder()
        .withAssetPipeline(assetPipeline)
        .withDeploymentRegistry(registry)
        .withStoreConfigLoader(async (tenantId, storeId) => {
          const config = provisionEngine.getProvisionedConfig(storeId);
          if (!config) {
            throw new Error(`Config not found for store: ${storeId}`);
          }
          return config;
        })
        .withTargetResolver(async (tenantId, storeId) => ({
          type: 'local',
          destination: tempLocalDir
        }))
        .build();

      provisionEngine = new DefaultProvisionEngine({
        pipeline,
        publishEngine
      });

      // 4. Trigger E2E Provisioning
      const request = createProvisionRequest({
        tenantId: 'tenant-gold',
        storeId: 'store-gold',
        storeName: 'Golden Apparel Shop',
        templateId: 'apparel',
        initialPackages: ['stripe'],
        metadata: {
          deploymentTarget: 'local'
        }
      });

      const result = await provisionEngine.provision(request);

      expect(result.success).toBe(true);
      expect(result.deploymentUrl).toBeDefined();
      expect(result.storeConfig).toBeDefined();

      // 5. Verify files physically exist on local disk in e2e_provision_deploy
      const indexHtml = await fs.readFile(path.join(tempLocalDir, 'index.html'), 'utf-8');
      expect(indexHtml).toContain('Home');

      const contactHtml = await fs.readFile(path.join(tempLocalDir, 'contact/index.html'), 'utf-8');
      expect(contactHtml).toContain('Contact');

      const manifestText = await fs.readFile(path.join(tempLocalDir, 'manifest.json'), 'utf-8');
      const manifest = JSON.parse(manifestText);
      expect(manifest.pages.length).toBe(2);
      expect(manifest.assets.length).toBe(1);
    });

    it('should trigger rollback of provisioned stages if PublishEngine execution fails', async () => {
      // 1. Setup Pipeline
      const pipeline = new DefaultProvisionPipelineBuilder()
        .withStage(new ValidateStage())
        .withStage(new TenantStage())
        .withStage(new TemplateStage())
        .withStage(new StoreConfigStage())
        .build();

      const rollbackSpy = vi.spyOn(pipeline.stages[1], 'rollback'); // TenantStage rollback

      // 2. Build PublishEngine with a failing asset builder to force publish failure
      const failingAssetPipeline = new DefaultAssetPipeline({
        builder: {
          build: async () => {
            throw new Error('Assets bundle compilation error');
          }
        },
        hasher: new CryptoAssetHasher()
      });

      let provisionEngine: DefaultProvisionEngine;

      publishEngine = new PublishEngineBuilder()
        .withAssetPipeline(failingAssetPipeline)
        .withDeploymentRegistry(registry)
        .withStoreConfigLoader(async (tenantId, storeId) => {
          return provisionEngine.getProvisionedConfig(storeId)!;
        })
        .withTargetResolver(async (tenantId, storeId) => ({
          type: 'local',
          destination: tempLocalDir
        }))
        .build();

      provisionEngine = new DefaultProvisionEngine({
        pipeline,
        publishEngine
      });

      const request = createProvisionRequest({
        tenantId: 'tenant-fail-pub',
        storeId: 'store-fail-pub',
        storeName: 'Fail Publish Shop',
        templateId: 'default',
        metadata: {
          deploymentTarget: 'local'
        }
      });

      const result = await provisionEngine.provision(request);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Assets bundle compilation error');
      expect(rollbackSpy).toHaveBeenCalled();
    });
  });
});
