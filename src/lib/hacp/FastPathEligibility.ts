/**
 * FastPathEligibility.ts — GATE v1.0 PHASE 6/7/11
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
  resolveTargetedEdit,
  type TargetedEditResolution,
} from './TargetedEditResolver';
import type { HacpBuilderContext } from './HacpTypes';
import { isSiteGenerationRequest } from '../ai/IntentClassifier';

/** PHASE 6 — the domains we are allowed to execute without a model call. */
export type FastPathDomain = 'COLOR' | 'FONT' | 'SIZE' | 'TEXT' | 'ALIGN' | 'MOVE';

/** PHASE 7.4 — only commands the BuilderCommand engine already understands. */
export const FAST_PATH_INTENTS: ReadonlySet<TargetedEditResolution['intent']> = new Set([
  'CHANGE_COLOR',
  'CHANGE_TEXT',
  'RESIZE',
  'ALIGN',
  'MOVE',
  'CHANGE_TYPOGRAPHY',
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
  | 'DESIGN_INTELLIGENCE_REQUIRED';

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
};

function fold(s: string): string {
  return s
    .toLowerCase()
    // GATE v7.0 — 'ł' is not decomposed by NFD, so ASCII aliases never matched
    // 'nagłówek' / 'tytuł' / 'tło'. Map it explicitly.
    .replace(/[łŁ]/g, 'l')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,!?;:"'`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * GATE v7.0 PHASE 16 — prompts that carry NO concrete value and NO concrete
 * target ("zmień coś", "zrób to ładniej"). The model used to answer these by
 * guessing; the honest deterministic answer is a CLARIFY with zero mutations.
 * Evaluated on folded text, so write aliases in ASCII.
 */
const INSUFFICIENT_DATA_RE =
  /\bcos\b|\bcos tam\b|\bjakis\b|\bjakie\b|\bjakies\b|\bjakiej\b|\bjakas\b|\bjakakolwiek\b|\bktos\b|\bgdzies\b|\bladniej\b|\bfajniej\b|\batrakcyjniej\b|\bciekawiej\b|\bsmaczniej\b/;

const reject = (reason: FastPathReason): FastPathVerdict => ({ eligible: false, reason });

/**
 * GATE v1.0 PHASE 7 — the single source of truth for fast-path eligibility.
 * Read-only: touches the document for lookups only, never mutates.
 */
export function evaluateFastPath(
  rawPrompt: string,
  context: HacpBuilderContext,
  document: BuilderDocument
): FastPathVerdict {
  const prompt = (rawPrompt || '').trim();
  if (!prompt) return reject('EMPTY_PROMPT');

  const text = fold(prompt);
  if (text.length > FAST_PATH_MAX_PROMPT_LENGTH) return reject('PROMPT_TOO_LONG');
  if (UNDO_REDO_RE.test(text)) return reject('UNDO_REDO_RESERVED');
  if (isSiteGenerationRequest(prompt)) return reject('GENERATION_REQUEST');
  if (MULTI_STEP_RE.test(text)) return reject('MULTI_STEP');

  // PHASE 7.2 — TARGET LOCK. No selection, or a selection that is not in the
  // document → never guess a target (PHASE 20: refuse, fall back to AI PATH).
  const targetId = context.selectedNodeId;
  if (!targetId) return reject('NO_TARGET');
  if (!findNode(document, targetId)) return reject('TARGET_NOT_FOUND');

  const resolution = resolveTargetedEdit(prompt, context, document);
  if (!resolution) {
    // GATE v7.0 PHASE 16 — an indefinite request is answered with an honest,
    // deterministic CLARIFY instead of an LLM round trip that times out and
    // reports "Nie udało się wykonać polecenia".
    if (INSUFFICIENT_DATA_RE.test(text)) return reject('INSUFFICIENT_DATA');
    return reject('UNRESOLVED');
  }

  // PHASE 7.4/6 — known BuilderCommand only.
  if (!FAST_PATH_INTENTS.has(resolution.intent)) return reject('NON_DETERMINISTIC_INTENT');

  // PHASE 7.6/7 + PHASE 11 — a semantic qualifier is a Design Intelligence
  // decision ("luksusowa", "nowoczesny") → AI PATH, never a random asset pick.
  if (resolution.qualifier) return reject('DESIGN_INTELLIGENCE_REQUIRED');

  // PHASE 7.3 — parameters complete: the value came literally from the prompt.
  if (resolution.explicitValue !== true) return reject('PARAMETERS_INCOMPLETE');

  const domain = INTENT_DOMAIN[resolution.intent];
  if (!domain) return reject('NON_DETERMINISTIC_INTENT');

  return { eligible: true, reason: 'ELIGIBLE', domain, resolution };
}

export default evaluateFastPath;
