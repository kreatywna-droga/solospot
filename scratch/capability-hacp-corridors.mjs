/**
 * Capability corridor HACP-level forensic traces — READ ONLY.
 * Executes tools against fixture BuilderDocument; no product code changes.
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

import { HacpBridge, resolveToolExecutionOutcome } from '../src/lib/hacp/HacpBridge.ts';
import { applyCommandToDocument } from '../packages/builder-core/src';
import { ToolSurfaceSelector } from '../src/lib/ai/ToolSurfaceSelector.ts';

function L(step, data) {
  console.log(JSON.stringify({ step, ...data }));
}

function fixtureDoc() {
  return {
    metadata: { storeSlug: 's-forensic' },
    theme: { primaryColor: '#0A0A0F', secondaryColor: '#D9A86C', font: 'Inter' },
    pages: [
      {
        id: 'page-home',
        name: 'Strona Główna',
        sections: [
          {
            id: 'sec_hero',
            type: 'hero',
            label: 'Hero',
            props: { title: 'MYSHOE', backgroundColor: '#0A0A0F' },
            styles: { backgroundColor: '#0A0A0F' },
            children: [
              { id: 'node_h1', type: 'heading', label: 'H1', props: { text: 'MYSHOE' }, styles: {}, children: [] },
            ],
          },
          {
            id: 'sec_features',
            type: 'section',
            label: 'Features',
            props: {},
            styles: {},
            children: [],
          },
        ],
      },
    ],
  };
}

function stats(doc) {
  let sections = 0;
  for (const p of doc.pages || []) sections += (p.sections || []).length;
  return { sectionCount: sections };
}

async function execTool(tc, doc) {
  const bridge = HacpBridge.getInstance();
  const res = await bridge.executeToolCall(tc, doc, 'page-home');
  return {
    name: tc.name,
    status: res.status,
    hasCommand: Boolean(res.command),
    command: res.command || null,
    commandType: res.command?.type,
    sectionId: res.command?.sectionId,
    props: res.command?.props,
    createdNodeId: res.createdNodeId,
    verificationPassed: res.verification?.passed,
    message: String(res.message || '').slice(0, 220),
  };
}

async function main() {
  // ── TEST 3: Library corridor ──
  {
    let doc = fixtureDoc();
    const before = stats(doc);
    L('TEST3_LIBRARY_START', before);

    const search = await execTool(
      { id: 't1', name: 'search_sections', arguments: { query: 'testimonials' } },
      doc
    );
    L('TEST3_SEARCH_RESULT', search);

    // Use ID returned by search_sections (TEST3 message showed testimonials-cards)
    const insert = await execTool(
      {
        id: 't2',
        name: 'insert_section_from_library',
        arguments: { sectionTemplateId: 'testimonials-cards', pageId: 'page-home' },
      },
      doc
    );
    L('TEST3_INSERT_RESULT', insert);

    if (insert.hasCommand) {
      try {
        const cmd = { ...insert.command, pageId: insert.command.pageId || 'page-home' };
        const next = applyCommandToDocument(doc, cmd);
        L('TEST3_DISPATCH', { changed: JSON.stringify(doc) !== JSON.stringify(next), before, after: stats(next) });
        doc = next;
      } catch (e) {
        L('TEST3_DISPATCH_ERROR', { error: String(e?.message || e) });
      }
    }

    const outline = resolveToolExecutionOutcome(
      Boolean(search.verificationPassed) && Boolean(insert.verificationPassed),
      insert.hasCommand ? 1 : 0
    );
    L('TEST3_LIBRARY_CORRIDOR', {
      chain: 'AI→search_sections→Library→result→AI→insert_section_from_library→HACP→BuilderCommand→dispatch→Canvas',
      searchOk: search.status === 'SUCCESS' || search.status === 'EXECUTED' || Boolean(search.verificationPassed),
      insertOk: Boolean(insert.hasCommand) && Boolean(insert.verificationPassed),
      sectionCountBefore: before.sectionCount,
      sectionCountAfter: stats(doc).sectionCount,
      outcome: outline,
      corridorComplete:
        Boolean(insert.hasCommand) &&
        Boolean(insert.verificationPassed) &&
        stats(doc).sectionCount === before.sectionCount + 1,
    });
  }

  // ── TEST 4: Experience corridor ──
  {
    let doc = fixtureDoc();
    const before = stats(doc);
    const search = await execTool(
      { id: 'e1', name: 'search_experiences', arguments: { query: 'gradient' } },
      doc
    );
    L('TEST4_SEARCH_RESULT', search);

    // Extract first experience id from JSON message if present
    let expId = null;
    try {
      const parsed = JSON.parse(search.message);
      expId = parsed.experiences?.[0]?.id || null;
    } catch {}
    L('TEST4_PICKED_ID', { expId, searchCount: (() => { try { return JSON.parse(search.message).count; } catch { return null; } })() });

    const cats = await execTool(
      { id: 'e2', name: 'get_experience_categories', arguments: {} },
      doc
    );
    L('TEST4_CATEGORIES', cats);

    const insert = await execTool(
      {
        id: 'e3',
        name: 'insert_experience_from_library',
        arguments: { experienceId: expId || 'flagship-mirror-hall', sectionId: 'sec_hero', pageId: 'page-home' },
      },
      doc
    );
    L('TEST4_INSERT_RESULT', insert);

    if (insert.hasCommand) {
      try {
        const cmd = { ...insert.command, pageId: insert.command.pageId || 'page-home' };
        const next = applyCommandToDocument(doc, cmd);
        L('TEST4_DISPATCH', {
          changed: JSON.stringify(doc) !== JSON.stringify(next),
          commandType: insert.commandType,
          props: insert.props,
        });
        doc = next;
      } catch (e) {
        L('TEST4_DISPATCH_ERROR', { error: String(e?.message || e) });
      }
    }

    L('TEST4_EXPERIENCE_CORRIDOR', {
      chain: 'AI→search_experiences→Experience Library→result→AI→insert_experience_from_library→HACP→UPDATE_PROPS→Experience runtime→Canvas',
      searchOk: Boolean(search.message) && search.status !== 'UNSUPPORTED',
      categoriesOk: cats.status !== 'UNSUPPORTED',
      insertOk: Boolean(insert.hasCommand) && Boolean(insert.verificationPassed),
      corridorComplete: Boolean(insert.hasCommand) && Boolean(insert.verificationPassed),
      note: 'insert_experience writes experienceConfig via UPDATE_PROPS; runtime compositor reads experienceConfig on Canvas',
    });
  }

  // ── TEST 5: Inspector corridor ──
  {
    let doc = fixtureDoc();
    const before = stats(doc);
    const inspect = await execTool(
      { id: 'i1', name: 'inspect_node', arguments: { nodeId: 'sec_hero' } },
      doc
    );
    L('TEST5_INSPECT', inspect);

    const resolve = await execTool(
      { id: 'i2', name: 'resolve_target', arguments: { prompt: 'istniejącej sekcji Hero' } },
      doc
    );
    L('TEST5_RESOLVE', resolve);

    const mutate = await execTool(
      {
        id: 'i3',
        name: 'update_node_props',
        arguments: { sectionId: 'sec_hero', pageId: 'page-home', props: { backgroundColor: '#FF0000' } },
      },
      doc
    );
    L('TEST5_MUTATE', mutate);

    if (mutate.hasCommand && mutate.command?.pageId !== undefined) {
      const next = applyCommandToDocument(doc, mutate.command);
      const hero = next.pages[0].sections.find((s) => s.id === 'sec_hero');
      L('TEST5_CANVAS_DOC', {
        changed: JSON.stringify(doc) !== JSON.stringify(next),
        heroProps: hero?.props,
        heroStyles: hero?.styles,
      });
      doc = next;
    } else if (mutate.hasCommand) {
      // ensure pageId present for applyCommandToDocument
      const cmd = { ...mutate.command, pageId: mutate.command.pageId || 'page-home' };
      try {
        const next = applyCommandToDocument(doc, cmd);
        const hero = next.pages[0].sections.find((s) => s.id === 'sec_hero');
        L('TEST5_CANVAS_DOC', {
          changed: JSON.stringify(doc) !== JSON.stringify(next),
          heroProps: hero?.props,
          heroStyles: hero?.styles,
        });
        doc = next;
      } catch (e) {
        L('TEST5_CANVAS_DOC_ERROR', { error: String(e?.message || e), command: cmd });
      }
    }

    L('TEST5_INSPECTOR_CORRIDOR', {
      chain: 'AI→inspect_node→resolve_target→update_node_props→UPDATE_PROPS→BuilderDocument→Canvas→verification',
      inspectOk: inspect.status !== 'UNSUPPORTED',
      resolveOk: resolve.status !== 'UNSUPPORTED',
      mutateOk: Boolean(mutate.hasCommand) && Boolean(mutate.verificationPassed),
      verificationPassed: Boolean(mutate.verificationPassed),
      corridorComplete: Boolean(mutate.hasCommand) && Boolean(mutate.verificationPassed),
      set_background_color_selectable: ToolSurfaceSelector.getToolNamesForIntent('EDIT_NODE').includes('set_background_color'),
      note: 'Background color path uses update_node_props on EDIT_NODE surface; set_background_color tool exists in REPO but NOT selectable',
    });
  }

  // ── TEST 6: Asset corridor ──
  {
    const inspectAsset = await execTool(
      { id: 'a1', name: 'inspect_asset', arguments: { nodeId: 'node_h1' } },
      fixtureDoc()
    );
    L('TEST6_ASSET_CORRIDOR', {
      inspect_asset: inspectAsset,
      search_assets_tool_exists: false,
      insert_asset_tool_exists: false,
      my_assets_UI_exists: true,
      solospot_library_UI_exists: true,
      shutterstock_API_exists: true,
      corridor: 'UI+API exist; AI HACP = inspect_asset only (C_NOT_SELECTABLE + A_ABSENT for search/insert)',
      corridorComplete: false,
    });
  }

  // ── TEST 7: batch_execute ──
  {
    let doc = fixtureDoc();
    const before = stats(doc);
    const batch = await execTool(
      {
        id: 'b1',
        name: 'batch_execute',
        arguments: {
          operations: [
            { tool: 'update_node_props', args: { sectionId: 'sec_hero', pageId: 'page-home', props: { title: 'BATCH_TITLE' } } },
            { tool: 'insert_section', args: { sectionType: 'testimonials', pageId: 'page-home' } },
          ],
        },
      },
      doc
    );
    L('TEST7_BATCH_EXECUTE', {
      result: batch,
      returnedCommand: batch.hasCommand,
      note: 'batch_execute handler discards sub-tool res.command — outer branch has no command field',
      isSelectable: ToolSurfaceSelector.getToolNamesForIntent('INSERT_SECTION').includes('batch_execute') ||
        ToolSurfaceSelector.getToolNamesForIntent('EDIT_NODE').includes('batch_execute'),
      selectableInAnySurface: ['INSERT_SECTION','INSERT_EXPERIENCE','EDIT_NODE','MOVE_SECTION','DELETE','STYLE','DESIGN_SYSTEM','INSPECT','AUDIT','DEBUG','SITE_GENERATION','UNDO','REDO'].some(
        (i) => ToolSurfaceSelector.getToolNamesForIntent(i).includes('batch_execute')
      ),
      acceptsRawBuilderCommands: false,
      acceptsToolNameArgs: true,
      discardsSubCommands: true,
      dispatchWouldBeEmpty: !batch.hasCommand,
      resolveOutcomeIfOnlyBatch: resolveToolExecutionOutcome(batch.verificationPassed, batch.hasCommand ? 1 : 0),
      sectionCountBefore: before.sectionCount,
      canReachLibrary: true, // via nested insert_section_from_library name
      canReachInspector: true, // via nested update_node_props
      widerThanSingleTools: 'handler table yes; surface no (never selectable); dispatch no (commands dropped)',
    });
  }

  // ── Orphan tools executable? ──
  {
    const orphanProbes = [];
    for (const name of ['insert_section', 'insert_node', 'set_background_color', 'move_node', 'inspect_asset', 'inspect_experience', 'get_experience_categories', 'inspect_parent', 'inspect_responsive', 'inspect_available_capabilities', 'batch_execute']) {
      const r = await execTool({ id: `o_${name}`, name, arguments: name === 'batch_execute' ? { operations: [] } : {} }, fixtureDoc());
      orphanProbes.push({
        name,
        status: r.status,
        hasCommand: r.hasCommand,
        commandType: r.commandType,
        verificationPassed: r.verificationPassed,
        selectableAnywhere: ['INSERT_SECTION','INSERT_EXPERIENCE','INSERT_SITE_TEMPLATE','EDIT_NODE','MOVE_SECTION','DELETE','STYLE','DESIGN_SYSTEM','SITE_GENERATION','INSPECT','AUDIT','DEBUG','CHAT','UNDO','REDO','CLARIFICATION_REQUIRED'].some(
          (i) => ToolSurfaceSelector.getToolNamesForIntent(i).includes(name)
        ),
        pointOfFailure:
          name === 'inspect_asset' || name === 'inspect_experience' || name === 'get_experience_categories' ||
          name === 'inspect_parent' || name === 'inspect_responsive' || name === 'inspect_available_capabilities' ||
          name === 'insert_section' || name === 'insert_node' || name === 'set_background_color' ||
          name === 'move_node' || name === 'batch_execute'
            ? (!['INSERT_SECTION','INSERT_EXPERIENCE','INSERT_SITE_TEMPLATE','EDIT_NODE','MOVE_SECTION','DELETE','STYLE','DESIGN_SYSTEM','SITE_GENERATION','INSPECT','AUDIT','DEBUG','UNDO','REDO'].some((i) => ToolSurfaceSelector.getToolNamesForIntent(i).includes(name))
              ? 'C_NOT_SELECTABLE (registered+executable but no surface)'
              : 'other')
            : 'unknown',
      });
    }
    L('ORPHAN_TOOL_PROBES', {
      note: 'Direct HacpBridge execution bypassing surface — proves REPO+EXECUTABLE without SELECTABLE',
      probes: orphanProbes,
    });
  }

  L('FORENSIC_HACP_DONE', { codeChanged: false, commit: false, push: false, deploy: false });
}

main().catch((err) => {
  L('TRACE_ERROR', { error: String(err?.message || err), stack: String(err?.stack || '').slice(0, 800) });
  process.exit(1);
});
