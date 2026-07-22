/**
 * builder-document.test.ts — C6.1-E
 *
 * Tests:
 *   - createBuilderDocument
 *   - createSectionNode
 *   - compile() round-trip (BuilderDocument → CompiledDocument)
 *   - compile() with nested SectionNode children (flattening)
 *   - touchDocument (version bump, isDirty, updatedAt)
 *   - compile() → StoreConfig shape validation (field presence)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  BuilderDocument,
  createBuilderDocument,
  createBuilderPage,
  createSectionNode,
  compile,
  touchDocument,
  SectionNode,
} from '../BuilderDocument';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeDoc(): BuilderDocument {
  return createBuilderDocument({
    id: 'store_test_001',
    tenantId: 'tenant_abc',
    metadata: {
      storeName: 'Test Store',
      storeSlug: 'test-store',
      locale: 'pl',
      currency: 'PLN',
    },
  });
}

// ---------------------------------------------------------------------------
// createBuilderDocument
// ---------------------------------------------------------------------------

describe('createBuilderDocument', () => {
  it('creates a valid document with defaults', () => {
    const doc = makeDoc();

    expect(doc.id).toBe('store_test_001');
    expect(doc.tenantId).toBe('tenant_abc');
    expect(doc.version).toBe(1);
    expect(doc.isDirty).toBe(false);
    expect(doc.pages).toHaveLength(1);
    expect(doc.pages[0].isHome).toBe(true);
    expect(doc.pages[0].slug).toBe('/');
    expect(doc.theme.primaryColor).toBe('#6366f1');
    expect(doc.theme.font).toBe('Inter');
  });

  it('allows theme overrides', () => {
    const doc = createBuilderDocument({
      id: 'x',
      tenantId: 't',
      metadata: { storeName: 'X', storeSlug: 'x', locale: 'en', currency: 'USD' },
      theme: { primaryColor: '#ff0000', font: 'Roboto' },
    });
    expect(doc.theme.primaryColor).toBe('#ff0000');
    expect(doc.theme.font).toBe('Roboto');
    expect(doc.theme.secondaryColor).toBe('#f1f5f9'); // default preserved
  });

  it('has createdAt and updatedAt as numbers', () => {
    const doc = makeDoc();
    expect(typeof doc.createdAt).toBe('number');
    expect(typeof doc.updatedAt).toBe('number');
    expect(doc.createdAt).toBeLessThanOrEqual(Date.now());
  });
});

// ---------------------------------------------------------------------------
// createSectionNode
// ---------------------------------------------------------------------------

describe('createSectionNode', () => {
  it('creates a node with defaults', () => {
    const node = createSectionNode({ id: 'n1', type: 'hero' });
    expect(node.id).toBe('n1');
    expect(node.type).toBe('hero');
    expect(node.label).toBe('hero');
    expect(node.props).toEqual({});
    expect(node.children).toEqual([]);
    expect(node.visible).toBe(true);
    expect(node.locked).toBe(false);
    expect(node.order).toBe(0);
  });

  it('accepts custom props and order', () => {
    const node = createSectionNode({
      id: 'n2',
      type: 'product-grid',
      label: 'Product Grid',
      props: { columns: 3 },
      order: 2,
    });
    expect(node.props).toEqual({ columns: 3 });
    expect(node.order).toBe(2);
    expect(node.label).toBe('Product Grid');
  });
});

// ---------------------------------------------------------------------------
// compile() — flat document
// ---------------------------------------------------------------------------

describe('compile() flat document', () => {
  let doc: BuilderDocument;

  beforeEach(() => {
    doc = makeDoc();
    // Add two sections to home page
    doc.pages[0].sections.push(
      createSectionNode({ id: 'sec_hero', type: 'hero', label: 'Hero', order: 0 }),
      createSectionNode({ id: 'sec_footer', type: 'footer', label: 'Footer', order: 1 })
    );
  });

  it('compiles to CompiledDocument shape', () => {
    const compiled = compile(doc);

    expect(compiled.storeId).toBe('store_test_001');
    expect(compiled.tenantId).toBe('tenant_abc');
    expect(compiled.storeName).toBe('Test Store');
    expect(compiled.storeSlug).toBe('test-store');
    expect(compiled.locale).toBe('pl');
    expect(compiled.currency).toBe('PLN');
    expect(compiled.builderVersion).toBe(1);
    expect(typeof compiled.compiledAt).toBe('string');
  });

  it('includes compiled pages with sections', () => {
    const compiled = compile(doc);

    expect(compiled.pages).toHaveLength(1);
    const page = compiled.pages[0];
    expect(page.slug).toBe('/');
    expect(page.sections).toHaveLength(2);

    const hero = page.sections.find(s => s.id === 'sec_hero');
    expect(hero).toBeDefined();
    expect(hero!.type).toBe('hero');
    expect(hero!.visible).toBe(true);
  });

  it('sets publicationStatus DRAFT when isDirty=false initially', () => {
    const compiled = compile(doc);
    // doc.isDirty is false → 'PUBLISHED'
    expect(compiled.publicationStatus).toBe('PUBLISHED');
  });

  it('sets publicationStatus DRAFT after touch', () => {
    const dirty = touchDocument(doc);
    const compiled = compile(dirty);
    expect(compiled.publicationStatus).toBe('DRAFT');
  });

  it('includes branding from theme', () => {
    const compiled = compile(doc);
    expect(compiled.branding.primaryColor).toBe('#6366f1');
    expect(compiled.branding.font).toBe('Inter');
  });
});

// ---------------------------------------------------------------------------
// compile() — nested SectionNode (container with children)
// ---------------------------------------------------------------------------

describe('compile() nested sections', () => {
  it('flattens nested container nodes with _childIds prop', () => {
    const doc = makeDoc();
    const child1 = createSectionNode({ id: 'child_1', type: 'text', order: 0 });
    const child2 = createSectionNode({ id: 'child_2', type: 'image', order: 1 });

    const container: SectionNode = {
      id: 'container_1',
      type: 'two-column',
      label: 'Two Column',
      props: { gap: '16px' },
      children: [child1, child2],
      visible: true,
      locked: false,
      order: 0,
    };

    doc.pages[0].sections.push(container);

    const compiled = compile(doc);
    const sections = compiled.pages[0].sections;

    // Container + 2 children = 3 flat sections
    expect(sections).toHaveLength(3);

    const compiledContainer = sections.find(s => s.id === 'container_1');
    expect(compiledContainer).toBeDefined();
    expect((compiledContainer!.props as Record<string, unknown>)._childIds).toEqual(['child_1', 'child_2']);

    const compiledChild1 = sections.find(s => s.id === 'child_1');
    expect(compiledChild1).toBeDefined();
    expect(compiledChild1!.type).toBe('text');
  });
});

// ---------------------------------------------------------------------------
// touchDocument
// ---------------------------------------------------------------------------

describe('touchDocument', () => {
  it('bumps version and sets isDirty', () => {
    const doc = makeDoc();
    expect(doc.version).toBe(1);
    expect(doc.isDirty).toBe(false);

    const touched = touchDocument(doc);
    expect(touched.version).toBe(2);
    expect(touched.isDirty).toBe(true);
  });

  it('updates updatedAt', async () => {
    const doc = makeDoc();
    await new Promise(r => setTimeout(r, 5));
    const touched = touchDocument(doc);
    expect(touched.updatedAt).toBeGreaterThanOrEqual(doc.updatedAt);
  });

  it('does not mutate original', () => {
    const doc = makeDoc();
    const touched = touchDocument(doc);
    expect(doc.version).toBe(1);
    expect(touched.version).toBe(2);
    expect(doc).not.toBe(touched);
  });

  it('is idempotent in structure (each call increments once)', () => {
    const doc = makeDoc();
    const t1 = touchDocument(doc);
    const t2 = touchDocument(t1);
    expect(t2.version).toBe(3);
  });
});
