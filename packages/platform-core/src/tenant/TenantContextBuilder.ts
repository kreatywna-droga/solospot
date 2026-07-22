import { TenantContext, TenantContextSchema } from './TenantTypes';

/**
 * TenantContextBuilder safely creates, validates, and freezes a TenantContext
 * to prevent runtime mutation and assure data integrity.
 */
export class TenantContextBuilder {
  private rawContext: Partial<TenantContext> = {
    domains: { primary: '' },
    plan: { tier: 'FREE', limits: {} },
    capabilities: [],
    metadata: { cacheKey: '', lastRefresh: '', ttlSeconds: 300 }
  };

  public setTenantId(tenantId: string): this {
    this.rawContext.tenantId = tenantId;
    return this;
  }

  public setSlug(slug: string): this {
    this.rawContext.slug = slug;
    return this;
  }

  public setStatus(status: 'ACTIVE' | 'SUSPENDED' | 'MAINTENANCE'): this {
    this.rawContext.status = status;
    return this;
  }

  public setDomains(domains: { primary: string; custom?: string }): this {
    this.rawContext.domains = domains;
    return this;
  }

  public setPlan(plan: { tier: 'FREE' | 'GROWTH' | 'ENTERPRISE'; limits: Record<string, number> }): this {
    this.rawContext.plan = plan;
    return this;
  }

  public setCapabilities(capabilities: string[]): this {
    this.rawContext.capabilities = capabilities;
    return this;
  }

  public setMetadata(metadata: { cacheKey: string; lastRefresh: string; ttlSeconds: number; locale?: string; currency?: string }): this {
    this.rawContext.metadata = metadata;
    return this;
  }

  /**
   * Validates data against the schema and freezes the object.
   */
  public build(): TenantContext {
    const parsed = TenantContextSchema.safeParse(this.rawContext);
    if (!parsed.success) {
      throw new Error(`Invalid tenant context configuration: ${JSON.stringify(parsed.error.format())}`);
    }

    return this.deepFreeze(parsed.data);
  }

  private deepFreeze<T extends Record<string, any>>(obj: T): T {
    Object.freeze(obj);
    Object.getOwnPropertyNames(obj).forEach((prop) => {
      if (
        obj.hasOwnProperty(prop) &&
        obj[prop] !== null &&
        (typeof obj[prop] === 'object' || typeof obj[prop] === 'function') &&
        !Object.isFrozen(obj[prop])
      ) {
        this.deepFreeze(obj[prop]);
      }
    });
    return obj;
  }
}
