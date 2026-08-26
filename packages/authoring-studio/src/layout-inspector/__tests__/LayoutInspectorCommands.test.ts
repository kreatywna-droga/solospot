/**
 * LayoutInspectorCommands.test.ts — Sprint S30 Unit Tests
 */

import { describe, it, expect } from 'vitest';
import {
  createBuilderDocument,
  createBuilderPage,
  createSectionNode,
  type BuilderDocument,
} from '../../../../builder-core/src/BuilderDocument';
import { applyLayoutFieldChange } from '../LayoutInspectorCommands';
import { readLayoutStyle } from '../../layout/LayoutCommands';

const createDoc = (): BuilderDocument => {
  const container = createSectionNode({
    id: 'c1',
    type: 'container',
    label: 'Container',
    props: { width: 500 },
  });

  const base = createBuilderDocument({
    id: 'doc-cmd-1',
    tenantId: 't1',
    metadata: { storeName: 'S', storeSlug: 's', locale: 'en', currency: 'USD' },
  });

  return {
    ...base,
    pages: [createBuilderPage({ id: 'p1', name: 'Home', slug: '/', sections: [container] })],
  };
};

describe('LayoutInspectorCommands', () => {
  it('dispatches desktop style field changes via SetLayoutStyleCommand', () => {
    let doc = createDoc();
    const res = applyLayoutFieldChange(doc, 'c1', 'layout.gap', 20, 'desktop');

    expect(res).toBeDefined();
    doc = res!.doc;
    const node = doc.pages[0].sections[0];
    expect(readLayoutStyle(node)?.gap).toBe(20);
    expect(res!.command.name).toContain('Set Layout Style');
  });

  it('dispatches mobile responsive field changes via SetBreakpointOverrideCommand', () => {
    let doc = createDoc();
    const res = applyLayoutFieldChange(doc, 'c1', 'layout.gap', 8, 'mobile');

    expect(res).toBeDefined();
    doc = res!.doc;
    expect(res!.command.name).toContain('Set Responsive Override (mobile)');
  });
});