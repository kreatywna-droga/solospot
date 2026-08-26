/**
 * AnimationTriggerContext.ts — PM33 Serializable Trigger Context
 *
 * A fully serializable, plain-data snapshot of the environment needed to
 * evaluate animation triggers. Contains ONLY scalar/boolean/number fields —
 * NO Browser objects (no Event, MouseEvent, HTMLElement, DOMRect,
 * IntersectionObserverEntry), NO functions, NO references to DOM.
 *
 * PM34 will map Browser APIs → this context; builder-core never touches the
 * browser directly.
 */

/**
 * Serializable viewport size (in CSS pixels).
 */
export interface TriggerViewport {
  readonly width: number;
  readonly height: number;
}

/**
 * Serializable trigger evaluation context.
 *
 * All fields are optional so an empty context can be safely created and
 * partial data can be provided incrementally. Defaults are defined by
 * `createTriggerContext`.
 */
export interface AnimationTriggerContext {
  /** Current vertical scroll offset in CSS pixels. */
  readonly scrollY: number;
  /** Current viewport width in CSS pixels. */
  readonly viewportWidth: number;
  /** Current viewport height in CSS pixels. */
  readonly viewportHeight: number;
  /** Whether the target element is currently hovered. */
  readonly isHovered: boolean;
  /** Whether the target element has been clicked. */
  readonly isClicked: boolean;
  /** Visibility ratio of the target within the viewport, in 0..1. */
  readonly visibilityRatio: number;
}

/**
 * Creates a fully-populated context from partial input, applying safe defaults.
 * Guarantees the returned object is complete and serializable.
 */
export function createTriggerContext(
  partial: Partial<AnimationTriggerContext> = {}
): AnimationTriggerContext {
  return {
    scrollY: partial.scrollY ?? 0,
    viewportWidth: partial.viewportWidth ?? 0,
    viewportHeight: partial.viewportHeight ?? 0,
    isHovered: partial.isHovered ?? false,
    isClicked: partial.isClicked ?? false,
    visibilityRatio: clamp01(partial.visibilityRatio ?? 0),
  };
}

function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t));
}
