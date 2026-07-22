---
Status: REVIEW
Author: AI Engineering Team
Reviewer: Marcin
Version: 1.0
Last Review: 2026-07-10
Depends On:
- docs/review/SPRINT_4_COMMERCE_RUNTIME/06_SHIPPING_ENGINE.md
---

# SPRINT 4: COMMERCE RUNTIME
## Specyfikacja Kontraktu — 07_TAX_ENGINE.md
*Definicja silnika podatkowego (Tax Engine), zasad kalkulacji podatków dla koszyka i wysyłek, zwolnień podatkowych oraz mechanizmów izolacji tenantów przy obliczeniach skarbowych.*

---

### 1. Model Domenowy Podatków (Tax Domain Model)

Wszystkie stawki podatkowe, reguły regionalne oraz zwolnienia są przypisane do odpowiedniego tenanta (`tenantId`). Ceny i wartości podatkowe są zawsze wyrażane jako liczby całkowite (integer grosze/cents) dla zachowania absolutnej precyzji finansowej.

```typescript
export interface TaxRate {
  id: string;
  tenantId: string;
  name: string;        // np. "VAT 23%", "VAT 8%", "Zero Tax"
  ratePercent: number; // np. 23 (oznacza 23%)
  code: string;        // np. "vat_23", "vat_8", "zero"
}

export interface TaxRegionRule {
  id: string;
  tenantId: string;
  countryCode: string; // ISO 3166-1 alpha-2 (np. "PL", "DE", "FR")
  taxRateId: string;   // Domyślna stawka przypisana do regionu
  shippingTaxRateId?: string; // Stawka podatku dla kosztów dostawy w tym regionie
}

export interface TaxExemption {
  customerId: string;
  tenantId: string;
  reason: string;      // np. "B2B Reverse Charge", "VAT Free Institution"
  grantedAt: string;
}

export interface TaxCalculationResult {
  subtotalNet: number;
  taxTotal: number;
  subtotalGross: number;
  breakdown: Array<{
    taxRateCode: string;
    taxRatePercent: number;
    taxAmount: number;
    netAmount: number;
  }>;
}
```

---

### 2. Architektura Silnika Podatkowego (Tax Engine)

Silnik `TaxEngine` dostarcza metody obliczania podatku dla poszczególnych produktów, koszyka zakupowego oraz kosztów wysyłki.

#### Główne metody:
1. **`calculateProductTax(tenantId: string, priceGross: number, taxRateId: string): Promise<{ net: number; tax: number }>`**
   * Wylicza wartość netto oraz kwotę podatku z ceny brutto według wzoru:
     $$Net = \text{round}\left(\frac{PriceGross}{1 + \frac{RatePercent}{100}}\right)$$
     $$Tax = PriceGross - Net$$
2. **`calculateCartTax(tenantId: string, items: Array<{ priceGross: number; quantity: number; taxRateId: string }>, shipping?: { priceGross: number; taxRateId: string }, countryCode?: string, customerId?: string): Promise<TaxCalculationResult>`**
   * Ustala region kalkulacji (domyślnie "PL").
   * Sprawdza, czy klient posiada aktywne zwolnienie podatkowe (`TaxExemption`). Jeśli tak, stosuje stawkę 0% (oraz emituje `Tax.ExemptionGranted`).
   * Dokonuje sumarycznej kalkulacji wartości netto, podatków i brutto z podziałem na stawki.
   * Emituje zdarzenie `Tax.Calculated`.
3. **`grantTaxExemption(tenantId: string, customerId: string, reason: string): Promise<TaxExemption>`**
   * Nadaje zwolnienie podatkowe dla klienta.
4. **`registerTaxRate(rate: TaxRate): void`**
5. **`registerRegionRule(rule: TaxRegionRule): void`**

---

### 3. Zdarzenia Podatkowe (Tax Events)

Zdarzenia publikowane na szynie `PlatformEventBus`:
* **`Tax.Calculated`**: Zakończenie obliczeń podatkowych dla transakcji.
* **`Tax.RuleApplied`**: Zastosowanie określonej reguły podatkowej kraju/regionu.
* **`Tax.ExemptionGranted`**: Uznanie zwolnienia podatkowego dla danego klienta.

---

### 4. Izolacja i Bezpieczeństwo Wielodostępności (RLS)

Silnik podatkowy restrykcyjnie weryfikuje przynależność stawek podatkowych i reguł regionalnych do tenanta. Próba użycia reguł innego sklepu wyzwala `TenantSecurityException`.

---

### 5. Kontrakt Testowy (Test Contract)

Implementacja silnika podatkowego w pliku `tax-engine.test.ts` musi zweryfikować:

1. **Obliczanie podatku VAT od ceny brutto (Happy Path)**:
   * Wyliczenie netto i podatku dla 1000 groszy przy VAT 23% (Net: 813, Tax: 187).
2. **Obsługa reguł regionalnych**:
   * Przejście między "PL" (23%) a "DE" (19%) powoduje poprawną zmianę wyliczeń wartości podatku.
3. **Kalkulacja podatku dla wysyłki**:
   * Naliczanie odpowiedniego podatku od kosztów dostawy.
4. **Zwolnienie podatkowe (Tax Exemption)**:
   * Klient ze zwolnieniem podatkowym otrzymuje wyliczenie z zerowym VAT-em (Tax: 0, Net: równe Gross).
5. **Izolacja Wielodostępności (Tenant Isolation)**:
   * Próba wywołania kalkulacji z regułą podatkową innego tenanta kończy się błędem `TenantSecurityException`.
