import { z } from 'zod';
import { PlatformEventBusImpl } from '../../platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '../../platform-core/src/logger/Logger';
import { EventRegistry } from '../../platform-core/src/events/EventRegistry';
import { TenantSecurityException } from './CommerceEngine';

export const CustomerAddressSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['SHIPPING', 'BILLING']),
  fullName: z.string().min(1),
  street: z.string().min(1),
  city: z.string().min(1),
  zipCode: z.string().min(1),
  country: z.string().min(1),
  isDefault: z.boolean(),
});
export type CustomerAddress = z.infer<typeof CustomerAddressSchema>;

export const CustomerProfileSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
});
export type CustomerProfile = z.infer<typeof CustomerProfileSchema>;

export const CustomerPreferencesSchema = z.object({
  marketingConsent: z.boolean(),
  preferredCurrency: z.string().length(3),
  language: z.string().min(2),
});
export type CustomerPreferences = z.infer<typeof CustomerPreferencesSchema>;

export const CustomerSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  email: z.string().email(),
  profile: CustomerProfileSchema,
  addresses: z.array(CustomerAddressSchema),
  preferences: CustomerPreferencesSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Customer = z.infer<typeof CustomerSchema>;

export interface RegisterCustomerDto {
  email: string;
  profile: CustomerProfile;
  preferences?: Partial<CustomerPreferences>;
}

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export class DuplicateCustomerException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DuplicateCustomerException';
  }
}

export class CustomerAccountEngine {
  private readonly eventBus: PlatformEventBusImpl;
  private readonly logger: ConsolePlatformLogger;
  private readonly customers = new Map<string, Customer>(); // In-memory simulated repository

  constructor(options: {
    eventBus: PlatformEventBusImpl;
    logger: ConsolePlatformLogger;
  }) {
    this.eventBus = options.eventBus;
    this.logger = options.logger;

    // Register all customer lifecycle events
    const customerEvents = [
      'Customer.Created',
      'Customer.Updated',
      'Customer.AddressAdded',
      'Customer.PreferencesChanged',
    ];
    for (const evt of customerEvents) {
      EventRegistry.register(evt);
    }
  }

  private enforceTenantIsolation(tenantId: string, targetTenantId: string, contextMessage: string): void {
    if (tenantId !== targetTenantId) {
      throw new TenantSecurityException(
        `Cross-tenant access blocked during customer operation: ${contextMessage}. Active: ${tenantId}, Target: ${targetTenantId}`
      );
    }
  }

  /**
   * Retrieves a customer by ID (verifying tenant isolation).
   */
  public async getCustomer(tenantId: string, customerId: string): Promise<Customer> {
    const customer = this.customers.get(customerId);
    if (!customer) {
      throw new Error(`Customer not found: ${customerId}`);
    }
    this.enforceTenantIsolation(tenantId, customer.tenantId, 'Get customer profile');
    return customer;
  }

  /**
   * Safe manual injection for testing or seeding.
   */
  public setCustomerForTesting(customer: Customer): void {
    this.customers.set(customer.id, customer);
  }

  /**
   * Registers a new customer under a tenant.
   */
  public async registerCustomer(
    tenantId: string,
    dto: RegisterCustomerDto,
    correlationId?: string
  ): Promise<Customer> {
    const cid = correlationId || `cust_reg_${Date.now()}`;

    // Ensure email uniqueness within the scope of this specific tenant
    for (const existing of this.customers.values()) {
      if (existing.tenantId === tenantId && existing.email.toLowerCase() === dto.email.toLowerCase()) {
        throw new DuplicateCustomerException(
          `Customer with email '${dto.email}' already exists in tenant '${tenantId}'`
        );
      }
    }

    const customerId = `cust_${Math.random().toString(36).substr(2, 9)}`;

    const customer: Customer = {
      id: customerId,
      tenantId,
      email: dto.email,
      profile: dto.profile,
      addresses: [],
      preferences: {
        marketingConsent: dto.preferences?.marketingConsent ?? false,
        preferredCurrency: dto.preferences?.preferredCurrency ?? 'PLN',
        language: dto.preferences?.language ?? 'pl',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    CustomerSchema.parse(customer);
    this.customers.set(customerId, customer);

    await this.eventBus.publish({
      eventId: `evt_cust_created_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'Customer.Created',
      timestamp: new Date().toISOString(),
      correlationId: cid,
      tenantId,
      payload: { customerId, email: customer.email },
    });

    return customer;
  }

  /**
   * Updates profile information.
   */
  public async updateProfile(
    tenantId: string,
    customerId: string,
    dto: UpdateProfileDto,
    correlationId?: string
  ): Promise<Customer> {
    const cid = correlationId || `cust_up_${Date.now()}`;
    const customer = await this.getCustomer(tenantId, customerId);

    const updatedCustomer: Customer = {
      ...customer,
      profile: {
        firstName: dto.firstName ?? customer.profile.firstName,
        lastName: dto.lastName ?? customer.profile.lastName,
        phone: dto.phone !== undefined ? dto.phone : customer.profile.phone,
      },
      updatedAt: new Date().toISOString(),
    };

    CustomerSchema.parse(updatedCustomer);
    this.customers.set(customerId, updatedCustomer);

    await this.eventBus.publish({
      eventId: `evt_cust_up_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'Customer.Updated',
      timestamp: new Date().toISOString(),
      correlationId: cid,
      tenantId,
      payload: { customerId },
    });

    return updatedCustomer;
  }

  /**
   * Adds an address to the customer profile.
   */
  public async addAddress(
    tenantId: string,
    customerId: string,
    addressDto: Omit<CustomerAddress, 'id'>,
    correlationId?: string
  ): Promise<Customer> {
    const cid = correlationId || `cust_addr_${Date.now()}`;
    const customer = await this.getCustomer(tenantId, customerId);

    const addressId = `addr_${Math.random().toString(36).substr(2, 9)}`;
    const newAddress: CustomerAddress = {
      ...addressDto,
      id: addressId,
    };

    // If new address is default, reset existing defaults of the same type
    let updatedAddresses = customer.addresses.map((addr) => {
      if (newAddress.isDefault && addr.type === newAddress.type) {
        return { ...addr, isDefault: false };
      }
      return addr;
    });

    updatedAddresses.push(newAddress);

    const updatedCustomer: Customer = {
      ...customer,
      addresses: updatedAddresses,
      updatedAt: new Date().toISOString(),
    };

    CustomerSchema.parse(updatedCustomer);
    this.customers.set(customerId, updatedCustomer);

    await this.eventBus.publish({
      eventId: `evt_cust_addr_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'Customer.AddressAdded',
      timestamp: new Date().toISOString(),
      correlationId: cid,
      tenantId,
      payload: { customerId, addressId },
    });

    return updatedCustomer;
  }

  /**
   * Removes an address.
   */
  public async removeAddress(
    tenantId: string,
    customerId: string,
    addressId: string,
    correlationId?: string
  ): Promise<Customer> {
    const customer = await this.getCustomer(tenantId, customerId);

    const updatedAddresses = customer.addresses.filter((addr) => addr.id !== addressId);

    const updatedCustomer: Customer = {
      ...customer,
      addresses: updatedAddresses,
      updatedAt: new Date().toISOString(),
    };

    CustomerSchema.parse(updatedCustomer);
    this.customers.set(customerId, updatedCustomer);
    return updatedCustomer;
  }

  /**
   * Updates preferences (consent, preferred language/currency).
   */
  public async updatePreferences(
    tenantId: string,
    customerId: string,
    preferences: Partial<CustomerPreferences>,
    correlationId?: string
  ): Promise<Customer> {
    const cid = correlationId || `cust_pref_${Date.now()}`;
    const customer = await this.getCustomer(tenantId, customerId);

    const updatedCustomer: Customer = {
      ...customer,
      preferences: {
        marketingConsent: preferences.marketingConsent ?? customer.preferences.marketingConsent,
        preferredCurrency: preferences.preferredCurrency ?? customer.preferences.preferredCurrency,
        language: preferences.language ?? customer.preferences.language,
      },
      updatedAt: new Date().toISOString(),
    };

    CustomerSchema.parse(updatedCustomer);
    this.customers.set(customerId, updatedCustomer);

    await this.eventBus.publish({
      eventId: `evt_cust_pref_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'Customer.PreferencesChanged',
      timestamp: new Date().toISOString(),
      correlationId: cid,
      tenantId,
      payload: { customerId },
    });

    return updatedCustomer;
  }
}
