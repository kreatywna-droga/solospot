# G1-05-E BUILDERDOCUMENT FIXTURE REPAIR REPORT — TS2353 Elimination

> **Rola:** Agent 1 — Technical Investigator & Repair Lead  
> **Tryb:** 🛠️ REPAIR EXECUTION (Zmiany wyłącznie w 3 wskazanych plikach testowych)  
> **Przedmiot naprawy:** Finding **G1-05-D-F2** — usunięcie 3 błędów TS2353 (`'name' does not exist in type 'BuilderDocument'`) poprzez pełne dostosowanie mocków `sampleDoc` do kontraktu `BuilderDocument`  
> **Pliki:**  
> 1. `packages/authoring-studio/src/experience/__tests__/Playback.test.ts`  
> 2. `packages/authoring-studio/src/experience/__tests__/PreviewIntegration.test.ts`  
> 3. `packages/authoring-studio/src/experience/__tests__/Seek.test.ts`  
> **Data:** 14 sierpnia 2026 r.  

---

## 1. Podsumowanie wykonawcze (Executive Summary)

W ramach zadania **TASK G1-05-E** zrealizowano naprawę findingu **G1-05-D-F2** w trzech plikach testowych pakietu `authoring-studio`.

Poprzedni stan repozytorium wynosił **380** błędów.  
Po dostosowaniu obiektów mock `sampleDoc` do rzeczywistego, niezmiennego kontraktu `BuilderDocument` (przeniesienie nazwy dokumentu do `metadata.storeName` oraz uzupełnienie wymaganych pól dokumentu), świeża weryfikacja kompilatora TypeScript wykazała spadek do dokładnie **377 błędów** (delta −3).

### Kluczowe metryki:
- **Stan początkowy (G1-05-D):** 380 błędów TS
- **Stan końcowy (G1-05-E):** **377 błędów TS** (380 → 377, delta −3) ✅
- **Błędy TS2741 (seo):** **0** ✅
- **Błędy TS2353 (name na BuilderDocument):** **0** ✅
- **Zakres modyfikacji:** **CODE: 0**, **TEST: 3 pliki**, **CONFIG: 0** ✅
- **Dyrektywy supresji TS (`any`, `@ts-ignore` itp.):** **0** ✅

---

## 2. Analiza przyczyny źródłowej TS2353 i kontraktu domenowego

### 2.1 Przyczyna błędu TS2353
W pierwotnych wersjach testów literał `sampleDoc: BuilderDocument` deklarował właściwość `name: 'Playback Test'` bezpośrednio w korzeniu obiektu.
Po naprawieniu `seo: {}` w kroku G1-05-C, kompilator TypeScript przeszedł do walidacji poziomu nadrzędnego i zgłosił nadmiarową właściwość:
```
error TS2353: Object literal may only specify known properties, and 'name' does not exist in type 'BuilderDocument'.
```

### 2.2 Rzeczywisty kontrakt `BuilderDocument` w SSOT
Lokalizacja: [`packages/builder-core/src/BuilderDocument.ts`](file:///c:/Users/HP/Documents/GOOGLE%20ANTIGRAVITY%20APK/WEB%20FACTOR/packages/builder-core/src/BuilderDocument.ts#L81-L104)

```typescript
export interface BuilderMetadata {
  readonly storeName: string;
  readonly storeSlug: string;
  readonly locale: string;
  readonly currency: string;
  readonly description?: string;
}

export interface BuilderTheme {
  primaryColor: string;
  secondaryColor: string;
  font: string;
  logo?: string;
  favicon?: string;
  backgroundColor?: string;
  borderRadius?: string;
}

export interface BuilderDocument {
  readonly id: string;
  readonly tenantId: string;
  version: number;
  metadata: BuilderMetadata;
  pages: BuilderPage[];
  theme: BuilderTheme;
  isDirty: boolean;
  createdAt: number;
  updatedAt: number;
}
```

W modelu domenowym właściwość określająca nazwę sklepu/dokumentu znajduje się w `metadata.storeName`.

---

## 3. Szczegółowy wykaz zmian w plikach testowych

### 3.1 `Playback.test.ts`
```diff
   const sampleDoc: BuilderDocument = {
     id: 'doc_playback',
-    name: 'Playback Test',
+    tenantId: 'tenant_playback',
+    version: 1,
+    metadata: {
+      storeName: 'Playback Test',
+      storeSlug: 'playback-test',
+      locale: 'en',
+      currency: 'USD',
+    },
+    theme: {
+      primaryColor: '#000000',
+      secondaryColor: '#ffffff',
+      font: 'Inter',
+    },
+    isDirty: false,
+    createdAt: 0,
+    updatedAt: 0,
     pages: [
       {
         id: 'page_home',
         name: 'Home',
         slug: '/',
         isHome: true,
         sections: [],
         seo: {},
       },
     ],
   };
```

### 3.2 `PreviewIntegration.test.ts`
```diff
   const sampleDoc: BuilderDocument = {
     id: 'doc_preview_diag',
-    name: 'Preview Diagnostic Test',
+    tenantId: 'tenant_preview_diag',
+    version: 1,
+    metadata: {
+      storeName: 'Preview Diagnostic Test',
+      storeSlug: 'preview-diag',
+      locale: 'en',
+      currency: 'USD',
+    },
+    theme: {
+      primaryColor: '#000000',
+      secondaryColor: '#ffffff',
+      font: 'Inter',
+    },
+    isDirty: false,
+    createdAt: 0,
+    updatedAt: 0,
     pages: [{ id: 'p1', name: 'Home', slug: '/', isHome: true, sections: [], seo: {} }],
   };
```

### 3.3 `Seek.test.ts`
```diff
   const sampleDoc: BuilderDocument = {
     id: 'doc_seek',
-    name: 'Seek Test',
+    tenantId: 'tenant_seek',
+    version: 1,
+    metadata: {
+      storeName: 'Seek Test',
+      storeSlug: 'seek-test',
+      locale: 'en',
+      currency: 'USD',
+    },
+    theme: {
+      primaryColor: '#000000',
+      secondaryColor: '#ffffff',
+      font: 'Inter',
+    },
+    isDirty: false,
+    createdAt: 0,
+    updatedAt: 0,
     pages: [{ id: 'p1', name: 'P1', slug: '/', isHome: true, sections: [], seo: {} }],
   };
```

---

## 4. Wyniki świeżej weryfikacji kompilatora (`tsc --noEmit --incremental false`)

| Metryka | Baseline (G1-05-D) | Po naprawie (G1-05-E) | Delta | Status |
|---|:---:|:---:|:---:|:---:|
| **TS2741 (brak `seo`)** | 0 | 0 | 0 | ✅ Zero błędów |
| **TS2353 (name na `BuilderDocument`)** | 3 | 0 | **−3** | ✅ Usunięte |
| **Błędy w `experience/__tests__`** | 28 | 25 | **−3** | ✅ Zredukowane |
| **Globalna liczba błędów TS** | **380** | **377** | **−3** | ✅ **Dokładnie 377** |

---

## 5. Weryfikacja zakresu zmian i dyscypliny architektonicznej

- **CODE:** 0 plików zmodyfikowanych (kod produkcyjny i kontrakty w `packages/builder-core` nietknięte).
- **TEST:** 3 pliki zmodyfikowane (`Playback.test.ts`, `PreviewIntegration.test.ts`, `Seek.test.ts`).
- **CONFIG:** 0 plików zmodyfikowanych.
- **Supresje TypeScript:** 0 wystąpień `any`, `as any`, `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`.
- **Zgodność z typami:** Wszystkie 3 mocki spełniają 100% rygorystycznego kontraktu `BuilderDocument`.

---

## 6. Podsumowanie i status końcowy

```
================================================================================
G1-05-E REPAIR AUDIT EVIDENCE:

Liczba usuniętych błędów TS2353:                 3 (3 → 0) ✅
Liczba błędów TS2741:                            0 ✅
Globalny licznik błędów:                         380 → 377 (delta −3) ✅
Liczba zmodyfikowanych plików:                   3 (TEST ONLY) ✅
Pliki produkcyjne (CODE):                        0 ZMIAN ✅
Pliki konfiguracyjne (CONFIG):                   0 ZMIAN ✅
Dyrektywy supresji TS:                           0 ✅

STATUS: ZADANIE G1-05-E UKOŃCZONE — STOP (OCZEKIWANIE NA G1-05-F AUDIT)
================================================================================
```
