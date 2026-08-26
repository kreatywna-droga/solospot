/**
 * ResponsiveValueModel.ts — Sprint S28 Responsive Value & Breakpoint Models
 *
 * Defines Breakpoint DTOs, ResponsiveValue<T> generic container, fallback chain models,
 * and cascading value resolution logic for multi-device authoring.
 *
 * NO DOM, NO React, NO requestAnimationFrame, NO Browser API, ZERO Runtime execution.
 */

export type BreakpointId = 'desktop' | 'laptop' | 'tablet' | 'mobile' | 'mobile_small' | string;

export interface Breakpoint {
  readonly id: BreakpointId;
  readonly name: string;
  readonly minWidthPx: number;
  readonly maxWidthPx?: number;
  readonly isDefault: boolean;
  readonly icon?: string;
}

export type ResponsiveValue<T> = Readonly<Record<string, T | undefined>>;

export interface FallbackChain {
  readonly targetBreakpointId: BreakpointId;
  readonly fallbackOrder: ReadonlyArray<BreakpointId>;
}

/**
 * Standard Desktop-First fallback order: desktop (base) -> laptop -> tablet -> mobile -> mobile_small
 */
export const DEFAULT_FALLBACK_ORDER: ReadonlyArray<BreakpointId> = [
  'desktop',
  'laptop',
  'tablet',
  'mobile',
  'mobile_small',
];

/**
 * Resolves the effective value for a target breakpoint following desktop-first cascading fallback rules.
 *
 * @param values Object containing per-breakpoint overrides
 * @param targetBreakpointId Desired breakpoint to resolve for
 * @param fallbackOrder Order of fallback precedence (defaults to desktop-first)
 */
export function resolveEffectiveValue<T>(
  values: ResponsiveValue<T> | undefined,
  targetBreakpointId: BreakpointId,
  fallbackOrder: ReadonlyArray<BreakpointId> = DEFAULT_FALLBACK_ORDER
): T | undefined {
  if (!values) {
    return undefined;
  }

  // 1. Direct hit on target breakpoint
  if (values[targetBreakpointId] !== undefined) {
    return values[targetBreakpointId];
  }

  // 2. Cascade down/up the fallback chain
  const targetIndex = fallbackOrder.indexOf(targetBreakpointId);
  if (targetIndex !== -1) {
    // Search upwards towards base (desktop)
    for (let i = targetIndex - 1; i >= 0; i--) {
      const bId = fallbackOrder[i];
      if (values[bId] !== undefined) {
        return values[bId];
      }
    }
  }

  // 3. Fallback to desktop base if not found in chain
  return values['desktop'];
}

/**
 * Helper to construct an immutable ResponsiveValue container.
 */
export function createResponsiveValue<T>(
  baseDesktopValue: T,
  overrides?: Partial<Record<BreakpointId, T>>
): ResponsiveValue<T> {
  return {
    desktop: baseDesktopValue,
    ...overrides,
  };
}

/**
 * Merges a new breakpoint override into an existing ResponsiveValue container.
 */
export function setResponsiveOverride<T>(
  existing: ResponsiveValue<T> | undefined,
  breakpointId: BreakpointId,
  value: T
): ResponsiveValue<T> {
  return {
    ...(existing ?? {}),
    [breakpointId]: value,
  };
}

/**
 * Removes a breakpoint override from a ResponsiveValue container.
 */
export function removeResponsiveOverride<T>(
  existing: ResponsiveValue<T> | undefined,
  breakpointId: BreakpointId
): ResponsiveValue<T> {
  if (!existing) {
    return {};
  }

  const copy = { ...existing };
  delete copy[breakpointId];
  return copy;
}
