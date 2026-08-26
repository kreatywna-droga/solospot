# G1-05-A ERROR CLUSTER IDENTIFICATION REPORT — TS2741 (BuilderPage `seo`)

> **Rola:** Agent 1 — Technical Investigator & Identification Lead  
> **Tryb:** 🔵 READ-ONLY / ANALYSIS ONLY (CODE CHANGES = 0, TEST CHANGES = 0, CONFIG CHANGES = 0)  
> **Przedmiot identyfikacji:** Klaster błędów TS2741 (brak właściwości `seo` w typie `BuilderPage`) w testach `packages/authoring-studio/src/experience/__tests__`  
> **Status bazowy repozytorium:** 380 błędów po zamknięciu i ratyfikacji RC1 / G1-04 (G1-04-A3 PASS)  
> **Data:** 14 sierpnia 2026 r.  

---

## 1. Podsumowanie wykonawcze (Executive Summary)

W ramach zadania **TASK G1-05-A** przeprowadzono analizę statyczną i identyfikację klastra błędów **TS2741**.  
Świeża weryfikacja kompilatora TypeScript (`npx tsc --noEmit --incremental false`) potwierdza obecność **dokładnie 3 wystąpień błędu TS2741** w całym repozytorium.

Wszystkie 3 błędy wynikają z **tej samej, izolowanej przyczyny**: niepełnej inicjalizacji literału obiektu `BuilderPage` w mockach danych (`sampleDoc.pages[0]`) w plikach testowych pakietu `authoring-studio`.

---

## 2. Metodyka i dowody kompilatora (Fresh tsc Evidence)

| Krok | Parametr / Wynik |
|---|---|
| Komenda weryfikacyjna | `npx tsc --noEmit --incremental false` |
| Cache TS | Wyłączony (`--incremental false`) |
| Całkowita liczba błędów w repozytorium | **380** (zgodne z baseline po G1-04-A3) |
| Łączna liczba błędów TS2741 | **3** (100% zlokalizowanych w `experience/__tests__`) |
| Zmodyfikowane pliki podczas identyfikacji | **0** (CODE: 0, TEST: 0, CONFIG: 0) |

---

## 3. Szczegółowa inwentaryzacja błędów TS2741

Poniższa tabela przedstawia pełną listę zidentyfikowanych wystąpień TS2741:

| Lp. | Plik | Linia:Kolumna | Pełny komunikat TypeScript (TS2741) | Wymagana właściwość / typ |
|:---:|---|:---:|---|---|
| 1 | `packages/authoring-studio/src/experience/__tests__/Playback.test.ts` | `11:7` | `Property 'seo' is missing in type '{ id: string; name: string; slug: string; isHome: true; sections: never[]; }' but required in type 'BuilderPage'.` | `seo: BuilderSEO` |
| 2 | `packages/authoring-studio/src/experience/__tests__/PreviewIntegration.test.ts` | `10:13` | `Property 'seo' is missing in type '{ id: string; name: string; slug: string; isHome: true; sections: never[]; }' but required in type 'BuilderPage'.` | `seo: BuilderSEO` |
| 3 | `packages/authoring-studio/src/experience/__tests__/Seek.test.ts` | `10:13` | `Property 'seo' is missing in type '{ id: string; name: string; slug: string; isHome: true; sections: never[]; }' but required in type 'BuilderPage'.` | `seo: BuilderSEO` |

---

## 4. Analiza kontraktu domenowego (`BuilderPage` & `BuilderSEO`)

### 4.1 Definicja interfejsu w SSOT
Lokalizacja: [`packages/builder-core/src/BuilderDocument.ts`](file:///c:/Users/HP/Documents/GOOGLE%20ANTIGRAVITY%20APK/WEB%20FACTOR/packages/builder-core/src/BuilderDocument.ts#L47-L88)

```typescript
// packages/builder-core/src/BuilderDocument.ts (linie 47-53)
export interface BuilderSEO {
  title?: string;
  description?: string;
  ogImage?: string;
  robots?: string;
  canonicalUrl?: string;
}

// packages/builder-core/src/BuilderDocument.ts (linie 81-88)
export interface BuilderPage {
  readonly id: string;
  slug: string;
  name: string;
  sections: SectionNode[];  // root-level tree of this page
  seo: BuilderSEO;          // <-- WŁAŚCIWOŚĆ WYMAGANA (mandatory)
  isHome: boolean;
}
```

### 4.2 Ustalenia dotyczące kontraktu
1. **Wymagalność pola:** Właściwość `seo` w `BuilderPage` jest polem obowiązkowym (`seo: BuilderSEO`), a nie opcjonalnym (`seo?: BuilderSEO`).
2. **Kształt typu `BuilderSEO`:** Wszystkie wewnętrzne pola typu `BuilderSEO` (`title`, `description`, `ogImage`, `robots`, `canonicalUrl`) są opcjonalne (`?`). Oznacza to, że pusty obiekt `{}` lub obiekt zawierający podstawowe metadane (np. `{ title: '...' }`) jest w 100% poprawnym typem `BuilderSEO`.
3. **Stan kontraktu produkcyjnego:** Kontrakt `BuilderDocument` / `BuilderPage` w `builder-core` jest elementem architektury SSOT i jest **zamrożony (FROZEN)**. Nie wymaga i nie powinien podlegać żadnym zmianom.

---

## 5. Analiza kodu testowego (Root Cause Analysis)

### 5.1 `Playback.test.ts` (linie 10–18)
```typescript
pages: [
  {
    id: 'page_home',
    name: 'Home',
    slug: '/',
    isHome: true,
    sections: [],
    // BRAK: seo: {}
  },
]
```

### 5.2 `PreviewIntegration.test.ts` (linia 10)
```typescript
pages: [{ id: 'p1', name: 'Home', slug: '/', isHome: true, sections: [] /* BRAK: seo: {} */ }]
```

### 5.3 `Seek.test.ts` (linia 10)
```typescript
pages: [{ id: 'p1', name: 'P1', slug: '/', isHome: true, sections: [] /* BRAK: seo: {} */ }]
```

### 5.4 Wnioski ze wspólnej przyczyny
- Wszystkie 3 błędy mają **wspólne źródło**: instancjonowanie uproszczonego literału `BuilderPage` w mockach testowych bez uwzględnienia obowiązkowego pola `seo`.
- W żadnym z testów pole `seo` nie bierze udziału w logice asercji (testy dotyczą silnika odtwarzania czasu rzeczywistego: Play/Pause/Seek/Diagnostics).
- Uzupełnienie pola `seo: {}` w tych trzech literałach całkowicie eliminuje błędy TS2741 bez wpływu na przebieg i asercje testów.

---

## 6. Szacowany zakres i bezpieczeństwo przyszłej naprawy (G1-05-B)

| Kategoria | Planowany zakres | Uwagi |
|---|:---:|---|
| **Pliki produkcyjne (CODE)** | **0** | Żadne pliki z `src/` ani `packages/*/src/` (poza testami) nie będą modyfikowane. |
| **Pliki testowe (TEST)** | **3** | `Playback.test.ts`, `PreviewIntegration.test.ts`, `Seek.test.ts` |
| **Pliki konfiguracyjne (CONFIG)** | **0** | Brak zmian w `tsconfig.json` czy konfiguracji narzędzi. |
| **Zmiany w kontraktach domenowych** | **0** | Kontrakt `BuilderPage` pozostaje w 100% nienaruszony. |
| **Ryzyko regresji** | **Brak (Zero)** | Zmiana dotyczy wyłącznie literałów fixtures w izolowanych plikach testowych unit testów. |
| **Oczekiwana redukcja błędów** | **−3** | Total TS errors: 380 → 377 (TS2741: 3 → 0). |

---

## 7. Werdykt i rekomendacja końcowa

```
================================================================================
G1-05-A CLUSTER IDENTIFICATION RESULT:

Liczba zidentyfikowanych błędów:                 3 × TS2741
Pliki:                                           3 pliki w experience/__tests__
Spójność przyczyny źródłowej:                    100% (brak 'seo' w mockach BuilderPage)
Wpływ na kod produkcyjny:                        0 zmian produkcyjnych
Wpływ na kontrakty domenowe:                     0 zmian kontraktów
Bezpieczeństwo naprawy:                          IZOLOWANY, SPÓJNY KLASTER

STATUS: G1-05 = READY FOR REPAIR
================================================================================
```

🛑 **Zakończono identyfikację klastra G1-05-A. Brak modyfikacji w kodzie i testach. Oczekiwanie na audyt identyfikacji przez Agenta 2.**
