/**
 * READ→WRITE EXECUTION FORENSIC TRACE — no code changes to app.
 * Captures: available tools (via unit-level surface), full API response
 * (toolCalls, status, message) for "Dodaj sekcję testimonials."
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const BASE = process.env.PW_BASE || 'http://localhost:3100';
const PROMPT = 'Dodaj sekcję testimonials.';

function log(step, data) {
  console.log(JSON.stringify({ step, ...data }));
}

async function main() {
  // 1. Tool surface (static, from TS via dynamic import through vitest not needed —
  //    re-derive from source constants by importing compiled path if available.
  //    Fallback: print expected INSERT_SECTION surface from ToolSurfaceSelector.)
  log('USER_REQUEST', { prompt: PROMPT });

  // 2. Intent classification expectation (IntentClassifier unit-tested)
  //    'Dodaj sekcję testimonials' → INSERT_SECTION (priority 7 SECTION_KEYWORDS)

  // 3. Tool surface for INSERT_SECTION (ToolSurfaceSelector)
  //    search_sections, insert_section_from_library, inspect_document_summary, inspect_page_structure
  log('EXPECTED_TOOL_SURFACE', {
    intent: 'INSERT_SECTION',
    tools: [
      'search_sections',
      'insert_section_from_library',
      'inspect_document_summary',
      'inspect_page_structure',
    ],
    insert_section_from_library_available: true,
  });

  // 4. Live API call — routerMode FREE (AgentOrchestrator path)
  const body = {
    prompt: PROMPT,
    messages: [{ role: 'user', content: PROMPT }],
    builderContext: {
      storeId: 's-demo',
      pageId: 'page-home',
      pageName: 'Strona Główna',
      viewport: 'DESKTOP',
      documentNodeCount: 1,
      activeTool: 'SELECT',
      availableCapabilitiesCount: 20,
      sectionsSummary: [{ id: 'sec-hero-init', type: 'hero', label: 'Hero', order: 0, childCount: 0 }],
    },
    routerMode: 'FREE',
    selectedModelId: undefined,
  };

  log('API_REQUEST', { url: `${BASE}/api/builder/copilot`, method: 'POST', routerMode: 'FREE' });

  const t0 = Date.now();
  const res = await fetch(`${BASE}/api/builder/copilot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const durationMs = Date.now() - t0;
  const json = await res.json();

  log('API_RESPONSE', {
    http: res.status,
    durationMs,
    status: json.status,
    provider: json.provider,
    model: json.model,
    routerMode: json.routerMode,
    isFreeModel: json.isFreeModel,
    error: json.error,
    errorType: json.errorType,
    messagePreview: (json.message || '').slice(0, 500),
    toolCallCount: (json.toolCalls || []).length,
    toolCalls: (json.toolCalls || []).map((tc) => ({
      id: tc.id,
      name: tc.name,
      arguments: tc.arguments,
      isMutation: /^(insert_|update_|set_|remove_|move_|delete_|batch_|configure_)/.test(tc.name) || tc.name === 'undo' || tc.name === 'redo',
    })),
  });

  // 5. Classify which failure mode this response represents
  const tcs = json.toolCalls || [];
  const hasMutation = tcs.some((tc) => /^(insert_|update_|set_|remove_|move_|delete_|batch_|configure_)/.test(tc.name) || tc.name === 'undo' || tc.name === 'redo');
  const hasRead = tcs.some((tc) => /^(inspect_|read_|search_|find_|resolve_|get_)/.test(tc.name));

  let classification = 'UNKNOWN';
  let breakPoint = 'unknown';
  if (json.status === 'ERROR' || json.status === 'NOT_CONFIGURED') {
    classification = 'PROVIDER_ERROR';
    breakPoint = 'provider/route — no model turn completed';
  } else if (hasMutation) {
    classification = 'MUTATION_RETURNED';
    breakPoint = 'after model turn N → mutation tool call present (chain OK at provider→HACP handoff)';
  } else if (hasRead && !hasMutation) {
    classification = 'READ_ONLY_ONLY';
    breakPoint = 'AgentOrchestrator/Provider returned read-only toolCalls only — no mutation emitted by model OR provider loop did not continue to insert';
  } else {
    classification = 'TEXT_ONLY_NO_TOOL';
    breakPoint = 'model returned text with zero tool calls — AgentOrchestrator detectPendingMutation may/may not inject';
  }

  log('CLASSIFICATION', {
    classification,
    breakPoint,
    finalStatus: json.status,
    note: hasRead && !hasMutation
      ? 'If provider agent-loop ran, model completed N read turns without ever emitting insert_section_from_library (or loop exited on text-only final turn).'
      : 'See breakPoint.',
  });

  log('FINAL', {
    CODE_CHANGED: 'NO',
    COMMIT: 'NO',
    PUSH: 'NO',
    DEPLOY: 'NO',
  });
}

main().catch((err) => {
  log('TRACE_ERROR', { error: String(err?.message || err) });
  process.exit(1);
});
