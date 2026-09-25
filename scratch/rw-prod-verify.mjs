/**
 * PRODUCTION READ→WRITE E2E — "Dodaj sekcję testimonials."
 * Calls live https://www.solospot.pl/api/builder/copilot, takes returned
 * mutation tool call(s), executes them through HacpBridge against a
 * sectionCount=1 BuilderDocument, dispatches ADD_SECTION, verifies 1→2.
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

import { ToolSurfaceSelector } from '../src/lib/ai/ToolSurfaceSelector.ts';
import { HacpBridge, resolveToolExecutionOutcome } from '../src/lib/hacp/HacpBridge.ts';
import { applyCommandToDocument } from '../packages/builder-core/src';

const PROD = 'https://www.solospot.pl/api/builder/copilot';
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
    sectionCount: sections,
    nodeCount: nodes,
    sectionIds: (doc.pages || []).flatMap((p) => (p.sections || []).map((s) => s.id)),
    sectionTypes: (doc.pages || []).flatMap((p) => (p.sections || []).map((s) => s.type)),
  };
}

async function main() {
  L('0_PROD_TARGET', { url: PROD, prompt: PROMPT });

  // 1) Probe production copilot API
  const getInfo = await fetch(PROD);
  const info = await getInfo.json();
  L('1_PROD_API_GET', { http: getInfo.status, ...info });

  // 2) POST the mutation prompt (same builderContext as local test)
  const t0 = Date.now();
  const res = await fetch(PROD, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: PROMPT,
      messages: [{ role: 'user', content: PROMPT }],
      routerMode: 'FREE',
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
    }),
  });
  const durationMs = Date.now() - t0;
  const data = await res.json();
  L('2_PROD_API_POST', {
    http: res.status,
    durationMs,
    status: data.status,
    provider: data.provider,
    model: data.model,
    routerMode: data.routerMode,
    isFreeModel: data.isFreeModel,
    messagePreview: (data.message || '').slice(0, 400),
    error: data.error,
    toolCallCount: (data.toolCalls || []).length,
    toolCalls: (data.toolCalls || []).map((tc) => ({
      id: tc.id,
      name: tc.name,
      arguments: tc.arguments,
      isMutation: ToolSurfaceSelector.isMutationTool(tc.name),
    })),
  });

  const toolCalls = data.toolCalls || [];
  const mutationCalls = toolCalls.filter((tc) => ToolSurfaceSelector.isMutationTool(tc.name));
  const insertCalled = mutationCalls.some((tc) => tc.name === 'insert_section_from_library');

  // 3) BuilderDocument BEFORE (sectionCount = 1)
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
  L('3_BUILDER_DOCUMENT_BEFORE', before);

  // 4) HACP execution of returned tool calls (client-side dispatch path)
  const bridge = HacpBridge.getInstance();
  const activePageId = 'page-home';
  const commands = [];
  const toolExecResults = [];
  const createdNodeIds = [];
  let lastVerification = null;
  let allPassed = true;

  L('4_HACP_TRACE', {
    phase: 'TOOL_CALLS_RECEIVED',
    toolCallCount: toolCalls.length,
    toolNames: toolCalls.map((tc) => tc.name),
    aiStatus: data.status,
    source: 'production API response.toolCalls',
  });

  for (const tc of toolCalls) {
    L('4_HACP_TRACE', { phase: 'EXECUTING_TOOL', toolName: tc.name, toolArgs: tc.arguments });
    const exec = await bridge.executeToolCall(tc, builderDocument, activePageId);
    lastVerification = exec.verification;
    if (exec.command) commands.push(exec.command);
    if (exec.createdNodeId) createdNodeIds.push(exec.createdNodeId);
    if (exec.status !== 'EXECUTED') allPassed = false;
    toolExecResults.push({
      name: tc.name,
      status: exec.status,
      hasCommand: Boolean(exec.command),
      commandType: exec.command?.type,
      verificationPassed: exec.verification?.passed,
      createdNodeId: exec.createdNodeId,
      messagePreview: String(exec.message || '').slice(0, 300),
    });
    L('4_HACP_TRACE', {
      phase: 'TOOL_RESULT',
      toolName: tc.name,
      status: exec.status,
      hasCommand: Boolean(exec.command),
      commandType: exec.command?.type,
      verificationPassed: exec.verification?.passed,
      createdNodeId: exec.createdNodeId,
    });
  }

  const outcome = resolveToolExecutionOutcome(allPassed, commands.length);
  L('5_GATE4_HACP', {
    hacpBridge_invoked: true,
    commandCount: commands.length,
    commands: commands.map((c) => ({
      type: c.type,
      pageId: c.pageId,
      sectionType: c.sectionType,
      sectionId: c.sectionId,
      label: c.label,
    })),
    outcome,
    toolExecResults,
    createdNodeIds,
  });

  // 5) Dispatch (applyCommandToDocument) — simulates AiCopilotWorkspace
  const applyResults = [];
  if (commands.length > 0) {
    L('6_DISPATCH_TRACE', { phase: 'DISPATCHING', commandCount: commands.length });
    for (const cmd of commands) {
      const next = applyCommandToDocument(builderDocument, cmd);
      applyResults.push({
        commandType: cmd.type,
        changed: JSON.stringify(builderDocument) !== JSON.stringify(next),
        createdSectionId: cmd.sectionId,
      });
      builderDocument = next;
    }
    L('6_DISPATCH_TRACE', { phase: 'DISPATCH_APPLIED', applyResults });
  }

  const after = docStats(builderDocument);
  L('7_BUILDER_DOCUMENT_AFTER', {
    ...after,
    unchanged:
      before.sectionCount === after.sectionCount &&
      before.nodeCount === after.nodeCount &&
      JSON.stringify(before.sectionIds) === JSON.stringify(after.sectionIds),
    sectionCountDelta: after.sectionCount - before.sectionCount,
    newSectionIds: after.sectionIds.filter((id) => !before.sectionIds.includes(id)),
    newSectionTypes: after.sectionTypes.filter((t, i) => !before.sectionTypes.includes(t) || after.sectionTypes.indexOf(t) !== before.sectionTypes.indexOf(t)),
  });

  // 6) Gate criteria
  const sectionIncreased = after.sectionCount === before.sectionCount + 1;
  const verificationPassed = Boolean(lastVerification?.passed);
  const builderCommandPresent = commands.length > 0;
  const createdNodeIdPresent = createdNodeIds.length > 0;
  const productionStatusSuccess = data.status === 'SUCCESS';
  const sectionCount1To2 = before.sectionCount === 1 && after.sectionCount === 2;

  let classification = 'UNKNOWN';
  let rootCause = 'unknown';
  if (productionStatusSuccess && sectionCount1To2 && verificationPassed && builderCommandPresent && createdNodeIdPresent && insertCalled) {
    classification = 'G';
    rootCause = 'production full READ→WRITE chain: API returned insert_section_from_library → HacpBridge ADD_SECTION → sectionCount 1→2 → verification PASS';
  } else if (data.status === 'PARTIAL' && !insertCalled) {
    classification = 'B';
    rootCause = 'production API returned only read-only tool call(s); no mutation selected';
  } else if (data.status === 'ERROR') {
    classification = 'ERROR';
    rootCause = data.error || 'production API error';
  } else if (builderCommandPresent && !sectionIncreased) {
    classification = 'E';
    rootCause = 'mutation command produced but document unchanged';
  } else {
    classification = 'PARTIAL';
    rootCause = 'incomplete production chain — inspect details';
  }

  L('8_GATE_SUMMARY', {
    classification,
    rootCause,
    production: {
      url: PROD,
      apiStatus: data.status,
      model: data.model,
      durationMs,
      toolCalls: toolCalls.map((tc) => tc.name),
    },
    passCriteria: {
      production_api_success: productionStatusSuccess,
      insert_section_from_library_returned: insertCalled,
      mutation_tool_call_exists: mutationCalls.length > 0,
      builder_command_exists: builderCommandPresent,
      hacpbridge_invoked: true,
      created_node_id_exists: createdNodeIdPresent,
      verification_passed: verificationPassed,
      section_count_1_to_2: sectionCount1To2,
      beforeSectionCount: before.sectionCount,
      afterSectionCount: after.sectionCount,
      newSectionIds: after.sectionIds.filter((id) => !before.sectionIds.includes(id)),
      dispatchApplied: applyResults,
    },
    allPass:
      productionStatusSuccess &&
      insertCalled &&
      builderCommandPresent &&
      createdNodeIdPresent &&
      verificationPassed &&
      sectionCount1To2,
  });
}

main().catch((err) => {
  L('TRACE_ERROR', {
    error: String(err?.message || err),
    stack: String(err?.stack || '').slice(0, 800),
  });
  process.exit(1);
});
