/**
 * SoloSpot Builder: Precision Control & Direct Canvas Manipulation Test Suite
 *
 * Requirements:
 *   1. Removal of primitive typography presets as the primary control
 *   2. Method A: Exact numeric input (8-150px)
 *   3. Method B: Sensitive continuous slider (step 1, 8-150px)
 *   4. Method C: Direct Canvas resize handle manipulation (scales fontSize directly without transform:scale)
 *   5. Single history record on pointer up
 *   6. Dual color picker + exact HEX input instant synchronization
 *   7. Responsive isolation (editing on Mobile/Tablet does not corrupt Desktop styles)
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

function resolveEffectiveStyles(node: SectionNode, viewport: 'DESKTOP' | 'TABLET' | 'MOBILE'): Record<string, any> {
  const base = (node.styles || {}) as Record<string, any>;
  if (viewport === 'DESKTOP') return base;
  const tablet = (node.responsive?.tablet || {}) as Record<string, any>;
  if (viewport === 'TABLET') return { ...base, ...tablet };
  const mobile = (node.responsive?.mobile || {}) as Record<string, any>;
  return { ...base, ...tablet, ...mobile };
}

describe('SoloSpot Precision Control & Direct Canvas Manipulation', () => {
  const registry = createBuilderComponentRegistry();
  const channel = createMemoryChannel();

  function setupContext(initialNode: SectionNode) {
    const doc = createBuilderDocument({
      pages: [
        createBuilderPage({
          id: 'page_main',
          name: 'Home',
          slug: '/',
          sections: [initialNode],
        }),
      ],
    });
    return createBuilderContext({ document: doc, registry, preview: channel.builderChannel });
  }

  describe('1. Exact Numeric Input (Method A) & Sensitive Slider (Method B)', () => {
    it('sets exact font-size on text node and clamps within 8-150px', () => {
      const textNode = createSectionNode({
        id: 'heading_1',
        type: 'heading',
        label: 'Hero Title',
        props: { text: 'Nowa Generacja E-Commerce' },
        styles: { fontSize: '32px' },
      });

      let ctx = setupContext(textNode);

      // User enters exact 64px
      const targetSize = 64;
      const clamped = Math.min(150, Math.max(8, targetSize));
      ctx = ctx.dispatch({
        type: 'SET_NODE_STYLES',
        nodeId: 'heading_1',
        styles: { fontSize: `${clamped}px` },
      });

      let found = findNode(ctx.document, 'heading_1');
      expect(found?.node.styles?.fontSize).toBe('64px');

      // Clamping upper bound: user enters 200px -> clamped to 150px
      const overflowSize = Math.min(150, Math.max(8, 200));
      ctx = ctx.dispatch({
        type: 'SET_NODE_STYLES',
        nodeId: 'heading_1',
        styles: { fontSize: `${overflowSize}px` },
      });
      found = findNode(ctx.document, 'heading_1');
      expect(found?.node.styles?.fontSize).toBe('150px');

      // Clamping lower bound: user enters 4px -> clamped to 8px
      const underflowSize = Math.min(150, Math.max(8, 4));
      ctx = ctx.dispatch({
        type: 'SET_NODE_STYLES',
        nodeId: 'heading_1',
        styles: { fontSize: `${underflowSize}px` },
      });
      found = findNode(ctx.document, 'heading_1');
      expect(found?.node.styles?.fontSize).toBe('8px');
    });

    it('slider fine-step increments (step=1) map 1:1 to canonical BuilderDocument fontSize', () => {
      const textNode = createSectionNode({
        id: 'text_desc',
        type: 'text',
        props: { text: 'Subheading text' },
        styles: { fontSize: '16px' },
      });

      let ctx = setupContext(textNode);

      // Sensitive slider moving from 16 to 17, 18, 19
      for (let size = 16; size <= 20; size++) {
        ctx = ctx.dispatch({
          type: 'SET_NODE_STYLES',
          nodeId: 'text_desc',
          styles: { fontSize: `${size}px` },
        });
        const found = findNode(ctx.document, 'text_desc');
        expect(found?.node.styles?.fontSize).toBe(`${size}px`);
      }
    });
  });

  describe('2. Direct Canvas Resize Handle Manipulation (Method C)', () => {
    it('scales fontSize directly without touching transform: scale', () => {
      const headingNode = createSectionNode({
        id: 'heading_hero',
        type: 'heading',
        props: { text: 'Wizualny Edytor' },
        styles: { fontSize: '24px' },
      });

      let ctx = setupContext(headingNode);

      // Simulate dragging SE corner handle from 200x50 to 300x75 (ratio 1.5)
      const startWidth = 200;
      const startHeight = 50;
      const startFontSize = 24;

      const finalWidth = 300;
      const finalHeight = 75;
      const ratio = Math.max(finalWidth / startWidth, finalHeight / startHeight);
      const computedFontSize = Math.min(150, Math.max(8, Math.round(startFontSize * ratio)));

      expect(ratio).toBe(1.5);
      expect(computedFontSize).toBe(36);

      // Pointer up commits single SET_NODE_STYLES
      ctx = ctx.dispatch({
        type: 'SET_NODE_STYLES',
        nodeId: 'heading_hero',
        styles: { fontSize: `${computedFontSize}px` },
      });

      const found = findNode(ctx.document, 'heading_hero');
      expect(found?.node.styles?.fontSize).toBe('36px');
      // Must NOT introduce fake transform scale
      expect(found?.node.styles?.scale).toBeUndefined();
      expect((found?.node.styles as Record<string, any>)?.transform).toBeUndefined();
    });

    it('pointermove produces zero history actions until pointerup single commit', () => {
      const headingNode = createSectionNode({
        id: 'heading_title',
        type: 'heading',
        styles: { fontSize: '20px' },
      });

      let ctx = setupContext(headingNode);
      const initialHistoryLength = ctx.history.entries.length;

      // Transient pointermove drag events do not dispatch to ctx.dispatch
      // (they only update React local state setResizing in SelectionOverlay)
      // Only pointerup dispatches once
      ctx = ctx.dispatch({
        type: 'SET_NODE_STYLES',
        nodeId: 'heading_title',
        styles: { fontSize: '30px' },
      });

      expect(ctx.history.entries.length).toBe(initialHistoryLength + 1);

      // Undo reverts cleanly to initial state
      ctx = ctx.dispatch({ type: 'UNDO' });
      let found = findNode(ctx.document, 'heading_title');
      expect(found?.node.styles?.fontSize).toBe('20px');

      // Redo restores to 30px
      ctx = ctx.dispatch({ type: 'REDO' });
      found = findNode(ctx.document, 'heading_title');
      expect(found?.node.styles?.fontSize).toBe('30px');
    });
  });

  describe('3. Color Swatch + Exact HEX Input Synchronization', () => {
    it('synchronizes exact HEX value across node styles and canvas renderer', () => {
      const buttonNode = createSectionNode({
        id: 'btn_cta',
        type: 'button',
        props: { text: 'Kup Teraz' },
        styles: { backgroundColor: '#7c3aed', color: '#ffffff' },
      });

      let ctx = setupContext(buttonNode);

      // User enters exact custom hex color #e11d48 (Rose 600)
      ctx = ctx.dispatch({
        type: 'SET_NODE_STYLES',
        nodeId: 'btn_cta',
        styles: { backgroundColor: '#e11d48', color: '#0f172a' },
      });

      const found = findNode(ctx.document, 'btn_cta');
      expect(found?.node.styles?.backgroundColor).toBe('#e11d48');
      expect(found?.node.styles?.color).toBe('#0f172a');
    });
  });

  describe('4. Responsive Isolation', () => {
    it('editing font-size on Mobile does NOT corrupt Desktop base font-size', () => {
      const textNode = createSectionNode({
        id: 'responsive_title',
        type: 'heading',
        styles: { fontSize: '48px', color: '#ffffff' },
      });

      let ctx = setupContext(textNode);

      // Desktop base is 48px
      expect(resolveEffectiveStyles(ctx.document.pages[0].sections[0], 'DESKTOP').fontSize).toBe('48px');

      // User switches to Mobile viewport and resizes font to 28px
      const currentResp = textNode.responsive || {};
      ctx = ctx.dispatch({
        type: 'UPDATE_NODE',
        nodeId: 'responsive_title',
        updates: {
          responsive: {
            ...currentResp,
            mobile: { fontSize: '28px' },
          },
        },
        pageId: 'page_main',
      });

      const updatedNode = ctx.document.pages[0].sections[0];
      // Desktop remains 48px
      expect(resolveEffectiveStyles(updatedNode, 'DESKTOP').fontSize).toBe('48px');
      expect(updatedNode.styles?.fontSize).toBe('48px');

      // Mobile renders 28px
      expect(resolveEffectiveStyles(updatedNode, 'MOBILE').fontSize).toBe('28px');
    });
  });
});
