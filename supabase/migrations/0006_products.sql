CREATE TABLE public.products (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  store_id    uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  name        text NOT NULL,
  description text NOT NULL DEFAULT '',
  price       bigint NOT NULL DEFAULT 0,
  currency    text NOT NULL DEFAULT 'PLN',
  images      jsonb NOT NULL DEFAULT '[]'::jsonb,
  status      text NOT NULL DEFAULT 'DRAFT',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_products_tenant ON public.products(tenant_id);
CREATE INDEX idx_products_store ON public.products(store_id);
CREATE INDEX idx_products_status ON public.products(status);
