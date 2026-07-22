import { z } from 'zod';
import { Cart, CartTotalsSchema } from './CartRuntime';

export const OrderStatusSchema = z.enum(['PENDING_PAYMENT', 'PAID', 'FULFILLED', 'CANCELLED']);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const OrderLineItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPriceGross: z.number().int().nonnegative(),
  totalGross: z.number().int().nonnegative(),
});
export type OrderLineItem = z.infer<typeof OrderLineItemSchema>;

export const ShippingAddressSchema = z.object({
  fullName: z.string().min(1),
  street: z.string().min(1),
  city: z.string().min(1),
  zipCode: z.string().min(1),
  country: z.string().min(1),
});
export type ShippingAddress = z.infer<typeof ShippingAddressSchema>;

export const OrderSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  cartId: z.string().min(1),
  items: z.array(OrderLineItemSchema),
  totals: CartTotalsSchema,
  status: OrderStatusSchema,
  shippingAddress: ShippingAddressSchema,
  paymentIntentId: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Order = z.infer<typeof OrderSchema>;

export class InvalidOrderStateException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidOrderStateException';
  }
}

export class CheckoutManager {
  /**
   * Translates a validated Cart into a PENDING_PAYMENT Order.
   */
  public static createOrder(
    cart: Cart,
    shippingAddress: ShippingAddress
  ): Order {
    if (cart.items.length === 0) {
      throw new Error('Cannot create an order from an empty cart.');
    }

    const orderId = `ord_${Math.random().toString(36).substr(2, 9)}`;
    const lineItems: OrderLineItem[] = cart.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPriceGross: item.unitPriceGross,
      totalGross: item.totalGross,
    }));

    return {
      id: orderId,
      tenantId: cart.tenantId,
      cartId: cart.id,
      items: lineItems,
      totals: cart.totals,
      status: 'PENDING_PAYMENT',
      shippingAddress,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Transitions Order status to PAID upon payment verification.
   */
  public static confirmPayment(order: Order, paymentIntentId: string): Order {
    if (order.status !== 'PENDING_PAYMENT') {
      throw new InvalidOrderStateException(
        `Cannot confirm payment for order '${order.id}' in state '${order.status}'`
      );
    }

    return {
      ...order,
      status: 'PAID',
      paymentIntentId,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Transitions Order status to FULFILLED when fulfilled.
   */
  public static fulfillOrder(order: Order): Order {
    if (order.status !== 'PAID') {
      throw new InvalidOrderStateException(
        `Cannot fulfill order '${order.id}' in state '${order.status}'`
      );
    }

    return {
      ...order,
      status: 'FULFILLED',
      updatedAt: new Date().toISOString(),
    };
  }
}
