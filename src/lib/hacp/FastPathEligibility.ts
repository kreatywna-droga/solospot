/**
 * FastPathEligibility.ts — GATE v1.0 PHASE 6/7/11 + GATE v8.0 PHASE 11/15.
 *
 * DECIDES whether a prompt may skip the LLM round trip and go straight to the
 * EXISTING BuilderCommand → BuilderDocument → Canvas → Verification pipeline.
 *
 * Hard rules (PHASE 7). ALL must hold, otherwise the caller falls back to the
 * normal AI path:
 *   1. intent unambiguous
 *   2. target unambiguous (currently selected node, present in the document)
 *   3. parameters complete (the new value is written literally in the prompt)
 *   4. a known BuilderCommand (set_node_styles / update_node_props)
 *   5. the resolver returned ONE unambiguous resolution
 *   6. no creative decision is required
 *   7. no choice among many Design System assets is required
 *
 * GATE v8 PHASE 11 — the gate no longer re-implements parsing: it reads the
 * SAME reject reasons the compiler produced (TEXT_VALUE_REJECTED, LOW_CONFIDENCE,
 * …), so "rozciągnij tytuł na boki" can never be re-interpreted as text here.
 *
 * PHASE 11: a QUALIFIER ("luksusowy", "nowoczesny", "bardziej widoczny") is a
 * design decision → DESIGN_INTELLIGENCE_REQUIRED → AI PATH. Only a font name
 * written literally ("na Inter") that EXISTS in the Design System qualifies.
 *
 * This module is PURE. It never executes anything. Execution happens in
 * HacpBridge.executeFastPath, which reuses executeToolCall →
 * verifyCommandExecution — the exact same engine the AI path uses.
 */

import { findNode, type BuilderDocument } from '../../../packages/builder-core/src';
import {
  explainTargetedEdit,
  type TargetedEditResolution,
} from './TargetedEditResolver';
import type { HacpBuilderContext, HacpConversationContext } from './HacpTypes';
import { isSiteGenerationRequest } from '../ai/IntentClassifier';
import {
  CONFIDENCE_THRESHOLD,
  fold,
  type EditRejectReason,
} from './nl/IntentTaxonomy';
import { isStyleResetPrompt } from './nl/IntentParser';

/** PHASE 6 — the domains we are allowed to execute without a model call. */
export type FastPathDomain =
  | 'COLOR'
  | 'FONT'
  | 'SIZE'
  | 'TEXT'
  | 'ALIGN'
  | 'MOVE'
  /** GATE v8 — opacity / border-radius appearance edits. */
  | 'STYLE';

/** PHASE 7.4 — only commands the BuilderCommand engine already understands. */
export const FAST_PATH_INTENTS: ReadonlySet<TargetedEditResolution['intent']> = new Set([
  'CHANGE_COLOR',
  'CHANGE_TEXT',
  'RESIZE',
  'ALIGN',
  'MOVE',
  'CHANGE_TYPOGRAPHY',
  /** GATE v8 — opacity / border-radius (canvas-supported style keys). */
  'CHANGE_APPEARANCE',
]);

/** PHASE 7 — short, surgical commands only. Long prose goes to the model. */
export const FAST_PATH_MAX_PROMPT_LENGTH = 160;

export type FastPathReason =
  | 'ELIGIBLE'
  | 'EMPTY_PROMPT'
  | 'PROMPT_TOO_LONG'
  | 'UNDO_REDO_RESERVED'
  | 'GENERATION_REQUEST'
  | 'MULTI_STEP'
  | 'NO_TARGET'
  | 'TARGET_NOT_FOUND'
  | 'UNRESOLVED'
  | 'NON_DETERMINISTIC_INTENT'
  | 'PARAMETERS_INCOMPLETE'
  /** GATE v7.0 — prompt carries no concrete value/target → honest CLARIFY. */
  | 'INSUFFICIENT_DATA'
  | 'DESIGN_INTELLIGENCE_REQUIRED'
  /** GATE v8 — parsed, but ambiguous (conf < threshold) → honest CLARIFY. */
  | 'LOW_CONFIDENCE'
  /** GATE v8 — "value" is a direction, not text (anti-BOKI) → honest CLARIFY. */
  | 'TEXT_VALUE_REJECTED';

export interface FastPathVerdict {
  eligible: boolean;
  /** Machine-readable reason — asserted directly by tests (PHASE 22). */
  reason: FastPathReason;
  domain?: FastPathDomain;
  resolution?: TargetedEditResolution;
}

/** PHASE 7 — undo/redo belong to the existing History engine, not here. */
const UNDO_REDO_RE =
  /\b(cofnij|wycofaj|wycofac|przywroc|przywier|cofni|anuluj|undo|redo|rollback|przywroc zmiane|cofnij zmiane)\b/;

/** PHASE 7 — anything sequenced or chained is not a single fast command. */
const MULTI_STEP_RE =
  /\b(a potem|potem|najpierw|nastepnie|wtedy|a nastepnie|i dodaj|i dodac|oraz dodaj|and then|then| oraz |;)\b/;

const INTENT_DOMAIN: Record<string, FastPathDomain> = {
  CHANGE_COLOR: 'COLOR',
  CHANGE_TEXT: 'TEXT',
  RESIZE: 'SIZE',
  ALIGN: 'ALIGN',
  MOVE: 'MOVE',
  CHANGE_TYPOGRAPHY: 'FONT',
  CHANGE_APPEARANCE: 'STYLE',
};

/**
 * GATE v7.0 PHASE 16 — prompts that carry NO concrete value and NO concrete
 * target ("zmień coś", "zrób to ładniej"). The model used to answer these by
 * guessing; the honest deterministic answer is a CLARIFY with zero mutations.
 * Evaluated on folded text, so write aliases in ASCII.
 */
const INSUFFICIENT_DATA_RE =
  /\bcos\b|\bcos tam\b|\bjakis\b|\bjakie\b|\bjakies\b|\bjakiej\b|\bjakas\b|\bjakakolwiek\b|\bktos\b|\bgdzies\b|\bladniej\b|\bfajniej\b|\batrakcyjniej\b|\bciekawiej\b|\bsmaczniej\b/;

const reject = (reason: FastPathReason): FastPathVerdict => ({ eligible: false, reason });

/** GATE v8 — compiler reject reason → user-facing fast-path reason. */
function mapReject(reason: EditRejectReason, text: string): FastPathReason {
  switch (reason) {
    case 'TEXT_VALUE_REJECTED':
      return 'TEXT_VALUE_REJECTED';
    case 'PARAMETERS_INCOMPLETE':
      return 'PARAMETERS_INCOMPLETE';
    case 'LOW_CONFIDENCE':
      return 'LOW_CONFIDENCE';
    case 'NOT_APPLICABLE':
      return 'NO_TARGET';
    case 'UNRESOLVED':
    default:
      return INSUFFICIENT_DATA_RE.test(text) ? 'INSUFFICIENT_DATA' : 'UNRESOLVED';
  }
}

/** GATE v8 PHASE 5 — continuation state carried from the previous turn. */
function previousFrom(conversation?: HacpConversationContext | null) {
  const last = conversation?.lastEdit;
  if (!last?.intent) return null;
  return { intent: last.intent, operation: last.operation, targetNodeId: last.targetNodeId };
}

/**
 * GATE v1.0 PHASE 7 — the single source of truth for fast-path eligibility.
 * Read-only: touches the document for lookups only, never mutates.
 */
export function evaluateFastPath(
  rawPrompt: string,
  context: HacpBuilderContext,
  document: BuilderDocument,
  conversation?: HacpConversationContext | null
): FastPathVerdict {
  const prompt = (rawPrompt || '').trim();
  if (!prompt) return reject('EMPTY_PROMPT');

  const text = fold(prompt);
  if (text.length > FAST_PATH_MAX_PROMPT_LENGTH) return reject('PROMPT_TOO_LONG');
  // GATE v8 — "przywróć domyślny rozmiar" is a STYLE reset, never an undo.
  if (UNDO_REDO_RE.test(text) && !isStyleResetPrompt(text)) return reject('UNDO_REDO_RESERVED');
  if (isSiteGenerationRequest(prompt)) return reject('GENERATION_REQUEST');
  if (MULTI_STEP_RE.test(text)) return reject('MULTI_STEP');

  // PHASE 7.2 — TARGET LOCK. No selection, or a selection that is not in the
  // document → never guess a target (PHASE 20: refuse, fall back to AI PATH).
  const targetId = context.selectedNodeId;
  if (!targetId) return reject('NO_TARGET');
  if (!findNode(document, targetId)) return reject('TARGET_NOT_FOUND');

  // GATE v8 — ONE parser + ONE compiler, exactly as Main Chat uses them.
  const outcome = explainTargetedEdit(prompt, context, document, {
    previous: previousFrom(conversation),
  });
  if (outcome.kind === 'reject') return reject(mapReject(outcome.reason, text));
  const resolution = outcome.resolution;

  // PHASE 7.4/6 — known BuilderCommand only.
  if (!FAST_PATH_INTENTS.has(resolution.intent)) return reject('NON_DETERMINISTIC_INTENT');

  // PHASE 7.6/7 + PHASE 11 — a semantic qualifier is a Design Intelligence
  // decision ("luksusowa", "nowoczesny") → AI PATH, never a random asset pick.
  if (resolution.qualifier) return reject('DESIGN_INTELLIGENCE_REQUIRED');

  // PHASE 7.3 — parameters complete: the value came literally from the prompt.
  if (resolution.explicitValue !== true) return reject('PARAMETERS_INCOMPLETE');

  // GATE v8 PHASE 11 — confidence gate: an ambiguous interpretation
  // ("zmień tekst na grubszy") is CLARIFIED, never dispatched.
  if ((resolution.confidence ?? 1) < CONFIDENCE_THRESHOLD) return reject('LOW_CONFIDENCE');

  const domain = INTENT_DOMAIN[resolution.intent];
  if (!domain) return reject('NON_DETERMINISTIC_INTENT');

  return { eligible: true, reason: 'ELIGIBLE', domain, resolution };
}

export default evaluateFastPath;
