import { describe, it, expect } from 'vitest';
import { performAdvancedSearch, type SearchQuery } from '../AdvancedSearch';
import { createBuilderDocument, createBuilderPage, createSectionNode } from '../../../../builder-core/src/BuilderDocument';

describe('AdvancedSearch (Sprint S6)', () => {
  it('searches and scores document nodes based on term', () => {
    const doc = createBuilderDocument({
      id: 'd1',
      tenantId: 't1',
      metadata: { storeName: 'Test', storeSlug: 'test', locale: 'en', currency: 'USD' },
    });
    const sec1 = createSectionNode({ id: 'node-1', type: 'rect', label: 'My Rectangle' });
    const sec2 = createSectionNode({ id: 'node-2', type: 'circle', label: 'My Circle' });
    const sec3 = createSectionNode({ id: 'node-3', type: 'text', label: 'Some other node' });
    const docWithNodes = {
      ...doc,
      pages: [createBuilderPage({ id: 'page1', slug: '/', name: 'Home', isHome: true, sections: [sec1, sec2, sec3] })],
    };

    const queryExact: SearchQuery = { term: 'my rectangle' };
    const resExact = performAdvancedSearch(docWithNodes, queryExact);
    expect(resExact).toHaveLength(1);
    expect(resExact[0].id).toBe('node-1');
    expect(resExact[0].score).toBe(100);

    const queryPartial: SearchQuery = { term: 'my ' };
    const resPartial = performAdvancedSearch(docWithNodes, queryPartial);
    expect(resPartial).toHaveLength(2); // rect & circle
    expect(resPartial[0].score).toBeGreaterThan(0);
  });
});
