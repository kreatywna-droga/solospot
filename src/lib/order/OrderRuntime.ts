/**
 * OrderRuntime.ts — Sprint 6 Step 6
 *
 * CIENKA WARSTWA ADAPTACYJNA (tylko mapowanie DTO, ZERO logiki biznesowej).
 *
 * Cała logika biznesowa (tworzenie zamówienia, zmiana statusu, walidacja
 * przejść) pozostaje w:
 *   - packages/commerce-engine/src/CheckoutFlow.ts  → CheckoutManager
 *   - packages/commerce-engine/src/OrderProcessingEngine.ts
 *   - packages/commerce-engine/src/PaymentEngine.ts
 *
 * Ten moduł tylko:
 *   1. Przyjmuje DTO z API/storefront
 *   2. Mapuje na kontrakty commerce-engine
 *   3. Zwraca odpowiedź
 */
import {
  OrderProcessingEngine,
  CheckoutManager,
  PaymentEngine,
  CartManager,
  type ProcessedOrder,
  type ProcessedOrderItem,
  type ShippingDetails,
  type ShippingAddress,
  type Cart,
  type PaymentProviderAdapter,
} from '../../../packages/commerce-engine/src';
import { PaymentFactory } from '@/lib/payments/PaymentFactory';
import { PlatformEventBusImpl } from '../../../packages/platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '../../../packages/platform-core/src/logger/Logger';

// ---------------------------------------------------------------------------
// Typy DTO dla API
// ---------------------------------------------------------------------------

export interface CheckoutItemDTO {
  /** Identyfikator produktu */
  productId: string;
  /** Ilość zamawiana */
  quantity: number;
  /** Cena jednostkowa brutto w groszach (opcjonalna, np. 5000 = 50.00 PLN) */
  unitPriceGross?: number;
  /** Stawka VAT (domyślnie 23%) */
  taxRate?: number;
}

export interface CheckoutRequestDTO {
  /** Produkty z koszyka */
  items: Array<CheckoutItemDTO>;
  /** Adres dostawy */
  shippingAddress: {
    fullName: string;
    street: string;
    city: string;
    zipCode: string;
    country: string;
  };
  /** Waluta (domyślnie PLN) */
  currency?: string;
  /** Opcjonalny kod kuponu (np. SAVE10) */
  couponCode?: string;
}

export interface CheckoutResponseDTO {
  success: boolean;
  orderId: string;
  redirectUrl: string;
  grandTotalGross: number;
  currency: string;
}

// ---------------------------------------------------------------------------
// OrderRuntime — cienka orkiestracja
// ---------------------------------------------------------------------------

export class OrderRuntime {
  private static instance: OrderRuntime | null = null;

  public static getInstance(): OrderRuntime {
    if (!OrderRuntime.instance) {
      OrderRuntime.instance = new OrderRuntime();
    }
    return OrderRuntime.instance;
  }

  public static resetInstanceForTesting(): void {
    OrderRuntime.instance = null;
  }

  private readonly eventBus: PlatformEventBusImpl;
  private readonly logger: ConsolePlatformLogger;
  private readonly orderEngine: OrderProcessingEngine;
  private readonly paymentEngine: PaymentEngine;
  /** In-memory idempotency cache (double-click "Zapłać" protection) keyed by correlationId. */
  private readonly checkoutCache = new Map<string, CheckoutResponseDTO>();
  /** Inflight request deduplication map for concurrent requests with identical correlationId. */
  private readonly inflightPromises = new Map<string, Promise<CheckoutResponseDTO>>();

  constructor(options?: { eventBus?: PlatformEventBusImpl; logger?: ConsolePlatformLogger }) {
    this.logger = options?.logger || new ConsolePlatformLogger();
    this.eventBus = options?.eventBus || new PlatformEventBusImpl();
    this.logger.setEventBus(this.eventBus);
    this.orderEngine = new OrderProcessingEngine({
      eventBus: this.eventBus,
      logger: this.logger,
    });
    this.paymentEngine = new PaymentEngine({
      eventBus: this.eventBus,
      logger: this.logger,
    });
  }

  /**
   * Główna orkiestracja checkoutu:
   *   1. CheckoutManager.createOrder() — buduje Order z koszyka
   *   2. OrderProcessingEngine.createOrder() — tworzy ProcessedOrder z CREATED
   *   3. OrderProcessingEngine.invoiceOrder() — CREATED → PAYMENT_PENDING
   *   4. PaymentEngine.createPaymentIntent() — tworzy intent przez PaymentFactory
   *   5. Zwraca redirectUrl do paywall providera
   *
   * ZERO logiki biznesowej — wyłącznie orkiestracja istniejących silników.
   */
  public async checkout(
    tenantId: string,
    customerId: string,
    req: CheckoutRequestDTO,
    correlationId?: string,
  ): Promise<CheckoutResponseDTO> {
    const cid = correlationId || `chk_${Date.now()}`;

    // 0. Idempotency guard — cached completed responses
    const cached = this.checkoutCache.get(cid);
    if (cached) {
      return cached;
    }

    // Deduplicate concurrent inflight requests with identical correlationId
    const inflight = this.inflightPromises.get(cid);
    if (inflight) {
      return inflight;
    }

    const promise = this.executeCheckout(tenantId, customerId, req, cid);
    this.inflightPromises.set(cid, promise);

    try {
      const result = await promise;
      this.checkoutCache.set(cid, result);
      return result;
    } finally {
      this.inflightPromises.delete(cid);
    }
  }

  private async executeCheckout(
    tenantId: string,
    customerId: string,
    req: CheckoutRequestDTO,
    cid: string,
  ): Promise<CheckoutResponseDTO> {
    const currency = req.currency || 'PLN';

    if (!req.items || req.items.length === 0) {
      throw new Error('Cannot checkout with an empty cart.');
    }

    // 1. Zbuduj koszyk z żądania i przelicz sumy
    const rawCart: Cart = {
      id: `crt_${Math.random().toString(36).substr(2, 9)}`,
      tenantId,
      couponCode: req.couponCode,
      items: req.items.map((item) => {
        const unitPriceGross = item.unitPriceGross ?? 0;
        const taxRate = item.taxRate ?? 23;
        const unitPriceNet = Math.round(unitPriceGross / (1 + taxRate / 100));
        return {
          productId: item.productId,
          quantity: item.quantity,
          unitPriceGross,
          unitPriceNet,
          taxRate,
          totalGross: unitPriceGross * item.quantity,
        };
      }),
      totals: {
        subtotalGross: 0,
        subtotalNet: 0,
        taxTotal: 0,
        discountGross: 0,
        grandTotalGross: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const cart = CartManager.recalculate(rawCart);

    // 2. Mapuj adres na kontrakt CheckoutFlow
    const shippingAddress: ShippingAddress = {
      fullName: req.shippingAddress.fullName,
      street: req.shippingAddress.street,
      city: req.shippingAddress.city,
      zipCode: req.shippingAddress.zipCode,
      country: req.shippingAddress.country,
    };

    // 3. CheckoutManager.createOrder() — walidacja koszyka + budowa Order
    const order = CheckoutManager.createOrder(cart, shippingAddress);

    // 4. Mapuj na ProcessedOrderItem dla OrderProcessingEngine
    const processedItems: ProcessedOrderItem[] = order.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPriceGross: item.unitPriceGross,
      totalGross: item.totalGross,
    }));

    const shipping: ShippingDetails = {
      fullName: shippingAddress.fullName,
      street: shippingAddress.street,
      city: shippingAddress.city,
      zipCode: shippingAddress.zipCode,
      country: shippingAddress.country,
    };

    // 5. OrderProcessingEngine.createOrder() → CREATED
    const processedOrder = await this.orderEngine.createOrder(
      tenantId,
      customerId,
      processedItems,
      shipping,
      currency,
      cid,
      {
        subtotalGross: order.totals.subtotalGross,
        taxTotal: order.totals.taxTotal,
        grandTotalGross: order.totals.grandTotalGross,
      },
    );

    // 6. Invoice → PAYMENT_PENDING
    const pendingOrder = await this.orderEngine.invoiceOrder(tenantId, processedOrder.id, cid);

    // 7. PaymentEngine → PaymentFactory → createPaymentIntent
    const adapter: PaymentProviderAdapter = PaymentFactory.getProvider({
      amount: pendingOrder.grandTotalGross,
      currency: pendingOrder.currency,
      items: processedItems,
    } as any) as unknown as PaymentProviderAdapter;

    const paymentIntent = await this.paymentEngine.createPaymentIntent(
      tenantId,
      pendingOrder.id,
      pendingOrder.grandTotalGross,
      pendingOrder.currency,
      adapter,
      cid,
    );

    // 8. Zwróć redirectUrl (provider.externalId jako URL do paywall)
    const redirectUrl = paymentIntent.externalId || '/store/order/success';

    const response: CheckoutResponseDTO = {
      success: true,
      orderId: pendingOrder.id,
      redirectUrl,
      grandTotalGross: pendingOrder.grandTotalGross,
      currency: pendingOrder.currency,
    };

    return response;
  }

  /**
   * Pobiera status zamówienia — delegacja do OrderProcessingEngine.getOrder().
   */
  public async getOrderStatus(
    tenantId: string,
    orderId: string,
  ): Promise<ProcessedOrder> {
    return this.orderEngine.getOrder(tenantId, orderId);
  }

  /**
   * Potwierdza płatność: PAYMENT_PENDING -> PAID
   */
  public async confirmPayment(
    tenantId: string,
    orderId: string,
    paymentIntentId = `pi_${Date.now()}`,
    correlationId?: string,
  ): Promise<ProcessedOrder> {
    return this.orderEngine.confirmPayment(tenantId, orderId, paymentIntentId, correlationId);
  }

  /**
   * Rozpoczyna realizację: PAID -> PROCESSING
   */
  public async startProcessing(
    tenantId: string,
    orderId: string,
    correlationId?: string,
  ): Promise<ProcessedOrder> {
    return this.orderEngine.startProcessing(tenantId, orderId, correlationId);
  }

  /**
   * Przygotowuje wysyłkę: PROCESSING -> READY_FOR_FULFILLMENT
   */
  public async prepareFulfillment(
    tenantId: string,
    orderId: string,
    correlationId?: string,
  ): Promise<ProcessedOrder> {
    return this.orderEngine.prepareFulfillment(tenantId, orderId, correlationId);
  }

  /**
   * Finalizuje zamówienie: READY_FOR_FULFILLMENT -> FULFILLED
   */
  public async fulfillOrder(
    tenantId: string,
    orderId: string,
    correlationId?: string,
  ): Promise<ProcessedOrder> {
    return this.orderEngine.fulfillOrder(tenantId, orderId, correlationId);
  }

  /**
   * Anuluje zamówienie: PAYMENT_PENDING / PAID -> CANCELLED
   */
  public async cancelOrder(
    tenantId: string,
    orderId: string,
    correlationId?: string,
  ): Promise<ProcessedOrder> {
    return this.orderEngine.cancelOrder(tenantId, orderId, correlationId);
  }

  /**
   * Zwraca zamówienie: FULFILLED -> REFUNDED
   */
  public async refundOrder(
    tenantId: string,
    orderId: string,
    correlationId?: string,
  ): Promise<ProcessedOrder> {
    return this.orderEngine.refundOrder(tenantId, orderId, correlationId);
  }

  /** Tylko dla testów — umożliwia wstrzyknięcie zamówienia. */
  public setOrderForTesting(order: ProcessedOrder): void {
    this.orderEngine.setOrderForTesting(order);
  }

  public getOrderProcessingEngine(): OrderProcessingEngine {
    return this.orderEngine;
  }

  public getPaymentEngine(): PaymentEngine {
    return this.paymentEngine;
  }

  public getEventBus(): PlatformEventBusImpl {
    return this.eventBus;
  }
}
