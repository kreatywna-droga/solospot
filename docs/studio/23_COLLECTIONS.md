# C16.23 — WEB FACTOR Studio Collections (CMS)

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 23_COLLECTIONS.md  
> **Status:** Draft  
> **Zależności:** 01_STUDIO_ARCHITECTURE.md, 08_COMPONENT_SYSTEM.md

---

## 1. Cel

Collections to system CMS Webflow-like. Użytkownik tworzy własne kolekcje danych (Produkty, Pracownicy, Opinie, FAQ), a Builder automatycznie generuje strony na podstawie tych danych.

**Kluczowa różnica:** Nie dodajesz ręcznie 100 kart produktów. Definiujesz kolekcję → szablon karty → Builder generuje wszystkie karty.

---

## 2. Koncepcja

```
┌─────────────────────────────────────────────────────┐
│  Kolekcja: Products                                  │
│                                                      │
│  Fields:                                             │
│  ┌────────┬──────────┬────────┬────────┐           │
│  │ Name   │ Price    │ Image  │ desc   │           │
│  ├────────┼──────────┼────────┼────────┤           │
│  │ Coffee │ 29.99    │ ☕     │ ...    │           │
│  │ Tea    │ 19.99    │ 🍵     │ ...    │           │
│  │ Mug    │ 14.99    │ 🥤     │ ...    │           │
│  │ ...    │ ...      │ ...    │ ...    │           │
│  └────────┴──────────┴────────┴────────┘           │
│                                                      │
│  ↓ Edytor:                                           │
│                                                      │
│  [Product Card Template] ← przeciągnij na stronę    │
│                                                      │
│  ↓ Render:                                           │
│                                                      │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐              │
│  │Coffee│ │ Tea  │ │ Mug  │ │ ...  │              │
│  │29.99 │ │19.99 │ │14.99 │ │      │              │
│  └──────┘ └──────┘ └──────┘ └──────┘              │
└─────────────────────────────────────────────────────┘
```

---

## 3. Collection Definition

```typescript
interface Collection {
  id: string;                    // "products"
  name: string;                  // "Products"
  description?: string;          // "Katalog produktów"
  icon?: string;                 // "Package"
  singularName: string;          // "Product"
  slug: string;                  // "products"
  
  fields: CollectionField[];
  
  // UI
  defaultView: 'TABLE' | 'GRID' | 'LIST';
  
  // Optional: template dla pojedynczego itemu
  itemTemplate?: string;          // section type dla detail page
  listTemplate?: string;          // section type dla listy
  
  // API
  apiEndpoint?: string;          // custom API (opcjonalnie)
  
  createdAt: string;
  updatedAt: string;
}

interface CollectionField {
  id: string;                    // "name"
  name: string;                  // "Name"
  type: CollectionFieldType;
  required: boolean;
  defaultValue?: any;
  placeholder?: string;
  description?: string;
  
  // Validation
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  
  // Relations
  relationCollection?: string;   // ID innej kolekcji
  
  // Media
  acceptTypes?: string[];        // [".jpg", ".png"]
  maxFileSize?: number;
}

type CollectionFieldType = 
  | 'TEXT'
  | 'NUMBER'
  | 'BOOLEAN'
  | 'EMAIL'
  | 'PHONE'
  | 'URL'
  | 'COLOR'
  | 'IMAGE'
  | 'GALLERY'
  | 'VIDEO'
  | 'FILE'
  | 'RICHTEXT'
  | 'DATE'
  | 'SELECT'
  | 'MULTISELECT'
  | 'RELATION'         // link do innej kolekcji
  | 'LOCATION'         // lat, lng, address
  | 'PRICE'            // amount + currency
  | 'SLUG';            // auto-generated z name
```

---

## 4. Collections Panel

### 4.1 Lista kolekcji

```
┌──────────────────────────────────────────────────────┐
│  COLLECTIONS (CMS)                     [+ New] [×]  │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │ Products     │ 24 items │ Updated 2h ago     │  │
│  ├────────────────────────────────────────────────┤  │
│  │ Team Members │  8 items │ Updated 1d ago     │  │
│  ├────────────────────────────────────────────────┤  │
│  │ Testimonials │ 12 items │ Updated 3d ago     │  │
│  ├────────────────────────────────────────────────┤  │
│  │ FAQ          │  6 items │ Updated 1w ago     │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  [📦 Import CSV] [📤 Export JSON]                    │
└──────────────────────────────────────────────────────┘
```

### 4.2 Collection Editor

```
┌──────────────────────────────────────────────────────┐
│  COLLECTION: Products                                 │
├──────────────────────────────────────────────────────┤
│  Fields:                                              │
│  ┌────────┬────────┬────────┬────────┬──────┬──────┐│
│  │ Name   │ Price  │ Image  │ Cat.   │ ⋮    │      ││
│  ├────────┼────────┼────────┼────────┼──────┤      ││
│  │ ☕     │  29.99 │ 🖼️    │ Coffee │ ⋮    │      ││
│  │ 🍵     │  19.99 │ 🖼️    │ Tea    │ ⋮    │      ││
│  │ 🥤     │  14.99 │ 🖼️    │ Acc.   │ ⋮    │      ││
│  │ ...    │  ...   │  ...   │  ...   │ ⋮    │      ││
│  └────────┴────────┴────────┴────────┴──────┘      ││
│                                                      │
│  [+ Add Item] [⚙ Edit Fields] [📊 Import CSV]     │
│                                                      │
│  ▼ Field Editor                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  Field Name  │ Type      │ Required │ Default │  │
│  │  ─────────── │ ──────    │ ──────── │ ─────── │  │
│  │  Name        │ TEXT      │ ✓        │ —       │  │
│  │  Price       │ PRICE     │ ✓        │ 0       │  │
│  │  Image       │ IMAGE     │ ✗        │ —       │  │
│  │  Category    │ SELECT    │ ✗        │ —       │  │
│  │              │           │          │         │  │
│  │  [+ Add Field]                                   │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

---

## 5. Collection w Builderze

### 5.1 Collection komponenty

```typescript
// Komponent "Collection List" — wyświetla listę z kolekcji
interface CollectionListProps {
  collectionId: string;       // "products"
  template: string;           // "product.card" — komponent template
  limit?: number;             // max items
  filter?: CollectionFilter;
  sort?: CollectionSort;
  layout: 'GRID' | 'LIST' | 'CAROUSEL' | 'MASONRY';
  columns: number;            // 2, 3, 4
}

// Komponent "Collection Single" — pojedynczy item
interface CollectionSingleProps {
  collectionId: string;
  itemId: string;             // lub slug
  fields: string[];           // które pola pokazać
  template: string;
}

// Template dla itemu (np. "product.card"):
// Definiuje jak wygląda pojedynczy element kolekcji
// Używa {{collection.field.name}} do wstawiania danych
```

### 5.2 Template Editor

```
┌──────────────────────────────────────────────────────┐
│  PRODUCT CARD TEMPLATE                                │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌────────────────────────────────────────────┐     │
│  │  ┌──────────┐                              │     │
│  │  │ {{image}}│                              │     │
│  │  └──────────┘                              │     │
│  │  {{name}}                                  │     │
│  │  {{price}} PLN                             │     │
│  │  [Dodaj do koszyka]                        │     │
│  └────────────────────────────────────────────┘     │
│                                                      │
│  Fields used: image, name, price                     │
│  [Edit Template] [Preview]                           │
└──────────────────────────────────────────────────────┘
```

### 5.3 Dynamic Pages

```typescript
// Collection może generować dynamiczne strony
// Np. Kolekcja "Products" → /products/{slug}

interface DynamicPage {
  collectionId: string;
  slugPattern: string;        // "/products/{{slug}}"
  template: string;           // section type dla strony
  seoTemplate: {
    title: string;            // "{{name}} — Sklep"
    description: string;      // "Kup {{name}} już od {{price}}"
  };
}

// Builder automatycznie tworzy strony dla każdego itemu
// w kolekcji przy compile()
```

---

## 6. Import / Export

### 6.1 CSV Import

```typescript
async function importCSV(collectionId: string, file: File) {
  const text = await file.text();
  const lines = text.split('\n');
  const headers = lines[0].split(',');
  const items = lines.slice(1).map(line => {
    const values = line.split(',');
    const item: Record<string, any> = {};
    headers.forEach((h, i) => {
      item[h.trim()] = values[i]?.trim();
    });
    return item;
  });
  
  // Dodaj do kolekcji
  for (const item of items) {
    dispatch({
      type: 'ADD_COLLECTION_ITEM',
      collectionId,
      item,
    });
  }
}
```

### 6.2 API Integration

```typescript
// Collection może być zasilana z API
interface CollectionAPISource {
  type: 'REST' | 'GRAPHQL';
  url: string;
  headers?: Record<string, string>;
  refreshInterval?: number;   // minutes
  mapping: Record<string, string>;  // API field → Collection field
}
```

---

## 7. Pliki

```
packages/builder-core/src/
├── Collections.ts             — model kolekcji

src/components/builder/collections/
├── CollectionsPanel.tsx       — główny panel CMS
├── CollectionEditor.tsx       — edytor kolekcji
├── CollectionFieldEditor.tsx  — edytor pól
├── CollectionDataGrid.tsx     — tabela danych
├── CollectionItemEditor.tsx   — edytor pojedynczego itemu
├── CollectionImport.tsx       — importer CSV
├── CollectionTemplate.tsx     — edytor template
├── CollectionVariablePicker.tsx — picker {{field}}
└── hooks/
    ├── useCollections.ts
    ├── useCollectionData.ts
    └── useCollectionTemplate.ts
```

