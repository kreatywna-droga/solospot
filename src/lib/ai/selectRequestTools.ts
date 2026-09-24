/**
 * selectRequestTools.ts — DUAL-PATH EXECUTION UNIFICATION REPAIR GATE v1.0
 *
 * Single source of truth for which tools may appear on request.tools.
 *
 * INVARIANT: request.tools ⊆ selectedToolSurface(intent).
 * The model must NEVER receive batch_execute or the full
 * BUILDER_TOOL_DEFINITIONS set as a callable tool list.
 *
 * Used by:
 * - AgentOrchestrator (primary FREE/AUTO corridor)
 * - /api/builder/copilot controlled continuation / PAID/MANUAL path
 *   (replaces the former tools: BUILDER_TOOL_DEFINITIONS fallback)
 */

import { IntentClassifier, type IntentCategory, type ClassifiedIntent } from './IntentClassifier';
import { ToolSurfaceSelector } from './ToolSurfaceSelector';
import type { HacpToolDefinition } from './AIProviderTypes';

export interface SelectRequestToolsContext {
  hasSelection?: boolean;
  selectedNodeType?: string;
  documentNodeCount?: number;
  conversationHistory?: string[];
}

export interface SelectRequestToolsResult {
  intent: IntentCategory;
  intentList: IntentCategory[];
  toolNames: string[];
  tools: HacpToolDefinition[];
  classified: ClassifiedIntent;
}

/**
 * Classify the prompt and return ONLY the tools allowed on the selected
 * tool surface (multi-intent union when secondary intents exist).
 */
export function selectRequestTools(
  prompt: string,
  context: SelectRequestToolsContext = {}
): SelectRequestToolsResult {
  const classified = IntentClassifier.classify(prompt || '', {
    hasSelection: context.hasSelection,
    selectedNodeType: context.selectedNodeType,
    documentNodeCount: context.documentNodeCount,
    conversationHistory: context.conversationHistory,
  });

  const secondaryIntents = Array.isArray(classified.parameters.secondaryIntents)
    ? (classified.parameters.secondaryIntents as IntentCategory[])
    : [];

  const intentList: IntentCategory[] =
    secondaryIntents.length > 0
      ? [classified.category, ...secondaryIntents]
      : [classified.category];

  const tools =
    intentList.length > 1
      ? ToolSurfaceSelector.getToolsForIntents(intentList)
      : ToolSurfaceSelector.getToolsForIntent(classified.category);

  const toolNames =
    intentList.length > 1
      ? ToolSurfaceSelector.getToolNamesForIntents(intentList)
      : ToolSurfaceSelector.getToolNamesForIntent(classified.category);

  return {
    intent: classified.category,
    intentList,
    toolNames,
    tools,
    classified,
  };
}

/**
 * Safety net: reject any tool list that is not a subset of the selected
 * surface (e.g. accidental reintroduction of BUILDER_TOOL_DEFINITIONS).
 */
export function assertToolsWithinSurface(
  tools: Array<{ name: string }>,
  intentList: IntentCategory[]
): { ok: boolean; leaked: string[] } {
  const allowed = new Set(ToolSurfaceSelector.getToolNamesForIntents(intentList));
  const leaked = tools.map((t) => t.name).filter((n) => !allowed.has(n));
  return { ok: leaked.length === 0, leaked };
}
