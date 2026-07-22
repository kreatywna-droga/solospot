import { ProvisionMode } from './ProvisionMode';

export interface ProvisionRequest {
  readonly tenantId: string;
  readonly storeId: string;
  readonly storeName: string;
  readonly templateId: string;
  readonly initialPackages: ReadonlyArray<string>;
  readonly mode: ProvisionMode;
  readonly correlationId: string;
  readonly metadata?: Record<string, unknown>;
}

export interface CreateProvisionRequestParams {
  readonly tenantId: string;
  readonly storeId: string;
  readonly storeName: string;
  readonly templateId: string;
  readonly initialPackages?: ReadonlyArray<string>;
  readonly mode?: ProvisionMode;
  readonly correlationId?: string;
  readonly metadata?: Record<string, unknown>;
}

export function createProvisionRequest(params: CreateProvisionRequestParams): ProvisionRequest {
  return {
    tenantId: params.tenantId,
    storeId: params.storeId,
    storeName: params.storeName,
    templateId: params.templateId,
    initialPackages: params.initialPackages || [],
    mode: params.mode || 'LIVE',
    correlationId: params.correlationId || `prv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    metadata: params.metadata || {}
  };
}
