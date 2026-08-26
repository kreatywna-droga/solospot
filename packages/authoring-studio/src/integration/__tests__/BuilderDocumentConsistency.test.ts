import { describe, it, expect } from 'vitest';
import { validateDocumentConsistency } from '../BuilderDocumentConsistency';
import { createBuilderDocument, createBuilderPage, createSectionNode } from '../../../../builder-core/src/BuilderDocument';

function buildValidDoc() {
  const doc = createBuilderDocument({
    id: 'store-valid',
    tenantId: 'tenant-valid',
    metadata: { storeName: 'Test', storeSlug: 'test', locale: 'en', currency: 'USD' },
  });
  const page = createBuilderPage({
    id: 'p-1',
    slug: '/',
    name: 'Home',
    isHome: true,
    sections: [createSectionNode({ id: 's-1', type: 'hero', label: 'Hero', order: 0 })],
  });
  return { ...doc, pages: [page] };
}

describe('BuilderDocumentConsistency (PM47, ETAP 3 & DECISION-100)', () => {
  it('validates document consistency and preserves SSOT (DECISION-100)', () => {
    const doc = buildValidDoc();
    const report = validateDocumentConsistency(doc);

    expect(report.isValid).toBe(true);
    expect(report.isSSOTPreserved).toBe(true);
    expect(report.checkedNodeCount).toBe(1);

    const invalidReport = validateDocumentConsistency(null);
    expect(invalidReport.isValid).toBe(false);
  });
});
