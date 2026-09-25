/**
 * FULL READ→WRITE EXECUTION TRACE — forensic only, no app code changes.
 * Captures: intent, exact tool payload, each model turn, tool results,
 * HacpBridge outcome, BuilderDocument before/after, verification.
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env.local so OPENCODE_API_KEY is present outside Next.js
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env.local');
try {
  const raw = readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m && !(m[1] in process.env)) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
} catch {
  // ignore missing env
}

const { IntentClassifier } = await import('../src/lib/ai/IntentClassifier.ts');
import { ToolSurfaceSelector } from '../src/lib/ai/ToolSurfaceSelector.ts';
import { ExecutionPlanManager } from '../src/lib/ai/ExecutionPlan.ts';
import { AgentOrchestrator } from '../src/lib/ai/AgentOrchestrator.ts';
import { OpenCodeProvider } from '../src/lib/ai/OpenCodeProvider.ts';
import { BUILDER_TOOL_DEFINITIONS } from '../src/lib/ai/BuilderToolDefinitions.ts';
import {
  HacpBridge,
  resolveToolExecutionOutcome,
} from '../src/lib/hacp/HacpBridge.ts';

const PROMPT = 'Dodaj sekcję testimonials.';

function L(step, data) {
  console.log(JSON.stringify({ step, ...data }));
}

function countNodes(node) {
  let n = 1;
  if (node.children) for (const c of node.children) n += countNodes(c);
  return n;
}

function docStats(doc) {
  const pages = doc.pages || [];
  let sections = 0;
  let nodes = 0;
  for (const p of pages) {
    sections += (p.sections || []).length;
    for (const s of p.sections || []) nodes += countNodes(s);
  }
  return {
    pageCount: pages.length,
    sectionCount: sections,
    nodeCount: nodes,
    sectionIds: pages.flatMap((p) => (p.sections || []).map((s) => s.id)),
    sectionTypes: pages.flatMap((p) => (p.sections || []).map((s) => s.type)),
  };
}

async function main() {
  L('1_USER_REQUEST', { prompt: PROMPT });

  // ── GATE prep: intent + surface ──
  const classified = IntentClassifier.classify(PROMPT, {
    hasSelection: false,
    documentNodeCount: 1,
  });
  L('3_INTENT_CLASSIFICATION', {
    category: classified.category,
    confidence: classified.confidence,
    targets: classified.targets,
    reasoning: classified.reasoning,
    evidence: 'IntentClassifier.classify(PROMPT) — direct invocation',
  });

  const surfaceTools = ToolSurfaceSelector.getToolsForIntent(classified.category);
  const surfaceNames = ToolSurfaceSelector.getToolNamesForIntent(classified.category);
  L('2_TOOL_SURFACE', {
    intent: classified.category,
    toolCount: surfaceTools.length,
    toolNames: surfaceNames,
    readTools: surfaceNames.filter((n) => ToolSurfaceSelector.isMutationTool(n) === false),
    mutationTools: surfaceNames.filter((n) => ToolSurfaceSelector.isMutationTool(n) === true),
    insert_section_from_library_in_surface: surfaceNames.includes('insert_section_from_library'),
    evidence:
      'ToolSurfaceSelector.ts TOOL_SURFACES INSERT_SECTION tools[] + getToolsForIntent filter against BUILDER_TOOL_DEFINITIONS',
    resolvedSchemas: surfaceTools.map((t) => ({
      name: t.name,
      hasParameters: Boolean(t.parameters),
      type: t.parameters?.type,
      required: t.parameters?.required,
    })),
  });

  const plan = ExecutionPlanManager.createPlan(classified.category, PROMPT, classified.targets, classified.parameters);
  L('3b_EXECUTION_PLAN', {
    planId: plan.id,
    steps: plan.steps.map((s) => ({ action: s.action, status: s.status })),
    evidence: 'ExecutionPlanManager.createPlan(INSERT_SECTION)',
  });

  // ── Instrument provider: capture exact payload tools ──
  const provider = new OpenCodeProvider();
  L('PROVIDER', {
    id: provider.id,
    configured: provider.isConfigured(),
    note: 'isConfigured checks OPENCODE_API_KEY present',
  });

  // Monkey-patch fetch to capture upstream request payloads (read-only observation)
  const realFetch = globalThis.fetch;
  let modelReqIndex = 0;
  const capturedModelRequests = [];
  const capturedModelResponses = [];
  globalThis.fetch = async (url, init) => {
    const isLLM =
      typeof url === 'string' &&
      (url.includes('/chat/completions') || url.includes('/messages'));
    if (isLLM) {
      modelReqIndex++;
      const idx = modelReqIndex;
      let body = null;
      try {
        body = JSON.parse(init?.body || '{}');
      } catch {
        body = { parseError: true };
      }
      const toolNames =
        (body.tools || []).map((t) => t.function?.name || t.name).filter(Boolean);
      capturedModelRequests.push({
        index: idx,
        url: String(url),
        model: body.model,
        messageCount: Array.isArray(body.messages) ? body.messages.length : 0,
        toolChoice: body.tool_choice,
        maxTokens: body.max_tokens,
        temperature: body.temperature,
        toolsSentCount: toolNames.length,
        toolsSent: toolNames,
        insert_section_from_library_sent: toolNames.includes('insert_section_from_library'),
        toolRolesInMessages: Array.isArray(body.messages)
          ? body.messages.map((m) => ({
              role: m.role,
              hasToolCalls: Boolean(m.tool_calls && m.tool_calls.length),
              toolCallNames: (m.tool_calls || []).map((tc) => tc.function?.name),
              contentPreview: typeof m.content === 'string' ? m.content.slice(0, 200) : Array.isArray(m.content) ? '[parts]' : m.content,
            }))
          : [],
      });
      L('MODEL_REQUEST', {
        index: idx,
        model: body.model,
        toolsSentCount: toolNames.length,
        toolsSent: toolNames,
        insert_section_from_library_sent: toolNames.includes('insert_section_from_library'),
      });
    }
    const res = await realFetch(url, init);
    // clone for logging
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
        capturedModelResponses.push({
          index: modelReqIndex,
          http: res.status,
          model: data.model,
          finishReason: choice?.finish_reason,
          contentPreview: (choice?.message?.content || '').slice(0, 300),
          toolCalls: tcs,
          toolCallNames: tcs.map((t) => t.name),
        });
        L('MODEL_RESPONSE', {
          index: modelReqIndex,
          http: res.status,
          model: data.model,
          finishReason: choice?.finish_reason,
          contentPreview: (choice?.message?.content || '').slice(0, 300),
          toolCalls: tcs,
        });
      } catch (e) {
        L('MODEL_RESPONSE_PARSE_ERROR', { index: modelReqIndex, error: String(e?.message || e) });
      }
    }
    return res;
  };

  // ── Run real orchestration ──
  const orchestrator = new AgentOrchestrator({
    generateWithTools: (req) => provider.generateWithTools(req),
  });

  // Capture tools AgentOrchestrator passes to provider
  const orchWrapped = {
    generateWithTools: async (req) => {
      L('ORCHESTRATOR_TO_PROVIDER', {
        routerMode: req.routerMode,
        toolsCount: req.tools?.length || 0,
        tools: (req.tools || []).map((t) => t.name),
        insert_section_from_library_in_request: (req.tools || []).some(
          (t) => t.name === 'insert_section_from_library'
        ),
        prompt: req.prompt,
        evidence: 'AgentOrchestrator.orchestrate step 4 minimalRequest.tools',
      });
      return provider.generateWithTools(req);
    },
  };
  const orch2 = new AgentOrchestrator(orchWrapped);

  const t0 = Date.now();
  const orchResult = await orch2.orchestrate(
    {
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
        sectionsSummary: [
          { id: 'sec-hero-init', type: 'hero', label: 'Hero', order: 0, childCount: 0 },
        ],
      },
      routerMode: 'FREE',
    },
    {
      documentNodeCount: 1,
      hasSelection: false,
      sectionsSummary: [{ id: 'sec-hero-init', type: 'hero', label: 'Hero' }],
    }
  );
  const durationMs = Date.now() - t0;

  L('4_ORCHESTRATOR_RESULT', {
    status: orchResult.status,
    intent: orchResult.intent,
    modelUsed: orchResult.modelUsed,
    durationMs,
    controllerInjected: Boolean(orchResult.controllerInjected),
    planSteps: orchResult.plan.steps.map((s) => ({
      action: s.action,
      status: s.status,
    })),
    planCurrentStepIndex: orchResult.plan.currentStepIndex,
    planStatus: orchResult.plan.status,
    toolCallCount: orchResult.toolCalls.length,
    toolCalls: orchResult.toolCalls.map((tc) => ({
      id: tc.id,
      name: tc.name,
      arguments: tc.arguments,
      isMutation: ToolSurfaceSelector.isMutationTool(tc.name),
    })),
    messagePreview: (orchResult.message || '').slice(0, 400),
    error: orchResult.error,
  });

  // ── GATE 2: model decision ──
  const allResponseToolNames = capturedModelResponses.flatMap((r) => r.toolCallNames);
  const mutationCalled = orchResult.toolCalls.some((tc) =>
    ToolSurfaceSelector.isMutationTool(tc.name)
  );
  const insertCalled = allResponseToolNames.includes('insert_section_from_library');
  L('GATE2_MODEL_DECISION', {
    insert_section_from_library_available_in_surface:
      surfaceNames.includes('insert_section_from_library'),
    insert_section_from_library_sent_in_model_requests: capturedModelRequests.map((r) => ({
      index: r.index,
      sent: r.insert_section_from_library_sent,
    })),
    model_turns_completed: capturedModelResponses.length,
    model_tool_calls_all_turns: capturedModelResponses.map((r) => ({
      index: r.index,
      toolCallNames: r.toolCallNames,
      finishReason: r.finishReason,
    })),
    mutation_tool_returned_to_orchestrator: mutationCalled,
    insert_section_from_library_ever_called: insertCalled,
    classification_gate2: !surfaceNames.includes('insert_section_from_library')
      ? 'A_TOOL_NOT_EXPOSED'
      : !insertCalled && orchResult.toolCalls.every((tc) => !ToolSurfaceSelector.isMutationTool(tc.name))
      ? 'A2_OR_B_MODEL_DID_NOT_SELECT_MUTATION'
      : insertCalled && !mutationCalled
      ? 'C_GENERATED_BUT_NOT_EXECUTED'
      : insertCalled && mutationCalled
      ? 'MUTATION_RETURNED'
      : 'UNKNOWN',
    evidence_note:
      'Gate2 decision uses capturedModelRequests (exact payload tools[]) + capturedModelResponses (exact tool_calls) + orchResult.toolCalls',
  });

  // ── GATE 3: execution loop behavior ──
  const loopBehavior = {
    model_requests_made: capturedModelRequests.length,
    model_responses_received: capturedModelResponses.length,
    read_only_results_fed_back: capturedModelRequests.some((r) =>
      r.toolRolesInMessages.some((m) => m.role === 'tool')
    ),
    final_tool_calls_from_orchestrator: orchResult.toolCalls.map((tc) => tc.name),
    has_mutation_in_final: orchResult.toolCalls.some((tc) =>
      ToolSurfaceSelector.isMutationTool(tc.name)
    ),
    chain:
      orchResult.toolCalls.some((tc) => ToolSurfaceSelector.isMutationTool(tc.name))
        ? 'READ → MODEL → WRITE (mutation present in final toolCalls)'
        : capturedModelResponses.length > 1
        ? 'READ → MODEL → (no WRITE selected on subsequent turn)'
        : capturedModelRequests.length > 1
        ? 'READ → MODEL_REQUEST_2 sent (response may have failed/timeout) → no WRITE'
        : 'READ → STOP (single model response only)',
    step_limit: 'MAX_AGENT_ITERATIONS=8 (OpenCodeProvider.ts)',
    read_only_guard:
      'READ_ONLY_TOOLS set executes search/inspect locally; mutations break loop for HacpBridge',
    orchestrator_awaits_next_turn: false,
    orchestrator_note:
      'AgentOrchestrator makes ONE generateWithTools call; multi-turn lives inside OpenCodeProvider agent loop only',
    detect_pending_mutation_ran: orchResult.toolCalls.length === 0,
    controller_injected: Boolean(orchResult.controllerInjected),
    evidence:
      'capturedModelRequests/Responses counts + AgentOrchestrator.ts:121 single await + OpenCodeProvider.ts:352 while loop',
  };
  L('GATE3_EXECUTION_LOOP', loopBehavior);

  // ── GATE 4/5: HacpBridge + BuilderDocument ──
  // Build a minimal real BuilderDocument-like structure for executeToolCall
  const bridge = HacpBridge.getInstance();
  const builderDocument = {
    metadata: { storeSlug: 's-demo' },
    theme: { primaryColor: '#D9A86C', secondaryColor: '#F2C27F', font: 'Inter' },
    pages: [
      {
        id: 'page-home',
        name: 'Strona Główna',
        sections: [
          {
            id: 'sec-hero-init',
            type: 'hero',
            label: 'Hero',
            props: {},
            styles: {},
            children: [],
          },
        ],
      },
    ],
  };
  const before = docStats(builderDocument);
  L('9_BUILDER_DOCUMENT_BEFORE', before);

  const activePageId = 'page-home';
  const toolCallsFromModel = orchResult.toolCalls;
  const commands = [];
  const toolExecResults = [];
  let lastVerification = null;
  let allPassed = true;

  L('HACP_TRACE', {
    phase: 'TOOL_CALLS_RECEIVED',
    toolCallCount: toolCallsFromModel.length,
    toolNames: toolCallsFromModel.map((tc) => tc.name),
    aiStatus: orchResult.status,
    note: 'HacpBridge.executePlan receives AICopilotResponse from /api/builder/copilot',
  });

  for (const tc of toolCallsFromModel) {
    L('HACP_TRACE', { phase: 'EXECUTING_TOOL', toolName: tc.name, toolArgs: tc.arguments });
    const exec = await bridge.executeToolCall(tc, builderDocument, activePageId);
    lastVerification = exec.verification;
    if (exec.command) commands.push(exec.command);
    if (exec.status !== 'EXECUTED') allPassed = false;
    toolExecResults.push({
      name: tc.name,
      status: exec.status,
      hasCommand: Boolean(exec.command),
      commandType: exec.command?.type,
      verificationPassed: exec.verification?.passed,
      verificationDiff: exec.verification?.diffSummary,
      messagePreview: String(exec.message || '').slice(0, 300),
      createdNodeId: exec.createdNodeId,
    });
    L('HACP_TRACE', {
      phase: 'TOOL_RESULT',
      toolName: tc.name,
      status: exec.status,
      hasCommand: Boolean(exec.command),
      commandType: exec.command?.type,
      verificationPassed: exec.verification?.passed,
      messagePreview: String(exec.message || '').slice(0, 300),
    });
  }

  const outcome = resolveToolExecutionOutcome(allPassed, commands.length);
  L('GATE4_HACP', {
    hacpBridge_invoked: true,
    toolCallsReceived: toolCallsFromModel.map((tc) => tc.name),
    builderCommandsProduced: commands.map((c) => ({ type: c.type, keys: Object.keys(c) })),
    commandCount: commands.length,
    dispatchWouldRun: commands.length > 0 && outcome.intent === 'EXECUTE',
    outcome,
    toolExecResults,
    note:
      commands.length === 0
        ? 'Zero BuilderCommands — search/read only; AiCopilotWorkspace dispatches only when intent===EXECUTE && commandsToDispatch.length>0'
        : 'Mutation commands present — would dispatch',
  });

  // Apply commands if any (simulating dispatch → applyCommandToDocument)
  // Without mutation commands, document must remain unchanged.
  // We do NOT fake-apply anything.
  const after = docStats(builderDocument);
  L('10_BUILDER_DOCUMENT_AFTER', {
    ...after,
    unchanged:
      JSON.stringify({
        sectionCount: before.sectionCount,
        nodeCount: before.nodeCount,
        sectionIds: before.sectionIds,
      }) ===
      JSON.stringify({
        sectionCount: after.sectionCount,
        nodeCount: after.nodeCount,
        sectionIds: after.sectionIds,
      }),
    note: 'No dispatch executed because commandCount=0; document object not mutated by executeToolCall for read-only tools',
  });

  const userFacingMessage =
    commands.length === 0
      ? `Wykonałem narzędzia: ${toolCallsFromModel.map((tc) => tc.name).join(', ')}. Nie wprowadziłem zmian w BuilderDocument — liczba sekcji bez zmian, brak nowego węzła. Brakuje kroku mutacji (np. insert_section_from_library). Spróbuj ponownie lub wskaż konkretny szablon z wyników wyszykiwania.`
      : orchResult.message;
  L('FINAL_RESPONSE', {
    orchestratorStatus: orchResult.status,
    hacpOutcome: outcome,
    executionStatus: outcome.executionStatus,
    intent: outcome.intent,
    verification: lastVerification
      ? {
          passed: lastVerification.passed,
          before: lastVerification.beforeValue,
          after: lastVerification.afterValue,
          diff: lastVerification.diffSummary,
          isMutationVerification: Boolean(lastVerification.beforeValue !== undefined && commands.length > 0),
        }
      : null,
    verificationIsMutationSuccess: commands.length > 0 && Boolean(lastVerification?.passed),
    message: userFacingMessage,
    durationMs,
    modelTurns: capturedModelResponses.length,
    modelRequests: capturedModelRequests.length,
  });

  // ── Classification ──
  let classification = 'UNKNOWN';
  let rootCause = 'unknown';
  if (!surfaceNames.includes('insert_section_from_library')) {
    classification = 'A';
    rootCause = 'insert_section_from_library not in tool surface for classified intent';
  } else if (capturedModelRequests.some((r) => !r.insert_section_from_library_sent)) {
    // tool in surface but not in at least one actual model request payload
    // check if ANY request had it
    const anySent = capturedModelRequests.some((r) => r.insert_section_from_library_sent);
    if (!anySent) {
      classification = 'A';
      rootCause =
        'Tool present in ToolSurfaceSelector surface but NOT present in actual upstream model request tools[] payload';
    } else if (orchResult.toolCalls.some((tc) => ToolSurfaceSelector.isMutationTool(tc.name))) {
      classification = 'B_or_later';
      rootCause = 'mutation returned';
    } else {
      classification = 'B';
      rootCause = 'insert_section_from_library was sent to model; model never selected it across completed turns';
    }
  } else if (orchResult.toolCalls.some((tc) => ToolSurfaceSelector.isMutationTool(tc.name))) {
    if (commands.length > 0 && after.sectionCount > before.sectionCount) {
      classification = 'G';
      rootCause = 'full chain worked';
    } else if (commands.length > 0) {
      classification = 'E';
      rootCause = 'mutation command produced but document unchanged';
    } else {
      classification = 'D';
      rootCause = 'mutation tool call present but no BuilderCommand produced';
    }
  } else {
    // tool was sent, model didn't select mutation
    if (capturedModelRequests.length > 1) {
      classification = 'B';
      rootCause =
        'Model received insert_section_from_library in request(s) but selected only read-only tool(s) across turns; loop completed without mutation selection';
    } else {
      classification = 'B';
      rootCause =
        'Model received insert_section_from_library but returned only read-only tool call(s) on the single completed turn; no mutation selected';
    }
  }

  // Refine with agent-loop timeout evidence
  const singleReadTurn =
    capturedModelResponses.length >= 1 &&
    capturedModelResponses.every(
      (r) => r.toolCallNames.length > 0 && r.toolCallNames.every((n) => !ToolSurfaceSelector.isMutationTool(n))
    );
  const noSecondResponse =
    capturedModelRequests.length >= 2 && capturedModelResponses.length < capturedModelRequests.length;

  L('CLASSIFICATION', {
    classification,
    rootCause,
    refinement: {
      singleReadTurnOnly: singleReadTurn,
      modelRequests: capturedModelRequests.length,
      modelResponses: capturedModelResponses.length,
      secondRequestWithoutResponse: noSecondResponse,
      gate2Classification: null,
    },
    questions: {
      q1_tools_passed: capturedModelRequests.map((r) => r.toolsSent),
      q2_insert_available_in_payload: capturedModelRequests.map((r) => r.insert_section_from_library_sent),
      q3_why_not_called:
        classification === 'B'
          ? 'Model selected read-only tool(s) only; never emitted insert_section_from_library in any completed response'
          : 'see rootCause',
      q4_layer_dropped:
        classification === 'A'
          ? 'ToolSurfaceSelector or route tool assembly'
          : 'none — tool reached model payload',
      q5_after_last_read:
        capturedModelRequests.length > 1
          ? 'Provider agent loop issued another model request; see MODEL_REQUEST/RESPONSE indices'
          : 'Single model response; orchestrator returned PARTIAL immediately',
      q6_mutation_generated_but_rejected: false,
      q7_hacp_received_builder_command: commands.length > 0,
      q8_builder_document_changed:
        before.sectionCount !== after.sectionCount || before.nodeCount !== after.nodeCount,
      q9_verification_ran_as_mutation_success: commands.length > 0 && Boolean(lastVerification?.passed),
    },
    evidence_files: [
      'src/lib/ai/ToolSurfaceSelector.ts (surface)',
      'src/lib/ai/AgentOrchestrator.ts (single-turn orchestrate)',
      'src/lib/ai/OpenCodeProvider.ts (agent loop + READ_ONLY_TOOLS + MAX 8)',
      'src/app/api/builder/copilot/route.ts (FREE/AUTO → AgentOrchestrator)',
      'src/lib/hacp/HacpBridge.ts (executeToolCall + resolveToolExecutionOutcome)',
      'scratch/rw-full-trace.mjs (this capture)',
    ],
  });

  L('FINAL_CONFIRMATIONS', {
    'CODE CHANGED': 'NO',
    'PROMPT CHANGED': 'NO',
    'MODEL ROUTER CHANGED': 'NO',
    'HACP CHANGED': 'NO',
    'COMMIT': 'NO',
    'PUSH': 'NO',
    'DEPLOY': 'NO',
  });

  globalThis.fetch = realFetch;
}

main().catch((err) => {
  L('TRACE_ERROR', { error: String(err?.message || err), stack: String(err?.stack || '').slice(0, 800) });
  process.exit(1);
});
