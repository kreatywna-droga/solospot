/**
 * HACP Tools — HACP Integration Tools and Capabilities
 *
 * Provides HACP-compatible tools for style search, inspection, and application.
 */

import type { HACPSearchTool, HACPApplyTool, HACPCapabilityCorridor } from '../types';
import type { HACPConstraint } from '../types';

export interface HACPTool {
  name: string;
  description: string;
  category: 'search' | 'inspect' | 'apply' | 'read';
  parameters: Record<string, unknown>;
  returns: string;
  readOnly: boolean;
}

export const HACP_TOOLS: HACPTool[] = [
  {
    name: 'search_design_styles',
    description: 'Search design styles by query, industry, mood, style',
    category: 'search',
    parameters: { query: 'string', industry: 'string', mood: 'string', style: 'string' },
    returns: 'StyleSearchResult[]',
    readOnly: true,
  },
  {
    name: 'search_style_packs',
    description: 'Search style packs by name, industry, mood',
    category: 'search',
    parameters: { query: 'string', industry: 'string', mood: 'string' },
    returns: 'StylePack[]',
    readOnly: true,
  },
  {
    name: 'search_fonts',
    description: 'Search fonts by name, category, tags',
    category: 'search',
    parameters: { query: 'string', category: 'string' },
    returns: 'FontItemExtended[]',
    readOnly: true,
  },
  {
    name: 'search_font_pairings',
    description: 'Search font pairings by display font, style',
    category: 'search',
    parameters: { query: 'string', style: 'string' },
    returns: 'FontPairing[]',
    readOnly: true,
  },
  {
    name: 'search_color_palettes',
    description: 'Search color palettes by name, style, industry',
    category: 'search',
    parameters: { query: 'string', style: 'string', industry: 'string' },
    returns: 'ColorPalette[]',
    readOnly: true,
  },
  {
    name: 'search_typography_systems',
    description: 'Search typography systems by name, style',
    category: 'search',
    parameters: { query: 'string', style: 'string' },
    returns: 'TypographySystem[]',
    readOnly: true,
  },
  {
    name: 'search_button_styles',
    description: 'Search button styles by name, style',
    category: 'search',
    parameters: { query: 'string', style: 'string' },
    returns: 'ButtonStyle[]',
    readOnly: true,
  },
  {
    name: 'search_card_styles',
    description: 'Search card styles by name, style',
    category: 'search',
    parameters: { query: 'string', style: 'string' },
    returns: 'CardSystem[]',
    readOnly: true,
  },
  {
    name: 'search_backgrounds',
    description: 'Search background systems by name, style',
    category: 'search',
    parameters: { query: 'string', style: 'string' },
    returns: 'BackgroundSystem[]',
    readOnly: true,
  },
  {
    name: 'search_industry_presets',
    description: 'Search industry presets by industry',
    category: 'search',
    parameters: { query: 'string', industry: 'string' },
    returns: 'IndustryPreset[]',
    readOnly: true,
  },
  {
    name: 'inspect_design_style',
    description: 'Inspect a design style with full dependencies',
    category: 'inspect',
    parameters: { styleId: 'string' },
    returns: 'DesignStyleDetail',
    readOnly: true,
  },
  {
    name: 'inspect_style_pack',
    description: 'Inspect a style pack with all dependencies',
    category: 'inspect',
    parameters: { packId: 'string' },
    returns: 'StylePackDetail',
    readOnly: true,
  },
  {
    name: 'apply_design_style',
    description: 'Apply a design style to a BuilderDocument',
    category: 'apply',
    parameters: { stylePackId: 'string', documentId: 'string', options: 'StyleApplicationOptions' },
    returns: 'StyleApplicationResult',
    readOnly: false,
  },
];

export type { HACPConstraint, HACPCapabilityCorridor };

export const HACP_CONSTRAINTS: HACPConstraint[] = [
  {
    type: 'read_only',
    description: 'Search and inspect tools must be read-only',
  },
  {
    type: 'mutation_requires_verification',
    description: 'Apply operations require verification before execution',
  },
  {
    type: 'no_random_selection',
    description: 'Style selection must be based on query or explicit ID, never random',
  },
  {
    type: 'compatibility_required',
    description: 'All style applications must check compatibility before applying',
  },
];

export const HACP_CAPABILITY_CORRIDOR: HACPCapabilityCorridor = {
  searchTools: HACP_TOOLS.filter((t) => t.category === 'search'),
  applyTools: HACP_TOOLS.filter((t) => t.category === 'apply'),
  inspectTools: HACP_TOOLS.filter((t) => t.category === 'inspect'),
  constraints: HACP_CONSTRAINTS,
};

export function getHACPTool(name: string): HACPTool | undefined {
  return HACP_TOOLS.find((t) => t.name === name);
}

export function getHACPSearchTools(): HACPSearchTool[] {
  return HACP_TOOLS.filter((t) => t.category === 'search') as HACPSearchTool[];
}

export function getHACPApplyTools(): HACPApplyTool[] {
  return HACP_TOOLS.filter((t) => t.category === 'apply') as HACPApplyTool[];
}

export default {
  tools: HACP_TOOLS,
  constraints: HACP_CONSTRAINTS,
  corridor: HACP_CAPABILITY_CORRIDOR,
};
