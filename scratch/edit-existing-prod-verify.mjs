/**
 * PRODUCTION EXISTING-NODE EDIT VERIFY — Hero MYSHOE → MARCIN BERNATOWICZ.
 * Calls live https://www.solospot.pl/api/builder/copilot, executes returned
 * mutation tool call(s) via HacpBridge against fixture Hero/MYSHOE, verifies
 * section/hero counts unchanged, MYSHOE→0, MARCIN≥1 (Classification G).
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

import { ToolSurfaceSelector } from '../src/lib/ai/ToolSurfaceSelector.ts';
import { HacpBridge, resolveToolExecutionOutcome } from '../src/lib/hacp/HacpBridge.ts';
import { applyCommandToDocument } from '../packages/builder-core/src';
import { findNodes } from '../src/lib/ai/BuilderInspectionTools.ts';

const PROD = 'https://www.solospot.pl/api/builder/copilot';
const PROMPT =
  'Zmień główny tytuł Hero na:\nMARCIN BERNATOWICZ.\nNa banerze nie może być napisane MYSHOE.';
const NEW_TITLE = 'MARCIN BERNATOWICZ';
const OLD_TEXT = 'MYSHOE';

function L(step, data) {
  console.log(JSON.stringify({ step, ...data }));
}

function walk(nodes, fn) {
  for (const n of nodes || []) {
    fn(n);
    walk(n.children, fn);
  }
}

function countText(doc, needle) {
  let count = 0;
  for (const p of doc.pages || []) {
    walk(p.sections, (n) => {
      const props = n.props || {};
      for (const v of Object.values(props)) {
        if (typeof v === 'string' && v.includes(needle)) count++;
      }
      if (typeof n.label === 'string' && n.label.includes(needle)) count++;
    });
  }
  return count;
}

function stats(doc) {
  let sections = 0;
  let heroes = 0;
  let allNodes = 0;
  for (const p of doc.pages || []) {
    for (const s of p.sections || []) {
      sections++;
      if (s.type === 'hero' || (s.label || '').toLowerCase().includes('hero')) heroes++;
      walk([s], () => {
        allNodes++;
      });
    }
  }
  return {
    sectionCount: sections,
    heroCount: heroes,
    totalNodes: allNodes,
    myshoeOccurrences: countText(doc, OLD_TEXT),
    marcinOccurrences: countText(doc, NEW_TITLE),
  };
}

function buildNodesIndex(doc) {
  const out = [];
  const walkIdx = (nodes, sectionId) => {
    for (const n of nodes || []) {
      const sid = sectionId || (n.type === 'section' || n.type === 'hero' ? n.id : undefined);
      out.push({
        id: n.id,
        type: n.type,
        label: n.label,
        sectionId: sid,
        parentId: n.parentId ?? null,
        props: n.props,
      });
      if (n.children?.length) walkIdx(n.children, sid);
    }
  };
  for (const p of doc.pages || []) walkIdx(p.sections, undefined);
  return out;
}

function createFixtureDoc() {
  return {
    metadata: { storeSlug: 's-myshoe', storeName: 'MyShoe Store' },
    theme: { primaryColor: '#7c3aed', secondaryColor: '#d946ef', font: 'Inter' },
    pages: [
      {
        id: 'page-home',
        name: 'Strona Główna',
        isHome: true,
        sections: [
          {
            id: 'sec_hero_myshoe_root',
            type: 'hero',
            label: 'Hero',
            order: 0,
            visible: true,
            locked: false,
            parentId: null,
            props: { title: 'MYSHOE', subtitle: 'Premium sneakers' },
            styles: {},
            children: [
              {
                id: 'node_heading_myshoe',
                type: 'heading',
                label: 'Headline',
                order: 0,
                visible: true,
                locked: false,
                parentId: 'sec_hero_myshoe_root',
                props: { text: 'Headline' },
                styles: { fontSize: '56px', color: '#ffffff' },
                children: [],
              },
              {
                id: 'node_text_sub',
                type: 'text',
                label: 'Subtitle',
                order: 1,
                visible: true,
                locked: false,
                parentId: 'sec_hero_myshoe_root',
                props: { text: 'Nowa kolekcja' },
                styles: {},
                children: [],
              },
            ],
          },
          {
            id: 'sec_features',
            type: 'section',
            label: 'Features',
            order: 1,
            visible: true,
            locked: false,
            parentId: null,
            props: {},
            styles: {},
            children: [],
          },
        ],
      },
    ],
  };
}

async function main() {
  let builderDocument = createFixtureDoc();
  const before = stats(builderDocument);
  const myshoeNodes = findNodes(builderDocument, { textContains: OLD_TEXT });
  const primaryTextId = (myshoeNodes.find((n) => n.type !== 'section' && n.type !== 'hero') || myshoeNodes[0])?.id || null;
  const heroSection = builderDocument.pages[0].sections.find(
    (s) => s.type === 'hero' || (s.label || '').toLowerCase().includes('hero')
  );
  L('0_PROD_EDIT_GATE', {
    url: PROD,
    prompt: PROMPT,
    before,
    primaryTextId,
    heroSectionId: heroSection?.id || null,
  });

  const getInfo = await fetch(PROD);
  const info = await getInfo.json();
  L('1_PROD_API_GET', { http: getInfo.status, ...info });

  const t0 = Date.now();
  const res = await fetch(PROD, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: PROMPT,
      messages: [{ role: 'user', content: PROMPT }],
      routerMode: 'FREE',
      builderContext: {
        storeId: 's-myshoe',
        pageId: 'page-home',
        pageName: 'Strona Główna',
        viewport: 'DESKTOP',
        documentNodeCount: before.sectionCount,
        activeTool: 'SELECT',
        availableCapabilitiesCount: 20,
        sectionsSummary: builderDocument.pages[0].sections.map((s, i) => ({
          id: s.id,
          type: s.type,
          label: s.label,
          order: i,
          childCount: s.children?.length || 0,
        })),
        nodesIndex: buildNodesIndex(builderDocument),
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
  const insertCalled = toolCalls.some(
    (tc) =>
      tc.name === 'insert_section' ||
      tc.name === 'insert_section_from_library' ||
      tc.name === 'insert_node'
  );

  const bridge = HacpBridge.getInstance();
  const commands = [];
  const createdNodeIds = [];
  let lastVerification = null;
  let allPassed = true;
  const toolExecResults = [];

  L('3_HACP_TRACE', {
    phase: 'TOOL_CALLS_RECEIVED',
    toolCallCount: toolCalls.length,
    toolNames: toolCalls.map((tc) => tc.name),
    aiStatus: data.status,
  });

  for (const tc of toolCalls) {
    const exec = await bridge.executeToolCall(tc, builderDocument, 'page-home');
    lastVerification = exec.verification;
    if (exec.command) commands.push(exec.command);
    if (exec.createdNodeId) createdNodeIds.push(exec.createdNodeId);
    if (exec.status !== 'EXECUTED' && exec.status !== 'SKIPPED') allPassed = false;
    toolExecResults.push({
      name: tc.name,
      status: exec.status,
      commandType: exec.command?.type,
      sectionId: exec.command?.sectionId,
      props: exec.command?.props,
      verificationPassed: exec.verification?.passed,
      messagePreview: String(exec.message || '').slice(0, 250),
    });
    L('4_HACP_TOOL_RESULT', {
      toolName: tc.name,
      status: exec.status,
      commandType: exec.command?.type,
      sectionId: exec.command?.sectionId,
      props: exec.command?.props,
      verificationPassed: exec.verification?.passed,
    });
  }

  const outcome = resolveToolExecutionOutcome(allPassed, commands.length);

  const applyResults = [];
  for (const cmd of commands) {
    const next = applyCommandToDocument(builderDocument, cmd);
    applyResults.push({
      type: cmd.type,
      sectionId: cmd.sectionId,
      changed: JSON.stringify(builderDocument) !== JSON.stringify(next),
    });
    builderDocument = next;
  }

  const after = stats(builderDocument);
  const mutationCommands = commands.filter(
    (c) => c.type === 'UPDATE_PROPS' || c.type === 'REPLACE_PROPS'
  );
  const insertCommands = commands.filter(
    (c) => c.type === 'ADD_SECTION' || c.type === 'ADD_NODE' || c.type === 'INSERT_NODE'
  );
  const verificationPassed = Boolean(lastVerification?.passed);

  // If first mutation only hit one MYSHOE occurrence, clear remaining MYSHOE on
  // known discovered nodes only when model already targeted that node family
  // (Hero or its children) — still requires model-driven UPDATE_PROPS, not a fake write.

  // Independent re-read + persistence round-trip
  const indepMyshoe = findNodes(builderDocument, { textContains: OLD_TEXT });
  const indepMarcin = findNodes(builderDocument, { textContains: NEW_TITLE });
  const roundTrip = JSON.parse(JSON.stringify(builderDocument));
  const persistMyshoe = findNodes(roundTrip, { textContains: OLD_TEXT });
  const persistMarcin = findNodes(roundTrip, { textContains: NEW_TITLE });

  const productionStatusSuccess = data.status === 'SUCCESS';
  const noDuplicate =
    after.sectionCount === before.sectionCount &&
    after.heroCount === before.heroCount &&
    insertCommands.length === 0 &&
    !insertCalled;
  const wrongNode =
    mutationCommands.length > 0 &&
    !mutationCommands.some(
      (c) => c.sectionId === primaryTextId || c.sectionId === heroSection?.id || myshoeNodes.some((n) => n.id === c.sectionId)
    );

  let classification = 'G';
  let rootCause = 'production existing Hero MYSHOE node edited in place — no duplicates';
  if (data.status === 'ERROR') {
    classification = 'ERROR';
    rootCause = data.error || 'production API error';
  } else if (insertCalled || insertCommands.length > 0 || after.sectionCount > before.sectionCount || after.heroCount > before.heroCount) {
    classification = 'C';
    rootCause = 'duplicate section/hero created instead of editing existing node';
  } else if (wrongNode) {
    classification = 'B';
    rootCause = 'mutation applied to wrong node (not Hero/MYSHOE target)';
  } else if (mutationCommands.length === 0) {
    classification = 'D';
    rootCause = 'no UPDATE_PROPS mutation produced';
  } else if (after.myshoeOccurrences > 0 || after.marcinOccurrences < 1) {
    classification = 'D';
    rootCause =
      after.myshoeOccurrences > 0
        ? 'MYSHOE still present after mutation'
        : 'MARCIN BERNATOWICZ missing after mutation';
  } else if (!verificationPassed) {
    classification = 'E';
    rootCause = 'verification failed';
  } else if (
    after.sectionCount === before.sectionCount &&
    after.heroCount === before.heroCount &&
    after.myshoeOccurrences === 0 &&
    after.marcinOccurrences >= 1
  ) {
    classification = 'G';
    rootCause = 'production full existing-node edit chain';
  } else {
    classification = 'E';
    rootCause = 'content verification failed';
  }

  const allPass =
    classification === 'G' &&
    productionStatusSuccess &&
    noDuplicate &&
    verificationPassed &&
    after.myshoeOccurrences === 0 &&
    after.marcinOccurrences >= 1 &&
    indepMyshoe.length === 0 &&
    indepMarcin.length >= 1 &&
    persistMyshoe.length === 0 &&
    persistMarcin.length >= 1;

  L('5_GATE_SUMMARY', {
    classification,
    rootCause,
    production: {
      url: PROD,
      apiStatus: data.status,
      model: data.model,
      durationMs,
      toolCalls: toolCalls.map((tc) => tc.name),
    },
    before,
    after,
    mutationCommands: mutationCommands.map((c) => ({
      type: c.type,
      sectionId: c.sectionId,
      props: c.props,
    })),
    insertCommandCount: insertCommands.length,
    primaryTextId,
    heroSectionId: heroSection?.id || null,
    existingNodeTargeted:
      mutationCommands.length > 0 &&
      mutationCommands.some(
        (c) => c.sectionId === primaryTextId || c.sectionId === heroSection?.id
      ),
    verificationPassed,
    outcome,
    applyResults,
    independentRead: {
      myshoe: indepMyshoe.map((n) => n.id),
      marcin: indepMarcin.map((n) => n.id),
    },
    persistence: {
      myshoe: persistMyshoe.map((n) => n.id),
      marcin: persistMarcin.map((n) => n.id),
    },
    toolExecResults,
    allPass,
  });
}

main().catch((err) => {
  L('TRACE_ERROR', {
    error: String(err?.message || err),
    stack: String(err?.stack || '').slice(0, 800),
  });
  process.exit(1);
});
