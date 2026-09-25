/**
 * TargetedEditResolver.ts — GATE v8.0 — THIN ADAPTER over the intent pipeline.
 *
 * The old resolver was 600 lines of hand-rolled if/else that duplicated the
 * keyword vocabulary and executed `text = "boki"` for "rozciągnij tytuł na
 * boki". It is now a façade:
 *
 *   prompt ──► IntentParser      (classify: intent + operation + value + conf)
 *          ──► IntentCompiler    (execute mapping: ONE intent → ONE tool call)
 *          ──► TargetedEditResolution (goes through verification before done)
 *
 * Both Main Chat (HacpBridge.buildTargetedEditResult) and the Fast Path
 * (FastPathEligibility) call this SAME façade, so there is exactly one
 * natural-language editing intelligence in the product.
 *
 * Exports kept byte-compatible with GATE v1/v6/v7 consumers:
 *   resolveTargetedEdit(prompt, ctx, doc) → resolution | null
 *   resolveDesignSystemFont(name)         → { name } | null
 */

import type { BuilderDocument } from '../../../packages/builder-core/src';
import type { HacpBuilderContext } from './HacpTypes';
import { parseEditIntent } from './nl/IntentParser';
import { compileEditIntent, type CompileOutcome } from './nl/IntentCompiler';
import type { EditContinuation, TargetedEditResolution } from './nl/IntentTaxonomy';
import { resolveDesignSystemFont } from './nl/StyleMath';

export type {
  TargetedEditIntent,
  TargetedDomain,
  TargetedQualifier,
  TargetedEditResolution,
  EditRejectReason,
} from './nl/IntentTaxonomy';
export type { CompileOutcome } from './nl/IntentCompiler';
export { resolveDesignSystemFont } from './nl/StyleMath';

export interface TargetedEditOptions {
  /** GATE v8 PHASE 5 — previous turn ("jeszcze bardziej" continuation). */
  previous?: EditContinuation | null;
}

/**
 * GATE v8 — full outcome: a resolution OR the exact reason it was refused.
 * Callers that must stay honest (eligibility gate, CLARIFY builders) read the
 * reject reason; callers that only want "can I edit this?" use
 * resolveTargetedEdit() below.
 */
export function explainTargetedEdit(
  rawPrompt: string,
  context: HacpBuilderContext,
  document: BuilderDocument,
  options?: TargetedEditOptions
): CompileOutcome {
  const parsed = parseEditIntent(rawPrompt, { previous: options?.previous ?? null });
  if (!parsed) return { kind: 'reject', reason: 'UNRESOLVED' };
  return compileEditIntent(parsed, rawPrompt, context, document);
}

/**
 * GATE v6/v7 compatible resolution: ONE unambiguous tool call for the CURRENT
 * selection, or null (never guess a target, never invent a value).
 */
export function resolveTargetedEdit(
  rawPrompt: string,
  context: HacpBuilderContext,
  document: BuilderDocument,
  options?: TargetedEditOptions
): TargetedEditResolution | null {
  const outcome = explainTargetedEdit(rawPrompt, context, document, options);
  return outcome.kind === 'resolution' ? outcome.resolution : null;
}

export default resolveTargetedEdit;
