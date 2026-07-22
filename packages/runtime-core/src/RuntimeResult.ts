import { RuntimePage, RuntimeSection } from './RuntimeSection';
import { RuntimeTheme } from './RuntimeContext';

export interface RuntimeResult {
  readonly success: boolean;
  readonly storeId: string;
  readonly tenantId: string;
  readonly slug: string;
  readonly version: string;
  readonly page: RuntimePage;
  readonly sections: ReadonlyArray<RuntimeSection>;
  readonly theme: RuntimeTheme;
  readonly errors?: ReadonlyArray<string>;
  readonly metadata?: Record<string, unknown>;
  readonly mode?: 'LIVE' | 'PREVIEW' | 'EXPORT';
  readonly renderedAt?: string;
}

export interface RuntimeError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly recoverable: boolean;
}

export function createSuccessResult(
  storeId: string,
  tenantId: string,
  slug: string,
  version: string,
  page: RuntimePage,
  sections: ReadonlyArray<RuntimeSection>,
  theme: RuntimeTheme,
  metadata?: Record<string, unknown>
): RuntimeResult {
  return {
    success: true,
    storeId,
    tenantId,
    slug,
    version,
    page,
    sections,
    theme,
    errors: undefined,
    metadata,
    mode: (metadata?.mode as 'LIVE' | 'PREVIEW' | 'EXPORT') || undefined,
    renderedAt: metadata?.renderedAt as string | undefined,
  };
}

export function createErrorResult(
  storeId: string,
  tenantId: string,
  slug: string,
  version: string,
  errors: ReadonlyArray<string>,
  page?: RuntimePage,
  sections?: ReadonlyArray<RuntimeSection>,
  theme?: RuntimeTheme
): RuntimeResult {
  return {
    success: false,
    storeId,
    tenantId,
    slug,
    version,
    page: page || { id: '', slug: '', name: '', sections: [] },
    sections: sections || [],
    theme: theme || { primaryColor: '#7c3aed', secondaryColor: '#ec4899', font: 'Inter' },
    errors,
    metadata: undefined,
  };
}

export function isSuccessResult(result: RuntimeResult): boolean {
  return result.success && (result.errors?.length ?? 0) === 0;
}

export function getResultErrors(result: RuntimeResult): ReadonlyArray<string> {
  return result.errors || [];
}