import {
  DashboardContext,
  DashboardView,
  CustomerOrder,
  CustomerAddress,
  CustomerPreferences,
  createDashboardContext,
  AuthenticationRequiredException,
  DashboardTenantScopeViolationException,
  AddressOperationException,
} from './DashboardContext';
import { PlatformEventBusImpl } from '../../platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '../../platform-core/src/logger/Logger';
import { EventRegistry } from '../../platform-core/src/events/EventRegistry';

// ── Adapter Ports ─────────────────────────────────────────────────────────────

export interface CustomerProfile {
  customerId: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  preferences: CustomerPreferences;
}

export interface DashboardAdapterPort {
  /** Returns null if session token is invalid or expired. */
  verifySession(tenantId: string, sessionToken: string): Promise<CustomerProfile | null>;
  getOrders(tenantId: string, customerId: string): Promise<CustomerOrder[]>;
  getOrderById(tenantId: string, customerId: string, orderId: string): Promise<CustomerOrder | null>;
  getAddresses(tenantId: string, customerId: string): Promise<CustomerAddress[]>;
  addAddress(tenantId: string, customerId: string, address: Omit<CustomerAddress, 'addressId' | 'isDefault'>): Promise<CustomerAddress>;
  removeAddress(tenantId: string, customerId: string, addressId: string): Promise<void>;
  setDefaultAddress(tenantId: string, customerId: string, addressId: string): Promise<CustomerAddress[]>;
  updatePreferences(tenantId: string, customerId: string, preferences: Partial<CustomerPreferences>): Promise<CustomerPreferences>;
  updateProfile(tenantId: string, customerId: string, data: { firstName?: string; lastName?: string }): Promise<CustomerProfile>;
}

// ── Dashboard Runtime ─────────────────────────────────────────────────────────

export class DashboardRuntime {
  private readonly eventBus: PlatformEventBusImpl;
  private readonly logger: ConsolePlatformLogger;
  private readonly adapter: DashboardAdapterPort;

  // Active sessions: sessionToken -> DashboardContext
  private readonly sessions = new Map<string, DashboardContext>();

  constructor(options: {
    eventBus: PlatformEventBusImpl;
    logger: ConsolePlatformLogger;
    adapter: DashboardAdapterPort;
  }) {
    this.eventBus = options.eventBus;
    this.logger = options.logger;
    this.adapter = options.adapter;

    const events = [
      'Dashboard.Opened',
      'Customer.ProfileUpdated',
      'Customer.AddressAdded',
      'Customer.AddressRemoved',
      'Customer.AddressSetDefault',
      'Customer.PreferenceUpdated',
    ];
    for (const evt of events) {
      EventRegistry.register(evt);
    }
  }

  private async publish(
    eventType: string,
    tenantId: string,
    payload: Record<string, any>,
    cid: string
  ): Promise<void> {
    await this.eventBus.publish({
      eventId: `evt_dash_${Math.random().toString(36).substr(2, 9)}`,
      eventType,
      timestamp: new Date().toISOString(),
      correlationId: cid,
      tenantId,
      payload,
    });
  }

  /**
   * Opens a dashboard session from a session token.
   * Verifies authentication and returns frozen DashboardContext.
   */
  public async openSession(
    tenantId: string,
    sessionToken: string,
    correlationId?: string
  ): Promise<DashboardContext> {
    const cid = correlationId || `dash_open_${Date.now()}`;

    const profile = await this.adapter.verifySession(tenantId, sessionToken);
    if (!profile) {
      throw new AuthenticationRequiredException('Session token invalid or expired');
    }

    // Tenant scope guard
    if (profile.tenantId !== tenantId) {
      throw new DashboardTenantScopeViolationException(profile.tenantId, tenantId);
    }

    const context = createDashboardContext({
      tenantId,
      customerId: profile.customerId,
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      locale: profile.preferences.locale,
      currency: profile.preferences.currency,
      currentView: 'account_home',
    });

    this.sessions.set(sessionToken, context);

    await this.publish('Dashboard.Opened', tenantId, { customerId: profile.customerId }, cid);

    this.logger.info({
      message: `Dashboard session opened for customer: ${profile.customerId} (tenant: ${tenantId})`,
      correlationId: cid,
      tenantId,
    });

    return context;
  }

  /** Returns the active session context, or throws if not authenticated. */
  public requireSession(sessionToken: string): DashboardContext {
    const ctx = this.sessions.get(sessionToken);
    if (!ctx) {
      throw new AuthenticationRequiredException('No active session for token');
    }
    return ctx;
  }

  /** Clears a session (logout). */
  public closeSession(sessionToken: string): void {
    this.sessions.delete(sessionToken);
  }

  // ── Orders ────────────────────────────────────────────────────────────────

  public async getOrders(
    sessionToken: string,
    correlationId?: string
  ): Promise<CustomerOrder[]> {
    const ctx = this.requireSession(sessionToken);
    return this.adapter.getOrders(ctx.tenantId, ctx.customerId);
  }

  public async getOrderById(
    sessionToken: string,
    orderId: string,
    correlationId?: string
  ): Promise<CustomerOrder | null> {
    const ctx = this.requireSession(sessionToken);
    const order = await this.adapter.getOrderById(ctx.tenantId, ctx.customerId, orderId);

    // Tenant + ownership guard
    if (order && order.orderId !== orderId) {
      throw new DashboardTenantScopeViolationException('external', ctx.tenantId);
    }
    return order;
  }

  // ── Address Book ──────────────────────────────────────────────────────────

  public async getAddresses(sessionToken: string): Promise<CustomerAddress[]> {
    const ctx = this.requireSession(sessionToken);
    return this.adapter.getAddresses(ctx.tenantId, ctx.customerId);
  }

  public async addAddress(
    sessionToken: string,
    address: Omit<CustomerAddress, 'addressId' | 'isDefault'>,
    correlationId?: string
  ): Promise<CustomerAddress> {
    const cid = correlationId || `dash_addr_add_${Date.now()}`;
    const ctx = this.requireSession(sessionToken);

    const newAddress = await this.adapter.addAddress(ctx.tenantId, ctx.customerId, address);
    await this.publish('Customer.AddressAdded', ctx.tenantId, {
      customerId: ctx.customerId,
      addressId: newAddress.addressId,
    }, cid);

    return newAddress;
  }

  public async removeAddress(
    sessionToken: string,
    addressId: string,
    correlationId?: string
  ): Promise<void> {
    const cid = correlationId || `dash_addr_rm_${Date.now()}`;
    const ctx = this.requireSession(sessionToken);

    const addresses = await this.adapter.getAddresses(ctx.tenantId, ctx.customerId);
    const toRemove = addresses.find((a) => a.addressId === addressId);

    if (!toRemove) {
      throw new AddressOperationException(`Address '${addressId}' not found`);
    }
    if (toRemove.isDefault && addresses.length > 1) {
      throw new AddressOperationException('Cannot remove the default address when other addresses exist. Set another as default first.');
    }
    if (addresses.length === 1) {
      throw new AddressOperationException('Cannot remove the only address on the account');
    }

    await this.adapter.removeAddress(ctx.tenantId, ctx.customerId, addressId);
    await this.publish('Customer.AddressRemoved', ctx.tenantId, {
      customerId: ctx.customerId,
      addressId,
    }, cid);
  }

  public async setDefaultAddress(
    sessionToken: string,
    addressId: string,
    correlationId?: string
  ): Promise<CustomerAddress[]> {
    const cid = correlationId || `dash_addr_def_${Date.now()}`;
    const ctx = this.requireSession(sessionToken);

    const updated = await this.adapter.setDefaultAddress(ctx.tenantId, ctx.customerId, addressId);
    await this.publish('Customer.AddressSetDefault', ctx.tenantId, {
      customerId: ctx.customerId,
      addressId,
    }, cid);

    return updated;
  }

  // ── Preferences ──────────────────────────────────────────────────────────

  public async updatePreferences(
    sessionToken: string,
    preferences: Partial<CustomerPreferences>,
    correlationId?: string
  ): Promise<{ context: DashboardContext; preferences: CustomerPreferences }> {
    const cid = correlationId || `dash_pref_${Date.now()}`;
    const ctx = this.requireSession(sessionToken);

    const updated = await this.adapter.updatePreferences(ctx.tenantId, ctx.customerId, preferences);

    // Rebuild immutable context with new locale/currency
    const newContext = createDashboardContext({
      ...ctx,
      locale: updated.locale,
      currency: updated.currency,
    });
    this.sessions.set(sessionToken, newContext);

    await this.publish('Customer.PreferenceUpdated', ctx.tenantId, {
      customerId: ctx.customerId,
      preferences: updated,
    }, cid);

    return { context: newContext, preferences: updated };
  }

  // ── Profile ───────────────────────────────────────────────────────────────

  public async updateProfile(
    sessionToken: string,
    data: { firstName?: string; lastName?: string },
    correlationId?: string
  ): Promise<{ context: DashboardContext; profile: CustomerProfile }> {
    const cid = correlationId || `dash_prof_${Date.now()}`;
    const ctx = this.requireSession(sessionToken);

    const updatedProfile = await this.adapter.updateProfile(ctx.tenantId, ctx.customerId, data);

    const newContext = createDashboardContext({
      ...ctx,
      firstName: updatedProfile.firstName,
      lastName: updatedProfile.lastName,
    });
    this.sessions.set(sessionToken, newContext);

    await this.publish('Customer.ProfileUpdated', ctx.tenantId, {
      customerId: ctx.customerId,
    }, cid);

    return { context: newContext, profile: updatedProfile };
  }
}
