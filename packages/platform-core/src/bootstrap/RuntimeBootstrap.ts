import { PlatformState, BootstrapContext } from '../types';
import { ConfigurationManager } from '../config/PlatformConfig';
import { ConsolePlatformLogger } from '../logger/Logger';
import { PlatformEventBusImpl } from '../events/PlatformEventBus';
import { DiagnosticsRegistry } from '../diagnostics/DiagnosticsRegistry';
import { TenantResolver, TenantDatabaseProvider, TenantContext } from '../tenant';
import { TenantResolutionError } from '../errors/PlatformError';

/**
 * Platform is the central orchestrator responsible for initialization
 * and cycle management of the platform engine.
 */
export class Platform {
  private state: PlatformState = 'CREATED';
  private readonly startTime: number;
  private readonly initializedModules: string[] = [];
  private eventBus: PlatformEventBusImpl | null = null;
  private logger: ConsolePlatformLogger | null = null;
  private readonly diagnostics: DiagnosticsRegistry;

  constructor() {
    this.startTime = Date.now();
    this.diagnostics = new DiagnosticsRegistry();
  }

  public getState(): PlatformState {
    return this.state;
  }

  public getEventBus(): PlatformEventBusImpl {
    if (!this.eventBus) {
      throw new Error('EventBus is not initialized. Run bootstrap first.');
    }
    return this.eventBus;
  }

  public getLogger(): ConsolePlatformLogger {
    if (!this.logger) {
      throw new Error('Logger is not initialized. Run bootstrap first.');
    }
    return this.logger;
  }

  public getDiagnostics(): DiagnosticsRegistry {
    return this.diagnostics;
  }

  /**
   * Triggers the platform bootstrapper sequence.
   */
  public async bootstrap(): Promise<BootstrapContext> {
    this.state = 'INITIALIZING';
    const errors: Array<{ module: string; message: string; timestamp: string }> = [];
    const correlationId = `boot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // 1. Configuration loading
      const configMgr = ConfigurationManager.getInstance();
      const config = configMgr.get();
      this.initializedModules.push('Configuration');

      // 2. Logger initialization
      this.logger = new ConsolePlatformLogger();
      this.initializedModules.push('Logger');

      // 3. Event Bus startup
      this.eventBus = new PlatformEventBusImpl(this.logger);
      this.logger.setEventBus(this.eventBus);
      this.initializedModules.push('EventBus');

      // Emit Bootstrap.Started
      await this.eventBus.publish({
        eventId: `evt_boot_start_${Math.random().toString(36).substr(2, 9)}`,
        eventType: 'Bootstrap.Started',
        timestamp: new Date().toISOString(),
        correlationId,
        payload: { environment: config.environment, version: config.version },
      });

      // Emit ModuleInitialized events
      for (const mod of ['Configuration', 'Logger', 'EventBus']) {
        await this.eventBus.publish({
          eventId: `evt_mod_${mod.toLowerCase()}_${Math.random().toString(36).substr(2, 9)}`,
          eventType: 'Bootstrap.ModuleInitialized',
          timestamp: new Date().toISOString(),
          correlationId,
          payload: { moduleName: mod },
        });
      }

      // 4. Diagnostics setup
      this.initializedModules.push('Diagnostics');

      // Register standard diagnostic health checks
      this.diagnostics.register({
        name: 'EventBus',
        check: async () => ({ status: 'READY', timestamp: new Date().toISOString() }),
      });
      this.diagnostics.register({
        name: 'Logger',
        check: async () => ({ status: 'READY', timestamp: new Date().toISOString() }),
      });

      await this.eventBus.publish({
        eventId: `evt_mod_diag_${Math.random().toString(36).substr(2, 9)}`,
        eventType: 'Bootstrap.ModuleInitialized',
        timestamp: new Date().toISOString(),
        correlationId,
        payload: { moduleName: 'Diagnostics' },
      });

      // 5. Self-Check (Health check evaluation)
      const health = await this.diagnostics.evaluate();
      if (health.status === 'FAILED') {
        this.state = 'FAILED';
      } else if (health.status === 'DEGRADED') {
        this.state = 'DEGRADED';
      } else {
        this.state = 'READY';
      }

      const bootstrapTimeMs = Date.now() - this.startTime;

      if (this.state === 'READY') {
        await this.eventBus.publish({
          eventId: `evt_boot_ready_${Math.random().toString(36).substr(2, 9)}`,
          eventType: 'Bootstrap.Ready',
          timestamp: new Date().toISOString(),
          correlationId,
          payload: { bootstrapTimeMs },
        });
      } else if (this.state === 'DEGRADED') {
        await this.eventBus.publish({
          eventId: `evt_boot_degraded_${Math.random().toString(36).substr(2, 9)}`,
          eventType: 'Bootstrap.Degraded',
          timestamp: new Date().toISOString(),
          correlationId,
          payload: { bootstrapTimeMs, reason: 'Non-critical health check degraded' },
        });
      } else {
        throw new Error('Self-check evaluation returned FAILED state.');
      }

      this.logger.info({
        message: `Platform bootstrap completed in ${bootstrapTimeMs}ms. Status: ${this.state}`,
        correlationId,
        metadata: { bootstrapTimeMs, state: this.state },
      });

      if (this.dbProvider) {
        this.tenantResolver = new TenantResolver({
          dbProvider: this.dbProvider,
          eventBus: this.eventBus,
          logger: this.logger,
          environment: config.environment,
        });
      }

      return {
        platformVersion: config.version,
        environment: config.environment,
        initializedModules: this.initializedModules,
        healthStatus: this.state,
        bootstrapTimeMs,
        errors,
      };

    } catch (err: any) {
      this.state = 'FAILED';
      const errorMessage = err instanceof Error ? err.message : 'Unknown bootstrap error';
      errors.push({ module: 'BOOTSTRAP', message: errorMessage, timestamp: new Date().toISOString() });

      console.error(`❌ PLATFORM BOOTSTRAP FAILED: ${errorMessage}`);

      if (this.eventBus) {
        this.eventBus.publish({
          eventId: `evt_boot_failed_${Math.random().toString(36).substr(2, 9)}`,
          eventType: 'Bootstrap.Failed',
          timestamp: new Date().toISOString(),
          correlationId,
          payload: { error: errorMessage },
        }).catch(() => {});
      }

      throw err;
    }
  }

  private dbProvider: TenantDatabaseProvider | null = null;
  private tenantResolver: TenantResolver | null = null;

  public setDatabaseProvider(dbProvider: TenantDatabaseProvider): void {
    this.dbProvider = dbProvider;
    if (this.logger && this.eventBus) {
      this.tenantResolver = new TenantResolver({
        dbProvider,
        eventBus: this.eventBus,
        logger: this.logger,
        environment: ConfigurationManager.getInstance().get().environment,
      });
    }
  }

  public getTenantResolver(): TenantResolver {
    if (!this.tenantResolver) {
      throw new Error('TenantResolver is not initialized. Call setDatabaseProvider first.');
    }
    return this.tenantResolver;
  }

  public async handleRequest(req: { headers: Record<string, string>; url?: string }, res: any): Promise<void> {
    const startTime = Date.now();
    const correlationId = req.headers['x-correlation-id'] || req.headers['X-Correlation-Id'] || `req_${Date.now()}`;
    res.setHeader('X-Correlation-Id', correlationId);

    try {
      if (!this.tenantResolver) {
        throw new Error('TenantResolver is not configured. Set DatabaseProvider first.');
      }

      // Step 1: Detect cross-tenant attempt
      let tokenTenantId: string | null = null;
      const authHeader = req.headers['authorization'] || req.headers['Authorization'];
      if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
        const token = authHeader.substring(7);
        tokenTenantId = this.extractTenantIdFromJwt(token);
      }

      const host = req.headers['host'] || req.headers['Host'];
      let hostTenant: TenantContext | null = null;
      if (host && this.dbProvider) {
        const cleanHost = host.split(':')[0].toLowerCase();
        if (cleanHost.endsWith('.solospot.com') || cleanHost.endsWith('.solospot.pl')) {
          const parts = cleanHost.split('.');
          if (parts.length > 2) {
            hostTenant = await this.dbProvider.findBySlug(parts[0]);
          }
        } else {
          hostTenant = await this.dbProvider.findByDomain(cleanHost);
        }
      }

      // If we got a token and we have a host, verify they match
      if (tokenTenantId && hostTenant && tokenTenantId !== hostTenant.tenantId) {
        res.statusCode = 403;
        res.setHeader('X-Tenant-Id', hostTenant.tenantId);
        res.end('Forbidden: Cross-tenant access attempt');
        return;
      }

      // Step 2: Proceed with standard resolution pipeline
      const tenantContext = await this.tenantResolver.resolve(req);
      
      res.statusCode = 200;
      res.setHeader('X-Tenant-Id', tenantContext.tenantId);
      res.setHeader('Cache-Control', `public, max-age=${tenantContext.metadata.ttlSeconds || 300}`);
      
      const executionTime = Date.now() - startTime;
      res.setHeader('X-Execution-Time-Ms', String(executionTime));
      res.end(JSON.stringify({ status: 'success', tenantId: tenantContext.tenantId }));
    } catch (err: any) {
      const executionTime = Date.now() - startTime;
      res.setHeader('X-Execution-Time-Ms', String(executionTime));

      if (err instanceof TenantResolutionError) {
        if (err.code === 'TENANT_NOT_FOUND') {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'Tenant not found' }));
          return;
        }
        if (err.code === 'TENANT_SUSPENDED') {
          res.statusCode = 403;
          res.end(JSON.stringify({ error: 'Tenant suspended' }));
          return;
        }
      }

      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Internal Server Error', message: err.message }));
    }
  }

  private extractTenantIdFromJwt(token: string): string | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }
      const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const decodedPayload = typeof atob === 'function' 
        ? atob(payloadBase64) 
        : Buffer.from(payloadBase64, 'base64').toString('utf8');
      const payload = JSON.parse(decodedPayload);
      return payload.tenantId || null;
    } catch {
      return null;
    }
  }
}
