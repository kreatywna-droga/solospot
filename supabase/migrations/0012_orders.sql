-- 0012_orders.sql
-- G1-333 HARDEN: Order persistence.
--
-- Mirrors the G1-332 inventory persistence pattern: tenant-scoped, RLS-protected,
-- server-side CHECK constraints, no global state.

CREATE TABLE IF NOT EXISTS public.orders (
  id text PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  customer_id text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','shipped','completed','cancelled')),
  total integer NOT NULL DEFAULT 0 CHECK (total >= 0),
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_tenant_id_idx ON public.orders (tenant_id);
CREATE INDEX IF NOT EXISTS orders_tenant_status_idx ON public.orders (tenant_id, status);
CREATE INDEX IF NOT EXISTS orders_tenant_customer_idx ON public.orders (tenant_id, customer_id);

-- Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS orders_tenant_isolation ON public.orders;
CREATE POLICY orders_tenant_isolation ON public.orders
  USING (tenant_id::text = (auth.jwt() ->> 'tenant_id'))
  WITH CHECK (tenant_id::text = (auth.jwt() ->> 'tenant_id'));