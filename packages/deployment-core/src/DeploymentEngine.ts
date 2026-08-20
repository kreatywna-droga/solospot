export type DeploymentStatus = 'IDLE' | 'PREPARING' | 'DEPLOYING' | 'ACCREDITING' | 'RELEASED' | 'ROLLED_BACK' | 'FAILED';

export interface DeploymentRecord {
  readonly deploymentId: string;
  readonly tenantId: string;
  readonly storeId: string;
  readonly version: string;
  readonly targetEnvironment: 'SANDBOX' | 'STAGING' | 'PRODUCTION';
  status: DeploymentStatus;
  readinessScore?: number;
  deploymentUrl?: string;
  readonly createdAt: string;
  updatedAt: string;
  readonly metadata?: Record<string, unknown>;
}

export class DeploymentEngine {
  private readonly deployments: Map<string, DeploymentRecord> = new Map();

  public createDeployment(params: {
    deploymentId: string;
    tenantId: string;
    storeId: string;
    version: string;
    targetEnvironment?: 'SANDBOX' | 'STAGING' | 'PRODUCTION';
    metadata?: Record<string, unknown>;
  }): DeploymentRecord {
    if (!params.deploymentId || !params.tenantId || !params.storeId) {
      throw new Error('deploymentId, tenantId, and storeId are required');
    }

    if (this.deployments.has(params.deploymentId)) {
      throw new Error(`Deployment with id '${params.deploymentId}' already exists`);
    }

    const record: DeploymentRecord = {
      deploymentId: params.deploymentId,
      tenantId: params.tenantId,
      storeId: params.storeId,
      version: params.version || '1.0.0',
      targetEnvironment: params.targetEnvironment || 'PRODUCTION',
      status: 'IDLE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: params.metadata || {},
    };

    this.deployments.set(params.deploymentId, record);
    return record;
  }

  public updateStatus(deploymentId: string, status: DeploymentStatus, metadata?: Record<string, unknown>): DeploymentRecord {
    const record = this.deployments.get(deploymentId);
    if (!record) {
      throw new Error(`Deployment '${deploymentId}' not found`);
    }

    record.status = status;
    record.updatedAt = new Date().toISOString();
    if (metadata) {
      (record as any).metadata = { ...record.metadata, ...metadata };
    }
    return record;
  }

  public setReadinessScore(deploymentId: string, score: number): DeploymentRecord {
    const record = this.deployments.get(deploymentId);
    if (!record) {
      throw new Error(`Deployment '${deploymentId}' not found`);
    }

    record.readinessScore = score;
    record.updatedAt = new Date().toISOString();
    return record;
  }

  public setDeploymentUrl(deploymentId: string, url: string): DeploymentRecord {
    const record = this.deployments.get(deploymentId);
    if (!record) {
      throw new Error(`Deployment '${deploymentId}' not found`);
    }

    record.deploymentUrl = url;
    record.updatedAt = new Date().toISOString();
    return record;
  }

  public getDeployment(deploymentId: string): DeploymentRecord | undefined {
    return this.deployments.get(deploymentId);
  }

  public rollbackDeployment(deploymentId: string, reason: string): DeploymentRecord {
    const record = this.deployments.get(deploymentId);
    if (!record) {
      throw new Error(`Deployment '${deploymentId}' not found`);
    }

    record.status = 'ROLLED_BACK';
    record.updatedAt = new Date().toISOString();
    (record as any).metadata = {
      ...record.metadata,
      rolledBackAt: record.updatedAt,
      rollbackReason: reason,
    };
    return record;
  }

  public deleteDeployment(deploymentId: string): boolean {
    return this.deployments.delete(deploymentId);
  }

  public listDeployments(tenantId?: string): DeploymentRecord[] {
    const all = Array.from(this.deployments.values());
    return tenantId ? all.filter(d => d.tenantId === tenantId) : all;
  }
}
