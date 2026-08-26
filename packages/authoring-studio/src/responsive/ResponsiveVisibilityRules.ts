/**
 * ResponsiveVisibilityRules.ts — Sprint S28 Responsive Visibility Engine
 *
 * Manages per-breakpoint element visibility rules (hide on mobile, hide on tablet, etc.).
 * Evaluates effective node visibility for targeted BreakpointIds.
 *
 * NO DOM, NO React, NO requestAnimationFrame, NO Browser API, ZERO Runtime execution.
 */

import type { SectionNode } from '../../../builder-core/src/BuilderDocument';
import type { BreakpointId } from './ResponsiveValueModel';
import { resolveEffectiveNodeProperty, setNodeResponsiveOverride, removeNodeResponsiveOverride } from './ResponsiveOverrideEngine';

export interface ResponsiveVisibilityConfig {
  readonly hiddenBreakpoints: ReadonlyArray<BreakpointId>;
}

/**
 * Checks whether a node is visible at a given target breakpoint.
 * Respects both node.visible property and per-breakpoint hidden override.
 */
export function isNodeVisibleAtBreakpoint(
  node: SectionNode,
  targetBreakpointId: BreakpointId,
  fallbackOrder?: ReadonlyArray<BreakpointId>
): boolean {
  // 1. Check if node is globally hidden on base props
  if (node.visible === false) {
    return false;
  }

  // 2. Check per-breakpoint hidden override
  const hiddenOverride = resolveEffectiveNodeProperty(
    node,
    'hidden',
    targetBreakpointId,
    fallbackOrder ?? ['desktop', 'laptop', 'tablet', 'mobile', 'mobile_small']
  );

  if (hiddenOverride === true) {
    return false;
  }

  return true;
}

/**
 * Sets node visibility state at a target breakpoint.
 * Returns a new SectionNode instance.
 */
export function setNodeVisibilityAtBreakpoint(
  node: SectionNode,
  breakpointId: BreakpointId,
  isVisible: boolean
): SectionNode {
  return setNodeResponsiveOverride(node, breakpointId, {
    hidden: !isVisible,
  });
}

/**
 * Clears visibility override for a target breakpoint, restoring fallback visibility.
 */
export function clearNodeVisibilityOverride(
  node: SectionNode,
  breakpointId: BreakpointId
): SectionNode {
  return removeNodeResponsiveOverride(node, breakpointId);
}
