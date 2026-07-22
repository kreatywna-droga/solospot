import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PlatformEventBusImpl } from '../../platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '../../platform-core/src/logger/Logger';
import { ConfigurationManager } from '../../platform-core/src/config/PlatformConfig';
import { CustomerAccountEngine, DuplicateCustomerException } from './CustomerAccountEngine';
import { TenantSecurityException } from './CommerceEngine';

describe('Customer Account Engine', () => {
  let engine: CustomerAccountEngine;
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

    engine = new CustomerAccountEngine({ eventBus, logger });
  });

  afterEach(() => {
    (process.env as any).NODE_ENV = originalEnv;
    ConfigurationManager.resetInstanceForTesting();
    vi.restoreAllMocks();
  });

  it('Should successfully register customer, update profile, preferences and emit events', async () => {
    const tenantId = 'tenant-shop-xyz';
    const email = 'client@example.com';

    const spyPublish = vi.spyOn(eventBus, 'publish');

    // 1. Register customer
    let customer = await engine.registerCustomer(tenantId, {
      email,
      profile: {
        firstName: 'Anna',
        lastName: 'Kowalska',
      },
      preferences: {
        language: 'pl',
        preferredCurrency: 'PLN',
        marketingConsent: true,
      },
    });

    expect(customer.tenantId).toBe(tenantId);
    expect(customer.email).toBe(email);
    expect(customer.profile.firstName).toBe('Anna');
    expect(customer.preferences.marketingConsent).toBe(true);
    expect(spyPublish).toHaveBeenCalled();

    // 2. Update Profile
    customer = await engine.updateProfile(tenantId, customer.id, {
      firstName: 'Ania',
      phone: '+48123456789',
    });
    expect(customer.profile.firstName).toBe('Ania');
    expect(customer.profile.phone).toBe('+48123456789');

    // 3. Update Preferences
    customer = await engine.updatePreferences(tenantId, customer.id, {
      marketingConsent: false,
    });
    expect(customer.preferences.marketingConsent).toBe(false);
  });

  it('Should prevent duplicate customer emails within the same tenant but allow across different tenants', async () => {
    const tenantA = 'tenant-a';
    const tenantB = 'tenant-b';
    const email = 'user@example.com';

    // Register in Tenant A
    await engine.registerCustomer(tenantA, {
      email,
      profile: { firstName: 'User', lastName: 'A' },
    });

    // Try duplicate in Tenant A -> throws DuplicateCustomerException
    await expect(
      engine.registerCustomer(tenantA, {
        email,
        profile: { firstName: 'Another', lastName: 'A' },
      })
    ).rejects.toThrow(DuplicateCustomerException);

    // Register same email in Tenant B -> allowed
    const customerB = await engine.registerCustomer(tenantB, {
      email,
      profile: { firstName: 'User', lastName: 'B' },
    });

    expect(customerB.tenantId).toBe(tenantB);
    expect(customerB.email).toBe(email);
  });

  it('Should manage customer addresses and reset defaults correctly', async () => {
    const tenantId = 'tenant-shop-xyz';
    let customer = await engine.registerCustomer(tenantId, {
      email: 'addresses@example.com',
      profile: { firstName: 'Jan', lastName: 'Kowalski' },
    });

    // Add first address (SHIPPING, default = true)
    customer = await engine.addAddress(tenantId, customer.id, {
      type: 'SHIPPING',
      fullName: 'Jan Kowalski',
      street: 'Wawelska 1',
      city: 'Krakow',
      zipCode: '30-001',
      country: 'PL',
      isDefault: true,
    });

    expect(customer.addresses.length).toBe(1);
    expect(customer.addresses[0].isDefault).toBe(true);

    const firstAddressId = customer.addresses[0].id;

    // Add second address (SHIPPING, default = true) -> resets the first one
    customer = await engine.addAddress(tenantId, customer.id, {
      type: 'SHIPPING',
      fullName: 'Jan Kowalski Office',
      street: 'Florianska 10',
      city: 'Krakow',
      zipCode: '31-002',
      country: 'PL',
      isDefault: true,
    });

    expect(customer.addresses.length).toBe(2);

    const addr1 = customer.addresses.find((a) => a.id === firstAddressId);
    const addr2 = customer.addresses.find((a) => a.id !== firstAddressId);

    expect(addr1?.isDefault).toBe(false);
    expect(addr2?.isDefault).toBe(true);

    // Remove address
    customer = await engine.removeAddress(tenantId, customer.id, firstAddressId);
    expect(customer.addresses.length).toBe(1);
    expect(customer.addresses[0].id).toBe(addr2?.id);
  });

  it('Should enforce tenant isolation and throw TenantSecurityException on cross-tenant access', async () => {
    const tenantA = 'tenant-a';
    const tenantB = 'tenant-b';

    const customerA = await engine.registerCustomer(tenantA, {
      email: 'a@example.com',
      profile: { firstName: 'Alice', lastName: 'A' },
    });

    // Tenant B trying to fetch Customer A -> throws
    await expect(
      engine.getCustomer(tenantB, customerA.id)
    ).rejects.toThrow(TenantSecurityException);

    // Tenant B trying to update Customer A -> throws
    await expect(
      engine.updateProfile(tenantB, customerA.id, { firstName: 'Hack' })
    ).rejects.toThrow(TenantSecurityException);
  });
});
