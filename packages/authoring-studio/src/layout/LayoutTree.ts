/**
 * LayoutTree.ts — Sprint S29 Recursive Whole-Document Layout Resolution
 *
 * Resolves the effective layout of a full BuilderDocument for a numeric viewport width:
 *   BuilderDocument → S28 breakpoint resolution → effective layout per node
 *   → ConstraintResolver / AutoLayoutEngine → immutable ResolvedLayoutNode tree.
 *
 * Two deterministic passes:
 *   1. measureSubtreeIntrinsic — bottom-up intrinsic sizes (explicit numbers only).
 *   2. top-down resolution — page → sections → nested children.
 *
 * NO DOM, NO React, NO requestAnimationFrame, NO Browser API, ZERO Runtime execution.
 */

import type { BuilderDocument, SectionNode } from '../../../builder-core/src/BuilderDocument';
import { BreakpointRegistry } from '../responsive/BreakpointRegistry';
import type { BreakpointId } from '../responsive/ResponsiveValueModel';
import {
  DEFAULT_LAYOUT_STYLE,
  PAGE_DEFAULT_HEIGHT,
  createLayoutSize,
  type LayoutRect,
  type LayoutSize,
  type LayoutStyle,
} from './LayoutModel';
import { numericLength } from './ConstraintModel';
import {
  layoutChildren,
  type ChildLayoutInput,
  type ResolvedChildRect,
} from './AutoLayoutEngine';
import { buildEffectiveNodeLayout } from './ResponsiveLayoutAdapter';

export interface ResolvedLayoutNode {
  readonly nodeId: string;
  readonly nodeType: string;
  readonly label: string;
  readonly rect: LayoutRect;
  readonly children: ReadonlyArray<ResolvedLayoutNode>;
  readonly id?: string;
  readonly type?: string;
}

export interface ResolvedPage {
  readonly pageId: string;
  readonly name: string;
  readonly rect: LayoutRect;
  readonly sections: ReadonlyArray<ResolvedLayoutNode>;
}

export interface LayoutResolution {
  readonly viewportWidthPx: number;
  readonly breakpointId: BreakpointId;
  readonly pages: ReadonlyArray<ResolvedPage>;
}

export type ResolvedLayoutTree = LayoutResolution;

/**
 * Bottom-up intrinsic measurement of a subtree.
 *
 * Explicit numeric sizes only — percentage lengths and unresolved 'fill' sizes count
 * as 0 (deterministic, documented). Container nodes add padding + children along their
 * layout direction.
 */
export function measureSubtreeIntrinsic(node: SectionNode, breakpointId: BreakpointId): LayoutSize {
  const effective = buildEffectiveNodeLayout(node, breakpointId);
  const visibleChildren = node.children.filter(
    (child) => !buildEffectiveNodeLayout(child, breakpointId).excluded
  );

  if (visibleChildren.length === 0) {
    return createLayoutSize({
      width: numericLength(effective.constraints.width) ?? 0,
      height: numericLength(effective.constraints.height) ?? 0,
    });
  }

  const childSizes = visibleChildren.map((child) => measureSubtreeIntrinsic(child, breakpointId));
  const gap = effective.style.gap;
  const pad = {
    top: effective.style.paddingTop,
    right: effective.style.paddingRight,
    bottom: effective.style.paddingBottom,
    left: effective.style.paddingLeft,
  };

  if (effective.style.direction === 'horizontal') {
    const contentWidth = childSizes.reduce((sum, s) => sum + s.width, 0) + gap * Math.max(0, childSizes.length - 1);
    const contentHeight = childSizes.reduce((max, s) => Math.max(max, s.height), 0);
    return createLayoutSize({
      width: pad.left + contentWidth + pad.right,
      height: pad.top + contentHeight + pad.bottom,
    });
  }

  const contentWidth = childSizes.reduce((max, s) => Math.max(max, s.width), 0);
  const contentHeight = childSizes.reduce((sum, s) => sum + s.height, 0) + gap * Math.max(0, childSizes.length - 1);
  return createLayoutSize({
    width: pad.left + contentWidth + pad.right,
    height: pad.top + contentHeight + pad.bottom,
  });
}

/**
 * Resolves the effective layout tree of a BuilderDocument for a viewport width.
 */
export function resolveLayout(document: BuilderDocument, viewportWidthPx: number): LayoutResolution {
  const registry = new BreakpointRegistry();
  const breakpointId = registry.resolveBreakpointForWidth(viewportWidthPx);
  const breakpoint = registry.getBreakpoint(breakpointId) ?? registry.getBreakpoint('desktop')!;
  const pageWidth = breakpoint.minWidthPx;

  const pages: ResolvedPage[] = document.pages.map((page) => {
    const pageRect: LayoutRect = {
      x: 0,
      y: 0,
      width: pageWidth,
      height: PAGE_DEFAULT_HEIGHT,
    };

    const sections = resolveSections(page.sections as ReadonlyArray<SectionNode>, pageRect, breakpointId);

    return {
      pageId: page.id,
      name: page.name,
      rect: pageRect,
      sections,
    };
  });

  return {
    viewportWidthPx,
    breakpointId,
    pages,
  };
}

function resolveSections(
  sections: ReadonlyArray<SectionNode>,
  parentRect: LayoutRect,
  breakpointId: BreakpointId,
  styleOverride?: LayoutStyle
): ReadonlyArray<ResolvedLayoutNode> {
  const effective = sections.map((section) => ({
    node: section,
    effective: buildEffectiveNodeLayout(section, breakpointId),
  }));
  const visible = effective.filter((entry) => !entry.effective.excluded);

  const inputs: ChildLayoutInput[] = visible.map((entry) => ({
    nodeId: entry.node.id,
    intrinsic: measureSubtreeIntrinsic(entry.node, breakpointId),
    constraints: entry.effective.constraints,
  }));

  const placed: ResolvedChildRect[] = layoutChildren({
    containerRect: parentRect,
    style: styleOverride ?? {
      ...DEFAULT_LAYOUT_STYLE,
      direction: 'vertical',
      alignItems: 'start',
      justifyContent: 'start',
    },
    children: inputs,
  });

  const placedById = new Map<string, LayoutRect>();
  for (const item of placed) {
    placedById.set(item.nodeId, item.rect);
  }

  return effective.map((entry) => {
    if (entry.effective.excluded) {
      return {
        nodeId: entry.node.id,
        id: entry.node.id,
        nodeType: entry.node.type,
        type: entry.node.type,
        label: entry.node.label,
        rect: { x: parentRect.x, y: parentRect.y, width: 0, height: 0 },
        children: [],
      };
    }
    const rect = placedById.get(entry.node.id) ?? parentRect;
    return resolveSection(entry.node, rect, breakpointId);
  });
}

function resolveSection(
  node: SectionNode,
  rect: LayoutRect,
  breakpointId: BreakpointId
): ResolvedLayoutNode {
  const effective = buildEffectiveNodeLayout(node, breakpointId);

  const children: ReadonlyArray<ResolvedLayoutNode> = resolveSections(
    node.children as ReadonlyArray<SectionNode>,
    rect,
    breakpointId,
    effective.style
  );

  return {
    nodeId: node.id,
    id: node.id,
    nodeType: node.type,
    type: node.type,
    label: node.label,
    rect,
    children,
  };
}