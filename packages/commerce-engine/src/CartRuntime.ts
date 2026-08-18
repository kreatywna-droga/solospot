import { z } from 'zod';
import { Product } from './ProductDomain';

export const CartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPriceGross: z.number().int().nonnegative(),
  totalGross: z.number().int().nonnegative(),
  taxRate: z.number().nonnegative().optional(),
  unitPriceNet: z.number().int().nonnegative().optional(),
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
   * Recalculates all sums and taxes for the cart based on fresh product pricing
   * or existing item pricing if fresh product details are not supplied in the map.
   */
  public static recalculate(cart: Cart, products?: Map<string, Product>): Cart {
    let subtotalGross = 0;
    let subtotalNet = 0;
    let taxTotal = 0;

    const updatedItems = cart.items.map((item) => {
      const product = products?.get(item.productId);

      let unitPriceGross: number;
      let taxRate: number;

      if (product) {
        unitPriceGross = product.pricing.priceGross;
        taxRate = product.pricing.taxRate;
      } else if (item.unitPriceGross !== undefined && item.unitPriceGross >= 0) {
        unitPriceGross = item.unitPriceGross;
        taxRate = item.taxRate !== undefined ? item.taxRate : 23;
      } else {
        throw new Error(`Product pricing not found for item: ${item.productId}`);
      }

      const totalGross = unitPriceGross * item.quantity;
      const taxRateDec = taxRate / 100;
      const unitPriceNet = Math.round(unitPriceGross / (1 + taxRateDec));
      const totalNet = unitPriceNet * item.quantity;
      const itemTaxTotal = totalGross - totalNet;

      subtotalGross += totalGross;
      subtotalNet += totalNet;
      taxTotal += itemTaxTotal;

      return {
        ...item,
        unitPriceGross,
        unitPriceNet,
        taxRate,
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

    const recalculatedCart: Cart = {
      ...cart,
      items: updatedItems,
      totals,
      updatedAt: new Date().toISOString(),
    };

    return CartSchema.parse(recalculatedCart);
  }

  /**
   * Adds or updates a product inside the cart with full stock and state validation.
   */
  public static addItem(
    cart: Cart,
    product: Product,
    quantity: number,
    existingProducts?: Map<string, Product>
  ): Cart {
    if (quantity <= 0) {
      throw new Error(`Quantity must be a positive integer. Received: ${quantity}`);
    }

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

    const unitPriceNet = Math.round(product.pricing.priceGross / (1 + product.pricing.taxRate / 100));

    let updatedItems: CartItem[];
    if (existingItem) {
      updatedItems = cart.items.map((item) =>
        item.productId === product.id
          ? {
              ...item,
              quantity: targetQuantity,
              unitPriceGross: product.pricing.priceGross,
              unitPriceNet,
              taxRate: product.pricing.taxRate,
              totalGross: product.pricing.priceGross * targetQuantity,
            }
          : item
      );
    } else {
      updatedItems = [
        ...cart.items,
        {
          productId: product.id,
          quantity,
          unitPriceGross: product.pricing.priceGross,
          unitPriceNet,
          taxRate: product.pricing.taxRate,
          totalGross: product.pricing.priceGross * quantity,
        },
      ];
    }

    const updatedCart: Cart = {
      ...cart,
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    };

    const productsMap = new Map<string, Product>(existingProducts || []);
    productsMap.set(product.id, product);

    return this.recalculate(updatedCart, productsMap);
  }

  /**
   * Removes an item from the cart and recalculates totals.
   */
  public static removeItem(cart: Cart, productId: string, products?: Map<string, Product>): Cart {
    const updatedItems = cart.items.filter((item) => item.productId !== productId);
    const updatedCart: Cart = {
      ...cart,
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    };
    return this.recalculate(updatedCart, products);
  }

  /**
   * Updates quantity of an item in the cart. If quantity <= 0, item is removed.
   */
  public static updateQuantity(
    cart: Cart,
    productId: string,
    quantity: number,
    product?: Product,
    products?: Map<string, Product>
  ): Cart {
    if (quantity <= 0) {
      return this.removeItem(cart, productId, products);
    }

    const existingItem = cart.items.find((item) => item.productId === productId);
    if (!existingItem) {
      throw new Error(`Item with productId '${productId}' not found in cart.`);
    }

    if (product) {
      if (
        !product.inventory.allowBackorder &&
        quantity > product.inventory.quantityAvailable
      ) {
        throw new InsufficientInventoryException(
          `Insufficient inventory for product '${product.id}'. Available: ${product.inventory.quantityAvailable}, Requested: ${quantity}`
        );
      }
    }

    const updatedItems = cart.items.map((item) => {
      if (item.productId !== productId) return item;
      const unitPriceGross = product ? product.pricing.priceGross : item.unitPriceGross;
      const taxRate = product ? product.pricing.taxRate : item.taxRate;
      const unitPriceNet = product
        ? Math.round(unitPriceGross / (1 + product.pricing.taxRate / 100))
        : item.unitPriceNet;
      return {
        ...item,
        quantity,
        unitPriceGross,
        unitPriceNet,
        taxRate,
        totalGross: unitPriceGross * quantity,
      };
    });

    const updatedCart: Cart = {
      ...cart,
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    };

    const productsMap = new Map<string, Product>(products || []);
    if (product) {
      productsMap.set(product.id, product);
    }

    return this.recalculate(updatedCart, productsMap);
  }
}
