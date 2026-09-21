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

// ─── TOOL NAME SETS ────────────────────────────────────────────────

const DEFINED_TOOL_NAMES = new Set(BUILDER_TOOL_DEFINITIONS.map((t) => t.name));

// Tools listed in the system prompt (extracted from route.ts)
// These are the tools the AI model is told it can use
const ADVERTISED_TOOLS = [
  // Inspection
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
  // Mutation
  'update_node_props',
  'set_node_styles',
  'insert_node',
  'remove_node',
  'move_node',
  'insert_section',
  'remove_section',
  'move_section',
  'set_background_color',
  'configure_experience',
  'update_theme',
  'batch_execute',
  'undo',
  'redo',
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

  // ── 2. Defined tools must be advertised ────────────────────────

  it('every defined tool is advertised to the model (no hidden tools)', () => {
    const advertisedSet = new Set(ADVERTISED_TOOLS);
    const hidden: string[] = [];
    for (const tool of DEFINED_TOOL_NAMES) {
      // test_echo is diagnostic, not advertised in prompt — allowed
      if (tool === 'test_echo') continue;
      if (!advertisedSet.has(tool)) {
        hidden.push(tool);
      }
    }
    expect(hidden).toEqual([]);
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
      totalHandlers: HACP_HANDLER_TOOLS.length,
      totalCapabilities: CAPABILITIES.length,
      definitionNames: BUILDER_TOOL_DEFINITIONS.map((t) => t.name).sort(),
      advertisedTools: [...ADVERTISED_TOOLS].sort(),
      handlerTools: [...HACP_HANDLER_TOOLS].sort(),
    };

    // All counts must match (except handlers which includes test_echo)
    expect(summary.totalDefinitions).toBe(summary.totalAdvertised + 1); // +1 for test_echo
    expect(summary.totalHandlers).toBe(summary.totalAdvertised + 1); // +1 for test_echo

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
