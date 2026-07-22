import { z } from 'zod';
import { Product } from './ProductDomain';

export const CartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPriceGross: z.number().int().nonnegative(),
  totalGross: z.number().int().nonnegative(),
});

export const CartTotalsSchema = z.object({
  subtotalGross: z.number().int().nonnegative(),
  subtotalNet: z.number().int().nonnegative(),
  taxTotal: z.number().int().nonnegative(),
  discountGross: z.number().int().nonnegative(),
  grandTotalGross: z.number().int().nonnegative(),
});

export const CartSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  items: z.array(CartItemSchema),
  totals: CartTotalsSchema,
  couponCode: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type CartItem = z.infer<typeof CartItemSchema>;
export type CartTotals = z.infer<typeof CartTotalsSchema>;
export type Cart = z.infer<typeof CartSchema>;

export class InsufficientInventoryException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InsufficientInventoryException';
  }
}

export class ProductInactiveException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProductInactiveException';
  }
}

export class CartManager {
  /**
   * Recalculates all sums and taxes for the cart based on fresh product pricing.
   */
  public static recalculate(cart: Cart, products: Map<string, Product>): Cart {
    let subtotalGross = 0;
    let subtotalNet = 0;
    let taxTotal = 0;

    const updatedItems = cart.items.map((item) => {
      const product = products.get(item.productId);
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      const unitPriceGross = product.pricing.priceGross;
      const totalGross = unitPriceGross * item.quantity;
      
      const taxRateDec = product.pricing.taxRate / 100;
      const unitPriceNet = Math.round(unitPriceGross / (1 + taxRateDec));
      const totalNet = unitPriceNet * item.quantity;
      const itemTaxTotal = totalGross - totalNet;

      subtotalGross += totalGross;
      subtotalNet += totalNet;
      taxTotal += itemTaxTotal;

      return {
        ...item,
        unitPriceGross,
        totalGross,
      };
    });

    // Simple coupon discount (e.g. 10% off for code "SAVE10")
    let discountGross = 0;
    if (cart.couponCode === 'SAVE10') {
      discountGross = Math.round(subtotalGross * 0.1);
    }

    const grandTotalGross = Math.max(0, subtotalGross - discountGross);

    const totals: CartTotals = {
      subtotalGross,
      subtotalNet,
      taxTotal,
      discountGross,
      grandTotalGross,
    };

    return {
      ...cart,
      items: updatedItems,
      totals,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Adds or updates a product inside the cart with full stock and state validation.
   */
  public static addItem(cart: Cart, product: Product, quantity: number): Cart {
    if (!product.isActive) {
      throw new ProductInactiveException(`Product '${product.id}' is inactive and cannot be purchased.`);
    }

    const existingItem = cart.items.find((item) => item.productId === product.id);
    const targetQuantity = (existingItem?.quantity || 0) + quantity;

    if (
      !product.inventory.allowBackorder &&
      targetQuantity > product.inventory.quantityAvailable
    ) {
      throw new InsufficientInventoryException(
        `Insufficient inventory for product '${product.id}'. Available: ${product.inventory.quantityAvailable}, Requested: ${targetQuantity}`
      );
    }

    let updatedItems: CartItem[];
    if (existingItem) {
      updatedItems = cart.items.map((item) =>
        item.productId === product.id
          ? { ...item, quantity: targetQuantity }
          : item
      );
    } else {
      updatedItems = [
        ...cart.items,
        {
          productId: product.id,
          quantity,
          unitPriceGross: product.pricing.priceGross,
          totalGross: product.pricing.priceGross * quantity,
        },
      ];
    }

    const updatedCart: Cart = {
      ...cart,
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    };

    const productsMap = new Map<string, Product>([[product.id, product]]);
    return this.recalculate(updatedCart, productsMap);
  }
}
