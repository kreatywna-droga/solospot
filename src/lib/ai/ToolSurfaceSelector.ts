/**
 * ToolSurfaceSelector.ts — Dynamic Tool Surface Selection
 *
 * Selects the MINIMAL tool set for each intent category.
 * Free models work better with fewer tools (4-6 vs 35).
 *
 * Model-agnostic: tool selection is based on intent, not model.
 */

import type { IntentCategory } from './IntentClassifier';
import type { HacpToolDefinition } from './AIProviderTypes';
import { BUILDER_TOOL_DEFINITIONS } from './BuilderToolDefinitions';

type ToolName = string;

interface ToolSurface {
  intent: IntentCategory;
  tools: ToolName[];
  description: string;
}

/**
 * Predefined tool surfaces per intent.
 * Each surface has 4-6 tools — enough for the task, minimal for the model.
 */
const TOOL_SURFACES: ToolSurface[] = [
  {
    intent: 'INSERT_SECTION',
    tools: [
      'search_sections',
      'insert_section_from_library',
      'inspect_document_summary',
      'inspect_page_structure',
    ],
    description: 'Search library, select section, insert into page',
  },
  {
    intent: 'INSERT_EXPERIENCE',
    tools: [
      'search_experiences',
      'insert_experience_from_library',
      'configure_experience',
      'inspect_document_summary',
    ],
    description: 'Search experiences, insert, configure',
  },
  {
    intent: 'INSERT_SITE_TEMPLATE',
    tools: [
      'search_website_templates',
      'search_sections',
      'insert_section_from_library',
      'inspect_document_summary',
    ],
    description: 'Search templates, insert sections',
  },
  {
    intent: 'EDIT_NODE',
    tools: [
      'inspect_selected_node',
      'inspect_node',
      'find_nodes',
      'resolve_target',
      'update_node_props',
      'set_node_styles',
      'inspect_document_summary',
    ],
    description: 'Find existing node, inspect, resolve target, update properties/styles',
  },
  {
    intent: 'MOVE_SECTION',
    tools: [
      'inspect_page_structure',
      'resolve_target',
      'move_section',
      'inspect_document_summary',
    ],
    description: 'Inspect structure, resolve target, move',
  },
  {
    intent: 'DELETE',
    tools: [
      'inspect_page_structure',
      'resolve_target',
      'remove_node',
      'remove_section',
      'inspect_document_summary',
    ],
    description: 'Inspect, resolve, delete',
  },
  {
    intent: 'STYLE',
    tools: [
      'inspect_selected_node',
      'resolve_target',
      'set_node_styles',
      'update_theme',
      'inspect_document_summary',
    ],
    description: 'Inspect, style, theme',
  },
  {
    intent: 'DESIGN_SYSTEM',
    tools: [
      'get_typography_presets',
      'get_design_presets',
      'update_theme',
      'inspect_document_summary',
      'inspect_page_structure',
    ],
    description: 'Typography, design presets, theme',
  },
  {
    intent: 'SITE_GENERATION',
    tools: [
      'search_website_templates',
      'search_sections',
      'search_experiences',
      'insert_section_from_library',
      'insert_experience_from_library',
      'inspect_document_summary',
    ],
    description: 'Full site building toolkit',
  },
  {
    intent: 'INSPECT',
    tools: [
      'inspect_page_structure',
      'inspect_document_summary',
      'inspect_selected_node',
      'read_builder_document',
      'read_page_full',
    ],
    description: 'Read-only inspection',
  },
  {
    intent: 'AUDIT',
    tools: [
      'inspect_page_structure',
      'inspect_document_summary',
      'read_builder_document',
      'read_page_full',
      'inspect_node',
    ],
    description: 'Full audit inspection',
  },
  {
    intent: 'DEBUG',
    tools: [
      'inspect_page_structure',
      'inspect_document_summary',
      'inspect_node',
      'inspect_children',
      'read_page_full',
    ],
    description: 'Debug inspection',
  },
  {
    intent: 'CHAT',
    tools: [], // No tools for pure chat
    description: 'Conversational — no tools needed',
  },
  {
    intent: 'UNDO',
    tools: ['undo'],
    description: 'Undo last action',
  },
  {
    intent: 'REDO',
    tools: ['redo'],
    description: 'Redo last action',
  },
  {
    intent: 'CLARIFICATION_REQUIRED',
    tools: [],
    description: 'Need more info from user',
  },
];

export class ToolSurfaceSelector {
  /**
   * Get the minimal tool set for a given intent.
   */
  static getToolsForIntent(intent: IntentCategory): HacpToolDefinition[] {
    const surface = TOOL_SURFACES.find((s) => s.intent === intent);
    if (!surface || surface.tools.length === 0) return [];

    return BUILDER_TOOL_DEFINITIONS.filter((t) =>
      surface.tools.includes(t.name)
    );
  }

  /**
   * Get tool names for a given intent.
   */
  static getToolNamesForIntent(intent: IntentCategory): string[] {
    const surface = TOOL_SURFACES.find((s) => s.intent === intent);
    return surface?.tools || [];
  }

  /**
   * Union of tool names across multiple intents (multi-intent merge).
   * FAZA 6: EDIT_NODE + DELETE → model can both update_node_props and remove_*.
   * Does not invent tools — only unions existing surfaces.
   */
  static getToolNamesForIntents(intents: IntentCategory[]): string[] {
    const set = new Set<string>();
    for (const intent of intents) {
      for (const name of this.getToolNamesForIntent(intent)) {
        set.add(name);
      }
    }
    return Array.from(set);
  }

  /**
   * Full tool definitions for a multi-intent union.
   */
  static getToolsForIntents(intents: IntentCategory[]): HacpToolDefinition[] {
    const names = new Set(this.getToolNamesForIntents(intents));
    return BUILDER_TOOL_DEFINITIONS.filter((t) => names.has(t.name));
  }

  /**
   * Get surface description for debugging.
   */
  static getDescription(intent: IntentCategory): string {
    const surface = TOOL_SURFACES.find((s) => s.intent === intent);
    return surface?.description || 'Unknown intent';
  }

  /**
   * Check if an intent requires tools.
   */
  static requiresTools(intent: IntentCategory): boolean {
    const surface = TOOL_SURFACES.find((s) => s.intent === intent);
    return surface ? surface.tools.length > 0 : false;
  }

  /**
   * Check if a tool call can mutate BuilderDocument.
   *
   * Read-only tools (search_*, inspect_*, read_*, resolve_*, get_*,
   * find_nodes, test_echo) never change the document: SEARCH ≠ INSERT.
   * Only mutation tools may ground a SUCCESS status.
   *
   * FORENSIC GATE v1.0: search-only result must never be reported
   * as EXECUTED/SUCCESS with an empty commandsToDispatch.
   */
  static isMutationTool(toolName: string): boolean {
    if (toolName === 'undo' || toolName === 'redo') return true;
    return /^(insert_|update_|set_|remove_|move_|delete_|batch_|configure_)/.test(toolName);
  }

  /**
   * True when at least one tool call in the list can mutate the document.
   */
  static hasMutationToolCall(toolCalls: Array<{ name: string }>): boolean {
    return toolCalls.some((tc) => ToolSurfaceSelector.isMutationTool(tc.name));
  }

  /**
   * Get all available intents and their tool counts.
   */
  static getSummary(): Array<{ intent: IntentCategory; toolCount: number; description: string }> {
    return TOOL_SURFACES.map((s) => ({
      intent: s.intent,
      toolCount: s.tools.length,
      description: s.description,
    }));
  }
}
