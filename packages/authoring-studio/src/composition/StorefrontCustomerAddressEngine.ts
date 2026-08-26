/**
 * StorefrontCustomerAddressEngine.ts — Sprint G1-96 Customer Address & Profile Engine (Night Shift Level 58)
 *
 * Provides pure TypeScript, headless customer saved address management, billing/shipping distinction,
 * default address assignment, validation, and address selection during checkout.
 *
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

export type AddressType = 'SHIPPING' | 'BILLING' | 'BOTH';

export interface CustomerAddressDTO {
  readonly addressId: string;
  readonly tenantId: string;
  readonly customerId: string;
  readonly type: AddressType;
  readonly isDefaultShipping: boolean;
  readonly isDefaultBilling: boolean;
  readonly fullName: string;
  readonly company?: string;
  readonly street1: string;
  readonly street2?: string;
  readonly city: string;
  readonly stateProvince: string;
  readonly postalCode: string;
  readonly countryCode: string; // ISO 2-letter
  readonly phone?: string;
  readonly createdAtMs: number;
  readonly updatedAtMs: number;
}

export interface AddressValidationResultDTO {
  readonly valid: boolean;
  readonly errors: ReadonlyArray<string>;
}

export interface CustomerAddressEngineStateDTO {
  readonly tenantId: string;
  readonly addresses: Record<string, CustomerAddressDTO>;
}

export class StorefrontCustomerAddressEngine {
  private readonly tenantId: string;
  private addresses: Map<string, CustomerAddressDTO> = new Map(); // addressId -> CustomerAddressDTO

  constructor(tenantId = 'default_tenant') {
    this.tenantId = tenantId;
  }

  /**
   * Validates structural address formatting.
   */
  public validateAddress(params: Partial<CustomerAddressDTO>): AddressValidationResultDTO {
    const errors: string[] = [];

    if (!params.fullName || params.fullName.trim().length === 0) {
      errors.push('Full name is required');
    }
    if (!params.street1 || params.street1.trim().length === 0) {
      errors.push('Street address (street1) is required');
    }
    if (!params.city || params.city.trim().length === 0) {
      errors.push('City is required');
    }
    if (!params.postalCode || params.postalCode.trim().length === 0) {
      errors.push('Postal code is required');
    }
    if (!params.countryCode || params.countryCode.trim().length !== 2) {
      errors.push('Country code must be a valid 2-letter ISO code');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Adds a new customer address to their profile.
   */
  public addAddress(
    customerId: string,
    params: {
      fullName: string;
      company?: string;
      street1: string;
      street2?: string;
      city: string;
      stateProvince: string;
      postalCode: string;
      countryCode: string;
      phone?: string;
      type?: AddressType;
      isDefaultShipping?: boolean;
      isDefaultBilling?: boolean;
    }
  ): CustomerAddressDTO {
    if (!customerId) {
      throw new Error('customerId is required to add an address');
    }

    const validation = this.validateAddress(params);
    if (!validation.valid) {
      throw new Error(`Address validation failed: ${validation.errors.join(', ')}`);
    }

    const now = Date.now();
    const addressId = `addr_${now}_${Math.random().toString(36).substring(2, 7)}`;
    const type = params.type || 'BOTH';

    const customerAddresses = this.getCustomerAddresses(customerId);
    const isFirstAddress = customerAddresses.length === 0;

    const isDefaultShipping = params.isDefaultShipping ?? isFirstAddress;
    const isDefaultBilling = params.isDefaultBilling ?? isFirstAddress;

    const address: CustomerAddressDTO = {
      addressId,
      tenantId: this.tenantId,
      customerId,
      type,
      isDefaultShipping,
      isDefaultBilling,
      fullName: params.fullName.trim(),
      company: params.company?.trim(),
      street1: params.street1.trim(),
      street2: params.street2?.trim(),
      city: params.city.trim(),
      stateProvince: params.stateProvince.trim(),
      postalCode: params.postalCode.trim(),
      countryCode: params.countryCode.trim().toUpperCase(),
      phone: params.phone?.trim(),
      createdAtMs: now,
      updatedAtMs: now
    };

    if (isDefaultShipping) {
      this.clearDefaultShipping(customerId);
    }
    if (isDefaultBilling) {
      this.clearDefaultBilling(customerId);
    }

    this.addresses.set(addressId, address);
    return address;
  }

  /**
   * Sets an address as default shipping for a customer.
   */
  public setDefaultShippingAddress(customerId: string, addressId: string): CustomerAddressDTO {
    const address = this.addresses.get(addressId);
    if (!address || address.customerId !== customerId) {
      throw new Error(`Address ${addressId} not found for customer ${customerId}`);
    }

    this.clearDefaultShipping(customerId);
    const updated: CustomerAddressDTO = {
      ...address,
      isDefaultShipping: true,
      updatedAtMs: Date.now()
    };

    this.addresses.set(addressId, updated);
    return updated;
  }

  /**
   * Sets an address as default billing for a customer.
   */
  public setDefaultBillingAddress(customerId: string, addressId: string): CustomerAddressDTO {
    const address = this.addresses.get(addressId);
    if (!address || address.customerId !== customerId) {
      throw new Error(`Address ${addressId} not found for customer ${customerId}`);
    }

    this.clearDefaultBilling(customerId);
    const updated: CustomerAddressDTO = {
      ...address,
      isDefaultBilling: true,
      updatedAtMs: Date.now()
    };

    this.addresses.set(addressId, updated);
    return updated;
  }

  /**
   * Removes an address from customer profile.
   */
  public deleteAddress(customerId: string, addressId: string): boolean {
    const address = this.addresses.get(addressId);
    if (!address || address.customerId !== customerId) {
      throw new Error(`Address ${addressId} not found for customer ${customerId}`);
    }

    return this.addresses.delete(addressId);
  }

  public getCustomerAddresses(customerId: string): ReadonlyArray<CustomerAddressDTO> {
    const results: CustomerAddressDTO[] = [];
    for (const addr of this.addresses.values()) {
      if (addr.customerId === customerId) {
        results.push(addr);
      }
    }
    return results;
  }

  public getDefaultShippingAddress(customerId: string): CustomerAddressDTO | undefined {
    return this.getCustomerAddresses(customerId).find(a => a.isDefaultShipping);
  }

  public getDefaultBillingAddress(customerId: string): CustomerAddressDTO | undefined {
    return this.getCustomerAddresses(customerId).find(a => a.isDefaultBilling);
  }

  private clearDefaultShipping(customerId: string): void {
    for (const [id, addr] of this.addresses.entries()) {
      if (addr.customerId === customerId && addr.isDefaultShipping) {
        this.addresses.set(id, { ...addr, isDefaultShipping: false, updatedAtMs: Date.now() });
      }
    }
  }

  private clearDefaultBilling(customerId: string): void {
    for (const [id, addr] of this.addresses.entries()) {
      if (addr.customerId === customerId && addr.isDefaultBilling) {
        this.addresses.set(id, { ...addr, isDefaultBilling: false, updatedAtMs: Date.now() });
      }
    }
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public exportState(): CustomerAddressEngineStateDTO {
    const record: Record<string, CustomerAddressDTO> = {};
    this.addresses.forEach((val, key) => {
      record[key] = val;
    });

    return {
      tenantId: this.tenantId,
      addresses: record
    };
  }

  public importState(state: CustomerAddressEngineStateDTO): void {
    if (!state || state.tenantId !== this.tenantId) {
      throw new Error('State tenantId mismatch during import');
    }
    this.addresses.clear();
    Object.entries(state.addresses || {}).forEach(([k, v]) => {
      this.addresses.set(k, v);
    });
  }
}
