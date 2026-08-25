/**
 * StorefrontCartCheckoutDrawerEngine.ts — Sprint G1-58 Storefront Cart, Checkout Flow & Commerce Engine (Night Shift Level 20)
 *
 * Implements a pure TypeScript, headless commerce state layer for WEB FACTOR Authoring Studio.
 * Connects product cards ('Add-to-Cart' CTA), persistent cart sessions, cart drawer toggles,
 * integer-cents monetary calculation, multi-page router transitions ('/store' -> '/cart' -> '/checkout'),
 * shipping address validation, and payment gateway handoff boundaries (OrderIntentDTO).
 *
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

import { VectorWorkspaceState, VectorDocumentSnapshot } from '../vector/VectorWorkspaceController';
import { PageSectionBlockCompositionEngine, EcommerceProductBindingDTO } from './PageSectionBlockCompositionEngine';
import { MultiPageNavigationRouterEngine, MultiPageSiteDocument, RouterExecutionResult } from './MultiPageNavigationRouterEngine';

// ---------------------------------------------------------------------------
// DTOs & Interfaces
// ---------------------------------------------------------------------------

export interface CartItemDTO {
  readonly productId: string;
  readonly title: string;
  readonly unitPriceCents: number;
  readonly priceFormatted: string;
  readonly imageUrl?: string;
  readonly quantity: number;
  readonly subtotalCents: number;
  readonly productBinding?: EcommerceProductBindingDTO;
}

export interface CartTotalsDTO {
  readonly subtotalCents: number;
  readonly taxCents: number;
  readonly shippingCents: number;
  readonly discountCents: number;
  readonly grandTotalCents: number;
  readonly subtotalFormatted: string;
  readonly grandTotalFormatted: string;
  readonly currency: string;
}

export interface CartSessionDTO {
  readonly sessionId: string;
  readonly items: ReadonlyArray<CartItemDTO>;
  readonly totals: CartTotalsDTO;
  readonly itemCount: number;
  readonly isDrawerOpen: boolean;
  readonly activeRouteSlug: string;
  readonly updatedAt: number;
}

export interface ShippingAddressDTO {
  readonly fullName: string;
  readonly street: string;
  readonly city: string;
  readonly zipCode: string;
  readonly country: string;
}

export interface CheckoutStateDTO {
  readonly step: 'cart' | 'shipping' | 'payment_boundary' | 'order_intent_created';
  readonly shippingAddress?: ShippingAddressDTO;
  readonly orderIntentId?: string;
  readonly isValid: boolean;
  readonly validationError?: string;
}

export interface OrderIntentDTO {
  readonly orderIntentId: string;
  readonly slug: string;
  readonly items: ReadonlyArray<{ readonly productId: string; readonly quantity: number; readonly unitPriceCents: number }>;
  readonly totals: CartTotalsDTO;
  readonly shippingAddress: ShippingAddressDTO;
  readonly status: 'pending_payment_gateway';
  readonly createdTimestamp: number;
}

export interface CommerceExecutionResult {
  readonly success: boolean;
  readonly cartSession: CartSessionDTO;
  readonly checkoutState?: CheckoutStateDTO;
  readonly orderIntent?: OrderIntentDTO;
  readonly siteDocument?: MultiPageSiteDocument;
  readonly workspaceState?: VectorWorkspaceState;
  readonly error?: string;
}

// ---------------------------------------------------------------------------
// Helper Math Functions
// ---------------------------------------------------------------------------

function parsePriceToCents(priceFormatted?: string): number {
  if (!priceFormatted) return 0;
  const numericStr = priceFormatted.replace(/[^0-9.]/g, '');
  const val = parseFloat(numericStr);
  return isNaN(val) ? 0 : Math.round(val * 100);
}

function formatCentsToCurrency(cents: number, currency: string = 'USD'): string {
  const dollars = (cents / 100).toFixed(2);
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'PLN' ? 'zł ' : `${currency} `;
  return currency === 'PLN' ? `${dollars} zł` : `${symbol}${dollars}`;
}

// ---------------------------------------------------------------------------
// Engine Implementation
// ---------------------------------------------------------------------------

export class StorefrontCartCheckoutDrawerEngine {
  /**
   * Initializes a new empty cart session with integer-cents calculation.
   */
  public static createCartSession(currency: string = 'USD'): CartSessionDTO {
    const sessionId = `cart_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const totals = this.calculateCartTotals([], currency);

    return {
      sessionId,
      items: [],
      totals,
      itemCount: 0,
      isDrawerOpen: false,
      activeRouteSlug: '/store',
      updatedAt: Date.now()
    };
  }

  /**
   * Calculates cart subtotal, tax (8%), shipping, and grand total in integer cents.
   */
  public static calculateCartTotals(items: ReadonlyArray<CartItemDTO>, currency: string = 'USD'): CartTotalsDTO {
    const subtotalCents = items.reduce((sum, item) => sum + (item.subtotalCents || 0), 0);
    const taxCents = Math.round(subtotalCents * 0.08); // 8% tax
    const shippingCents = items.length > 0 ? 999 : 0; // $9.99 flat shipping if items exist
    const discountCents = 0;
    const grandTotalCents = subtotalCents + taxCents + shippingCents - discountCents;

    return {
      subtotalCents,
      taxCents,
      shippingCents,
      discountCents,
      grandTotalCents,
      subtotalFormatted: formatCentsToCurrency(subtotalCents, currency),
      grandTotalFormatted: formatCentsToCurrency(grandTotalCents, currency),
      currency
    };
  }

  /**
   * Gets total quantity of items in cart.
   */
  public static getCartItemCount(session: CartSessionDTO): number {
    if (!session || !session.items) return 0;
    return session.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  /**
   * Adds an ecommerce product to cart session or increments quantity if item exists.
   */
  public static addProductToCart(
    session: CartSessionDTO,
    productBinding: EcommerceProductBindingDTO,
    quantityToAdd: number = 1
  ): CartSessionDTO {
    if (!session || !productBinding || !productBinding.productId) {
      return session;
    }
    if (quantityToAdd <= 0) return session;

    const unitPriceCents = parsePriceToCents(productBinding.priceFormatted);
    const existingIndex = session.items.findIndex(i => i.productId === productBinding.productId);
    let nextItems: CartItemDTO[] = [...session.items];

    if (existingIndex !== -1) {
      const existing = nextItems[existingIndex];
      const newQty = existing.quantity + quantityToAdd;
      nextItems[existingIndex] = {
        ...existing,
        quantity: newQty,
        subtotalCents: newQty * existing.unitPriceCents
      };
    } else {
      const newItem: CartItemDTO = {
        productId: productBinding.productId,
        title: productBinding.title,
        unitPriceCents,
        priceFormatted: productBinding.priceFormatted,
        imageUrl: productBinding.imageUrl,
        quantity: quantityToAdd,
        subtotalCents: quantityToAdd * unitPriceCents,
        productBinding
      };
      nextItems.push(newItem);
    }

    const totals = this.calculateCartTotals(nextItems, session.totals.currency);
    const itemCount = this.getCartItemCount({ ...session, items: nextItems });

    return {
      ...session,
      items: nextItems,
      totals,
      itemCount,
      isDrawerOpen: true, // Automatically open drawer on Add to Cart
      updatedAt: Date.now()
    };
  }

  /**
   * Removes a product from cart by productId.
   */
  public static removeProductFromCart(session: CartSessionDTO, productId: string): CartSessionDTO {
    if (!session) return session;
    const nextItems = session.items.filter(i => i.productId !== productId);
    const totals = this.calculateCartTotals(nextItems, session.totals.currency);
    const itemCount = this.getCartItemCount({ ...session, items: nextItems });

    return {
      ...session,
      items: nextItems,
      totals,
      itemCount,
      updatedAt: Date.now()
    };
  }

  /**
   * Updates item quantity in cart session.
   */
  public static updateCartQuantity(session: CartSessionDTO, productId: string, newQuantity: number): CartSessionDTO {
    if (!session) return session;
    if (newQuantity <= 0) {
      return this.removeProductFromCart(session, productId);
    }

    const nextItems = session.items.map(item => {
      if (item.productId !== productId) return item;
      return {
        ...item,
        quantity: newQuantity,
        subtotalCents: newQuantity * item.unitPriceCents
      };
    });

    const totals = this.calculateCartTotals(nextItems, session.totals.currency);
    const itemCount = this.getCartItemCount({ ...session, items: nextItems });

    return {
      ...session,
      items: nextItems,
      totals,
      itemCount,
      updatedAt: Date.now()
    };
  }

  /**
   * Clears all items from cart session.
   */
  public static clearCart(session: CartSessionDTO): CartSessionDTO {
    if (!session) return session;
    const totals = this.calculateCartTotals([], session.totals.currency);
    return {
      ...session,
      items: [],
      totals,
      itemCount: 0,
      isDrawerOpen: false,
      updatedAt: Date.now()
    };
  }

  /**
   * Opens cart drawer.
   */
  public static openCartDrawer(session: CartSessionDTO): CartSessionDTO {
    if (!session) return session;
    return { ...session, isDrawerOpen: true };
  }

  /**
   * Closes cart drawer.
   */
  public static closeCartDrawer(session: CartSessionDTO): CartSessionDTO {
    if (!session) return session;
    return { ...session, isDrawerOpen: false };
  }

  /**
   * Navigates active page route context to '/cart' via MultiPageNavigationRouterEngine.
   */
  public static navigateToCart(
    session: CartSessionDTO,
    siteDoc: MultiPageSiteDocument,
    workspaceState: VectorWorkspaceState
  ): CommerceExecutionResult {
    if (!session || !siteDoc || !siteDoc.routes || !workspaceState) {
      return { success: false, cartSession: session, error: 'Null session or site document' };
    }

    const cartRoute = siteDoc.routes.find(r => r.slug === '/cart');
    if (!cartRoute) {
      return { success: false, cartSession: session, error: 'Route /cart not found in site document' };
    }

    const routerRes = MultiPageNavigationRouterEngine.switchActiveRoute(siteDoc, workspaceState, cartRoute.id);
    if (!routerRes.success) {
      return { success: false, cartSession: session, error: routerRes.error };
    }

    const nextSession: CartSessionDTO = {
      ...session,
      isDrawerOpen: false,
      activeRouteSlug: '/cart',
      updatedAt: Date.now()
    };

    return {
      success: true,
      cartSession: nextSession,
      siteDocument: routerRes.siteDocument,
      workspaceState: routerRes.workspaceState
    };
  }

  /**
   * Begins checkout transition and navigates active page route context to '/checkout'.
   */
  public static beginCheckout(
    session: CartSessionDTO,
    siteDoc: MultiPageSiteDocument,
    workspaceState: VectorWorkspaceState
  ): CommerceExecutionResult {
    if (!session || !siteDoc || !siteDoc.routes || session.items.length === 0) {
      return { success: false, cartSession: session, error: 'Cannot begin checkout with empty cart or null site document' };
    }

    const checkoutRoute = siteDoc.routes.find(r => r.slug === '/checkout');
    if (!checkoutRoute) {
      return { success: false, cartSession: session, error: 'Route /checkout not found in site document' };
    }

    const routerRes = MultiPageNavigationRouterEngine.switchActiveRoute(siteDoc, workspaceState, checkoutRoute.id);
    if (!routerRes.success) {
      return { success: false, cartSession: session, error: routerRes.error };
    }

    const nextSession: CartSessionDTO = {
      ...session,
      isDrawerOpen: false,
      activeRouteSlug: '/checkout',
      updatedAt: Date.now()
    };

    const initialCheckoutState: CheckoutStateDTO = {
      step: 'shipping',
      isValid: false,
      validationError: 'Shipping address required'
    };

    return {
      success: true,
      cartSession: nextSession,
      checkoutState: initialCheckoutState,
      siteDocument: routerRes.siteDocument,
      workspaceState: routerRes.workspaceState
    };
  }

  /**
   * Updates checkout state patch (step, shippingAddress).
   */
  public static updateCheckoutState(checkoutState: CheckoutStateDTO, patch: Partial<CheckoutStateDTO>): CheckoutStateDTO {
    if (!checkoutState) {
      return { step: 'cart', isValid: false, validationError: 'Null checkout state' };
    }
    const updated: CheckoutStateDTO = {
      ...checkoutState,
      ...patch
    };

    return this.validateCheckoutTransition(updated, null as any);
  }

  /**
   * Validates checkout transition data before order intent creation.
   */
  public static validateCheckoutTransition(checkoutState: CheckoutStateDTO, session?: CartSessionDTO): CheckoutStateDTO {
    if (!checkoutState) return { step: 'cart', isValid: false, validationError: 'Null checkout state' };

    const addr = checkoutState.shippingAddress;
    if (!addr || !addr.fullName || !addr.street || !addr.city || !addr.zipCode || !addr.country) {
      return {
        ...checkoutState,
        isValid: false,
        validationError: 'Missing required shipping address fields (fullName, street, city, zipCode, country)'
      };
    }

    return {
      ...checkoutState,
      step: 'payment_boundary',
      isValid: true,
      validationError: undefined
    };
  }

  /**
   * Creates an OrderIntentDTO at the payment-gateway handoff boundary.
   */
  public static createOrderIntent(
    session: CartSessionDTO,
    checkoutState: CheckoutStateDTO,
    storeSlug: string
  ): CommerceExecutionResult {
    if (!session || session.items.length === 0) {
      return { success: false, cartSession: session, error: 'Cannot create order intent from empty cart' };
    }

    const validatedState = this.validateCheckoutTransition(checkoutState, session);
    if (!validatedState.isValid || !validatedState.shippingAddress) {
      return { success: false, cartSession: session, checkoutState: validatedState, error: validatedState.validationError || 'Invalid checkout state' };
    }

    const orderIntentId = `order_intent_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const orderItems = session.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents
    }));

    const orderIntent: OrderIntentDTO = {
      orderIntentId,
      slug: storeSlug || 'default-store',
      items: orderItems,
      totals: session.totals,
      shippingAddress: validatedState.shippingAddress,
      status: 'pending_payment_gateway',
      createdTimestamp: Date.now()
    };

    const nextCheckoutState: CheckoutStateDTO = {
      ...validatedState,
      step: 'order_intent_created',
      orderIntentId
    };

    return {
      success: true,
      cartSession: session,
      checkoutState: nextCheckoutState,
      orderIntent
    };
  }

  /**
   * Serializes cart session to JSON string.
   */
  public static serializeCartSession(session: CartSessionDTO): string {
    return JSON.stringify(session);
  }

  /**
   * Restores cart session from serialized JSON string.
   */
  public static restoreCartSession(serializedJson: string): CartSessionDTO {
    try {
      const parsed = JSON.parse(serializedJson);
      if (!parsed || !Array.isArray(parsed.items)) {
        return this.createCartSession();
      }
      return parsed;
    } catch {
      return this.createCartSession();
    }
  }
}
