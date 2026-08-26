'use client';

/**
 * /store/[slug]/cart — Sprint 6 Step 6
 *
 * CIENKA WARSTWA UI (ZERO logiki biznesowej).
 * - Cała logika koszyka → CartManager (commerce-engine)
 * - Stan UI → CartStore (LocalStorage + context)
 * - Produkty → renderStore (runtime pipeline)
 */

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCart, CartProvider } from '@/lib/cart/CartStore';
import { renderStore } from '@/lib/runtime';
import type { RuntimeProduct } from '@/lib/runtime';

function CartContent(): React.JSX.Element {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { state, dispatch } = useCart();
  const [products, setProducts] = useState<RuntimeProduct[]>([]);
  const [storeName, setStoreName] = useState('');

  useEffect(() => {
    renderStore({ slug, mode: 'LIVE' }).then((result) => {
      if (result?.success) {
        setProducts(result.products || []);
        setStoreName(result.storeName);
      }
    });
  }, [slug]);

  const getProduct = (productId: string): RuntimeProduct | undefined =>
    products.find((p) => p.id === productId);

  const subtotal = state.items.reduce((sum, item) => {
    const product = getProduct(item.productId);
    return sum + (product?.price || 0) * item.quantity;
  }, 0);

  if (!state.hydrated) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-slate-400">Ładowanie koszyka...</div></div>;
  }

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Koszyk jest pusty</h1>
          <p className="text-slate-500 mb-6">Dodaj produkty do koszyka, aby złożyć zamówienie.</p>
          <button
            onClick={() => router.push(`/store/${slug}`)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Wróć do sklepu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-8">Koszyk</h1>

        <div className="space-y-4">
          {state.items.map((item) => {
            const product = getProduct(item.productId);
            if (!product) return null;

            return (
              <div key={item.productId} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center gap-4">
                {product.images?.[0] && (
                  <img src={product.images[0]} alt={product.name} className="w-20 h-20 object-cover rounded-lg" />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800">{product.name}</h3>
                  <p className="text-sm text-slate-500">{product.price} {product.currency}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (item.quantity <= 1) {
                        dispatch({ type: 'REMOVE_ITEM', payload: { productId: item.productId } });
                      } else {
                        dispatch({ type: 'UPDATE_QUANTITY', payload: { productId: item.productId, quantity: item.quantity - 1 } });
                      }
                    }}
                    className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <button
                    onClick={() => dispatch({ type: 'UPDATE_QUANTITY', payload: { productId: item.productId, quantity: item.quantity + 1 } })}
                    className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    +
                  </button>
                </div>
                <div className="text-right min-w-[80px]">
                  <p className="font-semibold text-slate-800">{(product.price * item.quantity).toFixed(2)} {product.currency}</p>
                </div>
                <button
                  onClick={() => dispatch({ type: 'REMOVE_ITEM', payload: { productId: item.productId } })}
                  className="text-red-500 hover:text-red-700 transition-colors p-2"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-center text-lg">
            <span className="font-semibold text-slate-800">Suma</span>
            <span className="font-bold text-slate-800">{subtotal.toFixed(2)} PLN</span>
          </div>
          <button
            onClick={() => router.push(`/store/${slug}/checkout`)}
            className="w-full mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Przejdź do kasy
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CartPage(): React.JSX.Element {
  return (
    <CartProvider>
      <CartContent />
    </CartProvider>
  );
}
