---
Status: REVIEW
Author: AI Engineering Team
Reviewer: Marcin
Version: 1.0
Last Review: 2026-07-10
Depends On:
- docs/review/SPRINT_4_COMMERCE_RUNTIME/03_ORDER_PROCESSING_ENGINE.md
---

# SPRINT 4: COMMERCE RUNTIME
## Specyfikacja Kontraktu — 05_INVENTORY_ENGINE.md
*Definicja silnika zarządzania magazynem (Inventory Management Engine), mechanizmu rezerwacji zasobów, historii ruchów magazynowych oraz systemu alertów o niskim stanie zapasów.*

---

### 1. Model Domenowy Magazynu (Inventory Domain Model)

Wszystkie stany magazynowe, rezerwacje i ruchy są przypisane do odpowiedniego tenanta (`tenantId`) oraz produktu (`productId`).

```typescript
export interface InventoryStock {
  productId: string;
  tenantId: string;
  quantityAvailable: number; // Stan fizyczny dostępny do rezerwacji/zakupu
  quantityReserved: number;  // Stan zablokowany rezerwacjami
  lowStockThreshold: number; // Próg wyzwalający alert o niskim stanie
}

export interface StockReservation {
  id: string;
  tenantId: string;
  productId: string;
  orderId: string;
  quantity: number;
  expiresAt: string;
  status: 'PENDING' | 'COMMITTED' | 'RELEASED';
}

export interface StockMovement {
  id: string;
  tenantId: string;
  productId: string;
  quantityDelta: number; // np. +100 (dostawa), -1 (sprzedaż)
  type: 'RECEIPT' | 'SALE' | 'RESERVATION_COMMIT' | 'ADJUSTMENT' | 'RETURN';
  reason?: string;
  createdAt: string;
}
```

---

### 2. Architektura Silnika Magazynowego (Inventory Management Engine)

Silnik `InventoryEngine` realizuje operacje blokowania towaru w koszyku/checkout, zatwierdzania sprzedaży po opłaceniu zamówienia oraz przyjmowania dostaw.

#### Główne metody:
1. **`reserveStock(tenantId: string, orderId: string, productId: string, quantity: number, ttlSeconds: number): Promise<StockReservation>`**
   * Sprawdza, czy `quantityAvailable >= quantity`. Jeśli nie, rzuca `InsufficientInventoryException`.
   * Zwiększa `quantityReserved` i pomniejsza `quantityAvailable`.
   * Zwraca obiekt rezerwacji w stanie `PENDING`.
2. **`commitStock(tenantId: string, reservationId: string): Promise<StockMovement>`**
   * Wywoływany po pomyślnej płatności (`Payment.Completed`).
   * Zmienia status rezerwacji na `COMMITTED`.
   * Rejestruje ruch magazynowy typu `RESERVATION_COMMIT`.
   * Odejmuje wartość z `quantityReserved`.
3. **`releaseStock(tenantId: string, reservationId: string): Promise<void>`**
   * Wywoływany w przypadku wygaśnięcia rezerwacji lub anulowania zamówienia.
   * Zmienia status rezerwacji na `RELEASED`.
   * Cofa ilość z `quantityReserved` z powrotem do `quantityAvailable`.
4. **`adjustStock(tenantId: string, productId: string, delta: number, type: StockMovement['type'], reason?: string): Promise<InventoryStock>`**
   * Zmienia stan magazynowy (np. dostawa towaru lub korekta inwentaryzacyjna).
   * Generuje ruch magazynowy `StockMovement`.
   * Jeśli stan spadnie poniżej `lowStockThreshold`, emituje zdarzenie `Inventory.LowStock`.

---

### 3. Zdarzenia Magazynowe (Inventory Events)

* **`Inventory.Reserved`**: Pomyślne zarezerwowanie ilości produktu dla checkoutu.
* **`Inventory.Committed`**: Towar ostatecznie zdjęty ze stanu po płatności.
* **`Inventory.Released`**: Zwolnienie blokady (anulowanie transakcji).
* **`Inventory.LowStock`**: Stan magazynowy spadł poniżej progu alarmowego (wyzwolenie notyfikacji do sprzedawcy).

---

### 4. Izolacja i Bezpieczeństwo Wielodostępności (RLS)

Silnik magazynowy pilnuje, aby żaden tenant nie miał dostępu ani nie mógł zmodyfikować zapasów innego sklepu. Każda operacja jest walidowana pod kątem spójności `tenantId` (odrzucenie prób modyfikacji rzuca `TenantSecurityException`).

---

### 5. Kontrakt Testowy (Test Contract)

Implementacja silnika magazynowego w pliku `inventory-engine.test.ts` musi zweryfikować:

1. **Przebieg rezerwacji i zatwierdzenia (Happy Path)**:
   * Rezerwacja towaru ➔ `Payment.Completed` ➔ `commitStock` ➔ Sprawdzenie ruchów magazynowych.
2. **Zwalnianie przeterminowanych rezerwacji**:
   * Rezerwacja towaru ➔ `releaseStock` ➔ Przywrócenie pierwotnego stanu dostępności.
3. **Wyzwalanie Alercji o Niskim Stanie**:
   * Korekta stanu poniżej progu `lowStockThreshold` ➔ Asercja emisji zdarzenia `Inventory.LowStock`.
4. **Izolacja Wielodostępności (Tenant Isolation)**:
   * Próba wywołania rezerwacji na produkcie z innego sklepu rzuca `TenantSecurityException`.
