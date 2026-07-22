import { PlatformEventBusImpl } from '../../platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '../../platform-core/src/logger/Logger';
import { EventRegistry } from '../../platform-core/src/events/EventRegistry';
import { Product, ProductSchema } from './ProductDomain';
import { Cart, CartManager, CartSchema } from './CartRuntime';
import { Order, CheckoutManager, OrderSchema, ShippingAddress } from './CheckoutFlow';

export class TenantSecurityException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TenantSecurityException';
  }
}

export class CommerceEngine {
  private readonly eventBus: PlatformEventBusImpl;
  private readonly logger: ConsolePlatformLogger;

  constructor(options: {
    eventBus: PlatformEventBusImpl;
    logger: ConsolePlatformLogger;
  }) {
    this.eventBus = options.eventBus;
    this.logger = options.logger;

    // Register all commerce domain events
    const commerceEvents = [
      'Product.Created',
      'Cart.Created',
      'Cart.Updated',
      'Order.Created',
      'Payment.Completed',
      'Order.Fulfilled',
    ];
    for (const evt of commerceEvents) {
      EventRegistry.register(evt);
    }
  }

  /**
   * Safe check to prevent tenant cross-contamination (RLS check in app layer)
   */
  private enforceTenantIsolation(tenantId: string, targetTenantId: string, contextMessage: string): void {
    if (tenantId !== targetTenantId) {
      throw new TenantSecurityException(
        `Cross-tenant access blocked during: ${contextMessage}. Active: ${tenantId}, Target: ${targetTenantId}`
      );
    }
  }

  /**
   * Adds a product to the catalog, enforcing tenant assignment and scheme checks.
   */
  public async createProduct(
    tenantId: string,
    productData: Omit<Product, 'tenantId'>,
    correlationId?: string
  ): Promise<Product> {
    const cid = correlationId || `prod_create_${Date.now()}`;
    
    const product: Product = {
      ...productData,
      tenantId,
    };

    // Safe parsing using schema
    ProductSchema.parse(product);

    this.logger.info({
      message: `Creating product: ${product.id} for tenant: ${tenantId}`,
      correlationId: cid,
      tenantId,
    });

    await this.eventBus.publish({
      eventId: `evt_prod_created_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'Product.Created',
      timestamp: new Date().toISOString(),
      correlationId: cid,
      tenantId,
      payload: { productId: product.id },
    });

    return product;
  }

  /**
   * Generates a new shopping cart.
   */
  public async createCart(tenantId: string, correlationId?: string): Promise<Cart> {
    const cid = correlationId || `cart_create_${Date.now()}`;
    const cartId = `crt_${Math.random().toString(36).substr(2, 9)}`;

    const cart: Cart = {
      id: cartId,
      tenantId,
      items: [],
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

    CartSchema.parse(cart);

    this.logger.info({
      message: `Creating cart: ${cartId} for tenant: ${tenantId}`,
      correlationId: cid,
      tenantId,
    });

    await this.eventBus.publish({
      eventId: `evt_cart_created_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'Cart.Created',
      timestamp: new Date().toISOString(),
      correlationId: cid,
      tenantId,
      payload: { cartId },
    });

    return cart;
  }

  /**
   * Securely adds a product to the cart. Enforces RLS tenant matches.
   */
  public async addItemToCart(
    tenantId: string,
    cart: Cart,
    product: Product,
    quantity: number,
    correlationId?: string
  ): Promise<Cart> {
    const cid = correlationId || `cart_add_${Date.now()}`;

    // Tenant Isolation Check
    this.enforceTenantIsolation(tenantId, cart.tenantId, 'Add item: Cart ownership validation');
    this.enforceTenantIsolation(tenantId, product.tenantId, 'Add item: Product catalog boundary');

    const updatedCart = CartManager.addItem(cart, product, quantity);

    this.logger.info({
      message: `Added item (product: ${product.id}, qty: ${quantity}) to cart: ${cart.id}`,
      correlationId: cid,
      tenantId,
    });

    await this.eventBus.publish({
      eventId: `evt_cart_updated_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'Cart.Updated',
      timestamp: new Date().toISOString(),
      correlationId: cid,
      tenantId,
      payload: { cartId: cart.id, itemsCount: updatedCart.items.length },
    });

    return updatedCart;
  }

  /**
   * Initializes order checkout.
   */
  public async checkoutCart(
    tenantId: string,
    cart: Cart,
    shippingAddress: ShippingAddress,
    correlationId?: string
  ): Promise<Order> {
    const cid = correlationId || `checkout_${Date.now()}`;

    this.enforceTenantIsolation(tenantId, cart.tenantId, 'Checkout: Cart ownership validation');

    const order = CheckoutManager.createOrder(cart, shippingAddress);
    OrderSchema.parse(order);

    this.logger.info({
      message: `Created order: ${order.id} for cart: ${cart.id}`,
      correlationId: cid,
      tenantId,
    });

    await this.eventBus.publish({
      eventId: `evt_order_created_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'Order.Created',
      timestamp: new Date().toISOString(),
      correlationId: cid,
      tenantId,
      payload: { orderId: order.id, cartId: cart.id },
    });

    return order;
  }

  /**
   * Confirm order payment status.
   */
  public async confirmOrderPayment(
    tenantId: string,
    order: Order,
    paymentIntentId: string,
    correlationId?: string
  ): Promise<Order> {
    const cid = correlationId || `payment_confirm_${Date.now()}`;

    this.enforceTenantIsolation(tenantId, order.tenantId, 'Confirm Payment: Order ownership validation');

    const paidOrder = CheckoutManager.confirmPayment(order, paymentIntentId);

    this.logger.info({
      message: `Confirmed payment for order: ${order.id} (Intent: ${paymentIntentId})`,
      correlationId: cid,
      tenantId,
    });

    await this.eventBus.publish({
      eventId: `evt_pay_completed_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'Payment.Completed',
      timestamp: new Date().toISOString(),
      correlationId: cid,
      tenantId,
      payload: { orderId: order.id, paymentIntentId },
    });

    return paidOrder;
  }

  /**
   * Transition order to FULFILLED status.
   */
  public async fulfillOrder(
    tenantId: string,
    order: Order,
    correlationId?: string
  ): Promise<Order> {
    const cid = correlationId || `fulfillment_${Date.now()}`;

    this.enforceTenantIsolation(tenantId, order.tenantId, 'Fulfill Order: Order ownership validation');

    const fulfilledOrder = CheckoutManager.fulfillOrder(order);

    this.logger.info({
      message: `Fulfilled order: ${order.id}`,
      correlationId: cid,
      tenantId,
    });

    await this.eventBus.publish({
      eventId: `evt_order_fulfilled_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'Order.Fulfilled',
      timestamp: new Date().toISOString(),
      correlationId: cid,
      tenantId,
      payload: { orderId: order.id },
    });

    return fulfilledOrder;
  }
}
