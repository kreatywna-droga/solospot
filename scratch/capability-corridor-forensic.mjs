/**
 * AI CAPABILITY CORRIDOR FORENSIC GATE v1.0 — static + runtime inventory.
 * READ-ONLY diagnostic. Does not modify product code.
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  const raw = readFileSync(join(__dirname, '..', '.env.local'), 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m && !(m[1] in process.env)) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
} catch {}

import { BUILDER_TOOL_DEFINITIONS } from '../src/lib/ai/BuilderToolDefinitions.ts';
import { ToolSurfaceSelector } from '../src/lib/ai/ToolSurfaceSelector.ts';
import { IntentClassifier } from '../src/lib/ai/IntentClassifier.ts';
import { AgentOrchestrator } from '../src/lib/ai/AgentOrchestrator.ts';
import { OpenCodeProvider } from '../src/lib/ai/OpenCodeProvider.ts';

function L(step, data) {
  console.log(JSON.stringify({ step, ...data }));
}

const ALL = BUILDER_TOOL_DEFINITIONS.map((t) => t.name);

const READ = [
  'inspect_document_summary', 'inspect_page_structure', 'read_page_full', 'inspect_node',
  'inspect_children', 'inspect_parent', 'find_nodes', 'inspect_selected_node',
  'inspect_responsive', 'inspect_available_capabilities', 'read_builder_document', 'resolve_target',
];
const LIBRARY = ['search_sections', 'insert_section_from_library', 'search_website_templates'];
const EXPERIENCE = ['search_experiences', 'inspect_experience', 'insert_experience_from_library', 'get_experience_categories', 'configure_experience'];
const CONTENT = ['insert_node', 'update_node_props', 'remove_node', 'move_node', 'resolve_target'];
const DESIGN = [
  'get_typography_presets', 'get_design_presets', 'update_theme', 'set_node_styles',
  'set_background_color', 'set_text',
];
const ASSETS = ['inspect_asset'];
const PAGE = ['insert_section', 'remove_section', 'move_section', 'batch_execute', 'undo', 'redo'];
const VERIFICATION = []; // verification is not a tool — protocol inside HacpBridge
const ORPHANS = [
  'test_echo', 'insert_section', 'set_background_color', 'insert_node', 'batch_execute',
  'move_node', 'inspect_experience', 'get_experience_categories', 'inspect_parent',
  'inspect_responsive', 'inspect_asset', 'inspect_available_capabilities',
];

function inRepo(name) { return ALL.includes(name); }

const SURFACES = [
  'INSERT_SECTION', 'INSERT_EXPERIENCE', 'INSERT_SITE_TEMPLATE', 'EDIT_NODE',
  'MOVE_SECTION', 'DELETE', 'STYLE', 'DESIGN_SYSTEM', 'SITE_GENERATION',
  'INSPECT', 'AUDIT', 'DEBUG', 'CHAT', 'UNDO', 'REDO', 'CLARIFICATION_REQUIRED',
];

function selectable(name) {
  return SURFACES.filter((s) => ToolSurfaceSelector.getToolNamesForIntent(s).includes(name));
}

function classifySet(names) {
  return {
    count: names.length,
    tools: names,
    inRepo: names.filter(inRepo),
    selectableIn: Object.fromEntries(names.map((n) => [n, selectable(n)])),
    orphanedFromAllSurfaces: names.filter((n) => selectable(n).length === 0),
  };
}

L('TEST1_STATIC_INVENTORY', {
  totalDefinitions: ALL.length,
  READ: classifySet(READ.filter((n) => namesOrEmpty(ALL, n))),
  LIBRARY: classifySet(LIBRARY),
  EXPERIENCE: classifySet(EXPERIENCE),
  CONTENT: classifySet(CONTENT),
  DESIGN: classifySet(DESIGN),
  ASSETS: classifySet(ASSETS),
  PAGE: classifySet(PAGE),
  VERIFICATION: { count: 0, tools: [], note: 'EMPTY as tool — verification is HacpBridge.verifyCommandExecution protocol' },
  ALL_DEFINITIONS: ALL,
  ORPHANS_NOT_IN_ANY_SURFACE: ORPHANS.filter((n) => selectable(n).length === 0),
});

function namesOrEmpty(arr, n) { return arr.includes(n); }

// Intent → tools sent (what AgentOrchestrator would put in request.tools)
const INTENT_PROMPTS = {
  INSERT_SECTION: 'Dodaj sekcję testimonials.',
  INSERT_EXPERIENCE: 'Dodaj experience mesh gradient na Hero.',
  EDIT_NODE: 'Zmień tytuł istniejącego Hero na Nowy Tytuł.',
  MOVE_SECTION: 'Przenieś testimonials na górę.',
  DELETE: 'Usuń sekcję testimonials.',
  STYLE: 'Zmień kolor tła sekcji na czerwony.',
  DESIGN_SYSTEM: 'Użyj typography presets premium.',
  INSPECT: 'Pokaż strukturę strony.',
  CHAT: 'Hej, co potrafisz?',
};

L('TEST1_INTENT_TOOLS_SENT', {
  note: 'What AgentOrchestrator puts on request.tools for each intent (FREE path)',
  byIntent: Object.fromEntries(
    Object.entries(INTENT_PROMPTS).map(([intent, prompt]) => {
      const c = IntentClassifier.classify(prompt, { documentNodeCount: 3 });
      const surfaceIntent = c.category;
      const tools = ToolSurfaceSelector.getToolNamesForIntent(surfaceIntent);
      return [intent, {
        prompt,
        classifiedAs: surfaceIntent,
        confidence: c.confidence,
        toolsSentToModel: tools,
        count: tools.length,
        hasLibrary: tools.some((t) => LIBRARY.includes(t)),
        hasExperience: tools.some((t) => EXPERIENCE.includes(t)),
        hasAssets: tools.some((t) => ASSETS.includes(t)),
        hasDesign: tools.some((t) => DESIGN.includes(t)),
        hasPage: tools.some((t) => PAGE.includes(t)),
        hasBatch: tools.includes('batch_execute'),
      }];
    })
  ),
  systemPromptAdvertisesButSurfaceMayNot: {
    note: 'Tools named in route.ts system prompt prose',
    advertisedInPrompt: [
      'inspect_node', 'inspect_children', 'inspect_parent', 'find_nodes', 'inspect_responsive',
      'inspect_experience', 'inspect_asset', 'inspect_available_capabilities', 'inspect_document_summary',
      'inspect_selected_node', 'inspect_page_structure', 'read_builder_document', 'read_page_full',
      'update_node_props', 'set_node_styles', 'insert_node', 'remove_node', 'move_node',
      'insert_section', 'remove_section', 'move_section', 'set_background_color', 'configure_experience',
      'update_theme', 'batch_execute', 'undo', 'redo', 'search_experiences', 'search_sections',
      'insert_section_from_library', 'insert_experience_from_library',
    ],
    neverInAnySurface: ORPHANS.filter((n) => selectable(n).length === 0),
  },
});

// Capability matrix REPO→REGISTERED→SELECTABLE (static) → EXPOSED/EXECUTABLE filled by runtime
const CAPABILITY_ROWS = [
  { cap: 'inspect_document_summary', repo: inRepo('inspect_document_summary'), selectable: selectable('inspect_document_summary').length > 0 },
  { cap: 'inspect_page_structure', repo: inRepo('inspect_page_structure'), selectable: selectable('inspect_page_structure').length > 0 },
  { cap: 'read_page_full', repo: inRepo('read_page_full'), selectable: selectable('read_page_full').length > 0 },
  { cap: 'inspect_node', repo: inRepo('inspect_node'), selectable: selectable('inspect_node').length > 0 },
  { cap: 'find_nodes', repo: inRepo('find_nodes'), selectable: selectable('find_nodes').length > 0 },
  { cap: 'search_sections', repo: inRepo('search_sections'), selectable: selectable('search_sections').length > 0 },
  { cap: 'insert_section_from_library', repo: inRepo('insert_section_from_library'), selectable: selectable('insert_section_from_library').length > 0 },
  { cap: 'search_experiences', repo: inRepo('search_experiences'), selectable: selectable('search_experiences').length > 0 },
  { cap: 'insert_experience_from_library', repo: inRepo('insert_experience_from_library'), selectable: selectable('insert_experience_from_library').length > 0 },
  { cap: 'configure_experience', repo: inRepo('configure_experience'), selectable: selectable('configure_experience').length > 0 },
  { cap: 'inspect_experience', repo: inRepo('inspect_experience'), selectable: selectable('inspect_experience').length > 0 },
  { cap: 'get_experience_categories', repo: inRepo('get_experience_categories'), selectable: selectable('get_experience_categories').length > 0 },
  { cap: 'insert_node', repo: inRepo('insert_node'), selectable: selectable('insert_node').length > 0 },
  { cap: 'update_node_props', repo: inRepo('update_node_props'), selectable: selectable('update_node_props').length > 0 },
  { cap: 'remove_node', repo: inRepo('remove_node'), selectable: selectable('remove_node').length > 0 },
  { cap: 'move_node', repo: inRepo('move_node'), selectable: selectable('move_node').length > 0 },
  { cap: 'set_node_styles', repo: inRepo('set_node_styles'), selectable: selectable('set_node_styles').length > 0 },
  { cap: 'set_background_color', repo: inRepo('set_background_color'), selectable: selectable('set_background_color').length > 0 },
  { cap: 'get_typography_presets', repo: inRepo('get_typography_presets'), selectable: selectable('get_typography_presets').length > 0 },
  { cap: 'get_design_presets', repo: inRepo('get_design_presets'), selectable: selectable('get_design_presets').length > 0 },
  { cap: 'update_theme', repo: inRepo('update_theme'), selectable: selectable('update_theme').length > 0 },
  { cap: 'inspect_asset', repo: inRepo('inspect_asset'), selectable: selectable('inspect_asset').length > 0 },
  { cap: 'search_assets_AI', repo: false, selectable: false },
  { cap: 'insert_asset_AI', repo: false, selectable: false },
  { cap: 'insert_section', repo: inRepo('insert_section'), selectable: selectable('insert_section').length > 0 },
  { cap: 'remove_section', repo: inRepo('remove_section'), selectable: selectable('remove_section').length > 0 },
  { cap: 'move_section', repo: inRepo('move_section'), selectable: selectable('move_section').length > 0 },
  { cap: 'duplicate_section_AI', repo: false, selectable: false },
  { cap: 'batch_execute', repo: inRepo('batch_execute'), selectable: selectable('batch_execute').length > 0 },
  { cap: 'resolve_target', repo: inRepo('resolve_target'), selectable: selectable('resolve_target').length > 0 },
];

L('TEST2_CAPABILITY_MATRIX_STATIC', {
  columns: 'CAPABILITY | REPO | SELECTABLE (any surface)',
  rows: CAPABILITY_ROWS.map((r) => ({
    capability: r.cap,
    REPO: r.repo ? 'YES' : 'NO',
    SELECTABLE: r.selectable ? 'YES' : 'NO',
    failurePoint:
      !r.repo ? 'A_ABSENT' :
      !r.selectable ? 'C_NOT_SELECTABLE' :
      'pending_exposed_executable',
  })),
  summary: {
    absent: CAPABILITY_ROWS.filter((r) => !r.repo).map((r) => r.cap),
    inRepoButNotSelectable: CAPABILITY_ROWS.filter((r) => r.repo && !r.selectable).map((r) => r.cap),
    selectable: CAPABILITY_ROWS.filter((r) => r.selectable).map((r) => r.cap),
  },
});

// ── Runtime TEST 1: capture tools actually sent to model ──
async function captureToolsSent(prompt) {
  const provider = new OpenCodeProvider();
  const realFetch = globalThis.fetch;
  const captured = [];
  globalThis.fetch = async (url, init) => {
    const isLLM = typeof url === 'string' && url.includes('/chat/completions');
    if (isLLM) {
      let body = {};
      try { body = JSON.parse(init?.body || '{}'); } catch {}
      captured.push({
        model: body.model,
        toolsSent: (body.tools || []).map((t) => t.function?.name || t.name).filter(Boolean),
      });
    }
    const res = await realFetch(url, init);
    return res;
  };
  try {
    const orch = new AgentOrchestrator({ generateWithTools: (req) => provider.generateWithTools(req) });
    const result = await orch.orchestrate(
      {
        prompt,
        messages: [{ role: 'user', content: prompt }],
        builderContext: {
          storeId: 's-forensic',
          pageId: 'page-home',
          pageName: 'Strona Główna',
          viewport: 'DESKTOP',
          documentNodeCount: 3,
          activeTool: 'SELECT',
          availableCapabilitiesCount: 20,
          sectionsSummary: [
            { id: 'sec_hero', type: 'hero', label: 'Hero', order: 0, childCount: 2 },
            { id: 'sec_testimonials', type: 'testimonials', label: 'Testimonials', order: 1, childCount: 0 },
            { id: 'sec_features', type: 'section', label: 'Features', order: 2, childCount: 0 },
          ],
          nodesIndex: [
            { id: 'sec_hero', type: 'hero', label: 'Hero', sectionId: 'sec_hero', parentId: null, props: { title: 'MYSHOE', backgroundColor: '#0A0A0F' } },
            { id: 'node_h1', type: 'heading', label: 'H1', sectionId: 'sec_hero', parentId: 'sec_hero', props: { text: 'MYSHOE' } },
            { id: 'sec_testimonials', type: 'testimonials', label: 'Testimonials', sectionId: 'sec_testimonials', parentId: null, props: {} },
          ],
        },
        routerMode: 'FREE',
      },
      { documentNodeCount: 3, hasSelection: false, sectionsSummary: [] }
    );
    return {
      prompt,
      classifiedIntent: IntentClassifier.classify(prompt, { documentNodeCount: 3 }).category,
      orchestratorStatus: result.status,
      intent: result.intent,
      modelUsed: result.modelUsed,
      modelRequests: captured.length,
      toolsSentToModel: captured[0]?.toolsSent || [],
      toolCallsReturned: (result.toolCalls || []).map((tc) => tc.name),
      messagePreview: (result.message || '').slice(0, 250),
    };
  } finally {
    globalThis.fetch = realFetch;
  }
}

async function main() {
  L('TEST1_RUNTIME_START', { note: 'Capturing tools array on first model request for key prompts' });

  const prompts = [
    'Dodaj sekcję testimonials.',
    'Dodaj experience mesh gradient na Hero.',
    'Zmień tytuł istniejącego Hero na Nowy Tytuł.',
    'Zmień kolor tła istniejącej sekcji na czerwony.',
    'Pokaż strukturę strony.',
    'Hej, co potrafisz?',
  ];

  for (const p of prompts) {
    try {
      const r = await captureToolsSent(p);
      L('TEST1_RUNTIME_RESULT', r);
    } catch (e) {
      L('TEST1_RUNTIME_ERROR', { prompt: p, error: String(e?.message || e) });
    }
  }

  L('FORENSIC_STATIC_DONE', { codeChanged: false, commit: false, push: false, deploy: false });
}

main().catch((err) => {
  L('TRACE_ERROR', { error: String(err?.message || err), stack: String(err?.stack || '').slice(0, 800) });
  process.exit(1);
});
