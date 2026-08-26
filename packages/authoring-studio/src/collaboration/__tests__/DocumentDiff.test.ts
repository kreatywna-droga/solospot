import { describe, it, expect } from 'vitest';
import { calculateDocumentDiff } from '../DocumentDiff';
import {
  createBuilderDocument,
  createBuilderPage,
  createSectionNode,
} from '../../../../builder-core/src/BuilderDocument';

describe('DocumentDiff (Sprint S7)', () => {
  it('detects added, updated, and deleted nodes', () => {
    const n1 = createSectionNode({ id: 'n1', type: 'rect', label: 'A' });
    const n2 = createSectionNode({ id: 'n2', type: 'circle', label: 'B' });

    const baseDoc = createBuilderDocument({
      id: 'd1',
      tenantId: 't1',
      metadata: { storeName: 'Test', storeSlug: 'test', locale: 'en', currency: 'USD' },
    });
    const base = {
      ...baseDoc,
      pages: [createBuilderPage({ id: 'p1', name: 'Home', slug: '/', sections: [n1, n2] })],
    };

    const n1Updated = createSectionNode({ id: 'n1', type: 'rect', label: 'A Changed' });
    const n3 = createSectionNode({ id: 'n3', type: 'text', label: 'C' });

    const headDoc = createBuilderDocument({
      id: 'd1',
      tenantId: 't1',
      metadata: { storeName: 'Test', storeSlug: 'test', locale: 'en', currency: 'USD' },
    });
    const head = {
      ...headDoc,
      version: 2,
      pages: [createBuilderPage({ id: 'p1', name: 'Home', slug: '/', sections: [n1Updated, n3] })],
    };

    const report = calculateDocumentDiff(base, head);

    expect(report.baseVersion).toBe(1);
    expect(report.headVersion).toBe(2);
    expect(report.changes).toHaveLength(3);

    const added = report.changes.find((c) => c.operation === 'add');
    const updated = report.changes.find((c) => c.operation === 'update');
    const deleted = report.changes.find((c) => c.operation === 'delete');

    expect(added?.path).toBe('nodes.n3');
    expect(updated?.path).toBe('nodes.n1');
    expect(deleted?.path).toBe('nodes.n2');
  });
});
