import { PlatformEventBusImpl } from '@/../packages/platform-core/src/events/PlatformEventBus';
import { EventRegistry } from '@/../packages/platform-core/src/events/EventRegistry';
import { ConsolePlatformLogger } from '@/../packages/platform-core/src/logger/Logger';
import { TenantRepository } from './TenantRepository';
import crypto from 'crypto';
import type { Tenant, TenantStatus, StoreInstance, StoreStatus } from './TenantStatus';

export class TenantProvisioningEngine {
  private readonly eventBus: PlatformEventBusImpl;
  private readonly tenantRepo: TenantRepository;
  private readonly logger: ConsolePlatformLogger;

  constructor(options: {
    eventBus: PlatformEventBusImpl;
    tenantRepo: TenantRepository;
    logger: ConsolePlatformLogger;
  }) {
    this.eventBus = options.eventBus;
    this.tenantRepo = options.tenantRepo;
    this.logger = options.logger;

    // Register provisioning events
    const provisioningEvents = [
      'Tenant.Created',
      'Store.Provisioned',
      'Tenant.Ready',
    ];
    for (const evt of provisioningEvents) {
      EventRegistry.register(evt);
    }

    // Subscribe to Order.PaymentConfirmed event
    this.eventBus.subscribe<{ orderId: string; paymentIntentId: string }>(
      'Order.PaymentConfirmed',
      async (event) => {
        const { orderId, paymentIntentId } = event.payload;
        const tenantId = event.tenantId;
        if (tenantId) {
          try {
            await this.provisionTenant(tenantId, event.correlationId);
          } catch (err: any) {
            this.logger.error({
              message: `Provisioning failed for tenant ${tenantId} on order ${orderId}: ${err.message}`,
              correlationId: event.correlationId,
              tenantId,
            });
          }
        }
      }
    );
  }

  async createTenant(tenantId: string, ownerEmail: string, packageId: string, correlationId?: string): Promise<Tenant> {
    const cid = correlationId || `tn_create_${Date.now()}`;
    
    // Create tenant in CREATED status
    const tenant = await this.tenantRepo.createTenant({
      id: tenantId,
      ownerEmail,
      packageId,
      status: 'CREATED',
    });

    // Publish Tenant.Created event
    await this.eventBus.publish({
      eventId: `evt_tn_created_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'Tenant.Created',
      timestamp: new Date().toISOString(),
      correlationId: cid,
      tenantId,
      payload: { tenantId, ownerEmail, packageId },
    });

    this.logger.info({
      message: `Tenant registered: ${tenantId}`,
      correlationId: cid,
      tenantId,
    });

    return tenant;
  }

  async provisionTenant(tenantId: string, correlationId?: string): Promise<void> {
    const cid = correlationId || `tn_prov_${Date.now()}`;

    const tenant = await this.tenantRepo.getTenant(tenantId);
    if (!tenant) {
      throw new Error(`Tenant not found: ${tenantId}`);
    }

    // Update status to PROVISIONING
    await this.tenantRepo.updateTenantStatus(tenantId, 'PROVISIONING');

    const storeName = `${tenantId} Store`;
    const store = await this.tenantRepo.createStore({
      id: crypto.randomUUID(),
      tenantId,
      name: storeName,
      slug: storeName.toLowerCase().replace(/\s+/g, '-'),
      status: 'READY',
    });

    // Update status to ACTIVE
    await this.tenantRepo.updateTenantStatus(tenantId, 'ACTIVE');

    // Publish Store.Provisioned
    await this.eventBus.publish({
      eventId: `evt_store_prov_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'Store.Provisioned',
      timestamp: new Date().toISOString(),
      correlationId: cid,
      tenantId,
      payload: { tenantId, storeId: store.id, status: 'READY' },
    });

    // Publish Tenant.Ready
    await this.eventBus.publish({
      eventId: `evt_tn_ready_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'Tenant.Ready',
      timestamp: new Date().toISOString(),
      correlationId: cid,
      tenantId,
      payload: { tenantId, status: 'ACTIVE' },
    });

    this.logger.info({
      message: `Store provisioned and tenant activated: ${tenantId}`,
      correlationId: cid,
      tenantId,
    });
  }
}
