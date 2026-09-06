/**
 * section-magnets-and-live-resize.test.ts
 *
 * Comprehensive regression tests for:
 *   PART A: MAGNETIC SECTION SNAP
 *   PART B: REAL-TIME LIVE RESIZE
 */

import { describe, it, expect } from 'vitest';
import {
  computeSectionSnap,
  SectionBounds,
  createBuilderContext,
  createBuilderDocument,
  createBuilderPage,
  createSectionNode,
  createBuilderNode,
  createBuilderComponentRegistry,
  createMemoryChannel,
} from '../index';

describe('PART A: Magnetic Section Snap Engine', () => {
  const sections: SectionBounds[] = [
    {
      id: 'sec-hero',
      label: 'Hero',
      index: 0,
      left: 0,
      top: 0,
      bottom: 400,
      height: 400,
      right: 1200,
      width: 1200,
    },
    {
      id: 'sec-features',
      label: 'Features',
      index: 1,
      left: 0,
      top: 400,
      bottom: 750,
      height: 350,
      right: 1200,
      width: 1200,
    },
    {
      id: 'sec-pricing',
      label: 'Pricing',
      index: 2,
      left: 0,
      top: 750,
      bottom: 1150,
      height: 400,
      right: 1200,
      width: 1200,
    },
  ];

  it('1. Snap top -> previous section bottom (B.top === A.bottom)', () => {
    // Dragging sec-features near Hero bottom (400px)
    // naturalTop is 400, currentTop is dragged slightly to 408px (within 16px threshold)
    const result = computeSectionSnap({
      draggingSectionId: 'sec-features',
      currentLeft: 0,
      currentTop: 408,
      width: 1200,
      height: 350,
      naturalTop: 400,
      naturalLeft: 0,
      sections,
      pageWidth: 1200,
      zoom: 1.0,
      threshold: 16,
    });

    expect(result.snapped).toBe(true);
    expect(result.snappedY).toBe(true);
    expect(result.targetTop).toBe(400); // Exact match to Hero.bottom
    expect(result.curTy).toBe(0); // Restored to zero displacement
    expect(result.snapTarget).toBe('PREVIOUS_BOTTOM');
    expect(result.glowEdge).toBe('top');
    expect(result.label).toContain('Hero');
  });

  it('2. Snap bottom -> next section top (B.bottom === C.top)', () => {
    // sec-features height = 350. Next section (Pricing) top = 750.
    // If features top is dragged to 392 (within 16px of 400), bottom is 742 (within 16px of 750)
    const result = computeSectionSnap({
      draggingSectionId: 'sec-features',
      currentLeft: 0,
      currentTop: 394,
      width: 1200,
      height: 350,
      naturalTop: 400,
      naturalLeft: 0,
      sections,
      pageWidth: 1200,
      zoom: 1.0,
      threshold: 16,
    });

    expect(result.snapped).toBe(true);
    expect(result.snappedY).toBe(true);
    // Snapped so that top = 400, which makes bottom = 750 = Pricing.top
    expect(result.targetTop).toBe(400);
    expect(result.curTy).toBe(0);
  });

  it('3. Snap left -> page left (0px) without horizontal offset drift', () => {
    // Dragging slightly off-center (e.g. 7px to the right)
    const result = computeSectionSnap({
      draggingSectionId: 'sec-hero',
      currentLeft: 7,
      currentTop: 0,
      width: 1200,
      height: 400,
      naturalTop: 0,
      naturalLeft: 0,
      sections,
      pageWidth: 1200,
      zoom: 1.0,
      threshold: 16,
    });

    expect(result.snapped).toBe(true);
    expect(result.snappedX).toBe(true);
    expect(result.targetLeft).toBe(0); // Snapped to exact 0
    expect(result.curTx).toBe(0);
    expect(result.glowEdge).toBe('left');
  });

  it('4. Snap right -> page right (pageWidth)', () => {
    // Current left is dragged slightly left: left = -10px (width 1200, right = 1190, pageWidth = 1200)
    const result = computeSectionSnap({
      draggingSectionId: 'sec-hero',
      currentLeft: -10,
      currentTop: 0,
      width: 1200,
      height: 400,
      naturalTop: 0,
      naturalLeft: 0,
      sections,
      pageWidth: 1200,
      zoom: 1.0,
      threshold: 16,
    });

    expect(result.snapped).toBe(true);
    expect(result.snappedX).toBe(true);
    // Snapped to page right: targetLeft = 1200 - 1200 = 0
    expect(result.targetLeft).toBe(0);
    expect(result.curTx).toBe(0);
  });

  it('5. Zoom-aware snap threshold consistency (50%, 100%, 200%)', () => {
    // Screen threshold = 16px
    // At zoom 0.5 (50%), canvas threshold is 16 / 0.5 = 32px
    const result50 = computeSectionSnap({
      draggingSectionId: 'sec-features',
      currentLeft: 0,
      currentTop: 425, // 25px away — within 32px canvas threshold
      width: 1200,
      height: 350,
      naturalTop: 400,
      naturalLeft: 0,
      sections,
      pageWidth: 1200,
      zoom: 0.5,
      threshold: 16,
    });
    expect(result50.snappedY).toBe(true);
    expect(result50.targetTop).toBe(400);

    // At zoom 2.0 (200%), canvas threshold is 16 / 2.0 = 8px
    // 25px away is OUTSIDE threshold
    const result200Outside = computeSectionSnap({
      draggingSectionId: 'sec-features',
      currentLeft: 0,
      currentTop: 425,
      width: 1200,
      height: 350,
      naturalTop: 400,
      naturalLeft: 0,
      sections,
      pageWidth: 1200,
      zoom: 2.0,
      threshold: 16,
    });
    expect(result200Outside.snappedY).toBe(false);

    // At zoom 2.0, 6px away is WITHIN threshold (8px)
    const result200Inside = computeSectionSnap({
      draggingSectionId: 'sec-features',
      currentLeft: 0,
      currentTop: 406,
      width: 1200,
      height: 350,
      naturalTop: 400,
      naturalLeft: 0,
      sections,
      pageWidth: 1200,
      zoom: 2.0,
      threshold: 16,
    });
    expect(result200Inside.snappedY).toBe(true);
    expect(result200Inside.targetTop).toBe(400);
  });

  it('6. Cross-section snap for reordering (dragging section past another)', () => {
    // Dragging sec-hero down near sec-features bottom (750px)
    const result = computeSectionSnap({
      draggingSectionId: 'sec-hero',
      currentLeft: 0,
      currentTop: 755,
      width: 1200,
      height: 400,
      naturalTop: 0,
      naturalLeft: 0,
      sections,
      pageWidth: 1200,
      zoom: 1.0,
      threshold: 16,
    });

    expect(result.snappedY).toBe(true);
    expect(result.snapTarget).toBe('REORDER_BELOW');
    expect(result.targetTop).toBe(750); // features.bottom
    expect(result.reorderTargetIndex).toBe(1);
    expect(result.label).toContain('WSTAW ZA');
  });

  it('7. Section Reflow: perfect sequential flow without overlap', () => {
    // When sections are in normal flow, bottom of section N equals top of section N+1
    for (let i = 0; i < sections.length - 1; i++) {
      expect(sections[i].bottom).toBe(sections[i + 1].top);
    }
  });
});

describe('PART B: Real-Time Live Resize & Single Commit History', () => {
  const setupEnv = (nodeConfig: any) => {
    const rootSection = createSectionNode({
      id: 'sec_test',
      type: 'section',
      label: 'Test Section',
      styles: { height: '300px', minHeight: '300px' },
      children: nodeConfig ? [createBuilderNode(nodeConfig)] : [],
    });

    const doc = createBuilderDocument({
      id: 'doc_test',
      pages: [createBuilderPage({ id: 'page_1', name: 'Home', slug: '/', sections: [rootSection] })],
    });

    const registry = createBuilderComponentRegistry();
    const preview = createMemoryChannel().builderChannel;

    return createBuilderContext({ document: doc, registry, preview });
  };

  it('1. Text node: Width resize vs Font Size resize separation', () => {
    let ctx = setupEnv({
      id: 'text-1',
      type: 'text',
      label: 'Nagłówek',
      styles: { width: '300px', fontSize: '24px' },
      props: { content: 'Witaj' },
      children: [],
    });

    // Dragging East (E) handle: modifies width, does not change font size
    ctx = ctx.dispatch({
      type: 'SET_NODE_STYLES',
      nodeId: 'text-1',
      styles: { width: '450px' },
    });

    const found1 = ctx.document.pages[0].sections[0].children[0];
    expect(found1.styles?.width).toBe('450px');
    expect(found1.styles?.fontSize).toBe('24px'); // Preserved!

    // Dragging South (S) handle: modifies font size, does not change width
    ctx = ctx.dispatch({
      type: 'SET_NODE_STYLES',
      nodeId: 'text-1',
      styles: { fontSize: '36px' },
    });

    const found2 = ctx.document.pages[0].sections[0].children[0];
    expect(found2.styles?.width).toBe('450px'); // Preserved!
    expect(found2.styles?.fontSize).toBe('36px');
  });

  it('2. Image & Video live resize updates width and height in document', () => {
    let ctx = setupEnv({
      id: 'img-1',
      type: 'image',
      label: 'Obraz',
      styles: { width: '200px', height: '150px' },
      props: { src: 'test.jpg' },
      children: [],
    });

    ctx = ctx.dispatch({
      type: 'SET_NODE_STYLES',
      nodeId: 'img-1',
      styles: { width: '400px', height: '300px' },
    });

    const imgNode = ctx.document.pages[0].sections[0].children[0];
    expect(imgNode.styles?.width).toBe('400px');
    expect(imgNode.styles?.height).toBe('300px');
  });

  it('3. Section live resize updates height and minHeight in document', () => {
    let ctx = setupEnv(null);

    ctx = ctx.dispatch({
      type: 'SET_NODE_STYLES',
      nodeId: 'sec_test',
      styles: { height: '550px', minHeight: '550px' },
    });

    const sec = ctx.document.pages[0].sections[0];
    expect(sec.styles?.height).toBe('550px');
    expect(sec.styles?.minHeight).toBe('550px');
  });

  it('4. Single-commit history fidelity: 1 Undo reverts resize, 1 Redo restores resize', () => {
    let ctx = setupEnv({
      id: 'btn-1',
      type: 'button',
      label: 'Przycisk',
      styles: { width: '120px', height: '44px' },
      props: { text: 'Kliknij' },
      children: [],
    });

    const initialHistoryLength = ctx.history.entries.length;

    // Single commit on pointerup
    ctx = ctx.dispatch({
      type: 'SET_NODE_STYLES',
      nodeId: 'btn-1',
      styles: { width: '220px', height: '54px' },
    });

    expect(ctx.history.entries.length).toBe(initialHistoryLength + 1);
    expect(ctx.document.pages[0].sections[0].children[0].styles?.width).toBe('220px');

    // 1 UNDO reverts to 120px
    ctx = ctx.dispatch({ type: 'UNDO' });
    expect(ctx.document.pages[0].sections[0].children[0].styles?.width).toBe('120px');

    // 1 REDO restores 220px
    ctx = ctx.dispatch({ type: 'REDO' });
    expect(ctx.document.pages[0].sections[0].children[0].styles?.width).toBe('220px');
  });

  it('5. Universal live resize: Resizing element commits width and height cleanly without breaking parent flex layout', () => {
    let ctx = setupEnv({
      id: 'btn-cta',
      type: 'button',
      label: 'Rozpocznij Teraz',
      styles: { width: '160px', height: '44px' },
      props: { text: 'Rozpocznij Teraz' },
      children: [],
    });

    const newWidth = 268;
    const newHeight = 135;

    ctx = ctx.dispatch({
      type: 'SET_NODE_STYLES',
      nodeId: 'btn-cta',
      styles: {
        width: `${newWidth}px`,
        height: `${newHeight}px`,
      },
    });

    const btn = ctx.document.pages[0].sections[0].children[0];
    expect(btn.styles?.width).toBe('268px');
    expect(btn.styles?.height).toBe('135px');
    // Ensure clean styling without artificial translateX/translateY offset pollution
    expect(btn.styles?.translateX).toBeUndefined();
    expect(btn.styles?.translateY).toBeUndefined();
  });

  it('6. Universal live resize: Multi-step resize history fidelity and state rollback', () => {
    let ctx = setupEnv({
      id: 'card-1',
      type: 'container',
      label: 'Card',
      styles: { width: '300px', height: '200px' },
      props: {},
      children: [],
    });

    ctx = ctx.dispatch({
      type: 'SET_NODE_STYLES',
      nodeId: 'card-1',
      styles: {
        width: '450px',
        height: '320px',
      },
    });

    const card = ctx.document.pages[0].sections[0].children[0];
    expect(card.styles?.width).toBe('450px');
    expect(card.styles?.height).toBe('320px');

    // Undo reverts back to 300px x 200px
    ctx = ctx.dispatch({ type: 'UNDO' });
    const reverted = ctx.document.pages[0].sections[0].children[0];
    expect(reverted.styles?.width).toBe('300px');
    expect(reverted.styles?.height).toBe('200px');
  });
});
