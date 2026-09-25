/**
 * VisualLanguageApplication.ts — Visual Language → BuilderCommand plan
 *
 * Orchestrates the full transformation:
 * Visual Language
 * → Composition Decisions
 * → BuilderCommands
 * → Dispatch-ready command plan
 *
 * This is the missing pipeline layer between Visual Language
 * and real canvas transformation.
 */

import type { VisualLanguage } from './types';
import type { BuilderDocument, BuilderCommand } from '../../../packages/builder-core/src';
import { buildCompositionDecisions, compositionDecisionsToCommands, type CompositionInput } from './CompositionIntelligence';

export interface VisualLanguageCommandPlan {
  visualLanguageId: string;
  visualLanguageName: string;
  compositionCommands: BuilderCommand[];
  compositionDecisionsCount: number;
  summary: string;
}

export function buildVisualLanguageCommandPlan(
  visualLanguage: VisualLanguage,
  document: BuilderDocument,
  targetPageId?: string,
): VisualLanguageCommandPlan {
  const compositionInput: CompositionInput = {
    document,
    visualLanguage,
    targetPageId,
  };

  const decisions = buildCompositionDecisions(compositionInput);
  const compositionCommands = compositionDecisionsToCommands(decisions, targetPageId);

  const summary = decisions.map((d) => `[${d.category}] ${d.target}: ${d.property} = ${d.value}`).join('\n');

  return {
    visualLanguageId: visualLanguage.id,
    visualLanguageName: visualLanguage.name,
    compositionCommands,
    compositionDecisionsCount: decisions.length,
    summary,
  };
}
