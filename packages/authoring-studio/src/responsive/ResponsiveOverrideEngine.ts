/**
 * ResponsiveOverrideEngine.ts — Sprint S28 Per-Breakpoint Property Overrides Engine
 *
 * Immutably reads, updates, and removes per-breakpoint node property overrides
 * stored on BuilderDocument nodes (`node.props.responsiveOverrides`).
 *
 * DECISION-044 (SSOT):
 * All responsive overrides are stored directly in node metadata DTOs inside BuilderDocument.
 * Zero duplicate document models are created.
 *
 * NO DOM, NO React, NO requestAnimationFrame, NO Browser API, ZERO Runtime execution.
 */

import type { BuilderDocument, SectionNode } from '../../../builder-core/src/BuilderDocument';
import { touchDocument } from '../../../builder-core/src/BuilderDocument';
import type { BreakpointId, ResponsiveValue } from './ResponsiveValueModel';
import { resolveEffectiveValue, setResponsiveOverride, removeResponsiveOverride } from './ResponsiveValueModel';

export interface NodePropertyOverride {
  readonly width?: number | string;
  readonly height?: number | string;
  readonly x?: number;
  readonly y?: number;
  readonly fontSize?: number;
  readonly lineHeight?: number;
  readonly opacity?: number;
  readonly backgroundColor?: string;
  readonly display?: 'flex' | 'grid' | 'block' | 'none';
  readonly flexDirection?: 'row' | 'column';
  readonly gap?: number;
  readonly padding?: number;
  readonly margin?: number;
  readonly hidden?: boolean;
}

export type ResponsiveNodeOverrides = ResponsiveValue<NodePropertyOverride>;

/**
 * Retrieves responsive overrides dictionary for a target node in BuilderDocument.
 */
export function getNodeResponsiveOverrides(node: SectionNode): ResponsiveNodeOverrides {
  const props = (node.props as Record<string, any>) ?? {};
  return (props.responsiveOverrides as ResponsiveNodeOverrides) ?? {};
}

/**
 * Resolves effective node property for a given breakpoint applying desktop-first fallback rules.
 */
export function resolveEffectiveNodeProperty<K extends keyof NodePropertyOverride>(
  node: SectionNode,
  propertyKey: K,
  targetBreakpointId: BreakpointId,
  fallbackOrder: ReadonlyArray<BreakpointId> = ['desktop', 'laptop', 'tablet', 'mobile', 'mobile_small']
): NodePropertyOverride[K] | undefined {
  const overrides = getNodeResponsiveOverrides(node);
  
  // Search target breakpoint and upwards along fallback chain for specific propertyKey
  const targetIndex = fallbackOrder.indexOf(targetBreakpointId);
  const searchOrder = targetIndex !== -1
    ? fallbackOrder.slice(0, targetIndex + 1).slice().reverse()
    : [targetBreakpointId, 'desktop'];

  for (const bId of searchOrder) {
    const bpOverride = overrides[bId];
    if (bpOverride && bpOverride[propertyKey] !== undefined) {
      return bpOverride[propertyKey] as NodePropertyOverride[K];
    }
  }

  // Fall back to base property on node.props
  const baseProps = (node.props as Record<string, any>) ?? {};
  return baseProps[propertyKey as string];
}

/**
 * Immutably sets a responsive property override on a SectionNode.
 * Returns a new SectionNode instance.
 */
export function setNodeResponsiveOverride(
  node: SectionNode,
  breakpointId: BreakpointId,
  overridePartial: Partial<NodePropertyOverride>
): SectionNode {
  const currentOverrides = getNodeResponsiveOverrides(node);
  const existingForBreakpoint = currentOverrides[breakpointId] ?? {};
  
  const updatedForBreakpoint: NodePropertyOverride = {
    ...existingForBreakpoint,
    ...overridePartial,
  };

  const nextOverrides = setResponsiveOverride(
    currentOverrides,
    breakpointId,
    updatedForBreakpoint
  );

  return {
    ...node,
    props: {
      ...((node.props as Record<string, any>) ?? {}),
      responsiveOverrides: nextOverrides,
    },
  };
}

/**
 * Immutably removes a responsive property override for a target breakpoint from a SectionNode.
 * Returns a new SectionNode instance.
 */
export function removeNodeResponsiveOverride(
  node: SectionNode,
  breakpointId: BreakpointId
): SectionNode {
  const currentOverrides = getNodeResponsiveOverrides(node);
  const nextOverrides = removeResponsiveOverride(currentOverrides, breakpointId);

  return {
    ...node,
    props: {
      ...((node.props as Record<string, any>) ?? {}),
      responsiveOverrides: nextOverrides,
    },
  };
}

/**
 * Helper to update a node inside a BuilderDocument immutably.
 * Applies canonical touchDocument to increment version and set isDirty flag.
 */
export function updateNodeInDocument(
  doc: BuilderDocument,
  updatedNode: SectionNode
): BuilderDocument {
  const updateSections = (sections: ReadonlyArray<SectionNode>): ReadonlyArray<SectionNode> => {
    return sections.map((sec) => {
      if (sec.id === updatedNode.id) {
        return updatedNode;
      }
      if (sec.children && sec.children.length > 0) {
        return {
          ...sec,
          children: updateSections(sec.children as ReadonlyArray<SectionNode>) as any,
        };
      }
      return sec;
    });
  };

  const updatedDoc: BuilderDocument = {
    ...doc,
    pages: doc.pages.map((page) => ({
      ...page,
      sections: updateSections(page.sections as ReadonlyArray<SectionNode>) as any,
    })),
  };

  return touchDocument(updatedDoc);
}
