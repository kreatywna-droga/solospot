# G1-04 — REPAIR 2 / LayoutFieldCatalog.ts Report

**Agent:** Agent 1 — Inspector Core Engineer  
**Status:** COMPLETE (LayoutFieldCatalog.ts = 0 errors, Global TSC errors = 380)  
**Target File:** `packages/authoring-studio/src/layout-inspector/LayoutFieldCatalog.ts`  

---

## 1. Zakres zmienionych plików

Zmodyfikowano wyłącznie 1 plik:
* `packages/authoring-studio/src/layout-inspector/LayoutFieldCatalog.ts`

Zero modyfikacji w:
* `types.ts`
* Plikach testów (`__tests__/*.test.ts`)
* `tsconfig.json`, `package.json` i konfiguracji

---

## 2. Lista 13 naprawionych pól i dobranych `defaultValue`

Każde z 13 pól spełnia kontrakt `PropertyFieldDefinition` z właściwie dobranym `defaultValue` i zachowaniem reguł walidacji:

| # | Pole (id) | Typ widgetu | `defaultValue` | Uzasadnienie |
|---|-----------|-------------|----------------|--------------|
| 1 | `layout.left` | `number` | `0` | Domyślne przesunięcie (offset) więzu lewej krawędzi (0px) |
| 2 | `layout.right` | `number` | `0` | Domyślne przesunięcie (offset) więzu prawej krawędzi (0px) |
| 3 | `layout.top` | `number` | `0` | Domyślne przesunięcie (offset) więzu górnej krawędzi (0px) |
| 4 | `layout.bottom` | `number` | `0` | Domyślne przesunięcie (offset) więzu dolnej krawędzi (0px) |
| 5 | `layout.centerX` | `boolean` | `false` | Flaga centrowania w osi poziomej domyślnie wyłączona |
| 6 | `layout.centerY` | `boolean` | `false` | Flaga centrowania w osi pionowej domyślnie wyłączona |
| 7 | `layout.width` | `number` | `0` | Domyślny wymiar bazowy szerokości |
| 8 | `layout.height` | `number` | `0` | Domyślny wymiar bazowy wysokości |
| 9 | `layout.minWidth` | `number` | `0` | Minimalna szerokość (min: 0, walidacja non-negative) |
| 10 | `layout.maxWidth` | `number` | `0` | Maksymalna szerokość (min: 0, walidacja non-negative) |
| 11 | `layout.minHeight` | `number` | `0` | Minimalna wysokość (min: 0, walidacja non-negative) |
| 12 | `layout.maxHeight` | `number` | `0` | Maksymalna wysokość (min: 0, walidacja non-negative) |
| 13 | `layout.aspectRatio` | `number` | `1` | Proporcja boków (1:1, spełnia walidację `val > 0`) |

---

## 3. Dokładny Diff Logiczny

```diff
--- a/packages/authoring-studio/src/layout-inspector/LayoutFieldCatalog.ts
+++ b/packages/authoring-studio/src/layout-inspector/LayoutFieldCatalog.ts
@@ -156,6 +156,7 @@ export const LAYOUT_FIELD_DEFINITIONS: PropertyFieldDefinition[] = [
     description: 'Left pin offset in pixels',
     widget: 'number',
     category: 'layout',
+    defaultValue: 0,
     responsive: true,
     validation: (val) => toValidationResult(val === undefined || typeof val === 'number', 'Left constraint must be a number'),
   },
@@ -164,6 +164,7 @@ export const LAYOUT_FIELD_DEFINITIONS: PropertyFieldDefinition[] = [
     description: 'Right pin offset in pixels',
     widget: 'number',
     category: 'layout',
+    defaultValue: 0,
     validation: (val) => toValidationResult(val === undefined || typeof val === 'number', 'Right constraint must be a number'),
   },
   {
@@ -171,6 +171,7 @@ export const LAYOUT_FIELD_DEFINITIONS: PropertyFieldDefinition[] = [
     description: 'Top pin offset in pixels',
     widget: 'number',
     category: 'layout',
+    defaultValue: 0,
     responsive: true,
     validation: (val) => toValidationResult(val === undefined || typeof val === 'number', 'Top constraint must be a number'),
   },
@@ -179,6 +179,7 @@ export const LAYOUT_FIELD_DEFINITIONS: PropertyFieldDefinition[] = [
     description: 'Bottom pin offset in pixels',
     widget: 'number',
     category: 'layout',
+    defaultValue: 0,
     validation: (val) => toValidationResult(val === undefined || typeof val === 'number', 'Bottom constraint must be a number'),
   },
   {
@@ -186,6 +186,7 @@ export const LAYOUT_FIELD_DEFINITIONS: PropertyFieldDefinition[] = [
     description: 'Pin to horizontal center',
     widget: 'boolean',
     category: 'layout',
+    defaultValue: false,
     validation: (val) => toValidationResult(val === undefined || typeof val === 'boolean', 'Center X must be a boolean'),
   },
   {
@@ -193,6 +193,7 @@ export const LAYOUT_FIELD_DEFINITIONS: PropertyFieldDefinition[] = [
     description: 'Pin to vertical center',
     widget: 'boolean',
     category: 'layout',
+    defaultValue: false,
     validation: (val) => toValidationResult(val === undefined || typeof val === 'boolean', 'Center Y must be a boolean'),
   },
   {
@@ -200,6 +200,7 @@ export const LAYOUT_FIELD_DEFINITIONS: PropertyFieldDefinition[] = [
     description: 'Width in pixels or percentage',
     widget: 'number',
     category: 'layout',
+    defaultValue: 0,
     responsive: true,
     validation: (val) => toValidationResult(val === undefined || typeof val === 'number' || typeof val === 'string', 'Width must be a number or string'),
   },
@@ -208,6 +208,7 @@ export const LAYOUT_FIELD_DEFINITIONS: PropertyFieldDefinition[] = [
     description: 'Height in pixels or percentage',
     widget: 'number',
     category: 'layout',
+    defaultValue: 0,
     responsive: true,
     validation: (val) => toValidationResult(val === undefined || typeof val === 'number' || typeof val === 'string', 'Height must be a number or string'),
   },
@@ -216,6 +216,7 @@ export const LAYOUT_FIELD_DEFINITIONS: PropertyFieldDefinition[] = [
     description: 'Min Width',
     description: 'Minimum width in pixels',
     widget: 'number',
     category: 'layout',
+    defaultValue: 0,
     min: 0,
     validation: (val) => toValidationResult(val === undefined || (typeof val === 'number' && val >= 0), 'Min width must be a non-negative number'),
   },
@@ -224,6 +224,7 @@ export const LAYOUT_FIELD_DEFINITIONS: PropertyFieldDefinition[] = [
     description: 'Max Width',
     description: 'Maximum width in pixels',
     widget: 'number',
     category: 'layout',
+    defaultValue: 0,
     min: 0,
     validation: (val) => toValidationResult(val === undefined || (typeof val === 'number' && val >= 0), 'Max width must be a non-negative number'),
   },
@@ -232,6 +232,7 @@ export const LAYOUT_FIELD_DEFINITIONS: PropertyFieldDefinition[] = [
     description: 'Min Height',
     description: 'Minimum height in pixels',
     widget: 'number',
     category: 'layout',
+    defaultValue: 0,
     min: 0,
     validation: (val) => toValidationResult(val === undefined || (typeof val === 'number' && val >= 0), 'Min height must be a non-negative number'),
   },
@@ -240,6 +240,7 @@ export const LAYOUT_FIELD_DEFINITIONS: PropertyFieldDefinition[] = [
     description: 'Max Height',
     description: 'Maximum height in pixels',
     widget: 'number',
     category: 'layout',
+    defaultValue: 0,
     min: 0,
     validation: (val) => toValidationResult(val === undefined || (typeof val === 'number' && val >= 0), 'Max height must be a non-negative number'),
   },
@@ -248,6 +248,7 @@ export const LAYOUT_FIELD_DEFINITIONS: PropertyFieldDefinition[] = [
     description: 'Aspect Ratio',
     description: 'Width over height aspect ratio',
     widget: 'number',
     category: 'layout',
+    defaultValue: 1,
     min: 0,
     validation: (val) => toValidationResult(val === undefined || (typeof val === 'number' && val > 0), 'Aspect ratio must be a positive number'),
   },
```

---

## 4. Wynik świeżego sprawdzenia TypeScript (`npx tsc --noEmit --incremental false`)

* **Błędy w `LayoutFieldCatalog.ts`:** **0** (poprzednio 13 błędów TS2741, wszystkie usunięte)
* **Łączna liczba błędów w projekcie:** **380** (poprzednio 393 -> redukcja dokładnie o 13)
* **Brak nowych błędów / brak regresji typów.**
