/**
 * StorefrontCartPersistenceEngine.ts — Sprint G1-95 Cart Persistence & Login Merge Engine (Night Shift Level 57)
 *
 * Provides pure TypeScript, headless cart persistence, anonymous/guest cart tracking,
 * authenticated customer cart association, cart merge upon login, and cart recovery.
 *
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

export type DuplicateMergeStrategy = 'SUM_QUANTITIES' | 'OVERWRITE' | 'KEEP_HIGHER_QUANTITY';

export interface CartItemDTO {
  readonly itemId: string;
  readonly productId: string;
  readonly variantId: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly lineTotal: number;
  readonly addedAtMs: number;
}

export interface CartDTO {
  readonly cartId: string;
  readonly tenantId: string;
  readonly customerId?: string;
  readonly isGuest: boolean;
  readonly currency: string;
  readonly items: ReadonlyArray<CartItemDTO>;
  readonly subtotal: number;
  readonly totalItemsCount: number;
  readonly createdAtMs: number;
  readonly updatedAtMs: number;
  readonly expiresAtMs: number;
}

export interface CartMergeResultDTO {
  readonly guestCartId: string;
  readonly customerCartId: string;
  readonly mergedCartId: string;
  readonly itemsMergedCount: number;
  readonly newSubtotal: number;
  readonly strategyUsed: DuplicateMergeStrategy;
  readonly mergedCart: CartDTO;
}

export interface CartPersistenceEngineStateDTO {
  readonly tenantId: string;
  readonly defaultCartTtlMs: number;
  readonly carts: Record<string, CartDTO>;
  readonly customerCartMap: Record<string, string>; // customerId -> cartId
}

export class StorefrontCartPersistenceEngine {
  private readonly tenantId: string;
  private readonly defaultCartTtlMs: number;
  private carts: Map<string, CartDTO> = new Map(); // cartId -> CartDTO
  private customerCartMap: Map<string, string> = new Map(); // customerId -> cartId

  constructor(tenantId = 'default_tenant', defaultCartTtlMs = 30 * 24 * 60 * 60 * 1000) {
    this.tenantId = tenantId;
    this.defaultCartTtlMs = defaultCartTtlMs;
  }

  /**
   * Creates a new anonymous or customer cart.
   */
  public createCart(params?: { customerId?: string; currency?: string }): CartDTO {
    const now = Date.now();
    const cartId = `cart_${now}_${Math.random().toString(36).substring(2, 7)}`;
    const isGuest = !params?.customerId;

    const cart: CartDTO = {
      cartId,
      tenantId: this.tenantId,
      customerId: params?.customerId,
      isGuest,
      currency: (params?.currency || 'USD').toUpperCase(),
      items: [],
      subtotal: 0,
      totalItemsCount: 0,
      createdAtMs: now,
      updatedAtMs: now,
      expiresAtMs: now + this.defaultCartTtlMs
    };

    this.carts.set(cartId, cart);
    if (params?.customerId) {
      this.customerCartMap.set(params.customerId, cartId);
    }

    return cart;
  }

  /**
   * Adds or updates an item in the cart.
   */
  public addItem(cartId: string, item: { productId: string; variantId: string; quantity: number; unitPrice: number }): CartDTO {
    const existing = this.carts.get(cartId);
    if (!existing) {
      throw new Error(`Cart not found: ${cartId}`);
    }

    if (item.quantity <= 0 || item.unitPrice < 0) {
      throw new Error('Invalid cart item: quantity must be positive and unitPrice non-negative');
    }

    const items = [...existing.items];
    const existingIndex = items.findIndex(i => i.productId === item.productId && i.variantId === item.variantId);

    const now = Date.now();
    if (existingIndex >= 0) {
      const current = items[existingIndex];
      const newQty = current.quantity + item.quantity;
      items[existingIndex] = {
        ...current,
        quantity: newQty,
        lineTotal: newQty * current.unitPrice,
        addedAtMs: now
      };
    } else {
      const itemId = `item_${now}_${Math.random().toString(36).substring(2, 5)}`;
      items.push({
        itemId,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.quantity * item.unitPrice,
        addedAtMs: now
      });
    }

    const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
    const totalItemsCount = items.reduce((sum, i) => sum + i.quantity, 0);

    const updated: CartDTO = {
      ...existing,
      items,
      subtotal,
      totalItemsCount,
      updatedAtMs: now,
      expiresAtMs: now + this.defaultCartTtlMs
    };

    this.carts.set(cartId, updated);
    return updated;
  }

  /**
   * Merges an anonymous guest cart into an authenticated customer cart after login.
   */
  public mergeGuestCartOnLogin(
    guestCartId: string,
    customerId: string,
    strategy: DuplicateMergeStrategy = 'SUM_QUANTITIES'
  ): CartMergeResultDTO {
    const guestCart = this.carts.get(guestCartId);
    if (!guestCart) {
      throw new Error(`Guest cart not found: ${guestCartId}`);
    }

    let customerCartId = this.customerCartMap.get(customerId);
    let customerCart: CartDTO;

    if (!customerCartId || !this.carts.has(customerCartId)) {
      customerCart = this.createCart({ customerId, currency: guestCart.currency });
      customerCartId = customerCart.cartId;
    } else {
      customerCart = this.carts.get(customerCartId)!;
    }

    const mergedItemsMap = new Map<string, CartItemDTO>();

    // Seed customer items
    customerCart.items.forEach(item => {
      mergedItemsMap.set(`${item.productId}:${item.variantId}`, item);
    });

    // Merge guest items
    guestCart.items.forEach(guestItem => {
      const key = `${guestItem.productId}:${guestItem.variantId}`;
      const existing = mergedItemsMap.get(key);

      if (!existing) {
        mergedItemsMap.set(key, guestItem);
      } else {
        let newQty = existing.quantity;
        if (strategy === 'SUM_QUANTITIES') {
          newQty = existing.quantity + guestItem.quantity;
        } else if (strategy === 'OVERWRITE') {
          newQty = guestItem.quantity;
        } else if (strategy === 'KEEP_HIGHER_QUANTITY') {
          newQty = Math.max(existing.quantity, guestItem.quantity);
        }

        mergedItemsMap.set(key, {
          ...existing,
          quantity: newQty,
          lineTotal: newQty * existing.unitPrice,
          addedAtMs: Date.now()
        });
      }
    });

    const mergedItems = Array.from(mergedItemsMap.values());
    const newSubtotal = mergedItems.reduce((sum, i) => sum + i.lineTotal, 0);
    const totalItemsCount = mergedItems.reduce((sum, i) => sum + i.quantity, 0);
    const now = Date.now();

    const mergedCart: CartDTO = {
      ...customerCart,
      items: mergedItems,
      subtotal: newSubtotal,
      totalItemsCount,
      updatedAtMs: now,
      expiresAtMs: now + this.defaultCartTtlMs
    };

    this.carts.set(customerCartId, mergedCart);
    // Mark guest cart as expired/merged
    this.carts.set(guestCartId, {
      ...guestCart,
      items: [],
      subtotal: 0,
      totalItemsCount: 0,
      expiresAtMs: now
    });

    return {
      guestCartId,
      customerCartId,
      mergedCartId: customerCartId,
      itemsMergedCount: guestCart.items.length,
      newSubtotal,
      strategyUsed: strategy,
      mergedCart
    };
  }

  public getCart(cartId: string): CartDTO | undefined {
    return this.carts.get(cartId);
  }

  public getCustomerCart(customerId: string): CartDTO | undefined {
    const cartId = this.customerCartMap.get(customerId);
    return cartId ? this.carts.get(cartId) : undefined;
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public exportState(): CartPersistenceEngineStateDTO {
    const cartsRecord: Record<string, CartDTO> = {};
    this.carts.forEach((val, key) => {
      cartsRecord[key] = val;
    });

    const customerMapRecord: Record<string, string> = {};
    this.customerCartMap.forEach((val, key) => {
      customerMapRecord[key] = val;
    });

    return {
      tenantId: this.tenantId,
      defaultCartTtlMs: this.defaultCartTtlMs,
      carts: cartsRecord,
      customerCartMap: customerMapRecord
    };
  }

  public importState(state: CartPersistenceEngineStateDTO): void {
    if (!state || state.tenantId !== this.tenantId) {
      throw new Error('State tenantId mismatch during import');
    }
    this.carts.clear();
    this.customerCartMap.clear();

    Object.entries(state.carts || {}).forEach(([k, v]) => {
      this.carts.set(k, v);
    });
    Object.entries(state.customerCartMap || {}).forEach(([k, v]) => {
      this.customerCartMap.set(k, v);
    });
  }
}
