/**
 * Universal Canvas Manipulation + Universal Visual Asset Insertion Test Suite
 *
 * Verifies:
 * 1. Universal Canvas Move: Free dragging on canvas updates translateX & translateY canonically
 * 2. Universal Canvas Resize: Corner/edge resizing updates width/height (and fontSize for text)
 * 3. Universal Visual Asset Insertion: Inserting text, heading, image, video, svg, button into any container
 * 4. Single-Commit History Fidelity: 1 Undo reverts drag, 1 Redo reapplies drag
 * 5. Multi-Breakpoint Responsive Isolation: Responsive styles isolated per viewport
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

describe('Universal Canvas Manipulation & Asset Insertion Suite', () => {
  const createTestEnv = () => {
    const rootSection = createSectionNode({
      id: 'sec_main',
      type: 'section',
      label: 'Main Section',
      styles: { backgroundColor: '#07070e' },
      children: [],
    });

    const doc = createBuilderDocument({
      id: 'doc_universal',
      pages: [createBuilderPage({ id: 'page_1', name: 'Home', slug: '/', sections: [rootSection] })],
    });

    const registry = createBuilderComponentRegistry();
    const ctx = createBuilderContext({
      document: doc,
      registry,
      preview: createMemoryChannel().builderChannel,
    });

    return { ctx, doc };
  };

  it('1. Universal Canvas Move: updates translateX and translateY canonically', () => {
    let { ctx } = createTestEnv();

    // Insert an image node
    const imgNode = createBuilderNode({
      id: 'img_hero',
      type: 'image',
      label: 'Hero Image',
      styles: { width: '400px', height: '260px' },
      props: { src: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30' },
      children: [],
    });

    ctx = ctx.dispatch({
      type: 'INSERT_NODE',
      node: imgNode,
      parentId: 'sec_main',
      pageId: 'page_1',
    });

    // Simulate single-commit pointerup drag gesture: deltaX: +120px, deltaY: -45px
    ctx = ctx.dispatch({
      type: 'SET_NODE_STYLES',
      nodeId: 'img_hero',
      styles: { translateX: '120px', translateY: '-45px' },
    });

    const found = findNode(ctx.document, 'img_hero')!;
    expect(found.node.styles?.translateX).toBe('120px');
    expect(found.node.styles?.translateY).toBe('-45px');
  });

  it('2. Universal Canvas Resize: corner handles update width and height for visual elements', () => {
    let { ctx } = createTestEnv();

    // Insert a video node
    const vidNode = createBuilderNode({
      id: 'vid_promo',
      type: 'video',
      label: 'Promo Video',
      styles: { width: '480px', height: '270px' },
      props: { src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
      children: [],
    });

    ctx = ctx.dispatch({
      type: 'INSERT_NODE',
      node: vidNode,
      parentId: 'sec_main',
      pageId: 'page_1',
    });

    // Simulate resizing corner handle SE (+160px width, +90px height)
    ctx = ctx.dispatch({
      type: 'SET_NODE_STYLES',
      nodeId: 'vid_promo',
      styles: { width: '640px', height: '360px' },
    });

    const found = findNode(ctx.document, 'vid_promo')!;
    expect(found.node.styles?.width).toBe('640px');
    expect(found.node.styles?.height).toBe('360px');
  });

  it('3. Universal Canvas Resize for Text: updates fontSize without scale transform', () => {
    let { ctx } = createTestEnv();

    const textNode = createBuilderNode({
      id: 'txt_title',
      type: 'heading',
      label: 'Title',
      styles: { fontSize: '32px', color: '#ffffff' },
      props: { text: 'Mega Nagłówek' },
      children: [],
    });

    ctx = ctx.dispatch({
      type: 'INSERT_NODE',
      node: textNode,
      parentId: 'sec_main',
      pageId: 'page_1',
    });

    // Resize handle scales fontSize directly
    ctx = ctx.dispatch({
      type: 'SET_NODE_STYLES',
      nodeId: 'txt_title',
      styles: { fontSize: '48px' },
    });

    const found = findNode(ctx.document, 'txt_title')!;
    expect(found.node.styles?.fontSize).toBe('48px');
    // No fake scale transform should be applied - only canonical fontSize scales text
    const stylesObj = found.node.styles as Record<string, unknown> | undefined;
    expect(stylesObj?.transform).toBeUndefined(); // Zero fake scale()
  });

  it('4. Universal Visual Asset Insertion: directly inserts image, video, svg into any container', () => {
    let { ctx } = createTestEnv();

    // Create a container inside section
    const container = createBuilderNode({
      id: 'cont_grid',
      type: 'container',
      label: 'Content Grid',
      styles: { display: 'flex', gap: '20px' },
      children: [],
    });

    ctx = ctx.dispatch({
      type: 'INSERT_NODE',
      node: container,
      parentId: 'sec_main',
      pageId: 'page_1',
    });

    // Insert Image into cont_grid
    const img = createBuilderNode({
      id: 'img_card',
      type: 'image',
      label: 'Card Image',
      parentId: 'cont_grid',
      styles: { width: '300px', height: '200px' },
      props: { src: 'https://images.unsplash.com/photo-test' },
      children: [],
    });
    ctx = ctx.dispatch({ type: 'INSERT_NODE', node: img, parentId: 'cont_grid', pageId: 'page_1' });

    // Insert Video into cont_grid
    const vid = createBuilderNode({
      id: 'vid_card',
      type: 'video',
      label: 'Card Video',
      parentId: 'cont_grid',
      styles: { width: '320px', height: '180px' },
      props: { src: 'https://example.com/video.mp4' },
      children: [],
    });
    ctx = ctx.dispatch({ type: 'INSERT_NODE', node: vid, parentId: 'cont_grid', pageId: 'page_1' });

    // Insert SVG into cont_grid
    const svg = createBuilderNode({
      id: 'svg_card',
      type: 'svg',
      label: 'Card Icon',
      parentId: 'cont_grid',
      styles: { width: '48px', height: '48px', color: '#8b5cf6' },
      props: { svgContent: '<svg viewBox="0 0 24 24"></svg>' },
      children: [],
    });
    ctx = ctx.dispatch({ type: 'INSERT_NODE', node: svg, parentId: 'cont_grid', pageId: 'page_1' });

    const parentCont = findNode(ctx.document, 'cont_grid')!.node;
    expect(parentCont.children).toHaveLength(3);
    expect(parentCont.children!.map(c => c.type)).toEqual(['image', 'video', 'svg']);
    expect(parentCont.children!.map(c => c.id)).toEqual(['img_card', 'vid_card', 'svg_card']);
  });

  it('5. History Fidelity: exactly one commit per move gesture, 1 Undo reverts, 1 Redo restores', () => {
    let { ctx } = createTestEnv();

    const btn = createBuilderNode({
      id: 'btn_cta',
      type: 'button',
      label: 'CTA Button',
      styles: { translateX: '0px', translateY: '0px', width: '200px' },
      props: { text: 'Kup teraz' },
      children: [],
    });

    ctx = ctx.dispatch({
      type: 'INSERT_NODE',
      node: btn,
      parentId: 'sec_main',
      pageId: 'page_1',
    });

    // Single gesture commit on pointerup
    ctx = ctx.dispatch({
      type: 'SET_NODE_STYLES',
      nodeId: 'btn_cta',
      styles: { translateX: '150px', translateY: '80px' },
    });

    expect(findNode(ctx.document, 'btn_cta')!.node.styles?.translateX).toBe('150px');
    expect(findNode(ctx.document, 'btn_cta')!.node.styles?.translateY).toBe('80px');

    // 1 Undo reverts position back to 0px
    ctx = ctx.dispatch({ type: 'UNDO' });
    expect(findNode(ctx.document, 'btn_cta')!.node.styles?.translateX).toBe('0px');
    expect(findNode(ctx.document, 'btn_cta')!.node.styles?.translateY).toBe('0px');

    // 1 Redo reapplies position to 150px, 80px
    ctx = ctx.dispatch({ type: 'REDO' });
    expect(findNode(ctx.document, 'btn_cta')!.node.styles?.translateX).toBe('150px');
    expect(findNode(ctx.document, 'btn_cta')!.node.styles?.translateY).toBe('80px');
  });

  it('6. Responsive Breakpoint Isolation: canvas manipulation on mobile does not alter desktop', () => {
    let { ctx } = createTestEnv();

    const card = createBuilderNode({
      id: 'card_box',
      type: 'container',
      label: 'Card',
      styles: { width: '800px', translateX: '0px' },
      responsive: {},
      children: [],
    });

    ctx = ctx.dispatch({
      type: 'INSERT_NODE',
      node: card,
      parentId: 'sec_main',
      pageId: 'page_1',
    });

    // Mobile manipulation
    ctx = ctx.dispatch({
      type: 'UPDATE_NODE',
      nodeId: 'card_box',
      updates: {
        responsive: {
          mobile: { width: '320px', translateX: '10px' },
        },
      },
      pageId: 'page_1',
    });

    const found = findNode(ctx.document, 'card_box')!.node;
    expect(found.styles?.width).toBe('800px');
    expect(found.styles?.translateX).toBe('0px');
    expect((found.responsive as any)?.mobile?.width).toBe('320px');
    expect((found.responsive as any)?.mobile?.translateX).toBe('10px');
  });
});
