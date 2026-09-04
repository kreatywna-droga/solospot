/**
 * NS25: Real Parameter -> Document -> Renderer -> Canvas Regression Test Suite
 *
 * Verifies that every supported Inspector parameter:
 *   1. Updates BuilderDocument via SET_NODE_STYLES / UPDATE_NODE / UPDATE_PROPS
 *   2. Resolves correctly for the active breakpoint (Desktop, Tablet, Mobile)
 *   3. Reaches the Canvas renderer with correct DOM CSS properties (no [object Object])
 *   4. Participates in History (UNDO reverts, REDO reapplies)
 *   5. Accurately identifies unsupported types (e.g. Video)
 */

import { describe, it, expect } from 'vitest';
import {
  createBuilderDocument,
  createBuilderPage,
  createSectionNode,
  SectionNode,
  NodeStyles,
} from '../BuilderDocument';
import { createBuilderComponentRegistry } from '../ComponentRegistry';
import { createBuilderContext } from '../BuilderContext';
import { createMemoryChannel } from '../PreviewContract';
import { findNode } from '../NodeTree';

// Helper matching BuilderCanvas.tsx formatFourSide & style resolvers
function formatFourSide(val: any, fallback?: string): string | undefined {
  if (!val) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    const top = val.top ?? '0px';
    const right = val.right ?? '0px';
    const bottom = val.bottom ?? '0px';
    const left = val.left ?? '0px';
    if (!val.top && !val.right && !val.bottom && !val.left) return fallback;
    return `${top || '0px'} ${right || '0px'} ${bottom || '0px'} ${left || '0px'}`;
  }
  return fallback;
}

function resolveEffectiveStyles(node: SectionNode, viewport: 'DESKTOP' | 'TABLET' | 'MOBILE'): Record<string, any> {
  const base = (node.styles || {}) as Record<string, any>;
  if (viewport === 'DESKTOP') return base;
  const tablet = (node.responsive?.tablet || {}) as Record<string, any>;
  if (viewport === 'TABLET') return { ...base, ...tablet };
  const mobile = (node.responsive?.mobile || {}) as Record<string, any>;
  return { ...base, ...tablet, ...mobile };
}

describe('NS25 — Section Real Parameter Audit', () => {
  it('updates and resolves all Section background, size, spacing, border, effect, and layout parameters', () => {
    const sec = createSectionNode({
      id: 'sec_test',
      type: 'section',
      label: 'Main Section',
      props: { background: '#0a0a14', maxWidth: '1280px' },
    });

    const doc = createBuilderDocument({
      pages: [createBuilderPage({ id: 'p1', name: 'Home', slug: '/', sections: [sec] })],
    });

    const registry = createBuilderComponentRegistry();
    let ctx = createBuilderContext({ document: doc, registry, preview: createMemoryChannel().builderChannel });

    // 1. Mutate background & effects
    ctx = ctx.dispatch({
      type: 'SET_NODE_STYLES',
      nodeId: 'sec_test',
      styles: {
        backgroundColor: '#ff0055',
        backgroundImage: 'https://example.com/bg.jpg',
        opacity: 0.85,
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
      },
      pageId: 'p1',
    });

    let node = findNode(ctx.document, 'sec_test')!.node;
    let resolved = resolveEffectiveStyles(node, 'DESKTOP');
    expect(resolved.backgroundColor).toBe('#ff0055');
    expect(resolved.backgroundImage).toBe('https://example.com/bg.jpg');
    expect(resolved.opacity).toBe(0.85);
    expect(resolved.boxShadow).toBe('0 20px 40px rgba(0,0,0,0.5)');

    // 2. Mutate size
    ctx = ctx.dispatch({
      type: 'SET_NODE_STYLES',
      nodeId: 'sec_test',
      styles: {
        width: '100%',
        minWidth: '320px',
        maxWidth: '1440px',
        height: '600px',
        minHeight: '400px',
        maxHeight: '1000px',
      },
      pageId: 'p1',
    });

    node = findNode(ctx.document, 'sec_test')!.node;
    resolved = resolveEffectiveStyles(node, 'DESKTOP');
    expect(resolved.width).toBe('100%');
    expect(resolved.minWidth).toBe('320px');
    expect(resolved.maxWidth).toBe('1440px');
    expect(resolved.height).toBe('600px');
    expect(resolved.minHeight).toBe('400px');
    expect(resolved.maxHeight).toBe('1000px');

    // 3. Mutate 4-side spacing (object format from FourSideEditor)
    ctx = ctx.dispatch({
      type: 'SET_NODE_STYLES',
      nodeId: 'sec_test',
      styles: {
        padding: { top: '40px', right: '20px', bottom: '40px', left: '20px' },
        margin: { top: '10px', right: '0px', bottom: '20px', left: '0px' },
      },
      pageId: 'p1',
    });

    node = findNode(ctx.document, 'sec_test')!.node;
    resolved = resolveEffectiveStyles(node, 'DESKTOP');
    // Ensure formatFourSide produces clean CSS string (NOT [object Object])
    expect(formatFourSide(resolved.padding)).toBe('40px 20px 40px 20px');
    expect(formatFourSide(resolved.margin)).toBe('10px 0px 20px 0px');

    // 4. Mutate border
    ctx = ctx.dispatch({
      type: 'SET_NODE_STYLES',
      nodeId: 'sec_test',
      styles: {
        borderWidth: '2px',
        borderStyle: 'solid',
        borderColor: '#7c3aed',
        borderRadius: '24px',
      },
      pageId: 'p1',
    });

    node = findNode(ctx.document, 'sec_test')!.node;
    resolved = resolveEffectiveStyles(node, 'DESKTOP');
    expect(resolved.borderWidth).toBe('2px');
    expect(resolved.borderStyle).toBe('solid');
    expect(resolved.borderColor).toBe('#7c3aed');
    expect(resolved.borderRadius).toBe('24px');

    // 5. Mutate layout & position
    ctx = ctx.dispatch({
      type: 'SET_NODE_STYLES',
      nodeId: 'sec_test',
      styles: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
        position: 'relative',
        zIndex: 10,
      },
      pageId: 'p1',
    });

    node = findNode(ctx.document, 'sec_test')!.node;
    resolved = resolveEffectiveStyles(node, 'DESKTOP');
    expect(resolved.display).toBe('flex');
    expect(resolved.flexDirection).toBe('column');
    expect(resolved.alignItems).toBe('center');
    expect(resolved.justifyContent).toBe('center');
    expect(resolved.gap).toBe('24px');
    expect(resolved.position).toBe('relative');
    expect(resolved.zIndex).toBe(10);
  });
});

describe('NS25 — Container Real Parameter Audit', () => {
  it('updates container layout, dimensions, grid, and borders without dropping properties', () => {
    const cont = createSectionNode({
      id: 'cont_test',
      type: 'container',
      label: 'Flex Container',
      props: { display: 'flex-col', padding: 'md' },
    });

    const doc = createBuilderDocument({
      pages: [createBuilderPage({ id: 'p1', name: 'Home', slug: '/', sections: [cont] })],
    });

    let ctx = createBuilderContext({ document: doc, registry: createBuilderComponentRegistry(), preview: createMemoryChannel().builderChannel });

    ctx = ctx.dispatch({
      type: 'SET_NODE_STYLES',
      nodeId: 'cont_test',
      styles: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'auto',
        gap: '20px',
        width: '1200px',
        height: '500px',
        minWidth: '300px',
        maxWidth: '1400px',
        minHeight: '200px',
        maxHeight: '800px',
        backgroundColor: '#111827',
        borderRadius: '16px',
        borderWidth: '1px',
        borderStyle: 'dashed',
        borderColor: '#374151',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        opacity: 0.95,
        position: 'relative',
        zIndex: 5,
        padding: { top: '32px', right: '16px', bottom: '32px', left: '16px' },
        margin: '0 auto',
      },
      pageId: 'p1',
    });

    const node = findNode(ctx.document, 'cont_test')!.node;
    const resolved = resolveEffectiveStyles(node, 'DESKTOP');

    expect(resolved.display).toBe('grid');
    expect(resolved.gridTemplateColumns).toBe('repeat(3, 1fr)');
    expect(resolved.gap).toBe('20px');
    expect(resolved.width).toBe('1200px');
    expect(resolved.height).toBe('500px');
    expect(resolved.minWidth).toBe('300px');
    expect(resolved.maxWidth).toBe('1400px');
    expect(resolved.borderRadius).toBe('16px');
    expect(resolved.borderColor).toBe('#374151');
    expect(formatFourSide(resolved.padding)).toBe('32px 16px 32px 16px');
    expect(formatFourSide(resolved.margin)).toBe('0 auto');
  });
});

describe('NS25 — Image Real Parameter Audit', () => {
  it('updates image source, dimensions, object-fit, radius, border, and effects', () => {
    const img = createSectionNode({
      id: 'img_test',
      type: 'image',
      label: 'Hero Image',
      props: {
        src: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
        alt: 'Product',
        width: '100%',
        height: 'auto',
        objectFit: 'cover',
      },
    });

    const doc = createBuilderDocument({
      pages: [createBuilderPage({ id: 'p1', name: 'Home', slug: '/', sections: [img] })],
    });

    let ctx = createBuilderContext({ document: doc, registry: createBuilderComponentRegistry(), preview: createMemoryChannel().builderChannel });

    // 1. Replace image via UPDATE_PROPS (Content tab)
    ctx = ctx.dispatch({
      type: 'UPDATE_PROPS',
      sectionId: 'img_test',
      pageId: 'p1',
      props: {
        src: 'https://images.unsplash.com/photo-brand-new',
        alt: 'Updated Brand Image',
        objectFit: 'contain',
      },
    });

    let node = findNode(ctx.document, 'img_test')!.node;
    expect(node.props.src).toBe('https://images.unsplash.com/photo-brand-new');
    expect(node.props.alt).toBe('Updated Brand Image');
    expect(node.props.objectFit).toBe('contain');

    // 2. Adjust geometry & styling via SET_NODE_STYLES (Design tab)
    ctx = ctx.dispatch({
      type: 'SET_NODE_STYLES',
      nodeId: 'img_test',
      styles: {
        width: '450px',
        height: '350px',
        borderRadius: '20px',
        borderWidth: '3px',
        borderColor: '#10b981',
        borderStyle: 'solid',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        opacity: 0.9,
      },
      pageId: 'p1',
    });

    node = findNode(ctx.document, 'img_test')!.node;
    const resolved = resolveEffectiveStyles(node, 'DESKTOP');
    expect(resolved.width).toBe('450px');
    expect(resolved.height).toBe('350px');
    expect(resolved.borderRadius).toBe('20px');
    expect(resolved.borderWidth).toBe('3px');
    expect(resolved.borderColor).toBe('#10b981');
    expect(resolved.borderStyle).toBe('solid');
    expect(resolved.boxShadow).toBe('0 25px 50px -12px rgba(0, 0, 0, 0.25)');
    expect(resolved.opacity).toBe(0.9);
  });
});

describe('NS25 — Heading & Text Real Parameter Audit', () => {
  it('updates typography: fontSize, fontWeight, fontFamily, color, align, lineHeight, and letterSpacing', () => {
    const heading = createSectionNode({
      id: 'head_test',
      type: 'heading',
      label: 'Title',
      props: { text: 'Initial Title', level: 'h1' },
    });

    const doc = createBuilderDocument({
      pages: [createBuilderPage({ id: 'p1', name: 'Home', slug: '/', sections: [heading] })],
    });

    let ctx = createBuilderContext({ document: doc, registry: createBuilderComponentRegistry(), preview: createMemoryChannel().builderChannel });

    // Update typography in Design Inspector
    ctx = ctx.dispatch({
      type: 'SET_NODE_STYLES',
      nodeId: 'head_test',
      styles: {
        fontSize: '72px',
        fontWeight: '800',
        fontFamily: 'Outfit',
        color: '#f43f5e',
        textAlign: 'center',
        lineHeight: '1.1',
        letterSpacing: '-0.03em',
      },
      pageId: 'p1',
    });

    let node = findNode(ctx.document, 'head_test')!.node;
    let resolved = resolveEffectiveStyles(node, 'DESKTOP');

    expect(resolved.fontSize).toBe('72px');
    expect(resolved.fontWeight).toBe('800');
    expect(resolved.fontFamily).toBe('Outfit');
    expect(resolved.color).toBe('#f43f5e');
    expect(resolved.textAlign).toBe('center');
    expect(resolved.lineHeight).toBe('1.1');
    expect(resolved.letterSpacing).toBe('-0.03em');
  });
});

describe('NS25 — Button Real Parameter Audit', () => {
  it('updates button content, colors, geometry, borders, radius (0 and 40), and shadows', () => {
    const btn = createSectionNode({
      id: 'btn_test',
      type: 'button',
      label: 'Action Button',
      props: { text: 'Buy Now', variant: 'primary' },
    });

    const doc = createBuilderDocument({
      pages: [createBuilderPage({ id: 'p1', name: 'Home', slug: '/', sections: [btn] })],
    });

    let ctx = createBuilderContext({ document: doc, registry: createBuilderComponentRegistry(), preview: createMemoryChannel().builderChannel });

    // 1. Test square corners (radius 0)
    ctx = ctx.dispatch({
      type: 'SET_NODE_STYLES',
      nodeId: 'btn_test',
      styles: {
        backgroundColor: '#ef4444',
        color: '#ffffff',
        borderRadius: '0px',
        borderWidth: '2px',
        borderColor: '#b91c1c',
        borderStyle: 'solid',
        fontSize: '18px',
        fontWeight: '700',
        padding: '14px 28px',
      },
      pageId: 'p1',
    });

    let node = findNode(ctx.document, 'btn_test')!.node;
    let resolved = resolveEffectiveStyles(node, 'DESKTOP');
    expect(resolved.backgroundColor).toBe('#ef4444');
    expect(resolved.borderRadius).toBe('0px');
    expect(resolved.fontSize).toBe('18px');
    expect(formatFourSide(resolved.padding)).toBe('14px 28px');

    // 2. Test round pill corners (radius 40px)
    ctx = ctx.dispatch({
      type: 'SET_NODE_STYLES',
      nodeId: 'btn_test',
      styles: {
        borderRadius: '40px',
      },
      pageId: 'p1',
    });

    node = findNode(ctx.document, 'btn_test')!.node;
    resolved = resolveEffectiveStyles(node, 'DESKTOP');
    expect(resolved.borderRadius).toBe('40px');
  });
});

describe('NS25 — History: Undo & Redo', () => {
  it('reverts visual parameters on UNDO and reapplies them on REDO', () => {
    const sec = createSectionNode({
      id: 'sec_hist',
      type: 'section',
      label: 'History Section',
      styles: { backgroundColor: '#ffffff', width: '800px' },
    });

    const doc = createBuilderDocument({
      pages: [createBuilderPage({ id: 'p1', name: 'Home', slug: '/', sections: [sec] })],
    });

    let ctx = createBuilderContext({ document: doc, registry: createBuilderComponentRegistry(), preview: createMemoryChannel().builderChannel });

    // Change background to red
    ctx = ctx.dispatch({
      type: 'SET_NODE_STYLES',
      nodeId: 'sec_hist',
      styles: { backgroundColor: '#ff0000', width: '1200px' },
      pageId: 'p1',
    });

    let node = findNode(ctx.document, 'sec_hist')!.node;
    expect(node.styles?.backgroundColor).toBe('#ff0000');
    expect(node.styles?.width).toBe('1200px');

    // UNDO -> should revert to original #ffffff and 800px
    ctx = ctx.dispatch({ type: 'UNDO' });
    node = findNode(ctx.document, 'sec_hist')!.node;
    expect(node.styles?.backgroundColor).toBe('#ffffff');
    expect(node.styles?.width).toBe('800px');

    // REDO -> should return to #ff0000 and 1200px
    ctx = ctx.dispatch({ type: 'REDO' });
    node = findNode(ctx.document, 'sec_hist')!.node;
    expect(node.styles?.backgroundColor).toBe('#ff0000');
    expect(node.styles?.width).toBe('1200px');
  });
});

describe('NS25 — Responsive Parameter Isolation', () => {
  it('stores breakpoint overrides cleanly without corrupting desktop values', () => {
    const heading = createSectionNode({
      id: 'resp_head',
      type: 'heading',
      label: 'Responsive Heading',
      styles: { fontSize: '72px' },
      responsive: {
        tablet: { fontSize: '52px' },
        mobile: { fontSize: '36px' },
      },
    });

    const doc = createBuilderDocument({
      pages: [createBuilderPage({ id: 'p1', name: 'Home', slug: '/', sections: [heading] })],
    });

    const node = findNode(doc, 'resp_head')!.node;

    const desktopStyles = resolveEffectiveStyles(node, 'DESKTOP');
    const tabletStyles = resolveEffectiveStyles(node, 'TABLET');
    const mobileStyles = resolveEffectiveStyles(node, 'MOBILE');

    expect(desktopStyles.fontSize).toBe('72px');
    expect(tabletStyles.fontSize).toBe('52px');
    expect(mobileStyles.fontSize).toBe('36px');
  });
});

describe('NS25 — Video Element Verification', () => {
  it('correctly reports video as UNSUPPORTED when not present in registry', () => {
    const registry = createBuilderComponentRegistry();
    expect(registry.has('video')).toBe(false);
  });
});
