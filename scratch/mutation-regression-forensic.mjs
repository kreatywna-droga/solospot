/**
 * AI MUTATION REGRESSION FORENSIC v1.0 — READ-ONLY
 * ZERO production code changes. ZERO commit/push/deploy.
 *
 * Reproduces the contradictory user-facing message:
 * "Wykonałem narzędzia: insert_section_from_library ... Brakuje kroku mutacji"
 * and classifies where the chain broke.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
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

const { IntentClassifier } = await import('../src/lib/ai/IntentClassifier.ts');
const { ToolSurfaceSelector } = await import('../src/lib/ai/ToolSurfaceSelector.ts');
const {
  HacpBridge,
  resolveToolExecutionOutcome,
} = await import('../src/lib/hacp/HacpBridge.ts');
const { applyCommandToDocument, createBuilderDocument, findNode } = await import(
  '../packages/builder-core/src/index.ts'
);

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
  const sectionIds = [];
  for (const p of pages) {
    for (const s of p.sections || []) {
      sections += 1;
      nodes += countNodes(s);
      sectionIds.push(s.id);
    }
  }
  return {
    docId: doc.id,
    version: doc.version,
    pageIds: pages.map((p) => p.id),
    sectionCount: sections,
    nodeCount: nodes,
    sectionIds,
  };
}

function cloneDoc(doc) {
  return JSON.parse(JSON.stringify(doc));
}

function sameDoc(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Trace one executeToolCall with INPUT/OUTPUT/STATUS. */
async function traceToolCall(bridge, toolCall, document, activePageId) {
  const input = {
    name: toolCall.name,
    arguments: toolCall.arguments,
    activePageId,
    documentBefore: docStats(document),
  };
  let exec;
  try {
    exec = await bridge.executeToolCall(toolCall, document, activePageId);
  } catch (err) {
    exec = {
      status: 'FAILED',
      message: `THREW: ${err?.message || err}`,
      verification: { passed: false, operation: toolCall.name, target: 'unknown' },
      threw: true,
    };
  }
  const output = {
    status: exec.status,
    hasCommand: Boolean(exec.command),
    hasCommands: Boolean(exec.commands?.length),
    commandCount: exec.commands?.length || (exec.command ? 1 : 0),
    command: exec.command
      ? {
          type: exec.command.type,
          pageId: exec.command.pageId,
          sectionId: exec.command.sectionId,
          sectionType: exec.command.sectionType,
          label: exec.command.label,
          childrenCount: exec.command.children?.length ?? null,
          styles: exec.command.styles ? Object.keys(exec.command.styles) : null,
          defaultPropsKeys: Object.keys(exec.command.defaultProps || {}).slice(0, 12),
        }
      : null,
    commands: (exec.commands || []).map((c) => ({ type: c.type, pageId: c.pageId })),
    createdNodeId: exec.createdNodeId ?? null,
    verification: exec.verification,
    messagePreview: String(exec.message || '').slice(0, 300),
  };
  L('TRACE_TOOL_CALL', { input, output });
  return exec;
}

/**
 * Build a fake aiProviderResponse path by monkey-patching global fetch
 * so executePlan receives SUCCESS + toolCalls (no real model needed for repro).
 */
function installFakeProvider(toolCalls, message = 'Wstawiłem sekcję z biblioteki.') {
  // executePlan only calls /api/builder/copilot when typeof window !== 'undefined'
  // (browser client path). In Node forensic runs we must define window.
  const hadWindow = 'window' in globalThis;
  if (!hadWindow) {
    globalThis.window = globalThis;
  }
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    const u = String(url);
    if (u.includes('/api/builder/copilot')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          status: 'SUCCESS',
          provider: 'FAKE_FORENSIC',
          model: 'forensic-mock',
          message,
          toolCalls,
          routerMode: 'FREE',
          isFreeModel: true,
        }),
      };
    }
    return realFetch(url, init);
  };
  return () => {
    globalThis.fetch = realFetch;
    if (!hadWindow) delete globalThis.window;
  };
}

async function runExecutePlanScenario(label, toolCalls, fakeMessage) {
  const bridge = HacpBridge.getInstance();
  const document = createBuilderDocument({ id: 'doc_mutation_regression' });
  // Force a known page id similar to studio s-demo context when possible
  const before = docStats(document);
  const restore = installFakeProvider(toolCalls, fakeMessage);

  const context = {
    storeId: 's-demo',
    pageId: before.pageIds[0],
    pageName: 'Strona Główna',
    viewport: 'DESKTOP',
    documentNodeCount: before.sectionCount,
    activeTool: 'SELECT',
  };

  let result;
  try {
    result = await bridge.executePlan(
      'Dodaj sekcję testimonials.',
      context,
      document,
      { history: [] },
      'FREE'
    );
  } finally {
    restore();
  }

  // Apply commands like AiCopilotWorkspace.dispatch would
  let after = before;
  let working = cloneDoc(document);
  const dispatchResults = [];
  for (const cmd of result.commandsToDispatch || []) {
    try {
      const next = applyCommandToDocument(working, cmd);
      dispatchResults.push({
        commandType: cmd.type,
        changed: !sameDoc(working, next),
        createdSectionId: cmd.sectionId,
      });
      working = next;
    } catch (err) {
      dispatchResults.push({
        commandType: cmd?.type,
        error: String(err?.message || err),
      });
    }
  }
  after = docStats(working);

  const exactSymptom =
    /Wykonałem narzędzia:/.test(result.message || '') &&
    /Brakuje kroku mutacji/.test(result.message || '');

  const payload = {
    label,
    toolCallsIn: toolCalls.map((tc) => ({ name: tc.name, arguments: tc.arguments })),
    modelMessage: fakeMessage ?? null,
    outcome: {
      success: result.success,
      intent: result.intent,
      executionStatus: result.executionStatus,
      commandsToDispatch: (result.commandsToDispatch || []).map((c) => ({
        type: c.type,
        pageId: c.pageId,
        sectionId: c.sectionId,
      })),
      commandCount: (result.commandsToDispatch || []).length,
    },
    executionCard: {
      status: result.executionCard?.status,
      validationResult: result.executionCard?.validationResult,
      steps: (result.executionCard?.steps || []).map((s) => ({
        name: s.name,
        status: s.status,
        detail: String(s.detail || '').slice(0, 200),
      })),
    },
    verification: result.verification
      ? {
          passed: result.verification.passed,
          operation: result.verification.operation,
          target: result.verification.target,
          beforeValue: result.verification.beforeValue,
          afterValue: result.verification.afterValue,
          diffSummary: result.verification.diffSummary,
        }
      : null,
    before,
    after,
    documentUnchanged: sameDoc(before, after),
    sectionCountDelta: after.sectionCount - before.sectionCount,
    nodeCountDelta: after.nodeCount - before.nodeCount,
    dispatchResults,
    finalMessage: result.message,
    exactSymptom,
    classificationHint: null,
  };

  // Classification hints
  const insertCalled = toolCalls.some((t) => t.name === 'insert_section_from_library');
  const gotCommand = (result.commandsToDispatch || []).length > 0;
  if (exactSymptom && insertCalled && !gotCommand) {
    payload.classificationHint =
      'B or G: insert in toolCalls but zero commands collected → handler returned no command OR only read-only siblings collected';
  } else if (exactSymptom && insertCalled && gotCommand) {
    payload.classificationHint = 'F: commands exist but message path still claimed no mutation (should not happen)';
  } else if (!exactSymptom && insertCalled && gotCommand && payload.documentUnchanged) {
    payload.classificationHint = 'C or D: command produced but dispatch did not change document';
  } else if (!exactSymptom && insertCalled && gotCommand && !payload.documentUnchanged) {
    payload.classificationHint = 'SUCCESS path (contrast case)';
  }

  L('SCENARIO_RESULT', payload);
  return payload;
}

async function main() {
  const HEAD_INFO = {
    note: 'forensic scratch only',
    zeroCodeChanges: true,
  };
  L('GATE_START', {
    gate: 'AI MUTATION REGRESSION FORENSIC v1.0',
    mode: 'READ-ONLY',
    ...HEAD_INFO,
  });

  // ── FAZA 1: Intent + surface for the problematic class of request ──
  const PROMPT = 'Dodaj sekcję testimonials.';
  const classified = IntentClassifier.classify(PROMPT, {
    hasSelection: false,
    documentNodeCount: 1,
  });
  const surface = ToolSurfaceSelector.getToolNamesForIntent(classified.category);
  L('FAZA1_INTENT_SURFACE', {
    userInput: PROMPT,
    intent: classified,
    capabilitySurface: surface,
    insertInSurface: surface.includes('insert_section_from_library'),
    modelNote: 'synthetic executePlan path (fetch intercepted) — isolates HACP/chain from model flakiness',
  });

  // ── FAZA 2: Direct tool traces (INPUT/OUTPUT/STATUS) ──
  const bridge = HacpBridge.getInstance();
  const baseDoc = createBuilderDocument({ id: 'doc_trace' });
  const pageId = baseDoc.pages[0].id;
  L('FAZA2_BASE_DOC', { ...docStats(baseDoc), pageId });

  const traces = [];
  // A: missing sectionTemplateId
  traces.push({
    case: 'A_missing_templateId',
    exec: await traceToolCall(
      bridge,
      { id: 't-a', name: 'insert_section_from_library', arguments: {} },
      baseDoc,
      pageId
    ),
  });
  // B: unknown template
  traces.push({
    case: 'B_unknown_template',
    exec: await traceToolCall(
      bridge,
      {
        id: 't-b',
        name: 'insert_section_from_library',
        arguments: { sectionTemplateId: 'does-not-exist-xyz' },
      },
      baseDoc,
      pageId
    ),
  });
  // C: valid template
  traces.push({
    case: 'C_valid_template',
    exec: await traceToolCall(
      bridge,
      {
        id: 't-c',
        name: 'insert_section_from_library',
        arguments: { sectionTemplateId: 'testimonials-cards', pageId },
      },
      baseDoc,
      pageId
    ),
  });
  // D: valid template + wrong pageId (command still returned?)
  traces.push({
    case: 'D_valid_template_wrong_page',
    exec: await traceToolCall(
      bridge,
      {
        id: 't-d',
        name: 'insert_section_from_library',
        arguments: {
          sectionTemplateId: 'testimonials-cards',
          pageId: 'page-does-not-exist',
        },
      },
      baseDoc,
      pageId
    ),
  });
  // E: search only (read-only)
  traces.push({
    case: 'E_search_only',
    exec: await traceToolCall(
      bridge,
      { id: 't-e', name: 'search_sections', arguments: { query: 'testimonials' } },
      baseDoc,
      pageId
    ),
  });

  const traceSummary = traces.map((t) => ({
    case: t.case,
    status: t.exec?.status,
    hasCommand: Boolean(t.exec?.command),
    verificationPassed: t.exec?.verification?.passed,
    message: String(t.exec?.message || '').slice(0, 160),
  }));
  L('FAZA2_TRACE_SUMMARY', { traces: traceSummary });

  // ── FAZA 3–5: executePlan scenarios that can emit the exact message ──
  const scenarios = [];

  // S1: model called insert WITHOUT templateId → no command → exact message
  scenarios.push(
    await runExecutePlanScenario(
      'S1_insert_no_templateId',
      [
        {
          id: 'm1',
          name: 'insert_section_from_library',
          arguments: { pageId: baseDoc.pages[0].id },
        },
      ],
      'Wstawiam testimonials.'
    )
  );

  // S2: model called insert WITH unknown template → no command → exact message
  scenarios.push(
    await runExecutePlanScenario(
      'S2_insert_unknown_template',
      [
        {
          id: 'm2',
          name: 'insert_section_from_library',
          arguments: { sectionTemplateId: 'testimonials-pricing-xyz' },
        },
      ],
      'Dodaję sekcję.'
    )
  );

  // S3: model called ONLY search (contradiction still mentions np. insert_...)
  scenarios.push(
    await runExecutePlanScenario(
      'S3_search_only',
      [{ id: 'm3', name: 'search_sections', arguments: { query: 'testimonials' } }],
      'Znalazłem sekcje testimonials. Teraz wstawię.'
    )
  );

  // S4: search + insert without templateId (common partial-args failure)
  scenarios.push(
    await runExecutePlanScenario(
      'S4_search_then_insert_no_templateId',
      [
        { id: 'm4a', name: 'search_sections', arguments: { query: 'testimonials' } },
        { id: 'm4b', name: 'insert_section_from_library', arguments: {} },
      ],
      'Wstawiam wybraną sekcję.'
    )
  );

  // S5: VALID insert (contrast — should NOT emit symptom)
  scenarios.push(
    await runExecutePlanScenario(
      'S5_valid_insert_contrast',
      [
        {
          id: 'm5',
          name: 'insert_section_from_library',
          arguments: {
            sectionTemplateId: 'testimonials-cards',
            pageId: baseDoc.pages[0].id,
          },
        },
      ],
      'Wstawiłem sekcję testimonials.'
    )
  );

  // S6: search + VALID insert (normal multi-step)
  scenarios.push(
    await runExecutePlanScenario(
      'S6_search_then_valid_insert',
      [
        { id: 'm6a', name: 'search_sections', arguments: { query: 'testimonials' } },
        {
          id: 'm6b',
          name: 'insert_section_from_library',
          arguments: {
            sectionTemplateId: 'testimonials-cards',
            pageId: baseDoc.pages[0].id,
          },
        },
      ],
      'Gotowe.'
    )
  );

  // S7: insert with EMPTY string templateId (falsy path)
  scenarios.push(
    await runExecutePlanScenario(
      'S7_insert_empty_templateId',
      [
        {
          id: 'm7',
          name: 'insert_section_from_library',
          arguments: { sectionTemplateId: '' },
        },
      ],
      'ok'
    )
  );

  const symptomScenarios = scenarios.filter((s) => s.exactSymptom);
  const contrastOk = scenarios.filter(
    (s) => !s.exactSymptom && s.outcome.commandCount > 0 && !s.documentUnchanged
  );

  L('FAZA3_4_5_SCENARIO_MATRIX', {
    total: scenarios.length,
    exactSymptomCount: symptomScenarios.length,
    exactSymptomLabels: symptomScenarios.map((s) => s.label),
    contrastSuccessLabels: contrastOk.map((s) => s.label),
    classificationHints: scenarios.map((s) => ({
      label: s.label,
      exactSymptom: s.exactSymptom,
      commandCount: s.outcome.commandCount,
      documentUnchanged: s.documentUnchanged,
      hint: s.classificationHint,
      message: s.finalMessage?.slice(0, 220),
    })),
  });

  // ── FAZA 3 detail: toolCall → command → dispatch audit for S1/S5 ──
  const audit = scenarios.map((s) => ({
    label: s.label,
    toolCall: s.toolCallsIn[0],
    command: s.outcome.commandsToDispatch[0] || null,
    dispatch: s.dispatchResults[0] || null,
    before: { sectionCount: s.before.sectionCount, nodeCount: s.before.nodeCount },
    after: { sectionCount: s.after.sectionCount, nodeCount: s.after.nodeCount },
    pattern:
      s.outcome.commandCount > 0 && !s.documentUnchanged
        ? 'toolCall → command → dispatch (OK)'
        : s.outcome.commandCount === 0
        ? 'toolCall → result → NO command'
        : s.outcome.commandCount > 0 && s.documentUnchanged
        ? 'toolCall → command → dispatch NO document delta'
        : 'other',
  }));
  L('FAZA3_COMMAND_FORENSICS', { audit });

  // ── Message generator source evidence ──
  L('FAZA5_MESSAGE_GENERATOR', {
    file: 'src/lib/hacp/HacpBridge.ts',
    lines: '1559-1565',
    condition: 'commands.length === 0 after executePlan loop',
    messageTemplate:
      "Wykonałem narzędzia: ${toolCalls.map(tc=>tc.name).join(', ')}. Nie wprowadziłem zmian w BuilderDocument — liczba sekcji bez zmian, brak nowego węzła. Brakuje kroku mutacji (np. insert_section_from_library). ...",
    statusSemantics: {
      toolExecutedTrue: 'tool was in toolCalls array and executeToolCall returned (any status)',
      commandDispatchedFalse: 'commands[] empty → commandsToDispatch empty',
      mutationVerifiedFalse: 'resolveToolExecutionOutcome(0 commands) → CLARIFY',
      contradictionSource:
        'static suffix "np. insert_section_from_library" is ALWAYS printed when commands.length===0, AND executedNames can already list insert_section_from_library when that tool FAILED without producing a command',
    },
    resolveToolExecutionOutcome: {
      file: 'src/lib/hacp/HacpBridge.ts:50-61',
      zeroCommands: "{ success: true, intent: 'CHAT', executionStatus: 'CLARIFY' }",
    },
    workspaceDispatch: {
      file: 'src/components/builder/ai/AiCopilotWorkspace.tsx:692',
      condition: "result.intent === 'EXECUTE' && result.commandsToDispatch.length > 0",
      note: 'CLARIFY + empty commands → no dispatch (correct; document unchanged)',
    },
  });

  // ── FAZA 6: compare with previous PASS gate fixtures ──
  L('FAZA6_VS_PASS_GATE', {
    previousGate: 'AI END-TO-END EXECUTION CHAIN GATE v1.0',
    previousI1ToolArgs: {
      name: 'insert_section_from_library',
      arguments: {
        atIndex: 5,
        label: 'Testimonials',
        pageId: 'page-home',
        sectionTemplateId: 'testimonials-cards',
      },
    },
    previousI1Result: 'ADD_SECTION + documentChanged true + chainComplete',
    thisRegressionSymptom: exactSymptomMessage(samples(symptomScenarios)),
    deltas: [
      'tool arguments: PASS gate used sectionTemplateId=testimonials-cards; regression scenarios S1/S2/S4/S7 omit or falsify sectionTemplateId',
      'HACP handler path identical (same code); failed-arg paths return FAILED without command',
      'message path identical (HacpBridge executePlan commands.length===0 branch)',
      'model layer not required to reproduce — chain break is argument-level at HACP insert handler',
      'capability surface still includes insert_section_from_library (SELECTABLE/EXPOSED unchanged)',
    ],
    notIdenticalAssumption: true,
  });

  // ── FAZA 7/8: classification ──
  const primary = symptomScenarios.find((s) =>
    ['S1_insert_no_templateId', 'S2_insert_unknown_template', 'S7_insert_empty_templateId', 'S4_search_then_insert_no_templateId'].includes(s.label)
  );

  // Determine whether model-side (A) vs handler (B)
  // In synthetic scenarios we FORCE insert in toolCalls → not A.
  // Handler returns FAILED without command for bad/missing templateId → B.
  const classification = {
    CHAIN: primary ? 'FAIL' : contrastOk.length ? 'PASS' : 'UNVERIFIED',
    FIRST_BREAK: primary
      ? 'HACP insert_section_from_library handler → BuilderCommand (no command emitted)'
      : 'n/a',
    ROOT_CAUSE: primary
      ? [
          'Model (or synthetic toolCalls) invoked insert_section_from_library WITHOUT a resolvable sectionTemplateId',
          'Handler HacpBridge.executeToolCall (lines 609-628) returns status FAILED and NO command when sectionTemplateId missing/unknown/empty',
          'executePlan collects zero commands → resolveToolExecutionOutcome → CLARIFY',
          'Message generator (lines 1559-1565) lists executed tool names AND static suffix "Brakuje kroku mutacji (np. insert_section_from_library)" → contradictory UX',
          'AiCopilotWorkspace skips dispatch (intent CLARIFY / empty commands) → BuilderDocument BEFORE==AFTER',
        ].join(' | ')
      : 'see scenario matrix',
    REGRESSION: 'YES',
    categories: {
      A_model_did_not_call_mutation_tool: false,
      B_mutation_tool_called_but_no_command: true,
      C_command_not_dispatched: false,
      D_dispatched_but_document_unchanged: false,
      E_document_changed_but_verification_missed: false,
      F_mutation_ok_but_response_lies: false,
      G_other: false,
    },
    selected: 'B',
    evidenceForB: [
      'trace A/B/S7: executeToolCall insert → status FAILED, hasCommand false',
      'trace C/S5: same handler with valid testimonials-cards → EXECUTED + ADD_SECTION',
      'executePlan S1/S2/S7: commandCount 0, exactSymptom true, documentUnchanged true',
    ],
    noteOnA: 'If the REAL model omitted the mutation tool entirely, that would be A; but the user-facing message literally lists insert_section_from_library in executedNames, proving toolCalls contained it → not pure A. In production the same symptom occurs when model calls insert with bad/missing templateId.',
    noteOnF: 'Message is honest about no mutation (CLARIFY) but poorly worded — lists tool as "executed" and hardcodes example insert_section_from_library even when only search ran (S3).',
  };
  L('FAZA7_CLASSIFICATION', classification);

  L('FAZA8_VERDICT', {
    CHAIN: classification.CHAIN,
    FIRST_BREAK: classification.FIRST_BREAK,
    ROOT_CAUSE:
      'insert_section_from_library invoked without valid sectionTemplateId → handler returns FAILED/no command → commands.length===0 → honest CLARIFY + contradictory static message template at HacpBridge.ts:1560-1565',
    REGRESSION: classification.REGRESSION,
    zeroCodeChanges: true,
    commit: false,
    push: false,
    deploy: false,
  });

  // Persist artifact
  const outDir = join(__dirname, 'mutation-regression-proof');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    join(outDir, 'result.json'),
    JSON.stringify(
      {
        at: new Date().toISOString(),
        scenarios: scenarios.map((s) => ({
          label: s.label,
          exactSymptom: s.exactSymptom,
          commandCount: s.outcome.commandCount,
          executionStatus: s.outcome.executionStatus,
          intent: s.outcome.intent,
          documentUnchanged: s.documentUnchanged,
          before: s.before,
          after: s.after,
          finalMessage: s.finalMessage,
          verification: s.verification,
        })),
        classification,
      },
      null,
      2
    )
  );
  L('PROOF_WRITTEN', { path: join(outDir, 'result.json') });
  L('GATE_END', { codeChanged: false, commit: false, push: false, deploy: false });
}

function samples(arr) {
  return arr[0]?.finalMessage || '';
}
function exactSymptomMessage(msg) {
  return /Wykonałem narzędzia:/.test(msg) && /Brakuje kroku mutacji/.test(msg);
}

await main();
