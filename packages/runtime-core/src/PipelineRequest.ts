import { RuntimeMode } from './RuntimeMode';

export interface PipelineRequest {
  readonly tenantId: string;
  readonly storeId: string;
  readonly slug: string;
  readonly viewName: string;
  readonly props: Record<string, unknown>;
  readonly mode: RuntimeMode;
  readonly correlationId: string;
  readonly headers?: Record<string, string>;
  readonly locale?: string;
  readonly currency?: string;
}

export function createPipelineRequest(params: {
  tenantId: string;
  storeId: string;
  slug: string;
  viewName: string;
  props?: Record<string, unknown>;
  mode?: RuntimeMode;
  correlationId?: string;
  headers?: Record<string, string>;
  locale?: string;
  currency?: string;
}): PipelineRequest {
  return {
    tenantId: params.tenantId,
    storeId: params.storeId,
    slug: params.slug,
    viewName: params.viewName,
    props: params.props || {},
    mode: params.mode || 'LIVE',
    correlationId: params.correlationId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    headers: params.headers,
    locale: params.locale,
    currency: params.currency,
  };
}