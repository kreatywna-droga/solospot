CREATE TABLE public.templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,
  name        text NOT NULL,
  category    text NOT NULL DEFAULT 'general',
  description text NOT NULL DEFAULT '',
  price       bigint NOT NULL DEFAULT 0,
  currency    text NOT NULL DEFAULT 'PLN',
  preview_image text,
  theme_config  jsonb NOT NULL DEFAULT '{}'::jsonb,
  page_structure jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.template_installs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  store_id    uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES public.templates(id) ON DELETE RESTRICT,
  status      text NOT NULL DEFAULT 'INSTALLING',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.template_installs ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_templates_category ON public.templates(category);
CREATE INDEX idx_templates_slug ON public.templates(slug);
CREATE INDEX idx_template_installs_store ON public.template_installs(store_id);
CREATE INDEX idx_template_installs_tenant ON public.template_installs(tenant_id);
