import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '0018_assets_storage_rls.sql');
const migration = fs.readFileSync(migrationPath, 'utf8');
const migrationCode = migration
  .split('\n')
  .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
  .join('\n');

describe('Migration 0018_assets_storage_rls.sql — Storage RLS contract', () => {
  it('Defines storage.objects policies for the store-assets bucket', () => {
    expect(migration).toContain("on storage.objects");
    expect(migration).toContain('store-assets');
    expect((migration.match(/for (all|select|insert|update|delete) to authenticated/g) || []).length).toBeGreaterThanOrEqual(4);
  });

  it('Covers INSERT, SELECT, UPDATE and DELETE for objects', () => {
    for (const op of ['for insert', 'for select', 'for update', 'for delete']) {
      expect(migration).toContain(op);
    }
  });

  it('Gates write/read on tenant ownership via email (no global bypass)', () => {
    expect(migration).toContain("lower(t.owner_email) = lower(auth.jwt()->>'email')");
    expect(migration).toContain('split_part(name, \'/\', 1)');
    expect(migration).toMatch(/no `using \(true\)`/i);
  });

  it('Contains no RLS bypass patterns', () => {
    expect(migrationCode).not.toMatch(/with check\s*\(\s*true\s*\)/i);
    expect(migrationCode).not.toMatch(/using\s*\(\s*true\s*\)/i);
    expect((migration.match(/create policy/g) || []).length).toBeGreaterThanOrEqual(1);
  });

  it('Adds the assets UPDATE policy and hardens assets policies (case-insensitive email + store)', () => {
    expect(migration).toContain('"Tenants can update own assets" on public.assets');
    expect(migration).toContain('s.id = assets.store_id');
  });
});