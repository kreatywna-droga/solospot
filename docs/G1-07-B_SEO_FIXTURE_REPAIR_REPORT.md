# G1-07-B SEO FIXTURE REPAIR REPORT — 4 × TS2741 Elimination

> **Rola:** Agent 1 — Technical Investigator & Repair Lead  
> **Tryb:** 🛠️ REPAIR EXECUTION (`CODE = 0`, `TEST = 4`, `CONFIG = 0`)  
> **Przedmiot naprawy:** Naprawa 4 błędów `TS2741` dotyczących brakującej właściwości `seo` w fixture'ach `BuilderPage` oraz dostosowanie `sampleDoc` do pełnego kontraktu SSOT `BuilderDocument` w 4 plikach testowych  
> **Stan bazowy przed naprawą:** 358 błędów TypeScript  
> **Data:** 14 sierpnia 2026 r.  

---

## 1. Podsumowanie wykonawcze (Executive Summary)

W ramach zadania **TASK G1-07-B** zrealizowano precyzyjną naprawę 4 błędów `TS2741` odsłoniętych po naprawie `SectionNode` w zadaniu G1-07:
- `InspectorToCanvas.test.ts(11,7)`
- `LiveEditing.test.ts(11,7)`
- `TimelineToCanvas.test.ts(12,7)`
- `UndoRedoRender.test.ts(11,7)`

Świeża weryfikacja kompilatora TypeScript (`npx tsc --noEmit --incremental false`) potwierdza osiągnięcie założonego celu: **spadek globalnego licznika błędów z 358 do 354 (delta dokładnie −4)**.

### Kluczowe metryki wykonania:
- **Globalny stan bazowy przed naprawą:** **358**
- **Globalny stan po naprawie:** **354** (delta **−4**) ✅
- **Usunięte błędy TS2741 (seo):** **4 (4 → 0)** ✅
- **Błędy TS2322 (easing w `TimelineToCanvas.test.ts`):** dokładnie **2 (nietknięte)** ✅
- **Łączna liczba błędów w `experience/__tests__`:** dokładnie **2** (wyłącznie 2 × TS2322 easing) ✅
- **Zakres modyfikacji:** **CODE: 0**, **TEST: 4 pliki**, **CONFIG: 0** ✅
- **Dyrektywy supresji TS (`any`, `@ts-ignore` itp.):** **0** ✅
- **Modyfikacje kontraktów SSOT (`BuilderDocument`, `BuilderPage`, `BuilderSEO`):** **0** ✅

---

## 2. Rzeczywisty kontrakt produkcyjny `BuilderSEO` i `BuilderDocument` (SSOT)

W pliku [`packages/builder-core/src/BuilderDocument.ts`](file:///c:/Users/HP/Documents/GOOGLE%20ANTIGRAVITY%20APK/WEB%20FACTOR/packages/builder-core/src/BuilderDocument.ts) obowiązują następujące niezmienniki:

```typescript
export interface BuilderSEO {
  title?: string;
  description?: string;
  ogImage?: string;
  robots?: string;
  canonicalUrl?: string;
}

export interface BuilderPage {
  readonly id: string;
  slug: string;
  name: string;
  sections: SectionNode[];
  seo: BuilderSEO;
  isHome: boolean;
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

Fixture'y `sampleDoc` w 4 plikach testowych zostały uzupełnione o `seo: {}` na poziomie `BuilderPage` oraz właściwości korzenia `BuilderDocument` (`tenantId`, `metadata`, `theme`, `isDirty`, `createdAt`, `updatedAt`), w sposób w 100% zgodny z referencyjnymi testami z G1-05 (`Playback.test.ts`, `PreviewIntegration.test.ts`, `Seek.test.ts`).

---

## 3. Szczegółowy wykaz wprowadzonych zmian w 4 plikach testowych

### 3.1 [`packages/authoring-studio/src/experience/__tests__/InspectorToCanvas.test.ts`](file:///c:/Users/HP/Documents/GOOGLE%20ANTIGRAVITY%20APK/WEB%20FACTOR/packages/authoring-studio/src/experience/__tests__/InspectorToCanvas.test.ts#L7-L35)
```diff
   const sampleDoc: BuilderDocument = {
     id: 'doc_inspector',
-    name: 'Inspector Test Document',
+    tenantId: 'tenant_inspector',
+    version: 1,
+    metadata: {
+      storeName: 'Inspector Test Document',
+      storeSlug: 'inspector-test-document',
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
+        seo: {},
         sections: [
```

### 3.2 [`packages/authoring-studio/src/experience/__tests__/LiveEditing.test.ts`](file:///c:/Users/HP/Documents/GOOGLE%20ANTIGRAVITY%20APK/WEB%20FACTOR/packages/authoring-studio/src/experience/__tests__/LiveEditing.test.ts#L7-L35)
```diff
   const sampleDoc: BuilderDocument = {
     id: 'doc_live_test',
-    name: 'Live Test Document',
+    tenantId: 'tenant_live_test',
+    version: 1,
+    metadata: {
+      storeName: 'Live Test Document',
+      storeSlug: 'live-test-document',
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
+        seo: {},
         sections: [
```

### 3.3 [`packages/authoring-studio/src/experience/__tests__/TimelineToCanvas.test.ts`](file:///c:/Users/HP/Documents/GOOGLE%20ANTIGRAVITY%20APK/WEB%20FACTOR/packages/authoring-studio/src/experience/__tests__/TimelineToCanvas.test.ts#L8-L36)
```diff
   const sampleDoc: BuilderDocument = {
     id: 'doc_timeline',
-    name: 'Timeline Test Document',
+    tenantId: 'tenant_timeline',
+    version: 1,
+    metadata: {
+      storeName: 'Timeline Test Document',
+      storeSlug: 'timeline-test-document',
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
+        seo: {},
         sections: [
```

### 3.4 [`packages/authoring-studio/src/experience/__tests__/UndoRedoRender.test.ts`](file:///c:/Users/HP/Documents/GOOGLE%20ANTIGRAVITY%20APK/WEB%20FACTOR/packages/authoring-studio/src/experience/__tests__/UndoRedoRender.test.ts#L7-L35)
```diff
   const sampleDoc: BuilderDocument = {
     id: 'doc_undoredo',
-    name: 'Undo Redo Test',
+    tenantId: 'tenant_undoredo',
+    version: 1,
+    metadata: {
+      storeName: 'Undo Redo Test',
+      storeSlug: 'undo-redo-test',
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
         id: 'p1',
         name: 'Home',
         slug: '/',
         isHome: true,
+        seo: {},
         sections: [
```

---

## 4. Wyniki świeżej weryfikacji kompilatora (`tsc --noEmit --incremental false`)

```
Total TS errors: 354
Experience __tests__ errors: 2
```

### Wykaz pozostałych błędów w `packages/authoring-studio/src/experience/__tests__/`:
1. `TimelineToCanvas.test.ts(63,54): error TS2322: Type 'string' is not assignable to type 'EasingCurve'.`
2. `TimelineToCanvas.test.ts(64,57): error TS2322: Type 'string' is not assignable to type 'EasingCurve'.`

---

## 5. Podsumowanie metryk i dyscyplina architektoniczna

| Metryka | Stan bazowy (G1-07) | Stan obecny (G1-07-B) | Różnica | Status |
|---|:---:|:---:|:---:|:---:|
| **TS2741 (seo w 4 plikach)** | 4 | 0 | **−4** | ✅ Wyeliminowane w 100% |
| **TS2322 (easing w `TimelineToCanvas`)** | 2 | 2 | 0 | ✅ Nietknięte |
| **Błędy w `experience/__tests__`** | 6 | 2 | **−4** | ✅ Spadek do 2 |
| **Globalny licznik błędów TypeScript** | **358** | **354** | **−4** | ✅ **Dokładnie 354** |
| **Modyfikacje produkcyjne (CODE)** | 0 | 0 | 0 | ✅ Zero zmian |
| **Modyfikacje konfiguracji (CONFIG)** | 0 | 0 | 0 | ✅ Zero zmian |
| **Modyfikacje testów (TEST)** | — | 4 pliki | — | ✅ Tylko 4 wskazane testy |
| **Supresje TypeScript** | 0 | 0 | 0 | ✅ Zero supresji |

---

## 6. Status i rekomendacja końcowa

```
================================================================================
G1-07-B REPAIR AUDIT EVIDENCE:

Liczba usuniętych błędów TS2741:                 4 (4 → 0) ✅
Liczba pozostałych błędów TS2322 (easing):       2 (nietknięte) ✅
Łączna delta redukcji błędów:                    −4 ✅
Globalny licznik błędów:                         358 → 354 ✅
Liczba modyfikowanych plików:                   4 (TEST ONLY) ✅
Pliki produkcyjne (CODE):                        0 ZMIAN ✅
Pliki konfiguracyjne (CONFIG):                   0 ZMIAN ✅
Dyrektywy supresji TS:                           0 ✅
Kontrakty produkcyjne SSOT:                     0 ZMIAN ✅

STATUS: G1-07-B = READY FOR AGENT 2
================================================================================
```

🛑 **STOP. Naprawa G1-07-B ukończona. Wynik 354 osiągnięty. Agent 1 zatrzymuje pracę i oczekuje na Focused Delta Audit Agenta 2 (G1-07-C).**
