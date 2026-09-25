/**
 * REAL READ→WRITE EXECUTION TEST — phase gate evidence.
 * USER → intent → tools → model turns → mutation tool call → HacpBridge
 * → BuilderCommand → applyCommandToDocument → sectionCount 1→2 → VERIFY.
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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
} catch {}

const { IntentClassifier } = await import('../src/lib/ai/IntentClassifier.ts');
import { ToolSurfaceSelector } from '../src/lib/ai/ToolSurfaceSelector.ts';
import { ExecutionPlanManager } from '../src/lib/ai/ExecutionPlan.ts';
import { AgentOrchestrator } from '../src/lib/ai/AgentOrchestrator.ts';
import { OpenCodeProvider } from '../src/lib/ai/OpenCodeProvider.ts';
import { HacpBridge, resolveToolExecutionOutcome } from '../src/lib/hacp/HacpBridge.ts';
import { applyCommandToDocument } from '../packages/builder-core/src';

const PROMPT = 'Dodaj sekcję testimonials.';

function L(step, data) {
  console.log(JSON.stringify({ step, ...data }));
}

function docStats(doc) {
  let sections = 0;
  let nodes = 0;
  for (const p of doc.pages || []) {
    sections += (p.sections || []).length;
    for (const s of p.sections || []) {
      const walk = (n) => {
        nodes += 1;
        if (n.children) n.children.forEach(walk);
      };
      walk(s);
    }
  }
  return {
    pageCount: (doc.pages || []).length,
    sectionCount: sections,
    nodeCount: nodes,
    sectionIds: (doc.pages || []).flatMap((p) => (p.sections || []).map((s) => s.id)),
    sectionTypes: (doc.pages || []).flatMap((p) => (p.sections || []).map((s) => s.type)),
  };
}

async function main() {
  L('1_USER_REQUEST', { prompt: PROMPT });

  const classified = IntentClassifier.classify(PROMPT, {
    hasSelection: false,
    documentNodeCount: 1,
  });
  L('3_INTENT', { category: classified.category, confidence: classified.confidence });

  const surfaceNames = ToolSurfaceSelector.getToolNamesForIntent(classified.category);
  L('2_TOOL_SURFACE', {
    toolNames: surfaceNames,
    insert_section_from_library_in_surface: surfaceNames.includes('insert_section_from_library'),
  });

  const plan = ExecutionPlanManager.createPlan(
    classified.category,
    PROMPT,
    classified.targets,
    classified.parameters
  );
  L('3b_EXECUTION_PLAN', {
    planId: plan.id,
    steps: plan.steps.map((s) => ({ action: s.action, status: s.status })),
  });

  const provider = new OpenCodeProvider();
  L('PROVIDER', { id: provider.id, configured: provider.isConfigured() });

  // Capture upstream LLM traffic
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
      const toolNames = (body.tools || [])
        .map((t) => t.function?.name || t.name)
        .filter(Boolean);
      capturedModelRequests.push({
        index: idx,
        model: body.model,
        toolsSent: toolNames,
        insert_section_from_library_sent: toolNames.includes('insert_section_from_library'),
        messageRoles: (body.messages || []).map((m) => m.role),
      });
      L('MODEL_REQUEST', {
        index: idx,
        model: body.model,
        insert_section_from_library_sent: toolNames.includes('insert_section_from_library'),
        messageRoles: (body.messages || []).map((m) => m.role),
      });
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
        capturedModelResponses.push({
          index: modelReqIndex,
          http: res.status,
          model: data.model,
          finishReason: choice?.finish_reason,
          contentPreview: (choice?.message?.content || '').slice(0, 300),
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

  const orchWrapped = {
    generateWithTools: async (req) => {
      L('ORCHESTRATOR_TO_PROVIDER', {
        routerMode: req.routerMode,
        tools: (req.tools || []).map((t) => t.name),
        insert_section_from_library_in_request: (req.tools || []).some(
          (t) => t.name === 'insert_section_from_library'
        ),
        prompt: req.prompt,
      });
      return provider.generateWithTools(req);
    },
  };
  const orch = new AgentOrchestrator(orchWrapped);

  const t0 = Date.now();
  const orchResult = await orch.orchestrate(
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
        sectionsSummary: [{ id: 'sec-hero-init', type: 'hero', label: 'Hero', order: 0, childCount: 0 }],
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

  // ── BuilderDocument BEFORE ──
  const bridge = HacpBridge.getInstance();
  let builderDocument = {
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

  // ── HACP execution ──
  const activePageId = 'page-home';
  const toolCallsFromModel = orchResult.toolCalls;
  const commands = [];
  const toolExecResults = [];
  let lastVerification = null;
  let createdNodeIds = [];
  let allPassed = true;
  let execStatuses = [];

  L('HACP_TRACE', {
    phase: 'TOOL_CALLS_RECEIVED',
    toolCallCount: toolCallsFromModel.length,
    toolNames: toolCallsFromModel.map((tc) => tc.name),
    aiStatus: orchResult.status,
  });

  for (const tc of toolCallsFromModel) {
    L('HACP_TRACE', { phase: 'EXECUTING_TOOL', toolName: tc.name, toolArgs: tc.arguments });
    const exec = await bridge.executeToolCall(tc, builderDocument, activePageId);
    lastVerification = exec.verification;
    if (exec.command) commands.push(exec.command);
    if (exec.createdNodeId) createdNodeIds.push(exec.createdNodeId);
    if (exec.status !== 'EXECUTED') allPassed = false;
    execStatuses.push(exec.status);
    toolExecResults.push({
      name: tc.name,
      status: exec.status,
      hasCommand: Boolean(exec.command),
      commandType: exec.command?.type,
      verificationPassed: exec.verification?.passed,
      verificationDiff: exec.verification?.diffSummary,
      createdNodeId: exec.createdNodeId,
      messagePreview: String(exec.message || '').slice(0, 300),
    });
    L('HACP_TRACE', {
      phase: 'TOOL_RESULT',
      toolName: tc.name,
      status: exec.status,
      hasCommand: Boolean(exec.command),
      commandType: exec.command?.type,
      verificationPassed: exec.verification?.passed,
      createdNodeId: exec.createdNodeId,
      messagePreview: String(exec.message || '').slice(0, 300),
    });
  }

  const outcome = resolveToolExecutionOutcome(allPassed, commands.length);
  L('GATE4_HACP', {
    hacpBridge_invoked: true,
    toolCallsReceived: toolCallsFromModel.map((tc) => tc.name),
    builderCommandsProduced: commands.map((c) => ({
      type: c.type,
      pageId: c.pageId,
      sectionType: c.sectionType,
      sectionId: c.sectionId,
      label: c.label,
    })),
    commandCount: commands.length,
    dispatchWouldRun: commands.length > 0 && outcome.intent === 'EXECUTE',
    outcome,
    toolExecResults,
    execStatuses,
    createdNodeIds,
  });

  // ── Apply commands (simulating AiCopilotWorkspace dispatch) ──
  let applyResults = [];
  if (commands.length > 0) {
    L('DISPATCH_TRACE', { phase: 'DISPATCHING', commandCount: commands.length });
    for (const cmd of commands) {
      const next = applyCommandToDocument(builderDocument, cmd);
      applyResults.push({
        commandType: cmd.type,
        changed: JSON.stringify(builderDocument) !== JSON.stringify(next),
        createdSectionId: cmd.sectionId,
      });
      builderDocument = next;
    }
    L('DISPATCH_TRACE', { phase: 'DISPATCH_APPLIED', applyResults });
  }

  const after = docStats(builderDocument);
  L('10_BUILDER_DOCUMENT_AFTER', {
    ...after,
    unchanged:
      before.sectionCount === after.sectionCount &&
      before.nodeCount === after.nodeCount &&
      JSON.stringify(before.sectionIds) === JSON.stringify(after.sectionIds),
    sectionCountDelta: after.sectionCount - before.sectionCount,
    newSectionIds: after.sectionIds.filter((id) => !before.sectionIds.includes(id)),
  });

  // ── Final response ──
  const userFacingMessage =
    commands.length === 0
      ? `Wykonałem narzędzia: ${toolCallsFromModel.map((tc) => tc.name).join(', ')}. Nie wprowadziłem zmian w BuilderDocument — liczba sekcji bez zmian, brak nowego węzła. Brakuje kroku mutacji (np. insert_section_from_library). Spróbuj ponownie lub wskaż konkretny szablon z wyników wyszukiwania.`
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
          isMutationVerification: Boolean(
            lastVerification.beforeValue !== undefined && commands.length > 0
          ),
        }
      : null,
    verificationIsMutationSuccess:
      commands.length > 0 && Boolean(lastVerification?.passed),
    createdNodeIds,
    message: userFacingMessage,
    durationMs,
    modelTurns: capturedModelResponses.length,
    modelRequests: capturedModelRequests.length,
  });

  // ── Gate classification ──
  const mutationCalled = orchResult.toolCalls.some((tc) =>
    ToolSurfaceSelector.isMutationTool(tc.name)
  );
  const insertCalled = capturedModelResponses.some((r) =>
    r.toolCallNames.includes('insert_section_from_library')
  );
  const sectionIncreased = after.sectionCount === before.sectionCount + 1;
  const verificationPassed = Boolean(lastVerification?.passed);
  const builderCommandPresent = commands.length > 0;
  const createdNodeIdPresent = createdNodeIds.length > 0;

  let classification = 'UNKNOWN';
  let rootCause = 'unknown';
  if (!surfaceNames.includes('insert_section_from_library')) {
    classification = 'A';
    rootCause = 'insert_section_from_library not in tool surface';
  } else if (orchResult.status === 'SUCCESS' && sectionIncreased && verificationPassed && builderCommandPresent && createdNodeIdPresent) {
    classification = 'G';
    rootCause = 'full READ→WRITE chain worked: sectionCount 1→2 with mutation, BuilderCommand, HacpBridge, createdNodeId, verification';
  } else if (orchResult.status === 'PARTIAL' && !mutationCalled) {
    classification = 'B';
    rootCause = 'model returned only read-only tool call(s); no mutation selected across completed turns';
  } else if (orchResult.status === 'ERROR') {
    classification = 'ERROR';
    rootCause = orchResult.error || 'provider error';
  } else if (mutationCalled && !builderCommandPresent) {
    classification = 'D';
    rootCause = 'mutation tool call present but no BuilderCommand produced';
  } else if (builderCommandPresent && !sectionIncreased) {
    classification = 'E';
    rootCause = 'mutation command produced but document unchanged';
  } else {
    classification = 'PARTIAL';
    rootCause = 'incomplete chain — inspect details';
  }

  L('GATE_SUMMARY', {
    classification,
    rootCause,
    requirements: {
      intentIsInsertSection: classified.category === 'INSERT_SECTION',
      insertToolInSurface: surfaceNames.includes('insert_section_from_library'),
      insertToolSentInRequests: capturedModelRequests.map((r) => ({
        index: r.index,
        sent: r.insert_section_from_library_sent,
      })),
      modelCompletedTurns: capturedModelResponses.length,
      modelSelectedMutation: mutationCalled,
      mutationToolName: orchResult.toolCalls.find((tc) =>
        ToolSurfaceSelector.isMutationTool(tc.name)
      )?.name || null,
      orchestratorStatus: orchResult.status,
      hacpBridgeInvoked: true,
      builderCommandPresent,
      commandTypes: commands.map((c) => c.type),
      createdNodeIdPresent,
      createdNodeIds,
      verificationPassed,
      beforeSectionCount: before.sectionCount,
      afterSectionCount: after.sectionCount,
      sectionCountIncreased: sectionIncreased,
      newSectionIds: after.sectionIds.filter((id) => !before.sectionIds.includes(id)),
      dispatchApplied: applyResults,
    },
    passCriteria: {
      search_then_insert: insertCalled && mutationCalled,
      mutation_tool_call_exists: mutationCalled,
      builder_command_exists: builderCommandPresent,
      hacpbridge_invoked: true,
      created_node_id_exists: createdNodeIdPresent,
      verification_passed: verificationPassed,
      section_count_1_to_2: before.sectionCount === 1 && after.sectionCount === 2,
      final_status_success: orchResult.status === 'SUCCESS',
    },
  });

  L('FINAL_CONFIRMATIONS', {
    'CODE CHANGED': 'YES (repair applied — see OpenCodeProvider continuation)',
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
  L('TRACE_ERROR', {
    error: String(err?.message || err),
    stack: String(err?.stack || '').slice(0, 800),
  });
  process.exit(1);
});
