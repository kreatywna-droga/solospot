# C9 Specification — Commerce Persistence

**Epik:** C9 — Commerce Persistence  
**Data:** 2026-07-19  
**Status:** PLANNED  

---

## Cel

Dodać trwałość danych dla silnika Commerce. Obecnie wszystkie dane są in-memory. C9 wprowadza Repository Layer, Database Schema, Transaction Layer i Runtime Integration.

**Największa wartość biznesowa:** WEB FACTOR ma już narzędzie do tworzenia sklepów (C6-C8). Teraz trzeba sprawić, aby te sklepy miały prawdziwe dane, zamówienia i trwałość produkcyjną.

---

## Architektura

```
Commerce Engine (domena)
    ↓
Repository Interface
    ↓
Repository Provider (Supabase / Memory)
    ↓
Database (Supabase/Postgres)
```

Commerce Engine NIE zna Supabase. Tylko interface.

---

## Moduły

### C9.1 — Repository Layer

**Cel:** Oddzielić domenę od bazy danych.

**Pakiet:** `packages/commerce-persistence/`

**Struktura:**
```
packages/commerce-persistence/
  src/
    interfaces/
      Repository.ts
    repositories/
      ProductRepository.ts
      OrderRepository.ts
      CartRepository.ts
      InventoryRepository.ts
      CustomerRepository.ts
    providers/
      SupabaseRepository.ts
      MemoryRepository.ts
    index.ts
```

**Kontrakt:**
```typescript
interface Repository<T> {
  findById(id: string): Promise<T | null>
  findAll(options?: QueryOptions): Promise<T[]>
  create(data: CreateDTO<T>): Promise<T>
  update(id: string, data: Partial<T>): Promise<T>
  delete(id: string): Promise<void>
}
```

**Zasady:**
- Commerce Engine importuje tylko `Repository<T>` interface
- Provider implementuje interface
- Żadnych bezpośrednich zapytań SQL w domenie Commerce

### C9.2 — Database Schema

**Supabase/Postgres:**

```sql
-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Product Variants
CREATE TABLE variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  inventory INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  customer_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Order Items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL
);

-- Inventory
CREATE TABLE inventory (
  product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  reserved INTEGER NOT NULL DEFAULT 0
);
```

### C9.3 — Tenant Isolation

**RLS (Row Level Security):**
```sql
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON products
  USING (tenant_id = current_setting('app.tenant_id')::UUID);
```

**Test:**
- Tenant A nie widzi produktów Tenant B
- Wszystkie zapytania automatycznie filtrowane po `tenant_id`

### C9.4 — Transaction Layer

**Najważniejsze dla sklepu.**

**Przykład checkout:**
```
Create Order
    ↓
Reserve Inventory
    ↓
Charge Payment
    ↓
Confirm Order
```

Jeżeli payment fail → rollback całej transakcji.

**Interfejs:**
```typescript
interface Transaction {
  execute(): Promise<void>
  rollback(): Promise<void>
}
```

### C9.5 — Runtime Integration

**Obecny problem:** PublishPipeline generuje placeholder HTML zamiast rzeczywistych danych Commerce.

**Rozwiązanie:**
```
PublishPipeline
    ↓
TemplateRuntime
    ↓
ComponentRuntime
    ↓
Commerce Data Resolver  ← NOWY
    ↓
HTML z prawdziwymi produktami/cenami
```

**Commerce Data Resolver:**
- Ładuje dane Commerce (produkty, ceny, stan magazynowy)
- Dostarcza je do ComponentRuntime
- Cache na poziomie requestu

### C9.6 — Golden Commerce Flow

**Test end-to-end:**
```
Create Store
    ↓
Create Product
    ↓
Add Image
    ↓
Customer opens Store
    ↓
Add Cart
    ↓
Checkout
    ↓
Payment
    ↓
Order Created
    ↓
Inventory Updated
    ↓
Published Runtime
```

**Minimum 10-15 testów:**
- ✅ Repository CRUD
- ✅ Tenant isolation
- ✅ Transaction rollback
- ✅ Commerce Data Resolver
- ✅ Runtime integration
- ✅ Checkout flow
- ✅ Inventory reservation

---

## Kryteria certyfikacji

### Core
- ✅ Repository layer
- ✅ Database schema
- ✅ Tenant isolation (RLS)
- ✅ Transaction layer

### Experience
- ✅ Commerce Data Resolver
- ✅ Runtime integration
- ✅ Builder integration (products)

### Runtime
- ✅ Publish pipeline z Commerce data
- ✅ Runtime render z prawdziwymi produktami

### Quality
- ✅ Tests (minimum 15 golden flow)
- ✅ Build
- ✅ TypeScript

---

## Następny krok po C9

Po C9 Production Complete:
- C10 — Marketplace Authoring
- C11 — Workflow Automation
- C12 — AI Layer
