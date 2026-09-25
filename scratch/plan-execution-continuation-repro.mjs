/**
 * PLAN → EXECUTION CONTINUATION → TOOL CALL GATE v1.0 — LIVE REPRODUCTION (Faza 1)
 *
 * Exact prompt under test:
 *   "Zmień Hero. Tytuł ustaw na MARCIN BERNATOWICZ. Usuń MYSHOE."
 *
 * 12-point forensic record captured:
 *   1 user request, 2 selected model, 3 intent, 4 capability surface,
 *   5 tools passed to model, 6 raw model response, 7 tool_call returned?,
 *   8 text/plan returned?, 9 continuation started?, 10 next model turn?,
 *   11 tool call executed?, 12 final status.
 *
 * Two channels:
 *   A) LIVE API  — POST http://localhost:3000/api/builder/copilot (running dev server)
 *   B) DIRECT    — AgentOrchestrator + OpenCodeProvider with fetch interception
 *                  (captures EVERY model turn: tools, tool_calls, continuation)
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

const PROMPT = 'Zmień Hero. Tytuł ustaw na MARCIN BERNATOWICZ. Usuń MYSHOE.';
const BASE = process.env.PW_BASE || 'http://localhost:3000';

function L(step, data) {
  console.log(JSON.stringify({ step, ...data }));
}

function buildNodesIndex() {
  return [
    { id: 'sec_hero', type: 'hero', label: 'Hero', sectionId: 'sec_hero', parentId: null, props: { title: 'MYSHOE', subtitle: 'Premium sneakers' } },
    { id: 'node_h1', type: 'heading', label: 'H1', sectionId: 'sec_hero', parentId: 'sec_hero', props: { text: 'MYSHOE' } },
    { id: 'node_sub', type: 'text', label: 'Subtitle', sectionId: 'sec_hero', parentId: 'sec_hero', props: { text: 'Nowa kolekcja' } },
    { id: 'sec_features', type: 'section', label: 'Features', sectionId: 'sec_features', parentId: null, props: {} },
  ];
}

function buildBuilderContext() {
  return {
    storeId: 's-myshoe',
    pageId: 'page-home',
    pageName: 'Strona Główna',
    viewport: 'DESKTOP',
    documentNodeCount: 2,
    activeTool: 'SELECT',
    availableCapabilitiesCount: 20,
    sectionsSummary: [
      { id: 'sec_hero', type: 'hero', label: 'Hero', order: 0, childCount: 3 },
      { id: 'sec_features', type: 'section', label: 'Features', order: 1, childCount: 0 },
    ],
    nodesIndex: buildNodesIndex(),
  };
}

async function main() {
  // 1. USER REQUEST
  L('1_USER_REQUEST', { prompt: PROMPT });

  // 3. INTENT
  const { IntentClassifier } = await import('../src/lib/ai/IntentClassifier.ts');
  const { ToolSurfaceSelector } = await import('../src/lib/ai/ToolSurfaceSelector.ts');
  const classified = IntentClassifier.classify(PROMPT, {
    hasSelection: false,
    documentNodeCount: 2,
  });
  const tools = ToolSurfaceSelector.getToolNamesForIntent(classified.category);
  L('3_INTENT', {
    category: classified.category,
    confidence: classified.confidence,
    targets: classified.targets,
    reasoning: classified.reasoning,
  });

  // 4. CAPABILITY SURFACE
  L('4_CAPABILITY_SURFACE', {
    intent: classified.category,
    tools,
    hasInspectNode: tools.includes('inspect_node'),
    hasResolveTarget: tools.includes('resolve_target'),
    hasUpdateNodeProps: tools.includes('update_node_props'),
    hasFindNodes: tools.includes('find_nodes'),
    hasRemoveNode: tools.includes('remove_node') || tools.includes('remove_section'),
    hasInspectPageStructure: tools.includes('inspect_page_structure'),
    requiredTrioPresent:
      tools.includes('inspect_node') &&
      tools.includes('resolve_target') &&
      tools.includes('update_node_props'),
  });

  // CHANNEL A: LIVE API (running dev server)
  try {
    const t0 = Date.now();
    const res = await fetch(`${BASE}/api/builder/copilot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: PROMPT,
        messages: [{ role: 'user', content: PROMPT }],
        builderContext: buildBuilderContext(),
        routerMode: 'FREE',
      }),
      signal: AbortSignal.timeout(90000),
    });
    const json = await res.json();
    L('CHANNEL_A_LIVE_API', {
      http: res.status,
      durationMs: Date.now() - t0,
      status: json.status,
      provider: json.provider,
      model: json.model,
      routerMode: json.routerMode,
      toolCallCount: (json.toolCalls || []).length,
      toolCalls: (json.toolCalls || []).map((tc) => ({
        name: tc.name,
        arguments: tc.arguments,
        isMutation: /^(insert_|update_|set_|remove_|move_|delete_|batch_|configure_)/.test(tc.name) || tc.name === 'undo' || tc.name === 'redo',
      })),
      messagePreview: (json.message || '').slice(0, 500),
      error: json.error,
      errorType: json.errorType,
    });
  } catch (err) {
    L('CHANNEL_A_ERROR', { error: String(err?.message || err) });
  }

  // CHANNEL B: DIRECT — AgentOrchestrator + OpenCodeProvider with fetch interception
  const { AgentOrchestrator } = await import('../src/lib/ai/AgentOrchestrator.ts');
  const { OpenCodeProvider } = await import('../src/lib/ai/OpenCodeProvider.ts');

  const provider = new OpenCodeProvider();
  const realFetch = globalThis.fetch;
  let turn = 0;
  const turns = [];

  globalThis.fetch = async (url, init) => {
    const isLLM = typeof url === 'string' && url.includes('/chat/completions');
    if (isLLM) {
      turn++;
      let body = {};
      try {
        body = JSON.parse(init?.body || '{}');
      } catch {}
      const toolNames = (body.tools || []).map((t) => t.function?.name || t.name).filter(Boolean);
      turns.push({ turn, phase: 'REQUEST', model: body.model, toolsSent: toolNames });
      L('MODEL_REQUEST', { turn, model: body.model, toolsSent: toolNames });
    }
    const res = await realFetch(url, init);
    if (isLLM) {
      const clone = res.clone();
      try {
        const data = await clone.json();
        const choice = data.choices?.[0];
        const tcs = (choice?.message?.tool_calls || []).map((tc) => ({
          id: tc.id,
          name: tc.function?.name,
          arguments: tc.function?.arguments,
        }));
        turns.push({
          turn,
          phase: 'RESPONSE',
          model: data.model,
          finishReason: choice?.finish_reason,
          content: choice?.message?.content || '',
          toolCalls: tcs,
        });
        L('MODEL_RESPONSE', {
          turn,
          model: data.model,
          finishReason: choice?.finish_reason,
          contentPreview: (choice?.message?.content || '').slice(0, 600),
          toolCallCount: tcs.length,
          toolCalls: tcs,
        });
      } catch (e) {
        L('MODEL_RESPONSE_PARSE_ERROR', { turn, error: String(e?.message || e) });
      }
    }
    return res;
  };

  try {
    const orch = new AgentOrchestrator({ generateWithTools: (req) => provider.generateWithTools(req) });
    const t0 = Date.now();
    const orchResult = await orch.orchestrate(
      {
        prompt: PROMPT,
        messages: [{ role: 'user', content: PROMPT }],
        builderContext: buildBuilderContext(),
        routerMode: 'FREE',
      },
      {
        documentNodeCount: 2,
        hasSelection: false,
        sectionsSummary: buildBuilderContext().sectionsSummary,
      }
    );
    const durationMs = Date.now() - t0;
    const responses = turns.filter((t) => t.phase === 'RESPONSE');
    const first = responses[0];
    const toolCalls = orchResult.toolCalls || [];
    const hasMutation = toolCalls.some((tc) =>
      /^(insert_|update_|set_|remove_|move_|delete_|batch_|configure_)/.test(tc.name)
    );

    L('CHANNEL_B_ORCHESTRATOR', {
      status: orchResult.status,
      intent: orchResult.intent,
      modelUsed: orchResult.modelUsed,
      durationMs,
      modelTurns: responses.length,
      toolCalls: toolCalls.map((tc) => ({
        name: tc.name,
        arguments: tc.arguments,
        isMutation: /^(insert_|update_|set_|remove_|move_|delete_|batch_|configure_)/.test(tc.name),
      })),
      controllerInjected: Boolean(orchResult.controllerInjected),
      messagePreview: (orchResult.message || '').slice(0, 500),
      error: orchResult.error,
    });

    // 12-point forensic record
    const firstToolCalls = first?.toolCalls || [];
    L('FORENSIC_12_POINT', {
      '1_userRequest': PROMPT,
      '2_selectedModel': orchResult.modelUsed,
      '3_intent': classified.category,
      '4_capabilitySurface': tools,
      '5_toolsPassedToModel': turns.find((t) => t.phase === 'REQUEST')?.toolsSent || [],
      '6_rawModelResponse': (first?.content || '').slice(0, 800),
      '7_modelReturnedToolCall': firstToolCalls.length > 0,
      '8_modelReturnedTextPlan': firstToolCalls.length === 0 && Boolean(first?.content),
      '9_continuationStarted': responses.length > 1,
      '10_nextModelTurnExecuted': responses.length > 1,
      '11_toolCallExecuted': toolCalls.length > 0,
      '12_finalStatus': orchResult.status,
      finalToolCallCount: toolCalls.length,
      finalHasMutation: hasMutation,
      planWithoutExecution: firstToolCalls.length === 0 && toolCalls.length === 0,
    });
  } finally {
    globalThis.fetch = realFetch;
  }
}

main().catch((err) => {
  L('TRACE_ERROR', { error: String(err?.message || err), stack: String(err?.stack || '').slice(0, 800) });
  process.exit(1);
});
