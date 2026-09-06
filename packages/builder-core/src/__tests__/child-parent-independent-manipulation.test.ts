/**
 * Child-Parent Independent Manipulation + Section Insertion + Asset Context Test Suite
 *
 * Verifies:
 * 1. Deepest element manipulation: moving a child node alters only the child, leaving parent and siblings unmoved.
 * 2. Multi-child isolation: multiple children inside the same container can be moved independently.
 * 3. History single-commit fidelity: 1 undo reverts only the child's movement.
 * 4. Deterministic section insertion: inserting at index N deterministically places the section between predecessor and successor.
 * 5. Asset insertion spatial context: assets are inserted directly into the selected container.
 * 6. Storage diagnostic error formatting: formatStorageError produces actionable diagnostics instead of "<none>".
 */

import { describe, it, expect } from 'vitest';
import {
  createBuilderDocument,
  createBuilderPage,
  createSectionNode,
  createBuilderNode,
  SectionNode,
} from '../BuilderDocument';
import { createBuilderComponentRegistry } from '../ComponentRegistry';
import { createBuilderContext } from '../BuilderContext';
import { createMemoryChannel } from '../PreviewContract';
import { findNode } from '../NodeTree';
import { formatStorageError } from '../../../../src/lib/assets/AssetStorage';

describe('Hero Mission: Child-Parent Independent Manipulation & Contextual Section/Asset Insertion', () => {
  const setupTestEnvironment = () => {
    const childHeading = createBuilderNode({
      id: 'node_heading_1',
      type: 'heading',
      label: 'Kreatywny Tytuł',
      styles: { color: '#ffffff', fontSize: '24px' },
      props: { text: 'Kreatywny Tytuł' },
      children: [],
    });

    const childImage = createBuilderNode({
      id: 'node_image_1',
      type: 'image',
      label: 'Zdjęcie Produktu',
      styles: { width: '300px', height: '200px' },
      props: { src: 'https://images.unsplash.com/photo-1' },
      children: [],
    });

    const parentCard = createSectionNode({
      id: 'container_card',
      type: 'container',
      label: 'Karta Produktu',
      styles: { backgroundColor: '#121124', padding: '24px' },
      children: [childHeading, childImage],
    });

    const rootSection = createSectionNode({
      id: 'sec_root',
      type: 'section',
      label: 'Sekcja Główna',
      styles: { backgroundColor: '#08080f' },
      children: [parentCard],
    });

    const doc = createBuilderDocument({
      id: 'doc_mission',
      pages: [
        createBuilderPage({
          id: 'page_home',
          name: 'Strona Główna',
          slug: '/',
          sections: [rootSection],
        }),
      ],
    });

    const registry = createBuilderComponentRegistry();
    const ctx = createBuilderContext({
      document: doc,
      registry,
      preview: createMemoryChannel().builderChannel,
    });

    return { ctx, doc };
  };

  it('1. Deepest element manipulation: moving child updates ONLY child, parent remains completely unmoved', () => {
    let { ctx } = setupTestEnvironment();

    // Verify initial parent styles has no translateX/translateY
    const initialParent = findNode(ctx.document, 'container_card')!;
    expect(initialParent.node.styles?.translateX).toBeUndefined();
    expect(initialParent.node.styles?.translateY).toBeUndefined();

    // Move child heading by +50px, +30px
    ctx = ctx.dispatch({
      type: 'SET_NODE_STYLES',
      nodeId: 'node_heading_1',
      styles: { translateX: '50px', translateY: '30px' },
    });

    const updatedChild = findNode(ctx.document, 'node_heading_1')!;
    expect(updatedChild.node.styles?.translateX).toBe('50px');
    expect(updatedChild.node.styles?.translateY).toBe('30px');

    // CRITICAL: Parent container must remain completely untouched!
    const updatedParent = findNode(ctx.document, 'container_card')!;
    expect(updatedParent.node.styles?.translateX).toBeUndefined();
    expect(updatedParent.node.styles?.translateY).toBeUndefined();

    // Sibling image must also remain completely untouched!
    const siblingImage = findNode(ctx.document, 'node_image_1')!;
    expect(siblingImage.node.styles?.translateX).toBeUndefined();
    expect(siblingImage.node.styles?.translateY).toBeUndefined();
  });

  it('2. Multi-child isolation: multiple children can move independently without cross-contamination', () => {
    let { ctx } = setupTestEnvironment();

    // Move heading
    ctx = ctx.dispatch({
      type: 'SET_NODE_STYLES',
      nodeId: 'node_heading_1',
      styles: { translateX: '75px', translateY: '15px' },
    });

    // Move image
    ctx = ctx.dispatch({
      type: 'SET_NODE_STYLES',
      nodeId: 'node_image_1',
      styles: { translateX: '-40px', translateY: '90px' },
    });

    const heading = findNode(ctx.document, 'node_heading_1')!;
    const image = findNode(ctx.document, 'node_image_1')!;
    const parent = findNode(ctx.document, 'container_card')!;

    expect(heading.node.styles?.translateX).toBe('75px');
    expect(heading.node.styles?.translateY).toBe('15px');
    expect(image.node.styles?.translateX).toBe('-40px');
    expect(image.node.styles?.translateY).toBe('90px');
    expect(parent.node.styles?.translateX).toBeUndefined();
    expect(parent.node.styles?.translateY).toBeUndefined();
  });

  it('3. Single-commit Undo/Redo fidelity on child movement', () => {
    let { ctx } = setupTestEnvironment();

    // Move child
    ctx = ctx.dispatch({
      type: 'SET_NODE_STYLES',
      nodeId: 'node_heading_1',
      styles: { translateX: '120px', translateY: '80px' },
    });
    expect(findNode(ctx.document, 'node_heading_1')?.node.styles?.translateX).toBe('120px');

    // 1 Undo reverts the move
    ctx = ctx.dispatch({ type: 'UNDO' });
    expect(findNode(ctx.document, 'node_heading_1')?.node.styles?.translateX).toBeUndefined();

    // 1 Redo reapplies the move
    ctx = ctx.dispatch({ type: 'REDO' });
    expect(findNode(ctx.document, 'node_heading_1')?.node.styles?.translateX).toBe('120px');
  });

  it('4. Deterministic section insertion: inserts at exact index between predecessor and successor', () => {
    const sec1 = createSectionNode({ id: 'sec_hero', type: 'hero', label: 'Hero Sekcja', styles: {}, children: [] });
    const sec2 = createSectionNode({ id: 'sec_features', type: 'features', label: 'Funkcje', styles: {}, children: [] });
    const sec3 = createSectionNode({ id: 'sec_footer', type: 'footer', label: 'Stopka', styles: {}, children: [] });

    const doc = createBuilderDocument({
      id: 'doc_sections',
      pages: [
        createBuilderPage({
          id: 'page_1',
          name: 'Home',
          slug: '/',
          sections: [sec1, sec2, sec3],
        }),
      ],
    });

    const registry = createBuilderComponentRegistry();
    let ctx = createBuilderContext({
      document: doc,
      registry,
      preview: createMemoryChannel().builderChannel,
    });

    // Insert new section between Hero (index 0) and Features (index 1) -> target index 1
    const newPricing = createSectionNode({
      id: 'sec_pricing',
      type: 'pricing',
      label: 'Cennik',
      styles: {},
      children: [],
    });

    ctx = ctx.dispatch({
      type: 'INSERT_NODE',
      parentId: null,
      node: newPricing,
      index: 1,
      pageId: 'page_1',
    });

    const pageSections = ctx.document.pages[0].sections;
    expect(pageSections.length).toBe(4);
    expect(pageSections[0].id).toBe('sec_hero');
    expect(pageSections[1].id).toBe('sec_pricing');
    expect(pageSections[2].id).toBe('sec_features');
    expect(pageSections[3].id).toBe('sec_footer');
  });

  it('5. Contextual asset insertion into active container', () => {
    let { ctx } = setupTestEnvironment();

    // Insert new visual asset directly into active container 'container_card'
    const newButtonNode = createBuilderNode({
      id: 'node_btn_cta',
      type: 'button',
      label: 'Kup Teraz',
      parentId: 'container_card',
      styles: { backgroundColor: '#7c3aed', color: '#ffffff' },
      props: { text: 'Kup Teraz' },
      children: [],
    });

    ctx = ctx.dispatch({
      type: 'INSERT_NODE',
      node: newButtonNode,
      parentId: 'container_card',
      pageId: 'page_home',
    });

    const parent = findNode(ctx.document, 'container_card')!;
    expect(parent.node.children.some(c => c.id === 'node_btn_cta')).toBe(true);

    const inserted = findNode(ctx.document, 'node_btn_cta')!;
    expect(inserted.parent?.id).toBe('container_card');
  });

  it('6. Storage diagnostic error formatting prevents "<none>" and exposes root cause', () => {
    // Case A: Supabase returns { statusCode: '403', error: 'Unauthorized', message: '<none>' }
    const supabaseWeirdError = {
      name: 'StorageApiError',
      statusCode: '403',
      error: 'Unauthorized',
      message: '<none>',
    };
    const formattedA = formatStorageError(supabaseWeirdError);
    expect(formattedA).not.toBe('<none>');
    expect(formattedA).toContain('Unauthorized');
    expect(formattedA).toContain('status: 403');

    // Case B: Standard Error with message
    const standardError = new Error('Network timeout connecting to storage');
    const formattedB = formatStorageError(standardError);
    expect(formattedB).toContain('Network timeout connecting to storage');

    // Case C: Empty/unknown error
    const emptyError = {};
    const formattedC = formatStorageError(emptyError);
    expect(formattedC).not.toBe('<none>');
    expect(formattedC).toContain('SupabaseAssetStorage');
  });
});
