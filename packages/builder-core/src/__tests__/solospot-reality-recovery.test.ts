/**
 * SoloSpot Builder — Reality Recovery / Product Functionality Test Suite
 *
 * Verifies the core pillars of the W0 Reality Recovery mission:
 * 1. Canonical Insertion Rules (Section -> Container -> Child, and Sibling insertion)
 * 2. Section and Container unified layout rendering (no orphaned box)
 * 3. Image widget & source persistence (src, objectFit, objectPosition)
 * 4. Slider & numeric property normalization (gap, lineHeight, letterSpacing, opacity)
 * 5. History undo/redo fidelity across structural and style mutations
 * 6. Multi-breakpoint style isolation
 */

import { describe, it, expect } from 'vitest';
import {
  createBuilderDocument,
  createBuilderPage,
  createSectionNode,
  createBuilderNode,
} from '../BuilderDocument';
import { createBuilderComponentRegistry } from '../ComponentRegistry';
import { createBuilderContext } from '../BuilderContext';
import { createMemoryChannel } from '../PreviewContract';
import { findNode } from '../NodeTree';

describe('SoloSpot Builder — Reality Recovery Test Suite', () => {
  it('1. Canonical hierarchy: inserting container into section, and heading into container', () => {
    const rootSection = createSectionNode({
      id: 'sec_hero',
      type: 'section',
      label: 'Hero Section',
      props: { background: '#0a0a14' },
      children: [],
    });

    const doc = createBuilderDocument({
      id: 'doc_1',
      pages: [createBuilderPage({ id: 'p1', name: 'Home', slug: '/', sections: [rootSection] })],
    });

    const registry = createBuilderComponentRegistry();
    let ctx = createBuilderContext({ document: doc, registry, preview: createMemoryChannel().builderChannel });

    // Insert Container into Section
    const containerNode = createBuilderNode({
      id: 'cont_inner',
      type: 'container',
      label: 'Container',
      children: [],
    });

    ctx = ctx.dispatch({
      type: 'INSERT_NODE',
      node: containerNode,
      parentId: 'sec_hero',
      pageId: 'p1',
    });

    let sec = findNode(ctx.document, 'sec_hero')!.node;
    expect(sec.children).toHaveLength(1);
    expect(sec.children![0].id).toBe('cont_inner');

    // Insert Heading into Container
    const headingNode = createBuilderNode({
      id: 'heading_title',
      type: 'heading',
      label: 'Nagłówek',
      props: { content: 'Witaj w SoloSpot' },
      styles: { fontSize: '48px', color: '#ffffff' },
    });

    ctx = ctx.dispatch({
      type: 'INSERT_NODE',
      node: headingNode,
      parentId: 'cont_inner',
      pageId: 'p1',
    });

    let cont = findNode(ctx.document, 'cont_inner')!.node;
    expect(cont.children).toHaveLength(1);
    expect(cont.children![0].id).toBe('heading_title');
    expect(cont.children![0].props.content).toBe('Witaj w SoloSpot');
  });

  it('2. Sibling placement: adding text after heading inside same container', () => {
    const headingNode = createBuilderNode({
      id: 'heading_1',
      type: 'heading',
      label: 'Heading',
      props: { content: 'Header' },
    });

    const container = createBuilderNode({
      id: 'cont_1',
      type: 'container',
      label: 'Container',
      children: [headingNode],
    });

    const section = createSectionNode({
      id: 'sec_1',
      type: 'section',
      label: 'Section',
      children: [container],
    });

    const doc = createBuilderDocument({
      id: 'doc_1',
      pages: [createBuilderPage({ id: 'p1', name: 'Home', slug: '/', sections: [section] })],
    });

    const registry = createBuilderComponentRegistry();
    let ctx = createBuilderContext({ document: doc, registry, preview: createMemoryChannel().builderChannel });

    // Sibling insertion: insert text into cont_1 at index 1 (after heading_1)
    const textNode = createBuilderNode({
      id: 'text_1',
      type: 'text',
      label: 'Paragraf',
      props: { content: 'Opis produktu lub usługi' },
    });

    ctx = ctx.dispatch({
      type: 'INSERT_NODE',
      node: textNode,
      parentId: 'cont_1',
      index: 1,
      pageId: 'p1',
    });

    const cont = findNode(ctx.document, 'cont_1')!.node;
    expect(cont.children).toHaveLength(2);
    expect(cont.children![0].id).toBe('heading_1');
    expect(cont.children![1].id).toBe('text_1');
  });

  it('3. Image widget & source persistence: src update via props and styles', () => {
    const imageNode = createBuilderNode({
      id: 'img_test',
      type: 'image',
      label: 'Zdjęcie',
      props: {
        src: '',
        alt: 'SoloSpot Preview',
      },
      styles: {
        width: '100%',
        height: '400px',
        objectFit: 'cover',
      },
    });

    const section = createSectionNode({
      id: 'sec_1',
      type: 'section',
      children: [imageNode],
    });

    const doc = createBuilderDocument({
      id: 'doc_1',
      pages: [createBuilderPage({ id: 'p1', name: 'Home', slug: '/', sections: [section] })],
    });

    const registry = createBuilderComponentRegistry();
    let ctx = createBuilderContext({ document: doc, registry, preview: createMemoryChannel().builderChannel });

    // Update image src via SET_NODE_PROPS (simulating file upload or library selection)
    const newImageUrl = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb';
    ctx = ctx.dispatch({
      type: 'SET_NODE_PROPS',
      nodeId: 'img_test',
      props: { src: newImageUrl, alt: 'Updated Landscape' },
      pageId: 'p1',
    });

    // Also update styles (e.g. objectPosition, borderRadius from Inspector)
    ctx = ctx.dispatch({
      type: 'SET_NODE_STYLES',
      nodeId: 'img_test',
      styles: {
        objectPosition: 'center',
        borderRadius: '16px',
      },
      pageId: 'p1',
    });

    const img = findNode(ctx.document, 'img_test')!.node;
    expect(img.props.src).toBe(newImageUrl);
    expect(img.props.alt).toBe('Updated Landscape');
    expect(img.styles?.objectFit).toBe('cover');
    expect(img.styles?.objectPosition).toBe('center');
    expect(img.styles?.borderRadius).toBe('16px');
  });

  it('4. Slider and numeric parameter synchronization', () => {
    const container = createBuilderNode({
      id: 'cont_flex',
      type: 'container',
      styles: {
        display: 'flex',
        flexDirection: 'column',
      },
    });

    const textNode = createBuilderNode({
      id: 'txt_styled',
      type: 'text',
      styles: {},
    });

    const section = createSectionNode({
      id: 'sec_main',
      type: 'section',
      children: [container, textNode],
    });

    const doc = createBuilderDocument({
      id: 'doc_1',
      pages: [createBuilderPage({ id: 'p1', name: 'Home', slug: '/', sections: [section] })],
    });

    const registry = createBuilderComponentRegistry();
    let ctx = createBuilderContext({ document: doc, registry, preview: createMemoryChannel().builderChannel });

    // Update gap slider on container
    ctx = ctx.dispatch({
      type: 'SET_NODE_STYLES',
      nodeId: 'cont_flex',
      styles: { gap: '24px' },
      pageId: 'p1',
    });

    // Update lineHeight and letterSpacing slider on text
    ctx = ctx.dispatch({
      type: 'SET_NODE_STYLES',
      nodeId: 'txt_styled',
      styles: {
        lineHeight: '1.75',
        letterSpacing: '1px',
        opacity: 0.9,
      },
      pageId: 'p1',
    });

    const updatedCont = findNode(ctx.document, 'cont_flex')!.node;
    const updatedTxt = findNode(ctx.document, 'txt_styled')!.node;

    expect(updatedCont.styles?.gap).toBe('24px');
    expect(updatedTxt.styles?.lineHeight).toBe('1.75');
    expect(updatedTxt.styles?.letterSpacing).toBe('1px');
    expect(updatedTxt.styles?.opacity).toBe(0.9);
  });

  it('5. Full History Undo / Redo fidelity', () => {
    const section = createSectionNode({
      id: 'sec_hist',
      type: 'section',
      styles: { backgroundColor: '#111111' },
      children: [],
    });

    const doc = createBuilderDocument({
      id: 'doc_1',
      pages: [createBuilderPage({ id: 'p1', name: 'Home', slug: '/', sections: [section] })],
    });

    const registry = createBuilderComponentRegistry();
    let ctx = createBuilderContext({ document: doc, registry, preview: createMemoryChannel().builderChannel });

    // Step 1: change bg color
    ctx = ctx.dispatch({
      type: 'SET_NODE_STYLES',
      nodeId: 'sec_hist',
      styles: { backgroundColor: '#ff0055' },
      pageId: 'p1',
    });

    expect(findNode(ctx.document, 'sec_hist')!.node.styles?.backgroundColor).toBe('#ff0055');

    // Step 2: Undo
    ctx = ctx.dispatch({ type: 'UNDO' });
    expect(findNode(ctx.document, 'sec_hist')!.node.styles?.backgroundColor).toBe('#111111');

    // Step 3: Redo
    ctx = ctx.dispatch({ type: 'REDO' });
    expect(findNode(ctx.document, 'sec_hist')!.node.styles?.backgroundColor).toBe('#ff0055');
  });

  it('6. Multi-breakpoint isolation (Desktop base does not bleed into mobile overrides)', () => {
    const section = createSectionNode({
      id: 'sec_resp',
      type: 'section',
      styles: {
        fontSize: '32px',
        padding: '64px',
      },
      responsive: {
        mobile: {
          fontSize: '20px',
          padding: '16px',
        },
      },
    });

    const doc = createBuilderDocument({
      id: 'doc_1',
      pages: [createBuilderPage({ id: 'p1', name: 'Home', slug: '/', sections: [section] })],
    });

    const node = findNode(doc, 'sec_resp')!.node;
    expect(node.styles?.fontSize).toBe('32px');
    expect(node.styles?.padding).toBe('64px');
    expect(node.responsive?.mobile?.fontSize).toBe('20px');
    expect(node.responsive?.mobile?.padding).toBe('16px');
  });

  it('7. Section background contract: image (url + fit + overlay) and video persist and are undoable', () => {
    const section = createSectionNode({
      id: 'sec_bg',
      type: 'section',
      label: 'Hero z tłem',
      props: {},
      children: [],
    });

    const doc = createBuilderDocument({
      id: 'doc_bg',
      pages: [createBuilderPage({ id: 'p1', name: 'Home', slug: '/', sections: [section] })],
    });

    const registry = createBuilderComponentRegistry();
    let ctx = createBuilderContext({ document: doc, registry, preview: createMemoryChannel().builderChannel });

    // Inspector "Zdjęcie" tab → SET_NODE_STYLES with background image + fit + overlay
    ctx = ctx.dispatch({
      type: 'SET_NODE_STYLES',
      nodeId: 'sec_bg',
      styles: {
        backgroundImage: 'url("https://example.com/hero.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        overlayOpacity: 0.4,
      },
    });

    let node = findNode(ctx.document, 'sec_bg')!.node;
    expect(node.styles?.backgroundImage).toBe('url("https://example.com/hero.jpg")');
    expect(node.styles?.backgroundSize).toBe('cover');
    expect(node.styles?.overlayOpacity).toBe(0.4);

    // Switch to "Wideo" tab → clear image, set props.backgroundVideo
    ctx = ctx.dispatch({ type: 'SET_NODE_STYLES', nodeId: 'sec_bg', styles: { backgroundImage: 'none' } });
    ctx = ctx.dispatch({ type: 'UPDATE_PROPS', pageId: 'p1', sectionId: 'sec_bg', props: { backgroundVideo: 'https://example.com/bg.mp4' } });

    node = findNode(ctx.document, 'sec_bg')!.node;
    expect(node.styles?.backgroundImage).toBe('none');
    expect(node.props.backgroundVideo).toBe('https://example.com/bg.mp4');

    // Both mutations are undoable (history integrity)
    ctx = ctx.dispatch({ type: 'UNDO' });
    node = findNode(ctx.document, 'sec_bg')!.node;
    expect(node.props.backgroundVideo).toBeUndefined();

    ctx = ctx.dispatch({ type: 'UNDO' });
    node = findNode(ctx.document, 'sec_bg')!.node;
    expect(node.styles?.backgroundImage).toBe('url("https://example.com/hero.jpg")');

    ctx = ctx.dispatch({ type: 'REDO' });
    ctx = ctx.dispatch({ type: 'REDO' });
    node = findNode(ctx.document, 'sec_bg')!.node;
    expect(node.props.backgroundVideo).toBe('https://example.com/bg.mp4');
  });
});
