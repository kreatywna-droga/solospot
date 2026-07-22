-- 0008_template_install_rpc.sql
-- RPC function for installing templates to stores from marketplace

CREATE OR REPLACE FUNCTION public.install_template_to_store(
  p_store_id uuid,
  p_template_slug text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_template RECORD;
  v_page RECORD;
  v_section RECORD;
  v_config_json jsonb;
  v_new_page_id uuid;
  v_branding jsonb;
  v_pages jsonb;
  v_products jsonb;
  v_product RECORD;
  v_tenant_id uuid;
BEGIN
  -- Get template definition
  SELECT * INTO v_template
  FROM public.templates
  WHERE slug = p_template_slug;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template not found: %', p_template_slug;
  END IF;

  -- Get tenant_id for product creation
  SELECT tenant_id INTO v_tenant_id
  FROM public.stores
  WHERE id = p_store_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Store not found: %', p_store_id;
  END IF;

  -- Build branding from template theme_config
  v_branding := jsonb_build_object(
    'primaryColor', v_template.theme_config->>'primaryColor',
    'secondaryColor', v_template.theme_config->>'secondaryColor',
    'font', v_template.theme_config->>'font',
    'description', v_template.theme_config->>'description'
  );

  -- Update store config with template branding
  UPDATE public.stores
  SET config = jsonb_set(
    config,
    '{branding}',
    v_branding,
    true
  ) || jsonb_build_object('publicationStatus', 'PUBLISHED')
  WHERE id = p_store_id;

  -- Create pages from template
  v_pages := COALESCE(v_template.page_structure, '[]'::jsonb);
  FOR v_page IN SELECT * FROM jsonb_array_elements(v_pages) AS page
  LOOP
    INSERT INTO public.pages (store_id, slug, name, sections, is_active)
    VALUES (
      p_store_id,
      (v_page->>'slug')::text,
      (v_page->>'name')::text,
      (v_page->'sections')::jsonb,
      true
    )
    ON CONFLICT (store_id, slug) DO UPDATE SET
      name = EXCLUDED.name,
      sections = EXCLUDED.sections,
      is_active = EXCLUDED.is_active;
  END LOOP;

  -- Create products from template
  v_products := COALESCE(v_template.products, '[]'::jsonb);
  FOR v_product IN SELECT * FROM jsonb_array_elements(v_products) AS product
  LOOP
    INSERT INTO public.products (tenant_id, store_id, name, description, price, currency, images, status)
    VALUES (
      v_tenant_id,
      p_store_id,
      (v_product->>'name')::text,
      COALESCE((v_product->>'description')::text, ''),
      COALESCE((v_product->>'price')::bigint, 0),
      COALESCE((v_product->>'currency')::text, 'PLN'),
      COALESCE((v_product->'images')::jsonb, '[]'::jsonb),
      'ACTIVE'
    );
  END LOOP;

  -- Record the installation
  INSERT INTO public.template_installs (tenant_id, store_id, template_id, status)
  SELECT
    s.tenant_id,
    s.id,
    v_template.id,
    'INSTALLED'
  FROM public.stores s
  WHERE s.id = p_store_id
  ON CONFLICT DO NOTHING;
END;
$$;