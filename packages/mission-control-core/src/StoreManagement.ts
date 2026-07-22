import { StoreRepository } from '@/lib/store/StoreRepository';
import type { Store } from '@/lib/store/StoreTypes';
import { getServiceSupabase } from '@/lib/supabase';
import { DefaultProvisionEngine } from '../../provision-engine/src/DefaultProvisionEngine';
import { createProvisionRequest } from '../../provision-engine/src/ProvisionRequest';
import { createPublishRequest } from '../../publish-core/src/PublishRequest';
import { AdminContext } from './AdminContext';

// Imports for default engine setup
import { DefaultProvisionPipelineBuilder } from '../../provision-engine/src/DefaultProvisionPipeline';
import { ValidateStage } from '../../provision-engine/src/stages/ValidateStage';
import { TenantStage } from '../../provision-engine/src/stages/TenantStage';
import { TemplateStage } from '../../provision-engine/src/stages/TemplateStage';
import { PackageStage } from '../../provision-engine/src/stages/PackageStage';
import { StoreConfigStage } from '../../provision-engine/src/stages/StoreConfigStage';
import { PublishEngineBuilder } from '../../publish-engine/src/PublishEngineBuilder';
import { DefaultAssetPipeline } from '../../asset-builder/src/AssetPipeline';
import { CryptoAssetHasher } from '../../asset-builder/src/AssetHasher';
import { DefaultSEOBuilder } from '../../asset-builder/src/SEOBuilder';
import { DefaultDeploymentRegistry } from '../../deployment-core/src/DeploymentRegistry';
import { LocalProvider } from '../../deployment-core/src/providers/LocalProvider';

export interface StoreManager {
  listStores(ctx: AdminContext, tenantId?: string): Promise<Store[]>;
  getStore(ctx: AdminContext, tenantId: string, storeId: string): Promise<Store | null>;
  provisionStore(
    ctx: AdminContext,
    params: {
      tenantId: string;
      storeId: string;
      storeName: string;
      templateId: string;
      initialPackages?: string[];
    }
  ): Promise<any>;
  publishStore(ctx: AdminContext, tenantId: string, storeId: string): Promise<any>;
  suspendStore(ctx: AdminContext, tenantId: string, storeId: string): Promise<Store>;
}

export class DefaultStoreManager implements StoreManager {
  private readonly repo: StoreRepository;
  private readonly provisionEngine: DefaultProvisionEngine;
  private readonly publishEngine: any;

  constructor(deps?: { provisionEngine?: DefaultProvisionEngine; publishEngine?: any }) {
    this.repo = new StoreRepository();

    if (deps?.provisionEngine && deps?.publishEngine) {
      this.provisionEngine = deps.provisionEngine;
      this.publishEngine = deps.publishEngine;
    } else {
      // Build default fallback engines
      const registry = new DefaultDeploymentRegistry();
      registry.register('local', new LocalProvider());

      const mockAssetBuilder = {
        build: async () => [
          {
            path: 'assets/app.css',
            contentType: 'text/css',
            content: new TextEncoder().encode('body { background: #000; }'),
            size: 27
          }
        ]
      };

      const assetPipeline = new DefaultAssetPipeline({
        builder: mockAssetBuilder,
        hasher: new CryptoAssetHasher(),
        seoBuilder: new DefaultSEOBuilder()
      });

      const pipeline = new DefaultProvisionPipelineBuilder()
        .withStage(new ValidateStage())
        .withStage(new TenantStage())
        .withStage(new TemplateStage())
        .withStage(new PackageStage())
        .withStage(new StoreConfigStage())
        .build();

      let provisionEngine: DefaultProvisionEngine;

      const publishEngine = new PublishEngineBuilder()
        .withAssetPipeline(assetPipeline)
        .withDeploymentRegistry(registry)
        .withStoreConfigLoader(async (tenantId, storeId) => {
          const config = provisionEngine?.getProvisionedConfig(storeId);
          if (!config) {
            throw new Error(`Config not found for store: ${storeId}`);
          }
          return config;
        })
        .withTargetResolver(async (tenantId, storeId) => ({
          type: 'local',
          destination: `./public/stores/${storeId}`
        }))
        .build();

      provisionEngine = new DefaultProvisionEngine({
        pipeline,
        publishEngine
      });

      this.provisionEngine = provisionEngine;
      this.publishEngine = publishEngine;
    }
  }

  private checkPermission(ctx: AdminContext, action: string) {
    if (ctx.role === 'OWNER' || ctx.role === 'ADMIN') {
      return;
    }
    if (ctx.role === 'OPERATOR' && ['listStores', 'getStore', 'publishStore'].includes(action)) {
      return;
    }
    if (ctx.role === 'SUPPORT' && ['listStores', 'getStore'].includes(action)) {
      return;
    }
    throw new Error(`InsufficientPermissions: Role '${ctx.role}' does not have permission to execute action '${action}'`);
  }

  async listStores(ctx: AdminContext, tenantId?: string): Promise<Store[]> {
    this.checkPermission(ctx, 'listStores');
    if (tenantId) {
      return this.repo.getStoresByTenant(tenantId);
    }
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`StoreRepository.getAllStores failed: ${error.message}`);
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      slug: row.slug,
      domain: row.domain,
      status: row.status,
      config: row.config || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async getStore(ctx: AdminContext, tenantId: string, storeId: string): Promise<Store | null> {
    this.checkPermission(ctx, 'getStore');
    return this.repo.getStore(storeId, tenantId);
  }

  async provisionStore(
    ctx: AdminContext,
    params: {
      tenantId: string;
      storeId: string;
      storeName: string;
      templateId: string;
      initialPackages?: string[];
    }
  ): Promise<any> {
    this.checkPermission(ctx, 'provisionStore');
    const req = createProvisionRequest({
      tenantId: params.tenantId,
      storeId: params.storeId,
      storeName: params.storeName,
      templateId: params.templateId,
      initialPackages: params.initialPackages,
      correlationId: ctx.correlationId
    });
    const result = await this.provisionEngine.provision(req);
    if (result.success) {
      const supabase = getServiceSupabase();
      await supabase
        .from('stores')
        .upsert({
          id: params.storeId,
          tenant_id: params.tenantId,
          name: params.storeName,
          slug: params.storeName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          status: 'ACTIVE',
          config: result.storeConfig || {},
          updated_at: new Date().toISOString()
        });

      const publishReport = (result.metadata?.publishReport as any) || {};

      await supabase
        .from('deployments')
        .insert({
          id: publishReport.buildId || `build_${Date.now()}`,
          store_id: params.storeId,
          tenant_id: params.tenantId,
          status: 'SUCCESS',
          url: result.deploymentUrl,
          pages_count: publishReport.pagesCount || 0,
          artifacts_count: publishReport.artifactsCount || 0,
          duration_ms: publishReport.durationMs || 0,
          provider_type: publishReport.providerType || 'local',
          created_at: new Date().toISOString(),
          artifacts: []
        });
    }
    return result;
  }

  async publishStore(ctx: AdminContext, tenantId: string, storeId: string): Promise<any> {
    this.checkPermission(ctx, 'publishStore');
    const req = createPublishRequest({
      tenantId,
      storeId,
      correlationId: ctx.correlationId
    });
    return this.publishEngine.publish(req);
  }

  async suspendStore(ctx: AdminContext, tenantId: string, storeId: string): Promise<Store> {
    this.checkPermission(ctx, 'suspendStore');
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('stores')
      .update({ status: 'SUSPENDED', updated_at: new Date().toISOString() })
      .eq('id', storeId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      throw new Error(`StoreRepository.suspendStore failed: ${error.message}`);
    }

    return {
      id: data.id,
      tenantId: data.tenant_id,
      name: data.name,
      slug: data.slug,
      domain: data.domain,
      status: data.status,
      config: data.config || {},
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}
