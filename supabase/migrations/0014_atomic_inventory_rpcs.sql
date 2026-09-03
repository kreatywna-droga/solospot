-- 0014_atomic_inventory_rpcs.sql
-- G1-335: Atomic inventory reserve & release RPC functions.
--
-- These PostgreSQL functions execute as a SINGLE atomic statement, preventing
-- oversell under concurrent requests. The SupabaseInventoryRepository will
-- prefer these RPCs when available and fall back to conditional updates when not.

-- ============================================================================
-- atomic_inventory_reserve
-- Atomically reserves `p_quantity` units for a given tenant+product.
-- Uses FOR UPDATE row locking to prevent concurrent oversell.
-- Returns the updated inventory row, or NULL if insufficient/not found.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.atomic_inventory_reserve(
  p_tenant_id uuid,
  p_product_id uuid,
  p_quantity integer
)
RETURNS SETOF public.inventory
LANGUAGE plpgsql
AS $$
DECLARE
  v_row public.inventory%ROWTYPE;
BEGIN
  -- Lock the row for update to prevent concurrent modifications
  SELECT * INTO v_row
  FROM public.inventory
  WHERE tenant_id = p_tenant_id AND product_id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Check availability
  IF (v_row.quantity - v_row.reserved) < p_quantity THEN
    RAISE EXCEPTION 'Insufficient inventory: requested %, available %',
      p_quantity, (v_row.quantity - v_row.reserved)
      USING ERRCODE = 'check_violation';
  END IF;

  -- Atomic reserve
  UPDATE public.inventory
  SET reserved = reserved + p_quantity,
      updated_at = now()
  WHERE id = v_row.id
  RETURNING * INTO v_row;

  RETURN NEXT v_row;
END;
$$;

-- ============================================================================
-- atomic_inventory_release
-- Atomically releases `p_quantity` reserved units for a given tenant+product.
-- Uses FOR UPDATE row locking. Returns the updated inventory row.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.atomic_inventory_release(
  p_tenant_id uuid,
  p_product_id uuid,
  p_quantity integer
)
RETURNS SETOF public.inventory
LANGUAGE plpgsql
AS $$
DECLARE
  v_row public.inventory%ROWTYPE;
BEGIN
  SELECT * INTO v_row
  FROM public.inventory
  WHERE tenant_id = p_tenant_id AND product_id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inventory not found for tenant=% product=%',
      p_tenant_id, p_product_id
      USING ERRCODE = 'no_data_found';
  END IF;

  UPDATE public.inventory
  SET reserved = GREATEST(0, reserved - p_quantity),
      updated_at = now()
  WHERE id = v_row.id
  RETURNING * INTO v_row;

  RETURN NEXT v_row;
END;
$$;

-- Grant execute to service_role (Supabase backend)
GRANT EXECUTE ON FUNCTION public.atomic_inventory_reserve(uuid, uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.atomic_inventory_release(uuid, uuid, integer) TO service_role;
