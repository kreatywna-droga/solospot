/**
 * cart-store.test.ts — Sprint 6 Step 6 Finalization
 *
 * Node environment (bez jsdom). Testuje wyłącznie czysty reducer UI
 * (cartReducer) — ZERO logiki biznesowej, ZERO zależności od localStorage.
 *
 * Zakres (Zadanie A):
 *   - HYDRATE z LocalStorage-podobnej listy
 *   - ADD_ITEM (nowa pozycja + istniejąca pozycja / podmiana)
 *   - REMOVE_ITEM
 *   - UPDATE_QUANTITY
 *   - CLEAR
 *   - itemCount (liczba sztuk, nie unikalnych produktów)
 */
import { describe, it, expect } from 'vitest';
import { cartReducer, type CartItem, type CartState } from '../CartStore';

function makeItem(over: Partial<CartItem> = {}): CartItem {
  return {
    productId: 'prod-1',
    name: 'Test Product',
    price: 100,
    currency: 'PLN',
    image: '/img/test.png',
    quantity: 1,
    ...over,
  };
}

function initialState(over: Partial<CartState> = {}): CartState {
  return { items: [], itemCount: 0, hydrated: false, ...over };
}

describe('CartStore — cartReducer (UI state only)', () => {
  it('HYDRATE ustawia elementy, itemCount i hydrated=true', () => {
    const items = [
      makeItem({ productId: 'p1', quantity: 1 }),
      makeItem({ productId: 'p2', quantity: 3 }),
    ];
    const state = cartReducer(initialState(), { type: 'HYDRATE', payload: items });

    expect(state.items).toHaveLength(2);
    expect(state.itemCount).toBe(4);
    expect(state.hydrated).toBe(true);
  });

  it('ADD_ITEM dodaje nową pozycję i aktualizuje itemCount', () => {
    const state = cartReducer(initialState(), {
      type: 'ADD_ITEM',
      payload: makeItem({ productId: 'p1', quantity: 2 }),
    });

    expect(state.items).toHaveLength(1);
    expect(state.items[0].productId).toBe('p1');
    expect(state.itemCount).toBe(2);
  });

  it('ADD_ITEM kumuluje ilość dla istniejącej pozycji (nie duplikuje)', () => {
    const base = initialState({
      items: [makeItem({ productId: 'p1', quantity: 1 })],
      itemCount: 1,
      hydrated: true,
    });

    const state = cartReducer(base, {
      type: 'ADD_ITEM',
      payload: makeItem({ productId: 'p1', quantity: 5 }),
    });

    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(6); // 1 + 5 = 6
    expect(state.itemCount).toBe(6);
  });

  it('ADD_ITEM ignoruje niepoprawną ilość (quantity <= 0)', () => {
    const base = initialState({
      items: [makeItem({ productId: 'p1', quantity: 2 })],
      itemCount: 2,
      hydrated: true,
    });

    const state = cartReducer(base, {
      type: 'ADD_ITEM',
      payload: makeItem({ productId: 'p1', quantity: 0 }),
    });

    expect(state).toBe(base);
  });

  it('REMOVE_ITEM usuwa pozycję po productId', () => {
    const base = initialState({
      items: [
        makeItem({ productId: 'p1', quantity: 1 }),
        makeItem({ productId: 'p2', quantity: 2 }),
      ],
      itemCount: 3,
      hydrated: true,
    });

    const state = cartReducer(base, { type: 'REMOVE_ITEM', payload: { productId: 'p1' } });

    expect(state.items.map((i) => i.productId)).toEqual(['p2']);
    expect(state.itemCount).toBe(2);
  });

  it('UPDATE_QUANTITY aktualizuje ilość i przelicza itemCount', () => {
    const base = initialState({
      items: [makeItem({ productId: 'p1', quantity: 1 })],
      itemCount: 1,
      hydrated: true,
    });

    const state = cartReducer(base, {
      type: 'UPDATE_QUANTITY',
      payload: { productId: 'p1', quantity: 7 },
    });

    expect(state.items[0].quantity).toBe(7);
    expect(state.itemCount).toBe(7);
  });

  it('UPDATE_QUANTITY z ilością <= 0 usuwa pozycję z koszyka', () => {
    const base = initialState({
      items: [
        makeItem({ productId: 'p1', quantity: 2 }),
        makeItem({ productId: 'p2', quantity: 3 }),
      ],
      itemCount: 5,
      hydrated: true,
    });

    const state1 = cartReducer(base, {
      type: 'UPDATE_QUANTITY',
      payload: { productId: 'p1', quantity: 0 },
    });

    expect(state1.items).toHaveLength(1);
    expect(state1.items[0].productId).toBe('p2');
    expect(state1.itemCount).toBe(3);

    const state2 = cartReducer(state1, {
      type: 'UPDATE_QUANTITY',
      payload: { productId: 'p2', quantity: -1 },
    });

    expect(state2.items).toHaveLength(0);
    expect(state2.itemCount).toBe(0);
  });

  it('CLEAR czyści koszyk i zeruje itemCount', () => {
    const base = initialState({
      items: [makeItem({ productId: 'p1', quantity: 2 })],
      itemCount: 2,
      hydrated: true,
    });

    const state = cartReducer(base, { type: 'CLEAR' });

    expect(state.items).toHaveLength(0);
    expect(state.itemCount).toBe(0);
    expect(state.hydrated).toBe(true);
  });

  it('nieznana akcja zwraca stan bez zmian', () => {
    const base = initialState({ items: [makeItem()], itemCount: 1, hydrated: true });
    const state = cartReducer(base, { type: 'UNKNOWN' } as never);
    expect(state).toBe(base);
  });
});

