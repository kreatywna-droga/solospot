-- Migration: 0015_atomic_inventory_commit.sql
-- Description: Adds atomic_inventory_commit RPC function for concurrency-safe stock commit.

CREATE OR REPLACE FUNCTION atomic_inventory_commit(
  p_tenant_id UUID,
  p_product_id UUID,
  p_quantity INT
)
RETURNS TABLE (
  id UUID,
  tenant_id UUID,
  product_id UUID,
  quantity INT,
  reserved INT,
  low_stock_threshold INT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'p_quantity must be positive integer (got %)', p_quantity;
  END IF;

  RETURN QUERY
  UPDATE inventory
  SET
    quantity = GREATEST(0, inventory.quantity - p_quantity),
    reserved = GREATEST(0, inventory.reserved - p_quantity),
    updated_at = NOW()
  WHERE inventory.tenant_id = p_tenant_id
    AND inventory.product_id = p_product_id
  RETURNING
    inventory.id,
    inventory.tenant_id,
    inventory.product_id,
    inventory.quantity,
    inventory.reserved,
    inventory.low_stock_threshold,
    inventory.created_at,
    inventory.updated_at;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inventory row not found for tenant_id %, product_id %', p_tenant_id, p_product_id;
  END IF;
END;
$$;
