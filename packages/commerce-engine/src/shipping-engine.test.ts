import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PlatformEventBusImpl } from '../../platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '../../platform-core/src/logger/Logger';
import { ConfigurationManager } from '../../platform-core/src/config/PlatformConfig';
import { ShippingEngine, InvalidShipmentStateException } from './ShippingEngine';
import { TenantSecurityException } from './CommerceEngine';

describe('Shipping Engine', () => {
  let engine: ShippingEngine;
  let eventBus: PlatformEventBusImpl;
  let logger: ConsolePlatformLogger;
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
    (process.env as any).NODE_ENV = 'development';
    ConfigurationManager.resetInstanceForTesting();

    logger = new ConsolePlatformLogger();
    eventBus = new PlatformEventBusImpl(logger);
    logger.setEventBus(eventBus);

    engine = new ShippingEngine({ eventBus, logger });
  });

  afterEach(() => {
    (process.env as any).NODE_ENV = originalEnv;
    ConfigurationManager.resetInstanceForTesting();
    vi.restoreAllMocks();
  });

  it('Should transition shipment states correctly in happy path: CREATED -> READY_FOR_PICKUP -> IN_TRANSIT -> DELIVERED', async () => {
    const tenantId = 'tenant-shop-xyz';
    const methodId = 'meth_dhl_courier';
    const orderId = 'ord_12345';

    // 1. Register shipping method
    engine.registerShippingMethod({
      id: methodId,
      tenantId,
      name: 'DHL Courier',
      code: 'dhl_courier',
      carrier: 'DHL',
      priceGross: 1999, // 19.99 PLN
      isActive: true,
    });

    const recipientAddress = {
      fullName: 'Jan Kowalski',
      street: 'Krucza 5',
      city: 'Warszawa',
      zipCode: '00-001',
      country: 'PL',
    };

    const spyPublish = vi.spyOn(eventBus, 'publish');

    // 2. Create shipment (status CREATED)
    let shipment = await engine.createShipment(tenantId, orderId, methodId, recipientAddress);
    expect(shipment.status).toBe('CREATED');
    expect(shipment.orderId).toBe(orderId);

    // Verify Shipping.Created event was sent
    expect(spyPublish).toHaveBeenCalled();
    expect(spyPublish.mock.calls[0][0].eventType).toBe('Shipping.Created');

    // 3. Generate Label (status READY_FOR_PICKUP)
    shipment = await engine.generateLabel(tenantId, shipment.id);
    expect(shipment.status).toBe('READY_FOR_PICKUP');
    expect(shipment.trackingNumber).toContain('DHL_TRK_');
    expect(shipment.labelUrl).toContain('https://labels.platform.com/dhl/');

    // Verify LabelGenerated event was sent
    const labelGenEvent = spyPublish.mock.calls.find((call) => call[0].eventType === 'Shipping.LabelGenerated');
    expect(labelGenEvent).toBeDefined();

    // 4. Update status: READY_FOR_PICKUP -> IN_TRANSIT
    shipment = await engine.updateStatus(tenantId, shipment.id, 'IN_TRANSIT');
    expect(shipment.status).toBe('IN_TRANSIT');

    // 5. Update status: IN_TRANSIT -> DELIVERED
    shipment = await engine.updateStatus(tenantId, shipment.id, 'DELIVERED');
    expect(shipment.status).toBe('DELIVERED');

    // Verify Delivered event was sent
    const deliveredEvent = spyPublish.mock.calls.find((call) => call[0].eventType === 'Shipping.Delivered');
    expect(deliveredEvent).toBeDefined();
  });

  it('Should throw InvalidShipmentStateException for invalid state transitions', async () => {
    const tenantId = 'tenant-shop-xyz';
    const methodId = 'meth_inpost_paczkomat';
    const orderId = 'ord_12345';

    engine.registerShippingMethod({
      id: methodId,
      tenantId,
      name: 'InPost Paczkomat',
      code: 'inpost_paczkomat',
      carrier: 'INPOST',
      priceGross: 1299,
      isActive: true,
    });

    const shipment = await engine.createShipment(tenantId, orderId, methodId, {
      fullName: 'Anna Kowalska',
      street: 'Wesoła 2',
      city: 'Gdańsk',
      zipCode: '80-001',
      country: 'PL',
    });

    // Cannot transition directly from CREATED to DELIVERED
    await expect(
      engine.updateStatus(tenantId, shipment.id, 'DELIVERED')
    ).rejects.toThrow(InvalidShipmentStateException);
  });

  it('Should throw TenantSecurityException on cross-tenant shipping operations', async () => {
    const tenantA = 'tenant-a';
    const tenantB = 'tenant-b';
    const methodId = 'meth_dhl';

    engine.registerShippingMethod({
      id: methodId,
      tenantId: tenantA,
      name: 'DHL',
      code: 'dhl',
      carrier: 'DHL',
      priceGross: 1500,
      isActive: true,
    });

    // Tenant B attempts to use Tenant A's shipping method -> throws TenantSecurityException
    await expect(
      engine.createShipment(tenantB, 'ord_123', methodId, {
        fullName: 'Test User',
        street: 'Main St 1',
        city: 'City',
        zipCode: '12345',
        country: 'US',
      })
    ).rejects.toThrow(TenantSecurityException);

    // Create a valid shipment under Tenant A
    const shipmentA = await engine.createShipment(tenantA, 'ord_123', methodId, {
      fullName: 'Test User',
      street: 'Main St 1',
      city: 'City',
      zipCode: '12345',
      country: 'US',
    });

    // Tenant B attempts to access shipment details -> throws TenantSecurityException
    await expect(
      engine.getShipment(tenantB, shipmentA.id)
    ).rejects.toThrow(TenantSecurityException);

    // Tenant B attempts to generate label -> throws TenantSecurityException
    await expect(
      engine.generateLabel(tenantB, shipmentA.id)
    ).rejects.toThrow(TenantSecurityException);
  });
});
