-- 0011_inventory.sql
-- G1-332: Inventory persistence.
--
-- Each row represents the (tenant, product) stock record.
-- Stock availability is `quantity - reserved`. `reserved` is incremented on
-- reservation and decremented on release/commit. A row-level CHECK constraint
-- prevents negative available inventory at the storage layer.
--
-- Concurrency: the migration ships a SECURITY DEFINER function
-- `inventory_atomic_reserve(tenant_id, product_id, quantity)` that performs
-- the conditional UPDATE inside a single transaction. Application code should
-- invoke the RPC for true serializable isolation. If the RPC is unavailable
-- (e.g. local mock), the application falls back to its own filtering.
--
-- Tenant isolation is enforced both by the explicit `tenant_id` column with
-- NOT NULL constraint and by the RLS policy keyed on `(auth.jwt() ->> 'tenant_id')`.
-- The policy is permissive in the sense that only rows matching the caller's
-- tenant are returned/affected.

CREATE TABLE IF NOT EXISTS public.inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id uuid NOT NULL,
  quantity integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  reserved integer NOT NULL DEFAULT 0 CHECK (reserved >= 0),
  low_stock_threshold integer NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inventory_available_nonneg CHECK ((quantity - reserved) >= 0),
  CONSTRAINT inventory_tenant_product_unique UNIQUE (tenant_id, product_id)
);

CREATE INDEX IF NOT EXISTS inventory_tenant_id_idx ON public.inventory (tenant_id);
CREATE INDEX IF NOT EXISTS inventory_product_id_idx ON public.inventory (product_id);

-- Row Level Security
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS inventory_tenant_isolation ON public.inventory;
CREATE POLICY inventory_tenant_isolation ON public.inventory
  USING (tenant_id::text = (auth.jwt() ->> 'tenant_id'))
  WITH CHECK (tenant_id::text = (auth.jwt() ->> 'tenant_id'));

-- Atomic reserve: server-side conditional update.
-- Returns the post-update row, or raises an exception if insufficient stock.
CREATE OR REPLACE FUNCTION public.inventory_atomic_reserve(
  p_tenant_id uuid,
  p_product_id uuid,
  p_quantity integer
)
RETURNS public.inventory
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_row public.inventory;
BEGIN
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'inventory_atomic_reserve: quantity must be positive (got %)', p_quantity
      USING ERRCODE = '22023';
  END IF;

  -- Lock the row (if exists) and re-read
  SELECT * INTO v_row
    FROM public.inventory
    WHERE tenant_id = p_tenant_id AND product_id = p_product_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'inventory_atomic_reserve: inventory row not found for tenant=% product=%',
      p_tenant_id, p_product_id
      USING ERRCODE = 'P0002';
  END IF;

  IF (v_row.quantity - v_row.reserved) < p_quantity THEN
    RAISE EXCEPTION 'inventory_atomic_reserve: insufficient stock for tenant=% product=% (have %, need %)',
      p_tenant_id, p_product_id, (v_row.quantity - v_row.reserved), p_quantity
      USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.inventory
    SET reserved = v_row.reserved + p_quantity,
        updated_at = now()
    WHERE id = v_row.id
    RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

-- Atomic release: server-side conditional decrement of `reserved`.
CREATE OR REPLACE FUNCTION public.inventory_atomic_release(
  p_tenant_id uuid,
  p_product_id uuid,
  p_quantity integer
)
RETURNS public.inventory
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_row public.inventory;
BEGIN
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'inventory_atomic_release: quantity must be positive (got %)', p_quantity
      USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_row
    FROM public.inventory
    WHERE tenant_id = p_tenant_id AND product_id = p_product_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'inventory_atomic_release: inventory row not found for tenant=% product=%',
      p_tenant_id, p_product_id
      USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.inventory
    SET reserved = GREATEST(0, v_row.reserved - p_quantity),
        updated_at = now()
    WHERE id = v_row.id
    RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;