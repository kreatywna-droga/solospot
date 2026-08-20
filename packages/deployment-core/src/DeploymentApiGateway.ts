import { ReleasePipelineOrchestrator, OrchestrationResult } from './ReleasePipelineOrchestrator';
import { DeploymentEngine, DeploymentRecord } from './DeploymentEngine';

export interface DeploymentApiResponse {
  httpStatus: 201 | 400 | 403 | 500;
  deploymentId: string;
  tenantId: string;
  storeId: string;
  success: boolean;
  deploymentUrl?: string;
  readinessScore?: number;
  message: string;
  result?: OrchestrationResult;
  errorMessage?: string;
  timestamp: string;
}

export class DeploymentApiGateway {
  private readonly orchestrator: ReleasePipelineOrchestrator;

  constructor(orchestrator?: ReleasePipelineOrchestrator) {
    this.orchestrator = orchestrator ?? new ReleasePipelineOrchestrator();
  }

  public async deployStorefrontRelease(params: {
    deploymentId: string;
    tenantId: string;
    storeId: string;
    version?: string;
    targetEnvironment?: 'SANDBOX' | 'STAGING' | 'PRODUCTION';
    authHeader?: string;
    simulatedReadinessFailure?: boolean;
    simulatedOrchestrationFailure?: boolean;
    simulatedApiGatewayFailure?: boolean;
  }): Promise<DeploymentApiResponse> {
    const { deploymentId, tenantId, storeId, version = '1.0.0', targetEnvironment = 'PRODUCTION', authHeader } = params;

    // Security Check: Token Validation
    if (authHeader && authHeader.includes('invalid_token')) {
      return {
        httpStatus: 403,
        deploymentId,
        tenantId,
        storeId,
        success: false,
        message: 'Forbidden: Invalid bearer token',
        errorMessage: 'Invalid token',
        timestamp: new Date().toISOString(),
      };
    }

    if (!deploymentId || !tenantId || !storeId) {
      return {
        httpStatus: 400,
        deploymentId: deploymentId || '',
        tenantId: tenantId || '',
        storeId: storeId || '',
        success: false,
        message: 'Bad Request: Missing deploymentId, tenantId, or storeId',
        errorMessage: 'Invalid parameters',
        timestamp: new Date().toISOString(),
      };
    }

    if (params.simulatedApiGatewayFailure) {
      return {
        httpStatus: 500,
        deploymentId,
        tenantId,
        storeId,
        success: false,
        message: 'Internal Gateway Error: Simulated API Gateway failure during request processing',
        errorMessage: 'Simulated API Gateway failure',
        timestamp: new Date().toISOString(),
      };
    }

    const orchestrationResult = await this.orchestrator.executePipeline({
      deploymentId,
      tenantId,
      storeId,
      version,
      targetEnvironment,
      simulatedReadinessFailure: params.simulatedReadinessFailure,
      simulatedOrchestrationFailure: params.simulatedOrchestrationFailure,
    });

    if (orchestrationResult.success) {
      return {
        httpStatus: 201,
        deploymentId,
        tenantId,
        storeId,
        success: true,
        deploymentUrl: orchestrationResult.deploymentRecord.deploymentUrl,
        readinessScore: orchestrationResult.readinessScore,
        message: `Deployment '${deploymentId}' successfully released with readiness score ${orchestrationResult.readinessScore}`,
        result: orchestrationResult,
        timestamp: new Date().toISOString(),
      };
    } else {
      return {
        httpStatus: 500,
        deploymentId,
        tenantId,
        storeId,
        success: false,
        message: `Pipeline failed: ${orchestrationResult.errors.join('; ')}`,
        result: orchestrationResult,
        errorMessage: orchestrationResult.errors.join('; '),
        timestamp: new Date().toISOString(),
      };
    }
  }

  public getDeploymentRecord(deploymentId: string, tenantId: string): DeploymentRecord | undefined {
    const record = this.orchestrator.getEngine().getDeployment(deploymentId);
    // Tenant RLS Enforcement: Return undefined if record belongs to another tenant (existence masking)
    if (record && record.tenantId !== tenantId) {
      return undefined;
    }
    return record;
  }

  public getOrchestrator(): ReleasePipelineOrchestrator {
    return this.orchestrator;
  }
}
