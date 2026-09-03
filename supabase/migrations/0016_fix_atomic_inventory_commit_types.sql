-- 0016_fix_atomic_inventory_commit_types.sql
-- Fixes parameter type mismatch in atomic_inventory_commit (UUID vs TEXT)

DROP FUNCTION IF EXISTS public.atomic_inventory_commit(uuid, text, integer);
DROP FUNCTION IF EXISTS public.atomic_inventory_commit(uuid, uuid, integer);

CREATE OR REPLACE FUNCTION public.atomic_inventory_commit(
  p_tenant_id uuid,
  p_product_id uuid,
  p_quantity integer
)
RETURNS SETOF public.inventory
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_row public.inventory%ROWTYPE;
BEGIN
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'atomic_inventory_commit: quantity must be positive (got %)', p_quantity
      USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_row
  FROM public.inventory
  WHERE tenant_id = p_tenant_id AND product_id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'atomic_inventory_commit: inventory row not found for tenant=% product=%',
      p_tenant_id, p_product_id
      USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.inventory
  SET quantity = GREATEST(0, quantity - p_quantity),
      reserved = GREATEST(0, reserved - p_quantity),
      updated_at = now()
  WHERE id = v_row.id
  RETURNING * INTO v_row;

  RETURN NEXT v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.atomic_inventory_commit(uuid, uuid, integer) TO service_role;
