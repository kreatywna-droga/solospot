/**
 * PLAN → EXECUTION CONTINUATION → TOOL CALL GATE v1.0 — LIVE REPRODUCTION (FAZA 1)
 *
 * Prompt under test (exact gate wording):
 *   "Zmień Hero. Tytuł ustaw na MARCIN BERNATOWICZ. Usuń MYSHOE."
 *
 * Records the 12-point forensic checklist:
 *   1 user request, 2 selected model, 3 intent, 4 capability surface,
 *   5 tools passed to model, 6 raw model response, 7 tool_call returned?,
 *   8 text/plan returned?, 9 continuation started?, 10 next model turn?,
 *   11 tool call executed?, 12 final status.
 *
 * Channel A: LIVE API  — POST http://localhost:3000/api/builder/copilot (running dev server)
 * Channel B: DIRECT    — AgentOrchestrator + OpenCodeProvider with fetch interception
 *                        (captures EVERY model request/response: tools, tool_calls, continuation)
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
  // ── 1. USER REQUEST ──
  L('1_USER_REQUEST', { prompt: PROMPT });

  // ── 3. INTENT (deterministic) ──
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
  L('4_CAPABILITY_SURFACE', {
    intent: classified.category,
    tools,
    hasInspectNode: tools.includes('inspect_node'),
    hasResolveTarget: tools.includes('resolve_target'),
    hasUpdateNodeProps: tools.includes('update_node_props'),
    hasFindNodes: tools.includes('find_nodes'),
    hasRemoveNode: tools.includes('remove_node') || tools.includes('remove_section'),
  });

  // ── CHANNEL A: LIVE API (running dev server) ──
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
        isMutation: /^(insert_|update_|set_|remove_|move_|delete_|batch_|configure_)/.test(tc.name),
      })),
      messagePreview: (json.message || '').slice(0, 500),
      error: json.error,
    });
  } catch (err) {
    L('CHANNEL_A_ERROR', { error: String(err?.message || err) });
  }

  // ── CHANNEL B: DIRECT with fetch interception (raw model forensics) ──
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
      turns.push({ turn, dir: 'REQUEST', model: body.model, toolsSent: toolNames });
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
          dir: 'RESPONSE',
          model: data.model,
          finishReason: choice?.finish_reason,
          content: choice?.message?.content || '',
          toolCalls: tcs,
        });
        L('MODEL_RESPONSE', {
          turn,
          model: data.model,
          finishReason: choice?.finish_reason,
          contentPreview: (choice?.message?.content || '').slice(0, 500),
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
    const responses = turns.filter((t) => t.dir === 'RESPONSE');
    const first = responses[0];
    const hasMutation = orchResult.toolCalls.some((tc) =>
      /^(insert_|update_|set_|remove_|move_|delete_|batch_|configure_)/.test(tc.name)
    );

    L('CHANNEL_B_ORCHESTRATED', {
      status: orchResult.status,
      intent: orchResult.intent,
      modelUsed: orchResult.modelUsed,
      durationMs,
      toolCalls: orchResult.toolCalls.map((tc) => ({
        name: tc.name,
        arguments: tc.arguments,
        isMutation: /^(insert_|update_|set_|remove_|move_|delete_|batch_|configure_)/.test(tc.name),
      })),
      messagePreview: (orchResult.message || '').slice(0, 500),
      error: orchResult.error,
    });

    L('FORENSIC_12PT', {
      '1_userRequest': PROMPT,
      '2_selectedModel': orchResult.modelUsed,
      '3_intent': classified.category,
      '4_capabilitySurface': tools,
      '5_toolsPassedToModel': turns.find((t) => t.dir === 'REQUEST')?.toolsSent || [],
      '6_rawModelResponse': (first?.content || '').slice(0, 600),
      '7_modelReturnedToolCall': (first?.toolCalls?.length || 0) > 0,
      '8_modelReturnedTextPlan': (first?.toolCalls?.length || 0) === 0 && Boolean(first?.content),
      '9_continuationStarted': responses.length > 1,
      '10_nextModelTurnExecuted': responses.length > 1,
      '11_toolCallExecuted': orchResult.toolCalls.length > 0,
      '12_finalStatus': orchResult.status,
      modelTurns: responses.length,
      finalToolCallCount: orchResult.toolCalls.length,
      finalHasMutation: hasMutation,
      planWithoutExecution:
        (first?.toolCalls?.length || 0) === 0 && orchResult.toolCalls.length === 0,
    });
  } finally {
    globalThis.fetch = realFetch;
  }
}

main().catch((err) => {
  L('TRACE_ERROR', { error: String(err?.message || err), stack: String(err?.stack || '').slice(0, 800) });
  process.exit(1);
});
