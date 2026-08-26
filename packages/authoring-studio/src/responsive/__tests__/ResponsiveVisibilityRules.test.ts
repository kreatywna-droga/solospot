/**
 * ResponsiveVisibilityRules.test.ts — Sprint S28
 *
 * Unit tests for per-breakpoint node visibility toggles, hidden overrides,
 * and visibility resolution.
 */

import { describe, it, expect } from 'vitest';
import type { SectionNode } from '../../../../builder-core/src/BuilderDocument';
import {
  isNodeVisibleAtBreakpoint,
  setNodeVisibilityAtBreakpoint,
  clearNodeVisibilityOverride,
} from '../ResponsiveVisibilityRules';

const createTestNode = (id: string, visible: boolean = true): SectionNode => ({
  id,
  type: 'section',
  label: `Node ${id}`,
  order: 1,
  visible,
  locked: false,
  children: [],
  props: {},
});

describe('ResponsiveVisibilityRules', () => {
  it('node is visible by default at all breakpoints when visible is true', () => {
    const node = createTestNode('node-1', true);
    expect(isNodeVisibleAtBreakpoint(node, 'desktop')).toBe(true);
    expect(isNodeVisibleAtBreakpoint(node, 'mobile')).toBe(true);
  });

  it('globally hidden node is hidden across all breakpoints', () => {
    const node = createTestNode('node-1', false);
    expect(isNodeVisibleAtBreakpoint(node, 'desktop')).toBe(false);
    expect(isNodeVisibleAtBreakpoint(node, 'mobile')).toBe(false);
  });

  it('allows hiding node on mobile while remaining visible on desktop', () => {
    let node = createTestNode('node-1', true);
    node = setNodeVisibilityAtBreakpoint(node, 'mobile', false);

    expect(isNodeVisibleAtBreakpoint(node, 'desktop')).toBe(true);
    expect(isNodeVisibleAtBreakpoint(node, 'tablet')).toBe(true);
    expect(isNodeVisibleAtBreakpoint(node, 'mobile')).toBe(false);
  });

  it('clears visibility override restoring parent visibility', () => {
    let node = createTestNode('node-1', true);
    node = setNodeVisibilityAtBreakpoint(node, 'mobile', false);
    expect(isNodeVisibleAtBreakpoint(node, 'mobile')).toBe(false);

    node = clearNodeVisibilityOverride(node, 'mobile');
    expect(isNodeVisibleAtBreakpoint(node, 'mobile')).toBe(true);
  });
});
