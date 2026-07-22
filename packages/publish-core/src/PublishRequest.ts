export type PublishMode = 'LIVE' | 'PREVIEW' | 'EXPORT_STATIC';

export interface PublishRequest {
  readonly tenantId: string;
  readonly storeId: string;
  readonly mode: PublishMode;
  readonly correlationId: string;
  readonly userId?: string;
  readonly timestamp: string;
  readonly metadata?: Record<string, unknown>;
}

export function createPublishRequest(params: {
  tenantId: string;
  storeId: string;
  mode?: PublishMode;
  correlationId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}): PublishRequest {
  return {
    tenantId: params.tenantId,
    storeId: params.storeId,
    mode: params.mode || 'LIVE',
    correlationId: params.correlationId || `pub_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    userId: params.userId,
    timestamp: new Date().toISOString(),
    metadata: params.metadata || {},
  };
}
