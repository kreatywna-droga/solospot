-- C9.2 + C9.3: Commerce Persistence — Supabase/Postgres schema + RLS

-- ============================================================================
-- Products
-- ============================================================================

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  categories TEXT[] DEFAULT '{}',
  pricing JSONB NOT NULL,
  inventory JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(tenant_id, slug);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(tenant_id, is_active);

-- ============================================================================
-- Variants
-- ============================================================================

CREATE TABLE IF NOT EXISTS variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  inventory INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_variants_product_id ON variants(product_id);

-- ============================================================================
-- Customers
-- ============================================================================

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(tenant_id, email);

-- ============================================================================
-- Carts
-- ============================================================================

CREATE TABLE IF NOT EXISTS carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  session_id TEXT,
  items JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_carts_tenant_id ON carts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_carts_customer_id ON carts(customer_id);
CREATE INDEX IF NOT EXISTS idx_carts_session_id ON carts(session_id);

-- ============================================================================
-- Orders
-- ============================================================================

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_tenant_id ON orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(tenant_id, status);

-- ============================================================================
-- Order Items
-- ============================================================================

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  variant_id UUID,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- ============================================================================
-- Inventory
-- ============================================================================

CREATE TABLE IF NOT EXISTS inventory (
  product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  reserved INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory(product_id);

-- ============================================================================
-- C9.3 — Row Level Security (Tenant Isolation)
-- ============================================================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Helper: current tenant from Supabase JWT claim
CREATE OR REPLACE FUNCTION app_current_tenant() RETURNS UUID AS $$
  SELECT COALESCE(
    current_setting('app.tenant_id', true)::UUID,
    (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID
  )
$$ LANGUAGE SQL STABLE;

-- Products
DROP POLICY IF EXISTS tenant_isolation_products ON products;
CREATE POLICY tenant_isolation_products ON products
  USING (tenant_id = app_current_tenant())
  WITH CHECK (tenant_id = app_current_tenant());

-- Variants (via parent product tenant)
DROP POLICY IF EXISTS tenant_isolation_variants ON variants;
CREATE POLICY tenant_isolation_variants ON variants
  USING (EXISTS (SELECT 1 FROM products p WHERE p.id = variants.product_id AND p.tenant_id = app_current_tenant()))
  WITH CHECK (EXISTS (SELECT 1 FROM products p WHERE p.id = variants.product_id AND p.tenant_id = app_current_tenant()));

-- Customers
DROP POLICY IF EXISTS tenant_isolation_customers ON customers;
CREATE POLICY tenant_isolation_customers ON customers
  USING (tenant_id = app_current_tenant())
  WITH CHECK (tenant_id = app_current_tenant());

-- Carts
DROP POLICY IF EXISTS tenant_isolation_carts ON carts;
CREATE POLICY tenant_isolation_carts ON carts
  USING (tenant_id = app_current_tenant())
  WITH CHECK (tenant_id = app_current_tenant());

-- Orders
DROP POLICY IF EXISTS tenant_isolation_orders ON orders;
CREATE POLICY tenant_isolation_orders ON orders
  USING (tenant_id = app_current_tenant())
  WITH CHECK (tenant_id = app_current_tenant());

-- Order Items (via parent order tenant)
DROP POLICY IF EXISTS tenant_isolation_order_items ON order_items;
CREATE POLICY tenant_isolation_order_items ON order_items
  USING (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND o.tenant_id = app_current_tenant()))
  WITH CHECK (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND o.tenant_id = app_current_tenant()));

-- Inventory (via parent product tenant)
DROP POLICY IF EXISTS tenant_isolation_inventory ON inventory;
CREATE POLICY tenant_isolation_inventory ON inventory
  USING (EXISTS (SELECT 1 FROM products p WHERE p.id = inventory.product_id AND p.tenant_id = app_current_tenant()))
  WITH CHECK (EXISTS (SELECT 1 FROM products p WHERE p.id = inventory.product_id AND p.tenant_id = app_current_tenant()));
