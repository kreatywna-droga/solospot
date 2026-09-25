/**
 * PLAN → EXECUTION CONTINUATION → TOOL CALL GATE v1.0 — LIVE REPRODUCTION (Faza 1)
 *
 * Prompt under test (exact):
 *   "Zmień Hero. Tytuł ustaw na MARCIN BERNATOWICZ. Usuń MYSHOE."
 *
 * Captures (12-point forensic record):
 *   1 user request, 2 selected model, 3 intent, 4 capability surface,
 *   5 tools passed to model, 6 raw model response, 7 tool_call present?,
 *   8 text/plan present?, 9 continuation started?, 10 next model turn?,
 *   11 tool call executed?, 12 final status.
 *
 * Two channels:
 *   A) LIVE API  POST /api/builder/copilot (running dev server)
 *   B) DIRECT    AgentOrchestrator + OpenCodeProvider with fetch interception
 *                (captures EVERY upstream chat/completions request/response)
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
const MUTATION_RE = /^(insert_|update_|set_|remove_|move_|delete_|batch_|configure_)/;

function L(step, data) {
  console.log(JSON.stringify({ step, ...data }));
}

function buildFixtureContext() {
  return {
    storeId: 's-myshoe',
    pageId: 'page-home',
    pageName: 'Strona Główna',
    viewport: 'DESKTOP',
    documentNodeCount: 2,
    activeTool: 'SELECT',
    availableCapabilitiesCount: 20,
    sectionsSummary: [
      { id: 'sec_hero', type: 'hero', label: 'Hero', order: 0, childCount: 2 },
      { id: 'sec_features', type: 'section', label: 'Features', order: 1, childCount: 0 },
    ],
    nodesIndex: [
      {
        id: 'sec_hero',
        type: 'hero',
        label: 'Hero',
        sectionId: 'sec_hero',
        parentId: null,
        props: { title: 'MYSHOE', subtitle: 'Premium sneakers' },
      },
      {
        id: 'node_h1',
        type: 'heading',
        label: 'H1',
        sectionId: 'sec_hero',
        parentId: 'sec_hero',
        props: { text: 'MYSHOE' },
      },
      {
        id: 'node_sub',
        type: 'text',
        label: 'Subtitle',
        sectionId: 'sec_hero',
        parentId: 'sec_hero',
        props: { text: 'Nowa kolekcja' },
      },
      {
        id: 'sec_features',
        type: 'section',
        label: 'Features',
        sectionId: 'sec_features',
        parentId: null,
        props: {},
      },
    ],
  };
}

async function main() {
  // ── 1. USER REQUEST ──
  L('1_USER_REQUEST', { prompt: PROMPT });

  // ── 3. INTENT (deterministic, no network) ──
  const { IntentClassifier } = await import('../src/lib/ai/IntentClassifier.ts');
  const { ToolSurfaceSelector } = await import('../src/lib/ai/ToolSurfaceSelector.ts');
  const classified = IntentClassifier.classify(PROMPT, {
    hasSelection: false,
    documentNodeCount: 2,
  });
  const surface = ToolSurfaceSelector.getToolNamesForIntent(classified.category);
  L('3_INTENT', {
    category: classified.category,
    confidence: classified.confidence,
    targets: classified.targets,
    reasoning: classified.reasoning,
  });
  L('4_CAPABILITY_SURFACE', {
    intent: classified.category,
    tools: surface,
    hasInspectNode: surface.includes('inspect_node'),
    hasResolveTarget: surface.includes('resolve_target'),
    hasUpdateNodeProps: surface.includes('update_node_props'),
    hasFindNodes: surface.includes('find_nodes'),
    hasRemoveNode: surface.includes('remove_node') || surface.includes('remove_section'),
    capabilityComplete: ['inspect_node', 'resolve_target', 'update_node_props'].every((t) =>
      surface.includes(t)
    ),
  });

  // ── CHANNEL A: LIVE API ──
  L('CHANNEL_A_START', { url: `${BASE}/api/builder/copilot`, routerMode: 'FREE' });
  try {
    const t0 = Date.now();
    const res = await fetch(`${BASE}/api/builder/copilot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: PROMPT,
        messages: [{ role: 'user', content: PROMPT }],
        builderContext: buildFixtureContext(),
        routerMode: 'FREE',
      }),
      signal: AbortSignal.timeout(120000),
    });
    const json = await res.json();
    const tcs = json.toolCalls || [];
    L('CHANNEL_A_API_RESPONSE', {
      http: res.status,
      durationMs: Date.now() - t0,
      status: json.status,
      provider: json.provider,
      model: json.model,
      routerMode: json.routerMode,
      toolCallCount: tcs.length,
      toolCalls: tcs.map((tc) => ({
        name: tc.name,
        arguments: tc.arguments,
        isMutation: MUTATION_RE.test(tc.name),
      })),
      hasMutation: tcs.some((tc) => MUTATION_RE.test(tc.name)),
      messagePreview: (json.message || '').slice(0, 600),
      error: json.error,
    });
  } catch (err) {
    L('CHANNEL_A_ERROR', { error: String(err?.message || err) });
  }

  // ── CHANNEL B: DIRECT with fetch interception (raw model turns) ──
  L('CHANNEL_B_START', { note: 'AgentOrchestrator + OpenCodeProvider, every chat/completions captured' });
  const { AgentOrchestrator } = await import('../src/lib/ai/AgentOrchestrator.ts');
  const { OpenCodeProvider } = await import('../src/lib/ai/OpenCodeProvider.ts');

  const provider = new OpenCodeProvider();
  const realFetch = globalThis.fetch;
  let turn = 0;
  const turns = [];

  globalThis.fetch = async (url, init) => {
    const isLLM = typeof url === 'string' && url.includes('/chat/completions');
    let body = {};
    if (isLLM) {
      turn++;
      try {
        body = JSON.parse(init?.body || '{}');
      } catch {}
      const toolNames = (body.tools || []).map((t) => t.function?.name).filter(Boolean);
      turns.push({
        turn,
        direction: 'REQUEST',
        model: body.model,
        toolCount: toolNames.length,
        tools: toolNames,
        messageCount: (body.messages || []).length,
        roles: (body.messages || []).map((m) => m.role),
      });
    }
    const res = await realFetch(url, init);
    if (isLLM) {
      const clone = res.clone();
      try {
        const data = await clone.json();
        const choice = data.choices?.[0];
        const rawToolCalls = (choice?.message?.tool_calls || []).map((tc) => ({
          name: tc.function?.name,
          arguments: tc.function?.arguments,
        }));
        turns.push({
          turn,
          direction: 'RESPONSE',
          http: res.status,
          model: data.model,
          finishReason: choice?.finish_reason,
          rawContent: (choice?.message?.content || '').slice(0, 800),
          toolCalls: rawToolCalls,
          toolCallCount: rawToolCalls.length,
        });
      } catch (e) {
        turns.push({ turn, direction: 'RESPONSE_PARSE_ERROR', error: String(e?.message || e) });
      }
    }
    return res;
  };

  let orchResult = null;
  let orchError = null;
  try {
    const orch = new AgentOrchestrator({
      generateWithTools: (req) => provider.generateWithTools(req),
    });
    const ctx = buildFixtureContext();
    const t1 = Date.now();
    orchResult = await orch.orchestrate(
      {
        prompt: PROMPT,
        messages: [{ role: 'user', content: PROMPT }],
        builderContext: ctx,
        routerMode: 'FREE',
      },
      {
        documentNodeCount: ctx.documentNodeCount,
        hasSelection: false,
        sectionsSummary: ctx.sectionsSummary,
      }
    );
    L('CHANNEL_B_ORCHESTRATOR', {
      status: orchResult.status,
      intent: orchResult.intent,
      modelUsed: orchResult.modelUsed,
      durationMs: Date.now() - t1,
      toolCalls: orchResult.toolCalls.map((tc) => ({
        name: tc.name,
        arguments: tc.arguments,
        isMutation: MUTATION_RE.test(tc.name),
      })),
      controllerInjected: orchResult.controllerInjected || false,
      messagePreview: (orchResult.message || '').slice(0, 600),
      error: orchResult.error,
    });
  } catch (err) {
    orchError = String(err?.message || err);
    L('CHANNEL_B_ORCHESTRATOR_ERROR', { error: orchError });
  } finally {
    globalThis.fetch = realFetch;
  }

  // ── Per-turn forensics (Phases 3 & 4) ──
  for (const t of turns) {
    L(`MODEL_TURN_${t.direction}`, t);
  }

  const responses = turns.filter((t) => t.direction === 'RESPONSE');
  const first = responses[0];
  const anyToolCall = responses.some((r) => r.toolCallCount > 0);
  const continuationTurns = responses.length - 1;

  L('PHASE3_MODEL_RESPONSE_FORENSICS', {
    totalModelTurns: responses.length,
    firstTurnToolCallCount: first?.toolCallCount ?? null,
    firstTurnIsTextOnly: (first?.toolCallCount ?? 0) === 0,
    firstTurnContentPreview: first?.rawContent?.slice(0, 400) ?? null,
    anyToolCallAcrossTurns: anyToolCall,
    responseType:
      !first
        ? 'NO_RESPONSE'
        : first.toolCallCount > 0 && first.rawContent
          ? 'TOOL_CALL + TEXT'
          : first.toolCallCount > 0
            ? 'TOOL_CALL'
            : 'TEXT RESPONSE',
    planWithoutExecution:
      (first?.toolCallCount ?? 0) === 0 && /znajd|zmieni|usun|wykon|najpierw|plan/i.test(first?.rawContent || ''),
  });

  L('PHASE4_CONTINUATION_FORENSICS', {
    continuationModelTurns: continuationTurns,
    continuationRan: continuationTurns > 0,
    note: 'Provider continuation only triggers when FIRST response contains tool_calls (read-only). Text-only first response => loop never entered.',
    loopCondition: 'while (toolCalls.length > 0 && iteration < MAX_AGENT_ITERATIONS=8)',
    finalStatus: orchResult?.status ?? (orchError ? 'ERROR' : 'UNKNOWN'),
    finalToolCallCount: orchResult?.toolCalls?.length ?? null,
    finalHasMutation: (orchResult?.toolCalls || []).some((tc) => MUTATION_RE.test(tc.name)),
  });

  const finalToolCalls = orchResult?.toolCalls || [];
  const executedMutation = finalToolCalls.some((tc) => MUTATION_RE.test(tc.name));
  L('PHASE2_FIRST_BREAK', {
    breakPoint:
      orchResult?.status === 'ERROR'
        ? 'H — provider error (see error)'
        : finalToolCalls.length === 0 && !orchResult?.controllerInjected
          ? (first && first.toolCallCount === 0
              ? 'A or B — model returned TEXT/PLAN with zero tool_calls; NO continuation executed (loop condition false); orchestrator detectPendingMutation did not inject for this intent'
              : 'B — tool calls existed but none surfaced to orchestrator')
          : !executedMutation
            ? 'G — tool call present but read-only (no mutation reached HACP)'
            : 'NONE — mutation tool call produced',
    modelGeneratedToolCall: anyToolCall,
    continuationExecuted: continuationTurns > 0,
    mutationReachedOrchestrator: executedMutation,
    finalStatus: orchResult?.status ?? 'ERROR',
    antiFakeSuccess:
      finalToolCalls.length === 0
        ? 'orchestrator toolCalls=[] → HACP CLARIFY (no fake SUCCESS at bridge level)'
        : 'toolCalls present — HACP will execute',
  });

  L('FINAL_RECORD', {
    userRequest: PROMPT,
    selectedModel: orchResult?.modelUsed ?? first?.model ?? turns.find((t) => t.direction === 'REQUEST')?.model ?? null,
    intent: classified.category,
    capabilitySurface: surface,
    toolsPassedToModel: turns.find((t) => t.direction === 'REQUEST')?.tools ?? [],
    rawFirstResponsePreview: first?.rawContent?.slice(0, 400) ?? null,
    modelReturnedToolCall: first?.toolCallCount > 0,
    modelReturnedTextPlan: (first?.toolCallCount ?? 0) === 0 && Boolean(first?.rawContent),
    continuationStarted: continuationTurns > 0,
    nextModelTurnExecuted: responses.length > 1,
    toolCallExecuted: executedMutation,
    finalStatus: orchResult?.status ?? 'ERROR',
  });
}

main().catch((err) => {
  L('TRACE_ERROR', { error: String(err?.message || err), stack: String(err?.stack || '').slice(0, 600) });
  process.exit(1);
});
