/**
 * ResponsiveOverrideEngine.test.ts — Sprint S28
 *
 * Unit tests for reading, writing, clearing, and cascading node property overrides
 * stored immutably on BuilderDocument nodes.
 */

import { describe, it, expect } from 'vitest';
import type { SectionNode } from '../../../../builder-core/src/BuilderDocument';
import {
  getNodeResponsiveOverrides,
  resolveEffectiveNodeProperty,
  setNodeResponsiveOverride,
  removeNodeResponsiveOverride,
} from '../ResponsiveOverrideEngine';

const createTestNode = (id: string, baseProps: Record<string, any> = {}): SectionNode => ({
  id,
  type: 'section',
  label: `Node ${id}`,
  order: 1,
  visible: true,
  locked: false,
  children: [],
  props: {
    width: 1200,
    fontSize: 24,
    ...baseProps,
  },
});

describe('ResponsiveOverrideEngine', () => {
  it('returns empty overrides dictionary for unconfigured node', () => {
    const node = createTestNode('node-1');
    expect(getNodeResponsiveOverrides(node)).toEqual({});
  });

  it('resolves base node property when no responsive override is set', () => {
    const node = createTestNode('node-1', { width: 1000 });
    expect(resolveEffectiveNodeProperty(node, 'width', 'desktop')).toBe(1000);
    expect(resolveEffectiveNodeProperty(node, 'width', 'mobile')).toBe(1000);
  });

  it('immutably sets per-breakpoint property overrides and resolves effective value', () => {
    let node = createTestNode('node-1', { width: 1200, fontSize: 24 });
    node = setNodeResponsiveOverride(node, 'tablet', { width: 768, fontSize: 20 });
    node = setNodeResponsiveOverride(node, 'mobile', { width: 375, fontSize: 16 });

    expect(resolveEffectiveNodeProperty(node, 'width', 'desktop')).toBe(1200);
    expect(resolveEffectiveNodeProperty(node, 'width', 'tablet')).toBe(768);
    expect(resolveEffectiveNodeProperty(node, 'width', 'mobile')).toBe(375);

    expect(resolveEffectiveNodeProperty(node, 'fontSize', 'desktop')).toBe(24);
    expect(resolveEffectiveNodeProperty(node, 'fontSize', 'mobile')).toBe(16);
  });

  it('immutably removes per-breakpoint property override', () => {
    let node = createTestNode('node-1', { fontSize: 24 });
    node = setNodeResponsiveOverride(node, 'mobile', { fontSize: 16 });
    expect(resolveEffectiveNodeProperty(node, 'fontSize', 'mobile')).toBe(16);

    node = removeNodeResponsiveOverride(node, 'mobile');
    expect(resolveEffectiveNodeProperty(node, 'fontSize', 'mobile')).toBe(24);
  });
});
