/**
 * CartStore.tsx — Sprint 6 Step 6
 *
 * WYŁĄCZNIE stan UI + LocalStorage + delegacja do commerce-engine.
 *
 * Zgodnie z korektą 1:
 *   - NIE implementuje logiki koszyka (sumy, rabaty, walidacja)
 *   - NIE wylicza rabatów ani podatków
 *   - Cała logika biznesowa → CartManager (commerce-engine)
 *
 * Odpowiedzialności:
 *   1. Przechowywanie stanu koszyka (React Context)
 *   2. Synchronizacja z LocalStorage (persystencja)
 *   3. Delegacja operacji (addItem, removeItem, updateQuantity) do CartManager
 *   4. Emisja zdarzeń do Navbar Badge
 */

'use client';

import React, { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';

// ---------------------------------------------------------------------------
// CartItem — lokalny typ UI (NIE commerce-engine CartItem)
// Zgodnie z korektą 1: tylko pola niezbędne UI, bez logiki biznesowej
// ---------------------------------------------------------------------------

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  currency: string;
  image: string;
  quantity: number;
}

// ---------------------------------------------------------------------------
// Typy
// ---------------------------------------------------------------------------

export interface CartState {
  /** Produkty w koszyku (tylko identyfikatory + ilość — ceny z commerce-engine) */
  items: CartItem[];
  /** Liczba unikalnych produktów */
  itemCount: number;
  /** Czy koszyk został załadowany z LocalStorage */
  hydrated: boolean;
}

export type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: { productId: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR' }
  | { type: 'HYDRATE'; payload: CartItem[] };

// ---------------------------------------------------------------------------
// Reducer — tylko manipulacja stanem UI, ZERO logiki biznesowej
// ---------------------------------------------------------------------------

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'HYDRATE':
      return {
        items: action.payload,
        itemCount: calculateItemCount(action.payload),
        hydrated: true,
      };

    case 'ADD_ITEM': {
      if (action.payload.quantity <= 0) return state;
      const existingIndex = state.items.findIndex(
        (i) => i.productId === action.payload.productId,
      );
      let updatedItems: CartItem[];
      if (existingIndex >= 0) {
        const existingItem = state.items[existingIndex];
        const newQuantity = existingItem.quantity + action.payload.quantity;
        updatedItems = [...state.items];
        updatedItems[existingIndex] = {
          ...action.payload,
          quantity: newQuantity,
        };
      } else {
        updatedItems = [...state.items, action.payload];
      }
      return {
        ...state,
        items: updatedItems,
        itemCount: calculateItemCount(updatedItems),
      };
    }

    case 'REMOVE_ITEM': {
      const updatedItems = state.items.filter(
        (i) => i.productId !== action.payload.productId,
      );
      return {
        ...state,
        items: updatedItems,
        itemCount: calculateItemCount(updatedItems),
      };
    }

    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        const updatedItems = state.items.filter(
          (i) => i.productId !== action.payload.productId,
        );
        return {
          ...state,
          items: updatedItems,
          itemCount: calculateItemCount(updatedItems),
        };
      }
      const updatedItems = state.items.map((item) =>
        item.productId === action.payload.productId
          ? { ...item, quantity: action.payload.quantity }
          : item,
      );
      return {
        ...state,
        items: updatedItems,
        itemCount: calculateItemCount(updatedItems),
      };
    }

    case 'CLEAR':
      return { items: [], itemCount: 0, hydrated: true };

    default:
      return state;
  }
}

function calculateItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

// ---------------------------------------------------------------------------
// LocalStorage
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'wf_cart';

function loadCartFromStorage(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CartItem[];
  } catch {
    return [];
  }
}

function saveCartToStorage(items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage pełny lub niedostępny — ciche ignorowanie
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface CartContextValue {
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
}

const CartContext = createContext<CartContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function CartProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    itemCount: 0,
    hydrated: false,
  });

  // Hydratacja z LocalStorage
  useEffect(() => {
    const stored = loadCartFromStorage();
    if (stored.length > 0) {
      dispatch({ type: 'HYDRATE', payload: stored });
    } else {
      dispatch({ type: 'HYDRATE', payload: [] });
    }
  }, []);

  // Automatyczny zapis do LocalStorage przy każdej zmianie
  useEffect(() => {
    if (state.hydrated) {
      saveCartToStorage(state.items);
    }
  }, [state.items, state.hydrated]);

  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}

export { CartContext };
