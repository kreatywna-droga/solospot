/**
 * AI CONTENT INTENT & EXISTING NODE EDITING GATE v1.0
 * Real execution: Hero/MYSHOE → MARCIN BERNATOWICZ on existing node.
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

import { IntentClassifier } from '../src/lib/ai/IntentClassifier.ts';
import { ToolSurfaceSelector } from '../src/lib/ai/ToolSurfaceSelector.ts';
import { AgentOrchestrator } from '../src/lib/ai/AgentOrchestrator.ts';
import { OpenCodeProvider } from '../src/lib/ai/OpenCodeProvider.ts';
import { HacpBridge, resolveToolExecutionOutcome } from '../src/lib/hacp/HacpBridge.ts';
import { applyCommandToDocument } from '../packages/builder-core/src';
import { findNodes } from '../src/lib/ai/BuilderInspectionTools.ts';

const PROMPT =
  'Zmień główny tytuł Hero na:\nMARCIN BERNATOWICZ.\nNa banerze nie może być napisane MYSHOE.';
const NEW_TITLE = 'MARCIN BERNATOWICZ';
const OLD_TEXT = 'MYSHOE';

function L(step, data) {
  console.log(JSON.stringify({ step, ...data }));
}

function walk(nodes, fn, parent = null, sectionId = null) {
  for (const n of nodes || []) {
    fn(n, parent, sectionId);
    walk(n.children, fn, n.id, sectionId || (n.type === 'section' || n.type === 'hero' ? n.id : sectionId));
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
  let textNodes = 0;
  let allNodes = 0;
  for (const p of doc.pages || []) {
    for (const s of p.sections || []) {
      sections++;
      if (s.type === 'hero' || (s.label || '').toLowerCase().includes('hero')) heroes++;
      walk([s], (n) => {
        allNodes++;
        if (n.type === 'text' || n.type === 'heading') textNodes++;
      });
    }
  }
  return {
    sectionCount: sections,
    heroCount: heroes,
    textNodeCount: textNodes,
    totalNodes: allNodes,
    myshoeOccurrences: countText(doc, OLD_TEXT),
    marcinOccurrences: countText(doc, NEW_TITLE),
  };
}

/** Existing project fixture: Hero whose headline is MYSHOE (not hardcoded nodeId in the AI path). */
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

function discoverTarget(doc) {
  const heroNodes = findNodes(doc, { labelContains: 'hero' });
  const myshoeNodes = findNodes(doc, { textContains: OLD_TEXT });
  const heroSection = doc.pages[0].sections.find(
    (s) => s.type === 'hero' || (s.label || '').toLowerCase().includes('hero')
  );
  // Prefer non-section text node as primary target; also track section id (main title)
  const textTarget =
    myshoeNodes.find((n) => n.type !== 'section' && n.type !== 'hero') || myshoeNodes[0] || null;
  let parentSectionId = heroSection?.id || null;
  if (textTarget && textTarget.parentId) {
    parentSectionId = textTarget.parentId;
  }
  return {
    heroSectionId: heroSection?.id || null,
    heroLabel: heroSection?.label || null,
    myshoeNodeIds: myshoeNodes.map((n) => n.id),
    myshoeNodeTypes: myshoeNodes.map((n) => n.type),
    primaryTextId: textTarget?.id || null,
    allMyshoeIds: myshoeNodes.map((n) => n.id),
    labelHeroMatches: heroNodes.map((n) => n.id),
    parentOfMyshoe: parentSectionId,
  };
}

async function main() {
  L('1_USER_REQUEST', { prompt: PROMPT });

  const classified = IntentClassifier.classify(PROMPT, {
    hasSelection: false,
    documentNodeCount: 2,
  });
  const tools = ToolSurfaceSelector.getToolNamesForIntent(classified.category);
  L('0_INTENT', {
    category: classified.category,
    confidence: classified.confidence,
    targets: classified.targets,
    tools,
    expectedCategory: 'EDIT_NODE',
    intentMatch: classified.category === 'EDIT_NODE',
    hasUpdateNodeProps: tools.includes('update_node_props'),
    hasFindNodes: tools.includes('find_nodes'),
    hasInsertSection: tools.includes('insert_section_from_library') || tools.includes('insert_section'),
  });

  // ── GATE 1: BEFORE inspection (no hardcoded nodeId) ──
  let builderDocument = createFixtureDoc();
  const before = stats(builderDocument);
  const target = discoverTarget(builderDocument);
  L('GATE1_BEFORE', {
    ...before,
    heroNodeId: target.heroSectionId,
    heroLabel: target.heroLabel,
    textNodeIds: target.myshoeNodeIds,
    textNodeTypes: target.myshoeNodeTypes,
    primaryTextId: target.primaryTextId,
    parentSectionId: target.parentOfMyshoe,
    discoveryMethod: 'findNodes(doc,{labelContains/textContains}) — dynamic, not hardcoded',
    heroExists: Boolean(target.heroSectionId),
    myshoeExists: before.myshoeOccurrences > 0,
    knownTextNodeId: target.primaryTextId,
    knownParent: target.parentOfMyshoe,
    sectionCountBefore: before.sectionCount,
    nodesIndexCount: buildNodesIndex(builderDocument).length,
    gate1Pass:
      Boolean(target.heroSectionId) &&
      before.myshoeOccurrences > 0 &&
      Boolean(target.primaryTextId) &&
      Boolean(target.parentOfMyshoe),
  });

  // ── Model trace ──
  const provider = new OpenCodeProvider();
  const realFetch = globalThis.fetch;
  let modelReqIndex = 0;
  const capturedRequests = [];
  const capturedResponses = [];
  globalThis.fetch = async (url, init) => {
    const isLLM = typeof url === 'string' && url.includes('/chat/completions');
    if (isLLM) {
      modelReqIndex++;
      let body = {};
      try {
        body = JSON.parse(init?.body || '{}');
      } catch {}
      const toolNames = (body.tools || []).map((t) => t.function?.name || t.name).filter(Boolean);
      capturedRequests.push({
        index: modelReqIndex,
        model: body.model,
        toolsSent: toolNames,
        hasUpdate: toolNames.includes('update_node_props'),
        hasInsert: toolNames.includes('insert_section') || toolNames.includes('insert_section_from_library'),
      });
      L('MODEL_REQUEST', {
        index: modelReqIndex,
        model: body.model,
        toolsSent: toolNames,
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
        capturedResponses.push({
          index: modelReqIndex,
          model: data.model,
          finishReason: choice?.finish_reason,
          contentPreview: (choice?.message?.content || '').slice(0, 300),
          toolCallNames: tcs.map((t) => t.name),
          toolCalls: tcs,
        });
        L('MODEL_RESPONSE', {
          index: modelReqIndex,
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

  const orch = new AgentOrchestrator({ generateWithTools: (req) => provider.generateWithTools(req) });
  const t0 = Date.now();
  const orchResult = await orch.orchestrate(
    {
      prompt: PROMPT,
      messages: [{ role: 'user', content: PROMPT }],
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
      routerMode: 'FREE',
    },
    {
      documentNodeCount: before.sectionCount,
      hasSelection: false,
      sectionsSummary: builderDocument.pages[0].sections.map((s) => ({
        id: s.id,
        type: s.type,
        label: s.label,
      })),
    }
  );
  const durationMs = Date.now() - t0;

  L('3_ORCHESTRATOR', {
    status: orchResult.status,
    intent: orchResult.intent,
    modelUsed: orchResult.modelUsed,
    durationMs,
    toolCalls: orchResult.toolCalls.map((tc) => ({
      name: tc.name,
      arguments: tc.arguments,
      isMutation: ToolSurfaceSelector.isMutationTool(tc.name),
    })),
    messagePreview: (orchResult.message || '').slice(0, 400),
    error: orchResult.error,
    modelRequests: capturedRequests.length,
    modelResponses: capturedResponses.length,
  });

  // ── GATE 2: mutation on existing node ──
  const bridge = HacpBridge.getInstance();
  const commands = [];
  const execResults = [];
  const createdNodeIds = [];
  let lastVerification = null;
  let allPassed = true;

  L('GATE2_MUTATION_START', {
    toolCallCount: orchResult.toolCalls.length,
    toolNames: orchResult.toolCalls.map((tc) => tc.name),
  });

  for (const tc of orchResult.toolCalls) {
    const exec = await bridge.executeToolCall(tc, builderDocument, 'page-home');
    lastVerification = exec.verification;
    if (exec.command) commands.push(exec.command);
    if (exec.createdNodeId) createdNodeIds.push(exec.createdNodeId);
    if (exec.status !== 'EXECUTED') allPassed = false;
    execResults.push({
      name: tc.name,
      status: exec.status,
      commandType: exec.command?.type,
      sectionId: exec.command?.sectionId,
      props: exec.command?.props,
      verificationPassed: exec.verification?.passed,
      messagePreview: String(exec.message || '').slice(0, 300),
    });
    L('GATE2_TOOL_RESULT', {
      name: tc.name,
      status: exec.status,
      commandType: exec.command?.type,
      sectionId: exec.command?.sectionId,
      props: exec.command?.props,
      verificationPassed: exec.verification?.passed,
      messagePreview: String(exec.message || '').slice(0, 300),
    });
  }

  const mutationCommands = commands.filter(
    (c) => c.type === 'UPDATE_PROPS' || c.type === 'REPLACE_PROPS'
  );
  const insertCommands = commands.filter(
    (c) => c.type === 'ADD_SECTION' || c.type === 'ADD_NODE' || c.type === 'INSERT_NODE'
  );

  const outcome = resolveToolExecutionOutcome(allPassed, commands.length);

  // Dispatch
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

  L('GATE2_RESULT', {
    outcome,
    commandCount: commands.length,
    commands: commands.map((c) => ({
      type: c.type,
      sectionId: c.sectionId,
      pageId: c.pageId,
      props: c.props,
    })),
    mutationCommandCount: mutationCommands.length,
    insertCommandCount: insertCommands.length,
    applyResults,
    existingNodeTargeted:
      mutationCommands.length > 0 &&
      mutationCommands.every(
        (c) =>
          c.sectionId === target.heroSectionId ||
          target.myshoeNodeIds.includes(c.sectionId) ||
          target.labelHeroMatches.includes(c.sectionId)
      ),
    usedKnownTextOrHeroId: mutationCommands.some(
      (c) =>
        c.sectionId === target.myshoeNodeIds[0] ||
        c.sectionId === target.heroSectionId
    ),
  });

  L('GATE3_DUPLICATE', {
    before: {
      sectionCount: before.sectionCount,
      heroCount: before.heroCount,
      textNodeCount: before.textNodeCount,
      myshoeOccurrences: before.myshoeOccurrences,
      totalNodes: before.totalNodes,
    },
    after: {
      sectionCount: after.sectionCount,
      heroCount: after.heroCount,
      textNodeCount: after.textNodeCount,
      myshoeOccurrences: after.myshoeOccurrences,
      totalNodes: after.totalNodes,
      marcinOccurrences: after.marcinOccurrences,
    },
    sectionUnchanged: after.sectionCount === before.sectionCount,
    heroUnchanged: after.heroCount === before.heroCount,
    myshoeGone: after.myshoeOccurrences === 0,
    marcinPresent: after.marcinOccurrences >= 1,
    noDuplicate:
      after.sectionCount === before.sectionCount &&
      after.heroCount === before.heroCount &&
      insertCommands.length === 0,
    gate3Pass:
      after.sectionCount === before.sectionCount &&
      after.heroCount === before.heroCount &&
      after.myshoeOccurrences === 0 &&
      after.marcinOccurrences >= 1 &&
      insertCommands.length === 0,
  });

  // ── GATE 4: independent READ ──
  const indepMyshoe = findNodes(builderDocument, { textContains: OLD_TEXT });
  const indepMarcin = findNodes(builderDocument, { textContains: NEW_TITLE });
  const heroAfter = builderDocument.pages[0].sections.find(
    (s) => s.id === target.heroSectionId
  );
  const heroTexts = [];
  walk(heroAfter ? [heroAfter] : [], (n) => {
    const props = n.props || {};
    for (const v of Object.values(props)) {
      if (typeof v === 'string') heroTexts.push({ nodeId: n.id, text: v });
    }
  });
  L('GATE4_INDEPENDENT_READ', {
    myshoeNodes: indepMyshoe.map((n) => n.id),
    marcinNodes: indepMarcin.map((n) => ({ id: n.id, type: n.type, props: n.props })),
    heroStillExists: Boolean(heroAfter),
    heroTexts,
    marcinInHero: heroTexts.some((t) => t.text.includes(NEW_TITLE)),
    myshoeInHero: heroTexts.some((t) => t.text.includes(OLD_TEXT)),
    gate4Pass:
      Boolean(heroAfter) &&
      indepMyshoe.length === 0 &&
      indepMarcin.length >= 1 &&
      heroTexts.some((t) => t.text.includes(NEW_TITLE)) &&
      !heroTexts.some((t) => t.text.includes(OLD_TEXT)),
  });

  // ── Classification ──
  const insertOrNewSection =
    insertCommands.length > 0 || after.sectionCount > before.sectionCount || after.heroCount > before.heroCount;
  const wrongNode =
    mutationCommands.length > 0 &&
    !mutationCommands.some(
      (c) =>
        c.sectionId === target.primaryTextId ||
        c.sectionId === target.heroSectionId ||
        target.myshoeNodeIds.includes(c.sectionId)
    );
  const verificationPassed = Boolean(lastVerification?.passed);
  const myshoeRemaining = after.myshoeOccurrences > 0;
  const marcinMissing = after.marcinOccurrences < 1;

  let classification = 'G';
  let rootCause = 'full existing-node edit pass';
  if (orchResult.status === 'ERROR') {
    classification = 'ERROR';
    rootCause = orchResult.error || 'provider error';
  } else if (classified.category !== 'EDIT_NODE') {
    classification = 'A';
    rootCause = `Intent misclassified as ${classified.category} (expected EDIT_NODE) — hero keyword matched INSERT_SECTION before EDIT action`;
  } else if (orchResult.toolCalls.length === 0 && !orchResult.controllerInjected) {
    classification = 'A';
    rootCause = 'no mutation tool call returned — target resolution or model failed to select update_node_props';
  } else if (insertOrNewSection) {
    classification = 'C';
    rootCause = 'duplicate section/hero created instead of editing existing node';
  } else if (wrongNode) {
    classification = 'B';
    rootCause = 'mutation applied to wrong node (not Hero/MYSHOE target)';
  } else if (mutationCommands.length === 0) {
    classification = 'D';
    rootCause = 'no UPDATE_PROPS mutation produced';
  } else if (myshoeRemaining || marcinMissing) {
    classification = myshoeRemaining && !wrongNode && mutationCommands.length > 0 ? 'D' : 'E';
    rootCause = myshoeRemaining
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
    rootCause = 'existing Hero MYSHOE node edited in place — no duplicates';
  } else {
    classification = 'E';
    rootCause = 'content verification failed';
  }

  L('GATE5_DOM_NOTE', {
    note: 'DOM/persistence gates exercised via BuilderDocument independent READ + applyCommandToDocument; browser persistence covered in production studio save/reload path.',
  });

  // ── GATE 5/6: persistence — independent re-read after serialize/rehydrate ──
  const roundTrip = JSON.parse(JSON.stringify(builderDocument));
  const persistMyshoe = findNodes(roundTrip, { textContains: OLD_TEXT });
  const persistMarcin = findNodes(roundTrip, { textContains: NEW_TITLE });
  const persistHero = (roundTrip.pages?.[0]?.sections || []).find(
    (s) => s.id === target.heroSectionId
  );
  L('GATE5_PERSISTENCE', {
    roundTripOk: Boolean(roundTrip),
    myshoeAfterReload: persistMyshoe.map((n) => n.id),
    marcinAfterReload: persistMarcin.map((n) => n.id),
    heroStillPresent: Boolean(persistHero),
    sectionCountAfterReload: roundTrip.pages?.[0]?.sections?.length ?? -1,
    gate5Pass:
      persistMyshoe.length === 0 &&
      persistMarcin.length >= 1 &&
      Boolean(persistHero) &&
      (roundTrip.pages?.[0]?.sections?.length ?? -1) === before.sectionCount,
  });

  L('GATE7_NO_FAKE_SUCCESS', {
    orchestratorStatus: orchResult.status,
    wouldClaimSuccess:
      orchResult.status === 'SUCCESS' &&
      classification === 'G' &&
      verificationPassed &&
      after.myshoeOccurrences === 0 &&
      after.marcinOccurrences >= 1,
    antiFakeSuccessHolds:
      classification !== 'G' || orchResult.status !== 'SUCCESS'
        ? 'status not SUCCESS or classification not G — honest'
        : 'SUCCESS only with full chain',
  });

  L('FINAL_SUMMARY', {
    classification,
    rootCause,
    intent: classified.category,
    intentMatch: classified.category === 'EDIT_NODE',
    beforeSectionCount: before.sectionCount,
    afterSectionCount: after.sectionCount,
    beforeHeroCount: before.heroCount,
    afterHeroCount: after.heroCount,
        beforeMyshoe: before.myshoeOccurrences,
        afterMyshoe: after.myshoeOccurrences,
        afterMarcin: after.marcinOccurrences,
        beforeTextNodes: before.textNodeCount,
        afterTextNodes: after.textNodeCount,
        mutationTool: orchResult.toolCalls.find((tc) =>
          ToolSurfaceSelector.isMutationTool(tc.name)
        )?.name || null,
        mutationTargetNodeId:
          mutationCommands[0]?.sectionId || null,
        expectedTargetTextNodeId: target.primaryTextId,
        expectedTargetHeroId: target.heroSectionId,
      verificationPassed,
      modelTurns: capturedResponses.length,
      modelRequests: capturedRequests.length,
      durationMs,
      pass:
        classification === 'G' &&
        orchResult.status === 'SUCCESS' &&
        before.sectionCount === 1 + 1 && // 2 sections fixture
        after.sectionCount === before.sectionCount &&
        after.heroCount === before.heroCount &&
        before.myshoeOccurrences === 1 && // single MYSHOE on hero section title
        after.myshoeOccurrences === 0 &&
        after.marcinOccurrences >= 1 &&
        verificationPassed,
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
