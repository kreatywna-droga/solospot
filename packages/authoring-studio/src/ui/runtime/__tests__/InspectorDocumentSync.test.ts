import { describe, it, expect } from 'vitest';
import { syncInspectorValueToSSOT } from '../InspectorDocumentSync';
import type { BuilderDocument } from '../../../../../builder-core/src/BuilderDocument';

function makeDoc(): BuilderDocument {
  return {
    id: 'doc-1',
    tenantId: 'tenant-1',
    version: 1,
    isDirty: false,
    pages: [],
    metadata: { storeName: 'Test', storeSlug: 'test', locale: 'en', currency: 'USD' },
    theme: { primaryColor: '#000', secondaryColor: '#fff', font: 'Inter' },
    updatedAt: Date.now(),
  } as unknown as BuilderDocument;
}

describe('InspectorDocumentSync (Sprint S4, ETAP 2)', () => {
  it('syncs inspector value to SSOT immutably via touchDocument', () => {
    const doc = makeDoc();
    const res = syncInspectorValueToSSOT(doc, 's-1', 'opacity', 0.5);

    expect(res.isSSOTPreserved).toBe(true);
    expect(res.document.version).toBeGreaterThan(doc.version);
    expect(res.nodeId).toBe('s-1');
    expect(res.propertyKey).toBe('opacity');
    expect(res.document).not.toBe(doc); // immutability guaranteed
  });
});
