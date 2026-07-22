-- 0009_pages.sql
-- Pages table for store content management

CREATE TABLE public.pages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  slug        text NOT NULL,
  name        text NOT NULL,
  sections    jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT pages_store_slug_unique UNIQUE (store_id, slug)
);

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_pages_store ON public.pages(store_id);
CREATE INDEX idx_pages_store_slug ON public.pages(store_id, slug);

-- RLS Policy
CREATE POLICY "Service role full access to pages" ON public.pages
  FOR ALL USING (auth.role() = 'service_role');