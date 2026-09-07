-- WEB FACTOR Platform — Asset Storage RLS Contract (Sprint: Upload Authorization Fix)
-- Migration 0018: storage.objects RLS policies for the `store-assets` bucket
-- + hardened, store-scoped assets table policies (case-insensitive email; UPDATE policy).
--
-- ROOT CAUSE (observed in production):
-- "Wgraj z dysku" (browser direct upload) performs an INSERT into storage.objects
-- for the `store-assets` bucket using the authenticated user's session token.
-- The bucket is created programmatically (public: true) in AssetStorage.ts, so it
-- ships with NO storage.objects RLS policies. Supabase Storage default-denies any
-- object write without a matching policy -> "new row violates row-level security policy".
--
-- FIX: define a per-tenant storage RLS contract keyed on the object path prefix
-- `{tenant_id}/{store_id}/...`. An authenticated user may read/write/delete objects
-- ONLY inside folders owned by a tenant whose owner_email matches their JWT email,
-- with the store folder belonging to that same tenant. No `using (true)`/`with check (true)`
-- bypass is used; RLS stays enabled; the browser keeps the direct upload path (no 413).

-- 1) Ensure the `store-assets` bucket exists (idempotent for fresh/partial databases).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('store-assets', 'store-assets', true, 52428800, null)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 2) Service role full access to store-assets objects (explicit parity with DB tables).
drop policy if exists "Service role full access to store-assets objects" on storage.objects;
create policy "Service role full access to store-assets objects"
  on storage.objects for all
  using (bucket_id = 'store-assets' and auth.role() = 'service_role')
  with check (bucket_id = 'store-assets' and auth.role() = 'service_role');

-- 3) Tenant-scoped object INSERT:
--    authenticated users may upload ONLY under {my_tenant}/{my_store}/
drop policy if exists "Tenant can create own store-assets objects" on storage.objects;
create policy "Tenant can create own store-assets objects"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'store-assets'
    and exists (
      select 1
      from public.tenants t
      join public.stores s on s.tenant_id = t.id
      where lower(t.owner_email) = lower(auth.jwt()->>'email')
        and t.id::text = split_part(name, '/', 1)
        and s.id::text = split_part(name, '/', 2)
    )
  );

-- 4) Tenant-scoped object SELECT (SDK list/read of own folder only).
drop policy if exists "Tenant can read own store-assets objects" on storage.objects;
create policy "Tenant can read own store-assets objects"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'store-assets'
    and exists (
      select 1
      from public.tenants t
      join public.stores s on s.tenant_id = t.id
      where lower(t.owner_email) = lower(auth.jwt()->>'email')
        and t.id::text = split_part(name, '/', 1)
        and s.id::text = split_part(name, '/', 2)
    )
  );

-- 5) Tenant-scoped object UPDATE.
drop policy if exists "Tenant can update own store-assets objects" on storage.objects;
create policy "Tenant can update own store-assets objects"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'store-assets'
    and exists (
      select 1
      from public.tenants t
      join public.stores s on s.tenant_id = t.id
      where lower(t.owner_email) = lower(auth.jwt()->>'email')
        and t.id::text = split_part(name, '/', 1)
        and s.id::text = split_part(name, '/', 2)
    )
  )
  with check (
    bucket_id = 'store-assets'
    and exists (
      select 1
      from public.tenants t
      join public.stores s on s.tenant_id = t.id
      where lower(t.owner_email) = lower(auth.jwt()->>'email')
        and t.id::text = split_part(name, '/', 1)
        and s.id::text = split_part(name, '/', 2)
    )
  );

-- 6) Tenant-scoped object DELETE.
drop policy if exists "Tenant can delete own store-assets objects" on storage.objects;
create policy "Tenant can delete own store-assets objects"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'store-assets'
    and exists (
      select 1
      from public.tenants t
      join public.stores s on s.tenant_id = t.id
      where lower(t.owner_email) = lower(auth.jwt()->>'email')
        and t.id::text = split_part(name, '/', 1)
        and s.id::text = split_part(name, '/', 2)
    )
  );

-- 7) assets table: replace the 0017 tenant-only policies with hardened,
--    store-scoped, case-insensitive policies and add the missing UPDATE policy.
--    (Service-role full access from 0017 is retained and bypasses RLS.)
--    No global bypass: every policy still proves email -> tenant -> store ownership.

drop policy if exists "Tenants can view own assets" on public.assets;
create policy "Tenants can view own assets" on public.assets
  for select using (
    exists (
      select 1
      from public.tenants t
      join public.stores s on s.tenant_id = t.id
      where lower(t.owner_email) = lower(auth.jwt()->>'email')
        and t.id = assets.tenant_id
        and s.id = assets.store_id
    )
  );

drop policy if exists "Tenants can insert own assets" on public.assets;
create policy "Tenants can insert own assets" on public.assets
  for insert with check (
    exists (
      select 1
      from public.tenants t
      join public.stores s on s.tenant_id = t.id
      where lower(t.owner_email) = lower(auth.jwt()->>'email')
        and t.id = assets.tenant_id
        and s.id = assets.store_id
    )
  );

drop policy if exists "Tenants can update own assets" on public.assets;
create policy "Tenants can update own assets" on public.assets
  for update using (
    exists (
      select 1
      from public.tenants t
      join public.stores s on s.tenant_id = t.id
      where lower(t.owner_email) = lower(auth.jwt()->>'email')
        and t.id = assets.tenant_id
        and s.id = assets.store_id
    )
  ) with check (
    exists (
      select 1
      from public.tenants t
      join public.stores s on s.tenant_id = t.id
      where lower(t.owner_email) = lower(auth.jwt()->>'email')
        and t.id = assets.tenant_id
        and s.id = assets.store_id
    )
  );

drop policy if exists "Tenants can delete own assets" on public.assets;
create policy "Tenants can delete own assets" on public.assets
  for delete using (
    exists (
      select 1
      from public.tenants t
      join public.stores s on s.tenant_id = t.id
      where lower(t.owner_email) = lower(auth.jwt()->>'email')
        and t.id = assets.tenant_id
        and s.id = assets.store_id
    )
  );