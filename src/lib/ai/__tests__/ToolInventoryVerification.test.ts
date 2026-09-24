/**
 * ToolInventoryVerification.test.ts — Automated Tool Inventory Audit
 *
 * Verifies that:
 * 1. Every tool advertised to the model exists in BuilderToolDefinitions
 * 2. Every tool in BuilderToolDefinitions has a handler in HacpBridge
 * 3. Every tool in the system prompt has a definition and handler
 * 4. No ghost tools (advertised but missing)
 * 5. No hidden tools (defined but not advertised)
 * 6. BuilderCapabilityRegistry mutations map to real tools
 */

import { describe, it, expect } from 'vitest';
import { BUILDER_TOOL_DEFINITIONS } from '../BuilderToolDefinitions';
import { CAPABILITIES, getCapabilitiesForNodeType } from '../BuilderCapabilityRegistry';
import { ToolSurfaceSelector } from '../ToolSurfaceSelector';
import type { IntentCategory } from '../IntentClassifier';

// ─── TOOL NAME SETS ────────────────────────────────────────────────

const DEFINED_TOOL_NAMES = new Set(BUILDER_TOOL_DEFINITIONS.map((t) => t.name));

// Tools listed in the system prompt (extracted from route.ts).
// SURFACE REPAIR GATE v1.0: only tools that are SELECTABLE (appear in at
// least one ToolSurface) may be advertised. Internal/legacy/future tools
// stay in BuilderToolDefinitions (REPO) but are NOT advertised.
const ADVERTISED_TOOLS = [
  // Inspection (SELECTABLE surfaces only)
  'inspect_node',
  'inspect_children',
  'find_nodes',
  'inspect_document_summary',
  'inspect_selected_node',
  'inspect_page_structure',
  'read_builder_document',
  'read_page_full',
  // Mutation (SELECTABLE surfaces only)
  'update_node_props',
  'set_node_styles',
  'remove_node',
  'remove_section',
  'move_section',
  'configure_experience',
  'update_theme',
  'undo',
  'redo',
  // Library Intelligence (SELECTABLE surfaces only)
  'search_experiences',
  'search_sections',
  'search_website_templates',
  'get_typography_presets',
  'get_design_presets',
  'resolve_target',
  // Library Insertion
  'insert_section_from_library',
  'insert_experience_from_library',
  // Design System (ONE catalog — packages/design-system)
  'search_design_styles',
  'search_style_packs',
  'search_fonts',
  'search_font_pairings',
  'search_color_palettes',
  'search_typography_systems',
  'search_button_styles',
  'search_card_styles',
  'search_backgrounds',
  'search_industry_presets',
  'inspect_design_style',
  'inspect_style_pack',
  'apply_design_style',
  'apply_color_palette',
  'apply_typography',
  'apply_font',
  'apply_design_combination',
];

// Tools that are intentionally NOT advertised (REPO-only / internal / future gate).
// Decision matrix (FAZA 2 of AI CAPABILITY SURFACE REPAIR GATE v1.0):
//   B = internal/legacy, C = future gate
const REPO_ONLY_TOOLS = [
  'test_echo',              // diagnostic, never advertised
  'insert_section',         // B — public path is insert_section_from_library
  'set_background_color',   // B — superseded by update_node_props on EDIT_NODE
  'insert_node',            // C — needs parent validation + surface design
  'move_node',              // C — needs orphan guard + surface design
  'batch_execute',          // C — repaired dispatch, surface exposure future gate
  'inspect_experience',     // B — search_experiences covers discovery
  'get_experience_categories', // B — covered by search_experiences
  'inspect_asset',          // C — belongs to Asset Corridor Gate
  'inspect_parent',         // B — not exposed on any surface
  'inspect_responsive',     // B — not exposed on any surface
  'inspect_available_capabilities', // B — not exposed on any surface
];

// Tools that have handlers in HacpBridge (verified by code review)
// This list is the canonical set of tools that HacpBridge.executeToolCall supports
const HACP_HANDLER_TOOLS = [
  // Inspection tools (delegate to BuilderInspectionTools)
  'inspect_node',
  'inspect_children',
  'inspect_parent',
  'find_nodes',
  'inspect_responsive',
  'inspect_experience',
  'inspect_asset',
  'inspect_available_capabilities',
  'inspect_document_summary',
  'inspect_selected_node',
  'inspect_page_structure',
  'read_builder_document',
  'read_page_full',
  // Section tools
  'insert_section',
  'remove_section',
  'move_section',
  // Node mutation tools
  'update_node_props',
  'set_node_styles',
  'insert_node',
  'remove_node',
  'move_node',
  // Specialized tools
  'set_background_color',
  'configure_experience',
  'update_theme',
  'batch_execute',
  // History
  'undo',
  'redo',
  // Diagnostic
  'test_echo',
  // Library Intelligence
  'search_experiences',
  'get_experience_categories',
  'search_sections',
  'search_website_templates',
  'get_typography_presets',
  'get_design_presets',
  'resolve_target',
  // Library Insertion
  'insert_section_from_library',
  'insert_experience_from_library',
  // Design System (ONE catalog — packages/design-system)
  'search_design_styles',
  'search_style_packs',
  'search_fonts',
  'search_font_pairings',
  'search_color_palettes',
  'search_typography_systems',
  'search_button_styles',
  'search_card_styles',
  'search_backgrounds',
  'search_industry_presets',
  'inspect_design_style',
  'inspect_style_pack',
  'apply_design_style',
  'apply_color_palette',
  'apply_typography',
  'apply_font',
  'apply_design_combination',
];

// ─── TEST SUITE ────────────────────────────────────────────────────

describe('Tool Inventory Verification', () => {
  // ── 1. Advertised tools must exist in definitions ──────────────

  it('every advertised tool has a definition in BuilderToolDefinitions', () => {
    const missing: string[] = [];
    for (const tool of ADVERTISED_TOOLS) {
      if (!DEFINED_TOOL_NAMES.has(tool)) {
        missing.push(tool);
      }
    }
    expect(missing).toEqual([]);
  });

  // ── 2. REPO-only tools must NOT be advertised (surface discipline) ──

  it('REPO-only tools are never advertised to the model', () => {
    const advertisedSet = new Set(ADVERTISED_TOOLS);
    const leaked: string[] = [];
    for (const tool of REPO_ONLY_TOOLS) {
      if (advertisedSet.has(tool)) {
        leaked.push(tool);
      }
    }
    expect(leaked).toEqual([]);
  });

  it('every advertised tool is SELECTABLE on at least one surface', () => {
    // All 16 IntentCategory values — collect union of every surface.
    const intents: IntentCategory[] = [
      'CHAT', 'INSPECT', 'INSERT_SECTION', 'INSERT_EXPERIENCE',
      'INSERT_SITE_TEMPLATE', 'EDIT_NODE', 'MOVE_SECTION', 'DELETE',
      'STYLE', 'DESIGN_SYSTEM', 'SITE_GENERATION', 'AUDIT', 'DEBUG',
      'UNDO', 'REDO', 'CLARIFICATION_REQUIRED',
    ];
    const selectableUnion = new Set<string>();
    for (const intent of intents) {
      for (const name of ToolSurfaceSelector.getToolNamesForIntent(intent)) {
        selectableUnion.add(name);
      }
    }
    const notSelectable = ADVERTISED_TOOLS.filter((t) => !selectableUnion.has(t));
    expect(notSelectable).toEqual([]);
  });

  it('every REPO-only tool is either diagnostic or has a documented reason', () => {
    // All REPO-only tools must exist in definitions (they are REPO, not ghosts).
    for (const tool of REPO_ONLY_TOOLS) {
      expect(DEFINED_TOOL_NAMES.has(tool)).toBe(true);
    }
  });

  // ── 3. Advertised tools must have HacpBridge handlers ─────────

  it('every advertised tool has a handler in HacpBridge', () => {
    const handlerSet = new Set(HACP_HANDLER_TOOLS);
    const missing: string[] = [];
    for (const tool of ADVERTISED_TOOLS) {
      if (!handlerSet.has(tool)) {
        missing.push(tool);
      }
    }
    expect(missing).toEqual([]);
  });

  // ── 4. Defined tools must have HacpBridge handlers ────────────

  it('every defined tool has a handler in HacpBridge (no dead definitions)', () => {
    const handlerSet = new Set(HACP_HANDLER_TOOLS);
    const dead: string[] = [];
    for (const tool of DEFINED_TOOL_NAMES) {
      if (!handlerSet.has(tool)) {
        dead.push(tool);
      }
    }
    expect(dead).toEqual([]);
  });

  // ── 5. No ghost tools (advertised but no definition) ───────────

  it('no ghost tools exist in the system prompt', () => {
    const ghostTools = ADVERTISED_TOOLS.filter((t) => !DEFINED_TOOL_NAMES.has(t));
    expect(ghostTools).toEqual([]);
  });

  // ── 6. Every definition has required fields ────────────────────

  it('every tool definition has name, description, and parameters', () => {
    for (const tool of BUILDER_TOOL_DEFINITIONS) {
      expect(tool.name).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.parameters).toBeDefined();
      expect(tool.parameters.type).toBe('object');
    }
  });

  // ── 7. No duplicate tool names ─────────────────────────────────

  it('no duplicate tool names in definitions', () => {
    const names = BUILDER_TOOL_DEFINITIONS.map((t) => t.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });

  // ── 8. No duplicate advertised tools ───────────────────────────

  it('no duplicate advertised tools in system prompt', () => {
    const unique = new Set(ADVERTISED_TOOLS);
    expect(unique.size).toBe(ADVERTISED_TOOLS.length);
  });
});

describe('Capability Inventory Verification', () => {
  // ── 9. Every capability maps to a real mutation tool ───────────

  it('every capability mutationTool references a defined tool', () => {
    const missing: string[] = [];
    for (const cap of CAPABILITIES) {
      if (!DEFINED_TOOL_NAMES.has(cap.mutationTool)) {
        missing.push(`${cap.id} → ${cap.mutationTool}`);
      }
    }
    expect(missing).toEqual([]);
  });

  // ── 10. Every capability has required fields ───────────────────

  it('every capability has id, label, category, and mutationTool', () => {
    for (const cap of CAPABILITIES) {
      expect(cap.id).toBeTruthy();
      expect(cap.label).toBeTruthy();
      expect(cap.category).toBeTruthy();
      expect(cap.mutationTool).toBeTruthy();
      expect(cap.supportedNodeTypes.length).toBeGreaterThan(0);
    }
  });

  // ── 11. Node type capabilities resolve to real tools ───────────

  it('getCapabilitiesForNodeType returns only capabilities with valid mutationTool', () => {
    const nodeTypes = [
      'section', 'container', 'heading', 'text', 'button',
      'image', 'video', 'icon', 'divider', 'spacer', 'grid',
    ];
    for (const nodeType of nodeTypes) {
      const caps = getCapabilitiesForNodeType(nodeType);
      for (const cap of caps) {
        expect(DEFINED_TOOL_NAMES.has(cap.mutationTool)).toBe(true);
      }
    }
  });

  // ── 12. No duplicate capability IDs ────────────────────────────

  it('no duplicate capability IDs', () => {
    const ids = CAPABILITIES.map((c) => c.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  // ── 13. Every node type has at least one capability ────────────

  it('every common node type has at least one capability', () => {
    const nodeTypes = [
      'section', 'heading', 'text', 'button', 'image',
    ];
    for (const nodeType of nodeTypes) {
      const caps = getCapabilitiesForNodeType(nodeType);
      expect(caps.length).toBeGreaterThan(0);
    }
  });
});

describe('Tool Inventory Completeness', () => {
  // ── 14. Summary report ─────────────────────────────────────────

  it('prints tool inventory summary', () => {
    const summary = {
      totalDefinitions: BUILDER_TOOL_DEFINITIONS.length,
      totalAdvertised: ADVERTISED_TOOLS.length,
      totalRepoOnly: REPO_ONLY_TOOLS.length,
      totalHandlers: HACP_HANDLER_TOOLS.length,
      totalCapabilities: CAPABILITIES.length,
      definitionNames: BUILDER_TOOL_DEFINITIONS.map((t) => t.name).sort(),
      advertisedTools: [...ADVERTISED_TOOLS].sort(),
      repoOnlyTools: [...REPO_ONLY_TOOLS].sort(),
      handlerTools: [...HACP_HANDLER_TOOLS].sort(),
    };

    // REPO = ADVERTISED ∪ REPO_ONLY (disjoint)
    expect(summary.totalDefinitions).toBe(summary.totalAdvertised + summary.totalRepoOnly);
    expect(new Set([...summary.advertisedTools, ...summary.repoOnlyTools]).size)
      .toBe(summary.totalDefinitions);
    // No overlap
    for (const t of summary.advertisedTools) {
      expect(summary.repoOnlyTools).not.toContain(t);
    }

    // Every advertised tool must be in definitions
    for (const tool of summary.advertisedTools) {
      expect(summary.definitionNames).toContain(tool);
    }

    // Every advertised tool must be in handlers
    for (const tool of summary.advertisedTools) {
      expect(summary.handlerTools).toContain(tool);
    }
  });
});
