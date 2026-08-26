/**
 * WidgetShared — Sprint 7.1 Inspector 2.0 UI Layer
 *
 * Shared, presentation-only constants and helpers for widgets.
 * No business logic, no registry, no runtime, no builder-state imports.
 *
 * @agent Agent 3 — Supporting Implementation Engineer
 * @status READY FOR INTEGRATION BY AGENT 1
 */

// ---------------------------------------------------------------------------
// Shared Tailwind class fragments (dark theme, violet accent)
// ---------------------------------------------------------------------------

/** Base input styling for text-like inputs. */
export const inputBaseClass =
  'w-full bg-white/5 border rounded-lg px-3 py-2 text-sm text-white ' +
  'placeholder-slate-600 focus:outline-none focus:ring-1 transition-all ' +
  'border-white/10 focus:border-violet-500/50 focus:ring-violet-500/30';

/** Label styling for all widgets. */
export const labelClass =
  'block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5';

/** Inline label styling (used by toggle widgets). */
export const inlineLabelClass =
  'text-[11px] font-semibold text-slate-500 uppercase tracking-wider';

/** Description text styling. */
export const descriptionClass = 'text-[11px] text-slate-600 mt-1';

/** Error text styling. */
export const errorClass = 'text-[11px] text-red-400 mt-1';

/**
 * Coerce an arbitrary widget value into a string for display.
 * Presentation-only helper — never mutates state.
 */
export function toDisplayString(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

/**
 * Coerce an arbitrary widget value into a number for display.
 * Presentation-only helper — never mutates state.
 */
export function toDisplayNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

/**
 * Coerce an arbitrary widget value into a boolean for display.
 * Presentation-only helper — never mutates state.
 */
export function toDisplayBoolean(value: unknown): boolean {
  return Boolean(value);
}
