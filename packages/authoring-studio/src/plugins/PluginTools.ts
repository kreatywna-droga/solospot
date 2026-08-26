/**
 * PluginTools.ts — PM43 Tool Extension API (ETAP 5)
 *
 * Registration interfaces for plugin tools:
 *   - Property Editors
 *   - Timeline Tools
 *   - Asset Providers
 *   - Validators
 *   - Exporters
 *   - Importers
 *   - Productivity Tools
 *
 * NO DOM, NO React, NO Browser API.
 */

export type ToolKind =
  | 'property_editor'
  | 'timeline_tool'
  | 'asset_provider'
  | 'validator'
  | 'exporter'
  | 'importer'
  | 'productivity_tool';

export interface PluginToolRegistration {
  readonly toolId: string;
  readonly pluginId: string;
  readonly kind: ToolKind;
  readonly name: string;
  readonly description?: string;
  readonly handlerRef: unknown;
}

export interface PluginToolsState {
  readonly tools: ReadonlyArray<PluginToolRegistration>;
}

export const INITIAL_PLUGIN_TOOLS_STATE: PluginToolsState = {
  tools: [],
};

export function createPluginToolsState(
  initialTools: ReadonlyArray<PluginToolRegistration> = []
): PluginToolsState {
  return {
    tools: [...initialTools],
  };
}

/**
 * Registers a plugin tool extension immutably.
 */
export function registerPluginTool(
  state: PluginToolsState,
  tool: PluginToolRegistration
): PluginToolsState {
  const filtered = state.tools.filter((t) => t.toolId !== tool.toolId);
  return {
    tools: [...filtered, tool],
  };
}

/**
 * Retrieves all registered tools of a specific kind.
 */
export function getToolsByKind(
  state: PluginToolsState,
  kind: ToolKind
): ReadonlyArray<PluginToolRegistration> {
  return state.tools.filter((t) => t.kind === kind);
}
