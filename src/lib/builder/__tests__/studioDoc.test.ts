import { describe, it, expect } from 'vitest';
import { apiStoreToBuilderDoc, builderDocToApiPatch, ApiStore } from '../studioDoc';
import { buildStoragePath, storagePathOwnedByStore } from '../../assets/storagePath';

const TENANT_UUID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const STORE_UUID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

function makeStore(overrides: Partial<ApiStore> = {}): ApiStore {
  return {
    id: STORE_UUID,
    name: 'Test Store',
    slug: 'test-store',
    domain: null,
    status: 'ACTIVE',
    tenantId: TENANT_UUID,
    config: {
      pages: [
        {
          id: 'page-1',
          name: 'Strona główna',
          slug: '/',
          sections: [{ id: 'sec-1', type: 'hero', label: 'Hero', config: { title: 'Hi' } }],
        },
      ],
      branding: { primaryColor: '#111111' },
    },
    ...overrides,
  };
}

describe('studioDoc — document.tenantId / storage-path RLS contract (REG-0018-tenant-prefix)', () => {
  it('Uses the server-provided real TENANT uuid as document.tenantId (not the store uuid)', () => {
    const doc = apiStoreToBuilderDoc(makeStore());
    expect(doc.id).toBe(STORE_UUID);
    expect(doc.tenantId).toBe(TENANT_UUID);
    expect(doc.tenantId).not.toBe(STORE_UUID);
  });

  it('BROWSER PATH that is sent to Supabase Storage now matches the RLS policy: {tenantId}/{storeId}/file', () => {
    const doc = apiStoreToBuilderDoc(makeStore());
    const path = buildStoragePath(doc.tenantId, doc.id, 'bg-video.mp4');
    expect(path).toBe(`${TENANT_UUID}/${STORE_UUID}/bg-video.mp4`);
  });

  it('REG. That browser path satisfies storagePathOwnedByStore(session.tenantId, store.id) — the server check that mirrors the RLS join', () => {
    const doc = apiStoreToBuilderDoc(makeStore());
    const path = buildStoragePath(doc.tenantId, doc.id, 'bg-video.mp4');
    expect(storagePathOwnedByStore(path, TENANT_UUID, STORE_UUID)).toBe(true);
  });

  it('GUARD (old root cause): a path whose first segment is the STORE uuid must be rejected by the ownership check', () => {
    const doc = apiStoreToBuilderDoc(makeStore());
    const buggyPath = buildStoragePath(doc.id, doc.id, 'bg-video.mp4');
    expect(storagePathOwnedByStore(buggyPath, TENANT_UUID, STORE_UUID)).toBe(false);
  });

  it('Keeps store id when no tenantId is available (non-session fallback only)', () => {
    const doc = apiStoreToBuilderDoc(makeStore({ tenantId: undefined }));
    expect(doc.tenantId).toBe(STORE_UUID);
  });

  it('builderDocToApiPatch round-trips pages and sections', () => {
    const doc = apiStoreToBuilderDoc(makeStore());
    const patch = builderDocToApiPatch(doc);
    const pages = (patch.config as any).pages as any[];
    expect(pages).toHaveLength(1);
    expect(pages[0].sections[0].type).toBe('hero');
  });

  it('Keeps branding/metadata', () => {
    const doc = apiStoreToBuilderDoc(makeStore());
    expect((doc.theme as any).primaryColor).toBe('#111111');
    expect(doc.metadata.storeName).toBe('Test Store');
  });
});