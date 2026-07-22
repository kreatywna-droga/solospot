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
import { ProvisionEngineEvent } from '../src';
import { PublishEngineBuilder } from '../../publish-engine/src';
import { 
  CryptoAssetHasher, 
  DefaultSEOBuilder, 
  DefaultAssetPipeline 
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

describe('Provision Engine — Tenant Isolation & Robustness', () => {
  let tempLocalBaseDir: string;
  let registry: DefaultDeploymentRegistry;
  let assetPipeline: DefaultAssetPipeline;

  beforeEach(async () => {
    tempLocalBaseDir = path.join(__dirname, 'robustness_deploys');
    await safeCleanup(tempLocalBaseDir);

    const mockAssetBuilder = {
      build: async () => [
        {
          path: 'assets/style.css',
          contentType: 'text/css',
          content: new TextEncoder().encode('body { margin: 0; }'),
          size: 17
        }
      ]
    };

    assetPipeline = new DefaultAssetPipeline({
      builder: mockAssetBuilder,
      hasher: new CryptoAssetHasher(),
      seoBuilder: new DefaultSEOBuilder()
    });

    registry = new DefaultDeploymentRegistry();
    registry.register('local', new LocalProvider());
  });

  afterEach(async () => {
    await safeCleanup(tempLocalBaseDir);
  });

  describe('C1.4.1 & C1.4.4 — Tenant Isolation & Parallel Execution', () => {
    it('should provision 30 tenants concurrently without any state leakage or cross-contamination', async () => {
      const concurrencyCount = 30;
      const pipeline = new DefaultProvisionPipelineBuilder()
        .withStage(new ValidateStage())
        .withStage(new TenantStage())
        .withStage(new TemplateStage())
        .withStage(new PackageStage())
        .withStage(new StoreConfigStage())
        .build();

      let engine: DefaultProvisionEngine;

      const publishEngine = new PublishEngineBuilder()
        .withAssetPipeline(assetPipeline)
        .withDeploymentRegistry(registry)
        .withStoreConfigLoader(async (tenantId, storeId) => {
          return engine.getProvisionedConfig(storeId)!;
        })
        .withTargetResolver(async (tenantId, storeId) => ({
          type: 'local',
          destination: path.join(tempLocalBaseDir, tenantId, storeId)
        }))
        .build();

      engine = new DefaultProvisionEngine({
        pipeline,
        publishEngine
      });

      const promises = Array.from({ length: concurrencyCount }).map(async (_, idx) => {
        const id = idx + 1;
        const tenantId = `tenant-${id}`;
        const storeId = `store-${id}`;
        const request = createProvisionRequest({
          tenantId,
          storeId,
          storeName: `Store of Tenant ${id}`,
          templateId: id % 2 === 0 ? 'apparel' : 'digital',
          initialPackages: id % 2 === 0 ? ['stripe'] : ['paypal', 'posthog'],
          metadata: { deploymentTarget: 'local' }
        });

        const result = await engine.provision(request);
        return { result, tenantId, storeId, templateId: request.templateId, initialPackages: request.initialPackages };
      });

      const results = await Promise.all(promises);

      // Verify that all succeeded and are completely isolated
      expect(results.length).toBe(concurrencyCount);
      for (const res of results) {
        expect(res.result.success).toBe(true);
        expect(res.result.storeConfig).toBeDefined();
        
        const config = res.result.storeConfig!;
        expect(config.storeId).toBe(res.storeId);
        expect(config.storeName).toBe(`Store of Tenant ${res.tenantId.split('-')[1]}`);
        expect(config.template).toBe(res.templateId);

        // Verify package isolation
        if (res.templateId === 'apparel') {
          expect(config.capabilities).toContain('payments');
          expect(config.capabilities).not.toContain('analytics');
        } else {
          expect(config.capabilities).toContain('payments');
          expect(config.capabilities).toContain('analytics');
        }

        // Verify deployment paths do not cross-leak
        const deployDir = path.join(tempLocalBaseDir, res.tenantId, res.storeId);
        const indexHtml = await fs.readFile(path.join(deployDir, 'index.html'), 'utf-8');
        expect(indexHtml).toBeDefined();

        const manifestText = await fs.readFile(path.join(deployDir, 'manifest.json'), 'utf-8');
        const manifest = JSON.parse(manifestText);
        expect(manifest.pages.length).toBe(res.templateId === 'apparel' ? 2 : 1);
      }
    });
  });

  describe('C1.4.2 — Rollback Robustness at Each Stage', () => {
    const runFailingPipeline = async (failingStage: any) => {
      const pipeline = new DefaultProvisionPipelineBuilder()
        .withStage(new ValidateStage())
        .withStage(new TenantStage())
        .withStage(new TemplateStage())
        .withStage(failingStage)
        .build();

      const engine = new DefaultProvisionEngine({
        pipeline,
        publishEngine: new PublishEngineBuilder()
          .withAssetPipeline(assetPipeline)
          .withDeploymentRegistry(registry)
          .withStoreConfigLoader(async () => ({} as any))
          .withTargetResolver(async () => ({ type: 'local', destination: 'mock' }))
          .build()
      });

      const request = createProvisionRequest({
        tenantId: 'tenant-fail-test',
        storeId: 'store-fail-test',
        storeName: 'Fail Test Store',
        templateId: 'default'
      });

      return engine.provision(request);
    };

    it('should fail and cleanly rollback state if a stage throws an error', async () => {
      const badStage = {
        name: 'failing-stage',
        execute: async () => {
          throw new Error('Forced stage crash');
        },
        rollback: async (context: any) => context
      };

      const result = await runFailingPipeline(badStage);
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Forced stage crash');
      expect(result.storeConfig).toBeUndefined();
    });
  });

  describe('C1.4.3 — Idempotency', () => {
    it('should enforce idempotency by preventing duplicate tenant provisioning', async () => {
      const activeTenants = new Set<string>();
      const isTenantExists = async (tenantId: string) => activeTenants.has(tenantId);

      const pipeline = new DefaultProvisionPipelineBuilder()
        .withStage(new ValidateStage(isTenantExists))
        .withStage(new TenantStage())
        .withStage(new TemplateStage())
        .withStage(new StoreConfigStage())
        .build();

      const engine = new DefaultProvisionEngine({
        pipeline,
        publishEngine: new PublishEngineBuilder()
          .withAssetPipeline(assetPipeline)
          .withDeploymentRegistry(registry)
          .withStoreConfigLoader(async () => ({} as any))
          .withTargetResolver(async () => ({ type: 'local', destination: path.join(tempLocalBaseDir, 'idem') }))
          .build()
      });

      const request = createProvisionRequest({
        tenantId: 'unique-tenant-101',
        storeId: 'store-101',
        storeName: 'Unique Store',
        templateId: 'default'
      });

      // First run: Success
      const firstResult = await engine.provision(request);
      expect(firstResult.success).toBe(true);
      activeTenants.add('unique-tenant-101'); // simulate save to registry

      // Second run: Rejects idempotently with duplicate error
      const secondResult = await engine.provision(request);
      expect(secondResult.success).toBe(false);
      expect(secondResult.errors[0]).toContain('already exists');
    });
  });

  describe('C1.4.5 — Observability', () => {
    it('should emit a complete and ordered trace of ProvisionEngineEvents on success', async () => {
      const events: ProvisionEngineEvent[] = [];
      const pipeline = new DefaultProvisionPipelineBuilder()
        .withStage(new ValidateStage())
        .withStage(new TenantStage())
        .withStage(new TemplateStage())
        .withStage(new PackageStage())
        .withStage(new StoreConfigStage())
        .build();

      let engine: DefaultProvisionEngine;
      const publishEngine = new PublishEngineBuilder()
        .withAssetPipeline(assetPipeline)
        .withDeploymentRegistry(registry)
        .withStoreConfigLoader(async (tenantId, storeId) => {
          return engine.getProvisionedConfig(storeId)!;
        })
        .withTargetResolver(async (tenantId, storeId) => ({
          type: 'local',
          destination: path.join(tempLocalBaseDir, 'obs')
        }))
        .build();

      engine = new DefaultProvisionEngine({
        pipeline,
        publishEngine,
        onEvent: (event) => events.push(event)
      });

      const request = createProvisionRequest({
        tenantId: 'tenant-obs',
        storeId: 'store-obs',
        storeName: 'Obs Store',
        templateId: 'default',
        initialPackages: ['stripe']
      });

      const result = await engine.provision(request);
      expect(result.success).toBe(true);

      // Verify event trace
      const eventTypes = events.map(e => e.type);
      expect(eventTypes).toEqual([
        'ProvisionStarted',
        'TenantCreated',
        'TemplateInstalled',
        'PackagesInstalled',
        'StoreConfigGenerated',
        'PublishStarted',
        'AssetsBuilt',
        'DeploymentCompleted',
        'ProvisionCompleted'
      ]);

      // Verify metadata properties are present
      for (const event of events) {
        expect(event.tenantId).toBe('tenant-obs');
        expect(event.correlationId).toBe(request.correlationId);
        expect(event.timestamp).toBeDefined();
        if (event.type === 'ProvisionCompleted' || event.type === 'TenantCreated') {
          expect(event.durationMs).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it('should emit a ProvisionFailed event on execution failure', async () => {
      const events: ProvisionEngineEvent[] = [];
      const pipeline = new DefaultProvisionPipelineBuilder()
        .withStage(new ValidateStage())
        .withStage({
          name: 'crashing-stage',
          execute: async () => {
            throw new Error('Crash inside stage execution');
          }
        })
        .build();

      const engine = new DefaultProvisionEngine({
        pipeline,
        publishEngine: {} as any,
        onEvent: (event) => events.push(event)
      });

      const request = createProvisionRequest({
        tenantId: 'tenant-fail-obs',
        storeId: 'store-fail-obs',
        storeName: 'Fail Obs Store',
        templateId: 'default'
      });

      const result = await engine.provision(request);
      expect(result.success).toBe(false);

      const eventTypes = events.map(e => e.type);
      expect(eventTypes).toEqual(['ProvisionStarted', 'ProvisionFailed']);

      const failEvent = events[1];
      expect(failEvent.type).toBe('ProvisionFailed');
      expect(failEvent.tenantId).toBe('tenant-fail-obs');
      expect(failEvent.correlationId).toBe(request.correlationId);
      expect(failEvent.stage).toBe('crashing-stage');
      expect(failEvent.error).toContain('Crash inside stage execution');
      expect(failEvent.durationMs).toBeDefined();
    });
  });
});
