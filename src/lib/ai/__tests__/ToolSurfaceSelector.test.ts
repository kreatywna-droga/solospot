/**
 * ToolSurfaceSelector.test.ts — Unit tests for dynamic tool surface selection
 */
import { describe, it, expect } from 'vitest';
import { ToolSurfaceSelector } from '../ToolSurfaceSelector';

describe('ToolSurfaceSelector', () => {
  describe('getToolsForIntent', () => {
    it('returns 4 tools for INSERT_SECTION', () => {
      const tools = ToolSurfaceSelector.getToolsForIntent('INSERT_SECTION');
      expect(tools.length).toBe(4);
      const names = tools.map((t) => t.name);
      expect(names).toContain('search_sections');
      expect(names).toContain('insert_section_from_library');
    });

    it('returns 4 tools for INSERT_EXPERIENCE', () => {
      const tools = ToolSurfaceSelector.getToolsForIntent('INSERT_EXPERIENCE');
      expect(tools.length).toBe(4);
      const names = tools.map((t) => t.name);
      expect(names).toContain('search_experiences');
      expect(names).toContain('insert_experience_from_library');
    });

    it('returns 7 tools for EDIT_NODE', () => {
      const tools = ToolSurfaceSelector.getToolsForIntent('EDIT_NODE');
      expect(tools.length).toBe(7);
      const names = tools.map((t) => t.name);
      expect(names).toContain('update_node_props');
      expect(names).toContain('set_node_styles');
      expect(names).toContain('find_nodes');
    });

    it('returns 4 tools for MOVE_SECTION', () => {
      const tools = ToolSurfaceSelector.getToolsForIntent('MOVE_SECTION');
      expect(tools.length).toBe(4);
      const names = tools.map((t) => t.name);
      expect(names).toContain('move_section');
      expect(names).toContain('inspect_page_structure');
    });

    it('returns 0 tools for CHAT', () => {
      const tools = ToolSurfaceSelector.getToolsForIntent('CHAT');
      expect(tools.length).toBe(0);
    });

    it('returns 1 tool for UNDO', () => {
      const tools = ToolSurfaceSelector.getToolsForIntent('UNDO');
      expect(tools.length).toBe(1);
      expect(tools[0].name).toBe('undo');
    });
  });

  describe('requiresTools', () => {
    it('returns false for CHAT', () => {
      expect(ToolSurfaceSelector.requiresTools('CHAT')).toBe(false);
    });

    it('returns true for INSERT_SECTION', () => {
      expect(ToolSurfaceSelector.requiresTools('INSERT_SECTION')).toBe(true);
    });

    it('returns true for EDIT_NODE', () => {
      expect(ToolSurfaceSelector.requiresTools('EDIT_NODE')).toBe(true);
    });
  });

  describe('getToolNamesForIntent', () => {
    it('returns tool name strings', () => {
      const names = ToolSurfaceSelector.getToolNamesForIntent('INSERT_SECTION');
      expect(names.every((n) => typeof n === 'string')).toBe(true);
      expect(names).toContain('search_sections');
    });
  });

  describe('getSummary', () => {
    it('returns summary for all intents', () => {
      const summary = ToolSurfaceSelector.getSummary();
      expect(summary.length).toBeGreaterThan(10);
      expect(summary.every((s) => s.intent && s.toolCount >= 0)).toBe(true);
    });
  });
});
