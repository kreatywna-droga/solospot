/**
 * cartAdapter.ts — Sprint 6 Step 6
 *
 * WARSTWA ADAPTACYJNA (tylko mapowanie DTO, ZERO logiki biznesowej).
 *
 * Mapuje produkt z `src/lib/product` na kontrakt `commerce-engine Product`
 * oraz buduje `Cart` przy użyciu `CartManager` (commerce-engine) — cała
 * logika koszyka (sumy, rabaty, walidacja stanu/ilości) pozostaje w
 * `packages/commerce-engine/src/CartRuntime.ts`.
 */
import type { Product as StoreProduct } from '@/lib/product/ProductTypes';
import {
  Cart,
  CartManager,
  CartSchema,
  type Product as CommerceProduct,
} from '../../../packages/commerce-engine/src';

/** Domyślna stawka VAT używana przy mapowaniu ceny netto (zgodnie z OrderProcessingEngine). */
const DEFAULT_TAX_RATE = 23;

/**
 * Mapuje produkt storefront na kontrakt commerce-engine.
 * Wyłącznie translacja pól — bez reguł biznesowych.
 */
export function toCommerceProduct(p: StoreProduct): CommerceProduct {
  return {
    id: p.id,
    tenantId: p.tenantId,
    slug: p.id,
    name: p.name,
    description: p.description,
    categories: [],
    pricing: {
      priceGross: p.price,
      priceNet: Math.round(p.price / (1 + DEFAULT_TAX_RATE / 100)),
      taxRate: DEFAULT_TAX_RATE,
      currency: p.currency,
    },
    inventory: {
      sku: p.id,
      quantityAvailable: 99999,
      allowBackorder: true,
    },
    isActive: p.status === 'ACTIVE' || p.status === 'DRAFT',
    metadata: { storeProductId: p.id },
  };
}

/** Tworzy pusty koszyk (delegacja schematu commerce-engine). */
export function createEmptyCart(tenantId: string): Cart {
  const now = new Date().toISOString();
  const cart: Cart = {
    id: `crt_${Math.random().toString(36).substr(2, 9)}`,
    tenantId,
    items: [],
    totals: {
      subtotalGross: 0,
      subtotalNet: 0,
      taxTotal: 0,
      discountGross: 0,
      grandTotalGross: 0,
    },
    createdAt: now,
    updatedAt: now,
  };
  return CartSchema.parse(cart);
}

/**
 * Buduje koszyk z listy pozycji {productId, quantity} przy użyciu
 * `CartManager.addItem` (commerce-engine). Wszelkie reguły (stan produktu,
 * ilość, suma) wykonuje CartManager — ten moduł tylko przygotowuje dane.
 */
export function buildCartFromRequest(
  tenantId: string,
  items: Array<{ productId: string; quantity: number }>,
  products: StoreProduct[]
): Cart {
  let cart = createEmptyCart(tenantId);
  const productMap = new Map<string, StoreProduct>(products.map((p) => [p.id, p]));

  for (const item of items) {
    if (item.quantity <= 0) continue;
    const product = productMap.get(item.productId);
    if (!product) {
      throw new Error(`Product not found: ${item.productId}`);
    }
    cart = CartManager.addItem(cart, toCommerceProduct(product), item.quantity);
  }

  return CartSchema.parse(cart);
}

