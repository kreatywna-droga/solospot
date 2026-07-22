import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PlatformEventBusImpl } from '../../platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '../../platform-core/src/logger/Logger';
import { ConfigurationManager } from '../../platform-core/src/config/PlatformConfig';
import { InventoryEngine } from './InventoryEngine';
import { InsufficientInventoryException } from './CartRuntime';
import { TenantSecurityException } from './CommerceEngine';

describe('Inventory Engine', () => {
  let engine: InventoryEngine;
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

    engine = new InventoryEngine({ eventBus, logger });
  });

  afterEach(() => {
    (process.env as any).NODE_ENV = originalEnv;
    ConfigurationManager.resetInstanceForTesting();
    vi.restoreAllMocks();
  });

  it('Should reserve, commit stock and generate correct movements', async () => {
    const tenantId = 'tenant-shop-xyz';
    const productId = 'prod_test_item';
    const orderId = 'ord_111';

    // 1. Initialize stock to 10
    engine.initializeStock(tenantId, productId, 10, 3);

    // 2. Reserve 4 units
    const reservation = await engine.reserveStock(tenantId, orderId, productId, 4, 30);
    expect(reservation.productId).toBe(productId);
    expect(reservation.quantity).toBe(4);
    expect(reservation.status).toBe('PENDING');

    // Verify stock state (available: 6, reserved: 4)
    let stock = await engine.getStock(tenantId, productId);
    expect(stock.quantityAvailable).toBe(6);
    expect(stock.quantityReserved).toBe(4);

    // 3. Commit stock
    const movement = await engine.commitStock(tenantId, reservation.id);
    expect(movement.productId).toBe(productId);
    expect(movement.quantityDelta).toBe(-4);
    expect(movement.type).toBe('RESERVATION_COMMIT');

    // Verify final stock state (available: 6, reserved: 0)
    stock = await engine.getStock(tenantId, productId);
    expect(stock.quantityAvailable).toBe(6);
    expect(stock.quantityReserved).toBe(0);

    const movements = engine.getMovementsForTesting(tenantId);
    expect(movements.length).toBe(1);
    expect(movements[0].id).toBe(movement.id);
  });

  it('Should throw InsufficientInventoryException when reserving exceeds available stock', async () => {
    const tenantId = 'tenant-shop-xyz';
    const productId = 'prod_test_item';

    engine.initializeStock(tenantId, productId, 5, 2);

    await expect(
      engine.reserveStock(tenantId, 'ord_123', productId, 6, 30)
    ).rejects.toThrow(InsufficientInventoryException);
  });

  it('Should release stock back to available list', async () => {
    const tenantId = 'tenant-shop-xyz';
    const productId = 'prod_test_item';
    const orderId = 'ord_111';

    engine.initializeStock(tenantId, productId, 10);

    const reservation = await engine.reserveStock(tenantId, orderId, productId, 3, 30);
    let stock = await engine.getStock(tenantId, productId);
    expect(stock.quantityAvailable).toBe(7);
    expect(stock.quantityReserved).toBe(3);

    // Release reservation
    await engine.releaseStock(tenantId, reservation.id);

    stock = await engine.getStock(tenantId, productId);
    expect(stock.quantityAvailable).toBe(10);
    expect(stock.quantityReserved).toBe(0);
  });

  it('Should emit low stock warning event when stock falls below threshold', async () => {
    const tenantId = 'tenant-shop-xyz';
    const productId = 'prod_test_item';

    engine.initializeStock(tenantId, productId, 10, 3);

    const spyPublish = vi.spyOn(eventBus, 'publish');

    // Reduce stock by 8 units (new level: 2 <= threshold 3)
    await engine.adjustStock(tenantId, productId, -8, 'ADJUSTMENT', 'Damage correction');

    expect(spyPublish).toHaveBeenCalled();
    const eventCall = spyPublish.mock.calls.find((call) => call[0].eventType === 'Inventory.LowStock');
    expect(eventCall).toBeDefined();
    expect(eventCall?.[0].payload.quantityAvailable).toBe(2);
  });

  it('Should enforce tenant boundaries and throw TenantSecurityException on cross-tenant operations', async () => {
    const tenantA = 'tenant-a';
    const tenantB = 'tenant-b';
    const productId = 'prod_test_item';

    engine.initializeStock(tenantA, productId, 10);

    const reservation = await engine.reserveStock(tenantA, 'ord_123', productId, 2, 30);

    // Tenant B attempts to commit Tenant A's reservation -> throws TenantSecurityException
    await expect(
      engine.commitStock(tenantB, reservation.id)
    ).rejects.toThrow(TenantSecurityException);

    // Tenant B attempts to release Tenant A's reservation -> throws TenantSecurityException
    await expect(
      engine.releaseStock(tenantB, reservation.id)
    ).rejects.toThrow(TenantSecurityException);
  });
});
