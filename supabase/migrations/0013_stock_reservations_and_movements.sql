-- 0013_stock_reservations_and_movements.sql
-- G1-334: Stock Reservation & Movement Persistence + Expiration Sweeper support.
--
-- Mirrors 0011_inventory.sql & 0012_orders.sql patterns: tenant-scoped, RLS-protected,
-- server-side CHECK constraints, no global state.

-- ============================================================================
-- Stock Reservations
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.stock_reservations (
  id text PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id uuid NOT NULL,
  order_id text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  expires_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMMITTED', 'RELEASED', 'EXPIRED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stock_reservations_tenant_id_idx ON public.stock_reservations (tenant_id);
CREATE INDEX IF NOT EXISTS stock_reservations_tenant_order_idx ON public.stock_reservations (tenant_id, order_id);
CREATE INDEX IF NOT EXISTS stock_reservations_tenant_product_idx ON public.stock_reservations (tenant_id, product_id);
CREATE INDEX IF NOT EXISTS stock_reservations_expiration_idx ON public.stock_reservations (tenant_id, status, expires_at);

ALTER TABLE public.stock_reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS stock_reservations_tenant_isolation ON public.stock_reservations;
CREATE POLICY stock_reservations_tenant_isolation ON public.stock_reservations
  USING (tenant_id::text = (auth.jwt() ->> 'tenant_id'))
  WITH CHECK (tenant_id::text = (auth.jwt() ->> 'tenant_id'));

-- ============================================================================
-- Stock Movements
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.stock_movements (
  id text PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id uuid NOT NULL,
  quantity_delta integer NOT NULL,
  type text NOT NULL CHECK (type IN ('RECEIPT', 'SALE', 'RESERVATION_COMMIT', 'ADJUSTMENT', 'RETURN', 'RESERVATION_RELEASE', 'EXPIRED')),
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stock_movements_tenant_id_idx ON public.stock_movements (tenant_id);
CREATE INDEX IF NOT EXISTS stock_movements_tenant_product_idx ON public.stock_movements (tenant_id, product_id);
CREATE INDEX IF NOT EXISTS stock_movements_created_at_idx ON public.stock_movements (tenant_id, created_at);

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS stock_movements_tenant_isolation ON public.stock_movements;
CREATE POLICY stock_movements_tenant_isolation ON public.stock_movements
  USING (tenant_id::text = (auth.jwt() ->> 'tenant_id'))
  WITH CHECK (tenant_id::text = (auth.jwt() ->> 'tenant_id'));
