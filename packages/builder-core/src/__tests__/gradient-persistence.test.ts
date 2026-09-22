/**
 * Gradient persistence / undo-redo / responsive isolation tests.
 *
 * Gradients are stored as a valid CSS linear-gradient(...) string in
 * NodeStyles.backgroundImage via SET_NODE_STYLES — same channel as image URLs.
 */
import { describe, it, expect } from 'vitest';
import {
  createBuilderDocument,
  createBuilderPage,
  createSectionNode,
} from '../BuilderDocument';
import { createBuilderComponentRegistry } from '../ComponentRegistry';
import { createBuilderContext } from '../BuilderContext';
import { createMemoryChannel } from '../PreviewContract';
import { findNode } from '../NodeTree';
import {
  buildLinearGradient,
  parseLinearGradient,
  isLinearGradientCss,
  DEFAULT_GRADIENT,
} from '../../../authoring-studio/src/inspector/controls/gradient';

const GRADIENT_CSS = buildLinearGradient(DEFAULT_GRADIENT);

function makeCtx() {
  const section = createSectionNode({
    id: 'sec_bg',
    type: 'section',
    label: 'Hero',
    props: {},
    children: [],
  });
  const doc = createBuilderDocument({
    id: 'doc_g',
    pages: [createBuilderPage({ id: 'p1', name: 'Home', slug: '/', sections: [section] })],
  });
  const registry = createBuilderComponentRegistry();
  return createBuilderContext({
    document: doc,
    registry,
    preview: createMemoryChannel().builderChannel,
  });
}

describe('Gradient persistence (NodeStyles.backgroundImage)', () => {
  it('persists a linear-gradient CSS string via SET_NODE_STYLES', () => {
    let ctx = makeCtx();
    ctx = ctx.dispatch({
      type: 'SET_NODE_STYLES',
      nodeId: 'sec_bg',
      styles: { backgroundImage: GRADIENT_CSS },
    });
    const node = findNode(ctx.document, 'sec_bg')!.node;
    expect(node.styles?.backgroundImage).toBe(GRADIENT_CSS);
    expect(isLinearGradientCss(node.styles?.backgroundImage)).toBe(true);
    expect(parseLinearGradient(node.styles?.backgroundImage)).not.toBeNull();
  });

  it('clears gradient when switching back to solid/image ("none")', () => {
    let ctx = makeCtx();
    ctx = ctx.dispatch({
      type: 'SET_NODE_STYLES',
      nodeId: 'sec_bg',
      styles: { backgroundImage: GRADIENT_CSS },
    });
    ctx = ctx.dispatch({ type: 'SET_NODE_STYLES', nodeId: 'sec_bg', styles: { backgroundImage: 'none' } });
    const node = findNode(ctx.document, 'sec_bg')!.node;
    expect(node.styles?.backgroundImage).toBe('none');
    expect(isLinearGradientCss(node.styles?.backgroundImage)).toBe(false);
  });
});

describe('Gradient undo/redo fidelity', () => {
  it('SET_NODE_STYLES with gradient participates in history', () => {
    let ctx = makeCtx();
    const before = findNode(ctx.document, 'sec_bg')!.node.styles?.backgroundImage;

    ctx = ctx.dispatch({
      type: 'SET_NODE_STYLES',
      nodeId: 'sec_bg',
      styles: { backgroundImage: GRADIENT_CSS },
    });
    expect(findNode(ctx.document, 'sec_bg')!.node.styles?.backgroundImage).toBe(GRADIENT_CSS);

    ctx = ctx.dispatch({ type: 'UNDO' });
    expect(findNode(ctx.document, 'sec_bg')!.node.styles?.backgroundImage).toBe(before);

    ctx = ctx.dispatch({ type: 'REDO' });
    expect(findNode(ctx.document, 'sec_bg')!.node.styles?.backgroundImage).toBe(GRADIENT_CSS);
  });
});

describe('Gradient responsive isolation', () => {
  it('tablet gradient override does not contaminate desktop base', () => {
    let ctx = makeCtx();
    const tabletCss = buildLinearGradient({
      type: 'linear-gradient',
      angle: 90,
      stops: [
        { color: '#ff0000', position: 0 },
        { color: '#0000ff', position: 100 },
      ],
    });

    ctx = ctx.dispatch({
      type: 'SET_NODE_STYLES',
      nodeId: 'sec_bg',
      styles: { backgroundImage: GRADIENT_CSS },
    });

    const currentResp =
      (findNode(ctx.document, 'sec_bg')!.node as any).responsive || {};
    ctx = ctx.dispatch({
      type: 'UPDATE_NODE',
      nodeId: 'sec_bg',
      updates: {
        responsive: {
          ...currentResp,
          tablet: { ...(currentResp.tablet || {}), backgroundImage: tabletCss },
        },
      },
    } as any);

    const node = findNode(ctx.document, 'sec_bg')!.node;
    // Desktop base unchanged
    expect(node.styles?.backgroundImage).toBe(GRADIENT_CSS);
    // Tablet override stored separately
    const tablet = (node.responsive as any)?.tablet;
    expect(tablet?.backgroundImage).toBe(tabletCss);
    expect(tablet?.backgroundImage).not.toBe(node.styles?.backgroundImage);
  });
});
