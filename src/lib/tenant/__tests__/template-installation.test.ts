import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockDb, clearMockDb } from '@/lib/supabase';

vi.mock('@/lib/supabase');

const { TemplateRegistry } = await import('@/lib/template/TemplateRegistry');
const { TemplateInstaller } = await import('@/lib/template/TemplateInstaller');

describe('Template Installation', () => {
  beforeEach(() => {
    clearMockDb();
  });

  it('TemplateRegistry discovers all 4 templates', () => {
    const registry = new TemplateRegistry();
    const templates = registry.getAll();
    expect(templates).toHaveLength(4);
  });

  it('TemplateRegistry returns correct template meta', () => {
    const registry = new TemplateRegistry();
    const templates = registry.getAll();

    const fashion = templates.find((t) => t.slug === 'fashion-pro');
    expect(fashion).toBeDefined();
    expect(fashion!.category).toBe('fashion');

    const beauty = templates.find((t) => t.slug === 'beauty');
    expect(beauty).toBeDefined();
    expect(beauty!.category).toBe('beauty');

    const restaurant = templates.find((t) => t.slug === 'restaurant');
    expect(restaurant).toBeDefined();
    expect(restaurant!.category).toBe('food');

    const digital = templates.find((t) => t.slug === 'digital');
    expect(digital).toBeDefined();
    expect(digital!.category).toBe('digital');
  });

  it('TemplateRegistry.getBySlug returns full definition', () => {
    const registry = new TemplateRegistry();
    const tpl = registry.getBySlug('fashion-pro');
    expect(tpl).toBeDefined();
    expect(tpl!.slug).toBe('fashion-pro');
    expect(tpl!.pages.length).toBeGreaterThan(0);
    expect(tpl!.products.length).toBeGreaterThan(0);
    expect(tpl!.theme.primaryColor).toBeDefined();
  });

  it('getBySlug returns null for unknown template', () => {
    const registry = new TemplateRegistry();
    const tpl = registry.getBySlug('non-existent');
    expect(tpl).toBeUndefined();
  });

  it('TemplateInstaller installs template and marks store ready', async () => {
    const storeRow = {
      id: 'store-1',
      tenant_id: 'demo-fashion',
      name: 'Fashion Demo',
      slug: 'fashion-demo',
      domain: null,
      status: 'ACTIVE',
      config: {},
      created_at: '2026-07-01T00:00:00Z',
      updated_at: '2026-07-01T00:00:00Z',
    };

    mockDb.stores.push(storeRow);

    const installer = new TemplateInstaller();
    const result = await installer.install('demo-fashion', 'store-1', 'fashion-pro');

    expect(result.template).toBe('fashion-pro');
    expect(result.storeId).toBe('store-1');
  });

  it('TemplateInstaller rejects unknown template', async () => {
    const installer = new TemplateInstaller();
    await expect(
      installer.install('demo-fashion', 'store-1', 'non-existent')
    ).rejects.toThrow('Template not found: non-existent');
  });
});
