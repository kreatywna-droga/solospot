import { z } from 'zod';
import { PlatformEventBusImpl } from '../../platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '../../platform-core/src/logger/Logger';
import { EventRegistry } from '../../platform-core/src/events/EventRegistry';
import { TenantSecurityException } from './CommerceEngine';
import { ShippingProviderAdapter, MockShippingProviderAdapter } from './ShippingProviderAdapter';

export const ShippingMethodSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  name: z.string().min(1),
  code: z.string().min(1),
  carrier: z.string().min(1),
  priceGross: z.number().int().nonnegative(),
  isActive: z.boolean(),
});
export type ShippingMethod = z.infer<typeof ShippingMethodSchema>;

export const ShipmentStatusSchema = z.enum([
  'CREATED',
  'READY_FOR_PICKUP',
  'IN_TRANSIT',
  'DELIVERED',
  'FAILED',
  'CANCELLED',
]);
export type ShipmentStatus = z.infer<typeof ShipmentStatusSchema>;

export const ShipmentSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  orderId: z.string().min(1),
  shippingMethodId: z.string().min(1),
  status: ShipmentStatusSchema,
  trackingNumber: z.string().optional(),
  labelUrl: z.string().optional(),
  recipientAddress: z.object({
    fullName: z.string().min(1),
    street: z.string().min(1),
    city: z.string().min(1),
    zipCode: z.string().min(1),
    country: z.string().min(1),
  }),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Shipment = z.infer<typeof ShipmentSchema>;

export class InvalidShipmentStateException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidShipmentStateException';
  }
}

export class ShippingEngine {
  private readonly eventBus: PlatformEventBusImpl;
  private readonly logger: ConsolePlatformLogger;

  // In-memory repositories
  private readonly shipments = new Map<string, Shipment>();
  private readonly shippingMethods = new Map<string, ShippingMethod>();
  private readonly adapters = new Map<string, ShippingProviderAdapter>();

  private readonly allowedTransitions: Record<ShipmentStatus, Set<ShipmentStatus>> = {
    CREATED: new Set(['READY_FOR_PICKUP', 'CANCELLED']),
    READY_FOR_PICKUP: new Set(['IN_TRANSIT', 'CANCELLED']),
    IN_TRANSIT: new Set(['DELIVERED', 'FAILED']),
    DELIVERED: new Set([]),
    FAILED: new Set([]),
    CANCELLED: new Set([]),
  };

  constructor(options: {
    eventBus: PlatformEventBusImpl;
    logger: ConsolePlatformLogger;
  }) {
    this.eventBus = options.eventBus;
    this.logger = options.logger;

    // Register default mock adapters
    this.registerAdapter(new MockShippingProviderAdapter('DHL'));
    this.registerAdapter(new MockShippingProviderAdapter('INPOST'));

    // Register all shipping events
    const shippingEvents = [
      'Shipping.Created',
      'Shipping.LabelGenerated',
      'Shipping.Dispatched',
      'Shipping.Delivered',
      'Shipping.Failed',
    ];
    for (const evt of shippingEvents) {
      EventRegistry.register(evt);
    }
  }

  private enforceTenantIsolation(tenantId: string, targetTenantId: string, contextMessage: string): void {
    if (tenantId !== targetTenantId) {
      throw new TenantSecurityException(
        `Cross-tenant access blocked during shipping operation: ${contextMessage}. Active: ${tenantId}, Target: ${targetTenantId}`
      );
    }
  }

  /**
   * Register a new carrier adapter
   */
  public registerAdapter(adapter: ShippingProviderAdapter): void {
    this.adapters.set(adapter.getCarrierCode().toUpperCase(), adapter);
  }

  /**
   * Register or update a shipping method for a tenant
   */
  public registerShippingMethod(method: ShippingMethod): void {
    ShippingMethodSchema.parse(method);
    this.shippingMethods.set(method.id, method);
  }

  /**
   * Fetch a shipment record (with isolation checks).
   */
  public async getShipment(tenantId: string, shipmentId: string): Promise<Shipment> {
    const shipment = this.shipments.get(shipmentId);
    if (!shipment) {
      throw new Error(`Shipment not found: ${shipmentId}`);
    }
    this.enforceTenantIsolation(tenantId, shipment.tenantId, 'Get shipment details');
    return shipment;
  }

  /**
   * Get all active shipping methods for a tenant
   */
  public async getShippingMethods(tenantId: string): Promise<ShippingMethod[]> {
    return Array.from(this.shippingMethods.values()).filter(
      (m) => m.tenantId === tenantId && m.isActive
    );
  }

  /**
   * Creates a new shipment record.
   */
  public async createShipment(
    tenantId: string,
    orderId: string,
    shippingMethodId: string,
    recipientAddress: Shipment['recipientAddress'],
    correlationId?: string
  ): Promise<Shipment> {
    const cid = correlationId || `shp_create_${Date.now()}`;

    const method = this.shippingMethods.get(shippingMethodId);
    if (!method) {
      throw new Error(`Shipping method not found: ${shippingMethodId}`);
    }
    this.enforceTenantIsolation(tenantId, method.tenantId, 'Use shipping method');

    const shipmentId = `shp_${Math.random().toString(36).substr(2, 9)}`;
    const shipment: Shipment = {
      id: shipmentId,
      tenantId,
      orderId,
      shippingMethodId,
      status: 'CREATED',
      recipientAddress,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    ShipmentSchema.parse(shipment);
    this.shipments.set(shipmentId, shipment);

    await this.eventBus.publish({
      eventId: `evt_shp_created_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'Shipping.Created',
      timestamp: new Date().toISOString(),
      correlationId: cid,
      tenantId,
      payload: { shipmentId, orderId },
    });

    return shipment;
  }

  /**
   * Calls external carrier API via adapter to get tracking info and generate labels.
   */
  public async generateLabel(
    tenantId: string,
    shipmentId: string,
    correlationId?: string
  ): Promise<Shipment> {
    const cid = correlationId || `shp_label_${Date.now()}`;
    const shipment = await this.getShipment(tenantId, shipmentId);

    if (shipment.status !== 'CREATED') {
      throw new InvalidShipmentStateException(
        `Cannot generate label for shipment '${shipmentId}' in status '${shipment.status}'`
      );
    }

    const method = this.shippingMethods.get(shipment.shippingMethodId);
    if (!method) {
      throw new Error(`Shipping method not found for shipment: ${shipment.shippingMethodId}`);
    }

    const adapter = this.adapters.get(method.carrier.toUpperCase());
    if (!adapter) {
      throw new Error(`No shipping provider adapter found for carrier: ${method.carrier}`);
    }

    const labelResult = await adapter.createShipment(shipment.recipientAddress);

    const updatedShipment: Shipment = {
      ...shipment,
      status: 'READY_FOR_PICKUP',
      trackingNumber: labelResult.trackingNumber,
      labelUrl: labelResult.labelUrl,
      updatedAt: new Date().toISOString(),
    };

    ShipmentSchema.parse(updatedShipment);
    this.shipments.set(shipmentId, updatedShipment);

    await this.eventBus.publish({
      eventId: `evt_shp_label_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'Shipping.LabelGenerated',
      timestamp: new Date().toISOString(),
      correlationId: cid,
      tenantId,
      payload: { shipmentId, trackingNumber: labelResult.trackingNumber },
    });

    return updatedShipment;
  }

  /**
   * Advances shipment status and triggers appropriate domain events.
   */
  public async updateStatus(
    tenantId: string,
    shipmentId: string,
    nextStatus: ShipmentStatus,
    correlationId?: string
  ): Promise<Shipment> {
    const cid = correlationId || `shp_stat_${Date.now()}`;
    const shipment = await this.getShipment(tenantId, shipmentId);

    const allowed = this.allowedTransitions[shipment.status];
    if (!allowed || !allowed.has(nextStatus)) {
      throw new InvalidShipmentStateException(
        `Invalid shipment status transition for '${shipmentId}': '${shipment.status}' -> '${nextStatus}'`
      );
    }

    const updatedShipment: Shipment = {
      ...shipment,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    };

    ShipmentSchema.parse(updatedShipment);
    this.shipments.set(shipmentId, updatedShipment);

    let eventType = '';
    if (nextStatus === 'IN_TRANSIT') {
      eventType = 'Shipping.Dispatched';
    } else if (nextStatus === 'DELIVERED') {
      eventType = 'Shipping.Delivered';
    } else if (nextStatus === 'FAILED') {
      eventType = 'Shipping.Failed';
    }

    if (eventType) {
      await this.eventBus.publish({
        eventId: `evt_shp_ev_${Math.random().toString(36).substr(2, 9)}`,
        eventType,
        timestamp: new Date().toISOString(),
        correlationId: cid,
        tenantId,
        payload: { shipmentId, orderId: shipment.orderId },
      });
    }

    return updatedShipment;
  }
}
