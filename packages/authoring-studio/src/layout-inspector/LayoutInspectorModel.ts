/**
 * LayoutInspectorModel.ts — Sprint S30 Layout Inspector Read Model
 *
 * Provides headless read operations for finding SectionNodes and reading
 * layout configuration & effective per-breakpoint views from BuilderDocument.
 *
 * NO DOM, NO React, NO requestAnimationFrame, NO Browser API, ZERO Runtime execution.
 */

import type { BuilderDocument, SectionNode } from '../../../builder-core/src/BuilderDocument';
import { readLayoutStyle, readLayoutConstraints } from '../layout/LayoutCommands';
import {
  buildEffectiveNodeLayout,
  type EffectiveNodeLayout,
} from '../layout/ResponsiveLayoutAdapter';
import type { LayoutStyle } from '../layout/LayoutModel';
import type { LayoutConstraints } from '../layout/ConstraintModel';
import type { BreakpointId } from '../responsive/ResponsiveValueModel';

export interface LayoutInspectorState {
  readonly node: SectionNode;
  readonly style: LayoutStyle | undefined;
  readonly constraints: LayoutConstraints | undefined;
  readonly effective: EffectiveNodeLayout;
  readonly fieldValues: Record<string, unknown>;
}

/**
 * Recursively locates a SectionNode by ID in BuilderDocument pages.
 */
export function findLayoutNode(doc: BuilderDocument, nodeId: string): SectionNode | undefined {
  for (const page of doc.pages) {
    const found = searchSections(page.sections as ReadonlyArray<SectionNode>, nodeId);
    if (found) {
      return found;
    }
  }
  return undefined;
}

function searchSections(
  sections: ReadonlyArray<SectionNode>,
  nodeId: string
): SectionNode | undefined {
  for (const sec of sections) {
    if (sec.id === nodeId) {
      return sec;
    }
    if (sec.children && sec.children.length > 0) {
      const child = searchSections(sec.children as ReadonlyArray<SectionNode>, nodeId);
      if (child) {
        return child;
      }
    }
  }
  return undefined;
}

/**
 * Reads the layout inspector state for a node in BuilderDocument at a given breakpoint.
 */
export function readLayoutInspectorState(
  doc: BuilderDocument,
  nodeId: string,
  breakpointId: BreakpointId
): LayoutInspectorState | undefined {
  const node = findLayoutNode(doc, nodeId);
  if (!node) {
    return undefined;
  }

  const style = readLayoutStyle(node);
  const constraints = readLayoutConstraints(node);
  const effective = buildEffectiveNodeLayout(node, breakpointId);

  // Map field values per catalog fieldId
  const fieldValues: Record<string, unknown> = {
    'layout.mode': style?.mode,
    'layout.direction': style?.direction,
    'layout.gap': style?.gap,
    'layout.paddingTop': style?.paddingTop,
    'layout.paddingRight': style?.paddingRight,
    'layout.paddingBottom': style?.paddingBottom,
    'layout.paddingLeft': style?.paddingLeft,
    'layout.alignItems': style?.alignItems,
    'layout.justifyContent': style?.justifyContent,
    'layout.wrap': style?.wrap,
    'layout.left': constraints?.left,
    'layout.right': constraints?.right,
    'layout.top': constraints?.top,
    'layout.bottom': constraints?.bottom,
    'layout.centerX': constraints?.centerX,
    'layout.centerY': constraints?.centerY,
    'layout.width': constraints?.width,
    'layout.height': constraints?.height,
    'layout.minWidth': constraints?.minWidth,
    'layout.maxWidth': constraints?.maxWidth,
    'layout.minHeight': constraints?.minHeight,
    'layout.maxHeight': constraints?.maxHeight,
    'layout.aspectRatio': constraints?.aspectRatio,
    'layout.sizingWidth': constraints?.sizing?.width,
    'layout.sizingHeight': constraints?.sizing?.height,
  };

  return {
    node,
    style,
    constraints,
    effective,
    fieldValues,
  };
}