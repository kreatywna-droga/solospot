import { RuntimeMode } from './RuntimeMode';
import { RuntimeSection, RuntimePage } from './RuntimeSection';

export type StoreLifecycleState = 'CREATED' | 'LOADING' | 'READY' | 'ACTIVE' | 'DISPOSED';

export interface RuntimeTheme {
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly font: string;
  readonly logo?: string;
  readonly favicon?: string;
  readonly description?: string;
  readonly backgroundColor?: string;
  readonly borderRadius?: string;
}

export interface StoreConfig {
  readonly storeId: string;
  readonly storeName: string;
  readonly publicationStatus: string;
  readonly template?: string;
  readonly branding: {
    readonly primaryColor: string;
    readonly secondaryColor: string;
    readonly font: string;
    readonly logo?: string;
    readonly favicon?: string;
    readonly description?: string;
  };
  readonly pages: ReadonlyArray<RuntimePage>;
  readonly products?: ReadonlyArray<RuntimeProduct>;
  readonly navigation?: ReadonlyArray<RuntimeNavigation>;
  readonly seo?: RuntimeSEO;
  readonly capabilities?: ReadonlyArray<string>;
}

export interface RuntimeProduct {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly price: number;
  readonly currency: string;
  readonly images: ReadonlyArray<string>;
}

export interface RuntimeNavigation {
  readonly label: string;
  readonly href: string;
  readonly children?: ReadonlyArray<RuntimeNavigation>;
}

export interface RuntimeSEO {
  readonly title?: string;
  readonly description?: string;
  readonly ogImage?: string;
  readonly canonicalUrl?: string;
  readonly robots?: string;
  readonly jsonLdSchema?: Record<string, unknown>;
}

export interface TenantInfo {
  readonly tenantId: string;
  readonly slug: string;
  readonly domains: {
    readonly primary: string;
    readonly custom?: string;
  };
  readonly plan: {
    readonly tier: 'FREE' | 'GROWTH' | 'ENTERPRISE';
    readonly limits: Record<string, number>;
  };
  readonly capabilities: ReadonlyArray<string>;
  readonly metadata: {
    readonly locale?: string;
    readonly currency?: string;
  };
}

export interface RuntimeContext {
  readonly mode: RuntimeMode;
  readonly tenant: TenantInfo;
  readonly config: StoreConfig;
  readonly correlationId: string;
  readonly timestamp: string;
}

export function createRuntimeContext(
  mode: RuntimeMode,
  tenant: TenantInfo,
  config: StoreConfig,
  correlationId?: string
): RuntimeContext {
  return {
    mode,
    tenant,
    config,
    correlationId: correlationId || `ctx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toISOString(),
  };
}

export interface StoreRuntimeSnapshot {
  readonly tenantId: string;
  readonly engineVersion: string;
  readonly schemaVersion: string;
  readonly packages: ReadonlyArray<PackageInfo>;
  readonly capabilities: ReadonlyArray<string>;
  readonly theme: ThemeInfo;
  readonly configuration: Record<string, unknown>;
  readonly runtimeHash: string;
  readonly composedAt: string;
}

export interface PackageInfo {
  readonly id: string;
  readonly version: string;
  readonly priority: number;
}

export interface ThemeInfo {
  readonly id: string;
  readonly version: string;
  readonly settings: Record<string, unknown>;
}