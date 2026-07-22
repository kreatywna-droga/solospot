import { TenantContext } from './TenantTypes';
import { TenantCache } from './TenantCache';
import { PlatformEventBusImpl } from '../events/PlatformEventBus';
import { ConsolePlatformLogger } from '../logger/Logger';
import { TenantResolutionError, RuntimeError } from '../errors/PlatformError';

export interface TenantDatabaseProvider {
  findByTenantId(tenantId: string): Promise<TenantContext | null>;
  findByDomain(domain: string): Promise<TenantContext | null>;
  findBySlug(slug: string): Promise<TenantContext | null>;
}

export interface TenantL2Cache {
  get(key: string): Promise<{ context: TenantContext; expiresAt: number } | null>;
  set(key: string, context: TenantContext, ttlSeconds: number): Promise<void>;
  delete(key: string): Promise<void>;
}

export class TenantResolver {
  private readonly l1Cache: TenantCache;
  private readonly l2Cache?: TenantL2Cache;
  private readonly dbProvider: TenantDatabaseProvider;
  private readonly eventBus: PlatformEventBusImpl;
  private readonly logger: ConsolePlatformLogger;
  private readonly environment: 'development' | 'staging' | 'production';
  private readonly maxStaleMs: number;

  constructor(options: {
    dbProvider: TenantDatabaseProvider;
    eventBus: PlatformEventBusImpl;
    logger: ConsolePlatformLogger;
    environment?: 'development' | 'staging' | 'production';
    l2Cache?: TenantL2Cache;
    l1CacheTtlSeconds?: number;
    maxStaleSeconds?: number;
  }) {
    this.dbProvider = options.dbProvider;
    this.eventBus = options.eventBus;
    this.logger = options.logger;
    this.environment = options.environment || 'development';
    this.l2Cache = options.l2Cache;
    this.l1Cache = new TenantCache(options.l1CacheTtlSeconds || 300);
    this.maxStaleMs = (options.maxStaleSeconds || 86400) * 1000; // 1 day default max stale
  }

  public getL1Cache(): TenantCache {
    return this.l1Cache;
  }

  /**
   * Resolves a TenantContext from an incoming request using a prioritized pipeline.
   * Priority:
   * 1. Signed API Token
   * 2. Custom Domain
   * 3. Internal Preview URL
   * 4. Development Override (blocked in production/staging)
   */
  public async resolve(req: { headers: Record<string, string>; url?: string }): Promise<TenantContext> {
    const correlationId = req.headers['x-correlation-id'] || req.headers['X-Correlation-Id'] || `req_${Date.now()}`;
    
    // 1. Signed API Token
    let tokenTenantId: string | null = null;
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      const token = authHeader.substring(7);
      tokenTenantId = this.extractTenantIdFromJwt(token);
    }
    
    if (!tokenTenantId && req.url) {
      try {
        const urlObj = new URL(req.url, 'http://localhost');
        const apiKey = urlObj.searchParams.get('api_key');
        if (apiKey) {
          if (apiKey.includes('.')) {
            tokenTenantId = this.extractTenantIdFromJwt(apiKey);
          } else {
            tokenTenantId = apiKey;
          }
        }
      } catch {}
    }

    if (tokenTenantId) {
      return this.resolveWithCaching(
        `id:${tokenTenantId}`,
        () => this.dbProvider.findByTenantId(tokenTenantId!),
        correlationId
      );
    }

    // 2. Development Override
    const override = req.headers['x-tenant-override'] || req.headers['X-Tenant-Override'];
    if (override) {
      if (this.environment === 'development') {
        this.logger.info({
          message: `Tenant override header detected: ${override}`,
          correlationId,
        });
        return this.resolveWithCaching(
          `id:${override}`,
          () => this.dbProvider.findByTenantId(override),
          correlationId
        );
      } else {
        this.logger.warn({
          message: `Attempted X-Tenant-Override '${override}' in non-development environment '${this.environment}' blocked!`,
          correlationId,
        });
      }
    }

    // 3. Host resolution (Custom Domain or Internal Preview URL)
    const host = req.headers['host'] || req.headers['Host'];
    if (!host) {
      const errorMsg = 'Resolution failed: Missing host header';
      await this.publishFailure(correlationId, 'unknown', errorMsg);
      throw new TenantResolutionError(errorMsg, 'TENANT_NOT_FOUND', correlationId);
    }

    const cleanHost = host.split(':')[0].toLowerCase();

    // Check if preview domain
    if (cleanHost.endsWith('.solospot.com') || cleanHost.endsWith('.solospot.pl')) {
      const parts = cleanHost.split('.');
      if (parts.length > 2) {
        const slug = parts[0];
        return this.resolveWithCaching(
          `slug:${slug}`,
          () => this.dbProvider.findBySlug(slug),
          correlationId
        );
      }
    }

    // Default to custom domain lookup
    return this.resolveWithCaching(
      `domain:${cleanHost}`,
      () => this.dbProvider.findByDomain(cleanHost),
      correlationId
    );
  }

  /**
   * Helper that orchestrates L1 Cache -> L2 Cache -> DB Lookup.
   * Handles database failure (Failover to L2 stale content vs Fail-Closed).
   */
  private async resolveWithCaching(
    lookupKey: string,
    dbFetcher: () => Promise<TenantContext | null>,
    correlationId: string
  ): Promise<TenantContext> {
    const l1Key = `tenant:${lookupKey}`;
    
    // A. L1 Cache lookup
    const cachedL1 = this.l1Cache.get(l1Key);
    if (cachedL1) {
      this.verifyStatus(cachedL1, correlationId);
      return cachedL1;
    }

    // B. L2 Cache lookup
    let l2Entry: { context: TenantContext; expiresAt: number } | null = null;
    if (this.l2Cache) {
      try {
        l2Entry = await this.l2Cache.get(l1Key);
        if (l2Entry) {
          const now = Date.now();
          if (now < l2Entry.expiresAt) {
            this.verifyStatus(l2Entry.context, correlationId);
            this.l1Cache.set(l1Key, l2Entry.context);
            return l2Entry.context;
          }
        }
      } catch (err: any) {
        this.logger.error({
          message: `L2 cache fetch error: ${err.message}`,
          correlationId,
        });
      }
    }

    // C. Database lookup
    try {
      const dbContext = await dbFetcher();
      if (!dbContext) {
        throw new TenantResolutionError(
          `Tenant not found for lookup: ${lookupKey}`,
          'TENANT_NOT_FOUND',
          correlationId
        );
      }

      this.verifyStatus(dbContext, correlationId);

      // Save to L1 and L2
      this.l1Cache.set(l1Key, dbContext);
      if (this.l2Cache) {
        const ttlSeconds = dbContext.metadata.ttlSeconds || 300;
        this.l2Cache.set(l1Key, dbContext, ttlSeconds).catch(() => {});
      }

      // Publish event
      this.eventBus.publish({
        eventId: `evt_resolved_${Math.random().toString(36).substr(2, 9)}`,
        eventType: 'Tenant.Resolved',
        timestamp: new Date().toISOString(),
        correlationId,
        tenantId: dbContext.tenantId,
        payload: { lookupKey, slug: dbContext.slug },
      }).catch(() => {});

      return dbContext;
    } catch (dbErr: any) {
      // D. Fallback / Failover L2 Stale logic
      if (l2Entry && !(dbErr instanceof TenantResolutionError)) {
        const now = Date.now();
        // Check if within maxStaleMs threshold
        if (now < l2Entry.expiresAt + this.maxStaleMs) {
          this.logger.warn({
            message: `Database offline. Serving stale configuration for key ${l1Key} (SWR fallback)`,
            correlationId,
          });
          this.verifyStatus(l2Entry.context, correlationId);
          this.l1Cache.set(l1Key, l2Entry.context);
          return l2Entry.context;
        }
      }

      // E. Fail-Closed
      const finalError = dbErr instanceof TenantResolutionError 
        ? dbErr 
        : new RuntimeError(`Database unavailable during tenant resolution: ${dbErr.message}`, correlationId);

      await this.publishFailure(correlationId, lookupKey, finalError.message);
      throw finalError;
    }
  }

  private verifyStatus(context: TenantContext, correlationId: string): void {
    if (context.status === 'SUSPENDED') {
      throw new TenantResolutionError(
        `Tenant ${context.tenantId} is SUSPENDED`,
        'TENANT_SUSPENDED',
        correlationId
      );
    }
    // Note: MAINTENANCE stores can still be resolved, but rendering pipeline handles standard splash block.
  }

  private async publishFailure(correlationId: string, lookupKey: string, reason: string): Promise<void> {
    this.logger.error({
      message: `Tenant resolution failed for '${lookupKey}': ${reason}`,
      correlationId,
    });

    this.eventBus.publish({
      eventId: `evt_res_fail_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'Tenant.ResolutionFailed',
      timestamp: new Date().toISOString(),
      correlationId,
      payload: { lookupKey, reason },
    }).catch(() => {});
  }

  private extractTenantIdFromJwt(token: string): string | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }
      const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const decodedPayload = this.base64Decode(payloadBase64);
      const payload = JSON.parse(decodedPayload);
      return payload.tenantId || null;
    } catch {
      return null;
    }
  }

  private base64Decode(str: string): string {
    if (typeof atob === 'function') {
      return atob(str);
    }
    return Buffer.from(str, 'base64').toString('utf8');
  }
}
