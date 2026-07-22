import { getServiceSupabase } from '@/lib/supabase';
import { DefaultDeploymentRegistry } from '../../deployment-core/src/DeploymentRegistry';
import { LocalProvider } from '../../deployment-core/src/providers/LocalProvider';
import { StaticExportProvider } from '../../deployment-core/src/providers/StaticExportProvider';
import { AdminContext } from './AdminContext';

export interface DeploymentRecord {
  id: string;
  storeId: string;
  tenantId: string;
  status: 'SUCCESS' | 'FAILED';
  url?: string;
  pagesCount: number;
  artifactsCount: number;
  durationMs: number;
  providerType: string;
  createdAt: string;
  artifacts: any[];
}

export interface DeploymentManager {
  listDeployments(ctx: AdminContext, storeId: string): Promise<DeploymentRecord[]>;
  getDeployment(ctx: AdminContext, id: string): Promise<DeploymentRecord | null>;
  rollbackDeployment(ctx: AdminContext, tenantId: string, storeId: string, buildId: string): Promise<void>;
}

export class DefaultDeploymentManager implements DeploymentManager {
  private readonly registry: DefaultDeploymentRegistry;

  constructor() {
    this.registry = new DefaultDeploymentRegistry();
    this.registry.register('local', new LocalProvider());
    this.registry.register('static', new StaticExportProvider());
  }

  private checkPermission(ctx: AdminContext, action: string) {
    if (ctx.role === 'OWNER' || ctx.role === 'ADMIN') {
      return;
    }
    if (ctx.role === 'OPERATOR' && ['listDeployments', 'getDeployment'].includes(action)) {
      return;
    }
    if (ctx.role === 'SUPPORT' && ['listDeployments', 'getDeployment'].includes(action)) {
      return;
    }
    throw new Error(`InsufficientPermissions: Role '${ctx.role}' does not have permission to execute action '${action}'`);
  }

  async listDeployments(ctx: AdminContext, storeId: string): Promise<DeploymentRecord[]> {
    this.checkPermission(ctx, 'listDeployments');
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('deployments')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`DeploymentManager.listDeployments failed: ${error.message}`);
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      storeId: row.store_id,
      tenantId: row.tenant_id,
      status: row.status,
      url: row.url,
      pagesCount: row.pages_count || 0,
      artifactsCount: row.artifacts_count || 0,
      durationMs: row.duration_ms || 0,
      providerType: row.provider_type || 'local',
      createdAt: row.created_at,
      artifacts: row.artifacts || [],
    }));
  }

  async getDeployment(ctx: AdminContext, id: string): Promise<DeploymentRecord | null> {
    this.checkPermission(ctx, 'getDeployment');
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('deployments')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`DeploymentManager.getDeployment failed: ${error.message}`);
    }
    if (!data) return null;

    return {
      id: data.id,
      storeId: data.store_id,
      tenantId: data.tenant_id,
      status: data.status,
      url: data.url,
      pagesCount: data.pages_count || 0,
      artifactsCount: data.artifacts_count || 0,
      durationMs: data.duration_ms || 0,
      providerType: data.provider_type || 'local',
      createdAt: data.created_at,
      artifacts: data.artifacts || [],
    };
  }

  async rollbackDeployment(ctx: AdminContext, tenantId: string, storeId: string, buildId: string): Promise<void> {
    this.checkPermission(ctx, 'rollbackDeployment');
    const deployment = await this.getDeployment(ctx, buildId);
    if (!deployment) {
      throw new Error(`Deployment with ID '${buildId}' not found`);
    }

    const provider = this.registry.resolve({
      type: deployment.providerType,
      destination: `./public/stores/${storeId}`
    });

    const deployRequest = {
      target: {
        type: deployment.providerType,
        destination: `./public/stores/${storeId}`
      },
      artifacts: deployment.artifacts,
      manifest: {
        version: '1.0',
        buildId: buildId,
        runtimeVersion: '1.0',
        assets: [],
        pages: [],
        integrity: {},
        generatedAt: new Date().toISOString(),
      },
      correlationId: ctx.correlationId,
      metadata: {}
    };

    if (typeof provider.rollback !== 'function') {
      throw new Error(`Provider '${deployment.providerType}' does not support rollback`);
    }

    const res = await provider.rollback(deployRequest);
    if (!res.success) {
      throw new Error(`Deployment rollback failed: ${res.errors.join('; ')}`);
    }

    // Save rollback event as audit log / update deployment status
    const supabase = getServiceSupabase();
    await supabase.from('deployments').update({ status: 'FAILED', updated_at: new Date().toISOString() }).eq('id', buildId);
  }
}
