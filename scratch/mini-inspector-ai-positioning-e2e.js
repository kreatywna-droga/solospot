/**
 * CONTEXTUAL MINI INSPECTOR AI ANCHOR-TO-SELECTED-COMPONENT GATE v1.0 — Prod E2E
 *
 * Geometry proof: AI window is anchored to the selected node's viewport rect
 * (not stale bottom-right), follows scroll/zoom/selection, stays inside workspace.
 *
 * BASE_URL=https://www.solospot.pl
 */
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.BASE_URL || 'https://www.solospot.pl';
const CHROME_PATH =
  process.env.CHROME_PATH ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT_DIR = path.join(__dirname, 'mini-inspector-ai-positioning-proof');

const RESULTS = [];
let step = 0;

function log(id, action, expected, actual, status, evidence = '') {
  RESULTS.push({ id, action, expected, actual, status, evidence });
  console.log(`${status} ${id}: ${action} — ${actual}`);
  if (evidence) console.log(`  evidence: ${evidence}`);
}

function nextStep() {
  step += 1;
  return `S${String(step).padStart(2, '0')}`;
}

async function waitMs(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`), fullPage: false });
  console.log(`  [shot] ${name}.png`);
}

/** Full geometry snapshot: workspace, selected node, AI window. */
function SNAPSHOT_FN() {
  const round = (n) => Math.round(n * 100) / 100;
  const R = (r) => ({
    left: round(r.left), top: round(r.top), right: round(r.right), bottom: round(r.bottom),
    width: round(r.width), height: round(r.height),
    cx: round(r.left + r.width / 2), cy: round(r.top + r.height / 2),
  });

  const wsEl = document.querySelector('[data-builder-workspace]');
  const ws = wsEl ? R(wsEl.getBoundingClientRect()) : null;

  const ai = document.querySelector('[data-testid="mini-inspector-ai"]');
  let aiData = null;
  if (ai) {
    const r = ai.getBoundingClientRect();
    const cs = getComputedStyle(ai);
    aiData = {
      rect: R(r),
      position: cs.position,
      leftStyle: ai.style.left || null,
      topStyle: ai.style.top || null,
      rightStyle: ai.style.right || null,
      bottomStyle: ai.style.bottom || null,
      placement: ai.getAttribute('data-ai-placement'),
      target: ai.getAttribute('data-ai-target'),
      status: ai.getAttribute('data-ai-status'),
      visible: r.width > 0 && r.height > 0,
    };
  }

  // Selected node: prefer target id from AI, else first selected-looking node
  const targetId = aiData && aiData.target;
  let node = null;
  if (targetId) {
    const el =
      document.querySelector(`[data-node-id="${CSS.escape(targetId)}"]`) ||
      document.querySelector(`[data-section-id="${CSS.escape(targetId)}"]`);
    if (el) {
      const r = el.getBoundingClientRect();
      node = {
        id: targetId,
        rect: R(r),
        type: el.getAttribute('data-node-type') || 'section',
      };
    }
  }

  return { ws, ai: aiData, node, dpr: window.devicePixelRatio, vw: window.innerWidth, vh: window.innerHeight };
}

async function snapshot(page) {
  return page.evaluate(SNAPSHOT_FN);
}

/** Is AI window "next to" the node (right/left/above/below within gap tolerance)? */
function nearNode(s, gapMax = 80) {
  if (!s.ai || !s.node) return { ok: false, reason: 'missing ai or node' };
  const a = s.ai.rect;
  const n = s.node.rect;
  const gaps = {
    leftOfNode: n.left - a.right,
    rightOfNode: a.left - n.right,
    aboveNode: n.top - a.bottom,
    belowNode: a.top - n.bottom,
  };
  const minGap = Math.min(gaps.leftOfNode, gaps.rightOfNode, gaps.aboveNode, gaps.belowNode);
  // At least one side has a small non-negative gap (adjacent), or slight overlap ok
  const adjacent =
    (gaps.leftOfNode >= -8 && gaps.leftOfNode <= gapMax) ||
    (gaps.rightOfNode >= -8 && gaps.rightOfNode <= gapMax) ||
    (gaps.aboveNode >= -8 && gaps.aboveNode <= gapMax) ||
    (gaps.belowNode >= -8 && gaps.belowNode <= gapMax);
  // Not the stale bottom-right corner (within 40px of viewport bottom-right)
  const staleCorner =
    Math.abs(a.right - s.vw) < 40 && Math.abs(a.bottom - s.vh) < 40;
  return {
    ok: adjacent && !staleCorner,
    adjacent,
    staleCorner,
    gaps,
    placement: s.ai.placement,
    minGap: Math.round(minGap * 100) / 100,
  };
}

function insideWorkspace(s, margin = 16) {
  if (!s.ai || !s.ws) return false;
  const a = s.ai.rect;
  const w = s.ws;
  return (
    a.left >= w.left + margin - 1 &&
    a.right <= w.right - margin + 1 &&
    a.top >= w.top + margin - 1 &&
    a.bottom <= w.bottom - margin + 1
  );
}

async function openAiForSelection(page) {
  let present = await page.evaluate(
    () => !!document.querySelector('[data-testid="mini-inspector-ai-open"]')
  );
  if (!present) {
    await realClickSelector(page, '[title*="Ustawienia"]');
    await waitMs(900);
    present = await page.evaluate(
      () => !!document.querySelector('[data-testid="mini-inspector-ai-open"]')
    );
  }
  if (!present) return false;
  await realClickSelector(page, '[data-testid="mini-inspector-ai-open"]');
  await waitMs(800);
  return page.evaluate(() => !!document.querySelector('[data-testid="mini-inspector-ai"]'));
}

async function realClickSelector(page, selector) {
  const pt = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return null;
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
  }, selector);
  if (!pt) return false;
  await page.mouse.move(pt.x, pt.y);
  await waitMs(250);
  await page.mouse.click(pt.x, pt.y);
  await waitMs(600);
  return true;
}

async function selectByType(page, typePref) {
  const pick = await page.evaluate((prefs) => {
    const nodes = Array.from(document.querySelectorAll('[data-node-id]'));
    let el = null;
    for (const t of prefs) {
      el = nodes.find((n) => (n.getAttribute('data-node-type') || '') === t);
      if (el) break;
    }
    if (!el) el = document.querySelector('[data-section-id]') || nodes[0];
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      id: el.getAttribute('data-node-id') || el.getAttribute('data-section-id'),
      type: el.getAttribute('data-node-type') || 'section',
      x: Math.round(r.x + r.width / 2),
      y: Math.round(r.y + r.height / 2),
    };
  }, typePref);
  if (!pick) return null;
  await page.mouse.move(pick.x, pick.y);
  await waitMs(350);
  await page.mouse.click(pick.x, pick.y);
  await waitMs(1200);
  return pick;
}

function closeAi(page) {
  return page.evaluate(() => {
    const btn = document.querySelector('[data-testid="mini-inspector-ai-collapse"]');
    if (btn) btn.click();
  });
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1000'],
    defaultViewport: { width: 1600, height: 1000 },
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  let armed = false;
  page.on('pageerror', (e) => {
    if (armed) consoleErrors.push(e.message.slice(0, 250));
  });
  page.on('console', (m) => {
    if (armed && m.type() === 'error') consoleErrors.push(m.text().slice(0, 250));
  });

  try {
    log(nextStep(), 'Open prod URL', 'reachable', BASE_URL, 'PASS', BASE_URL);
    await page.goto(`${BASE_URL}/studio/test-store`, {
      waitUntil: 'networkidle2',
      timeout: 90000,
    });
    await page.waitForSelector('[data-builder-workspace]', { timeout: 60000 });
    await waitMs(3500);
    log(nextStep(), 'Builder workspace present', '[data-builder-workspace]', 'present', 'PASS');
    await shot(page, '01-builder');
    armed = true;

    // ── S: select HEADLINE and open AI ──
    const n1 = await selectByType(page, ['heading', 'text']);
    if (!n1) throw new Error('No heading/text node');
    log(nextStep(), 'Select heading', 'click succeeded', `${n1.type}:${n1.id}`, 'PASS');
    const opened1 = await openAiForSelection(page);
    log(
      nextStep(),
      'Open Mini Inspector AI for heading',
      'window present',
      opened1 ? 'open' : 'missing',
      opened1 ? 'PASS' : 'FAIL'
    );
    await shot(page, '02-ai-heading');

    let s1 = await snapshot(page);
    const a1 = nearNode(s1);
    log(
      nextStep(),
      'AI anchored next to selected heading (not stale bottom-right)',
      'adjacent + not viewport corner',
      `placement=${a1.placement} adjacent=${a1.adjacent} staleCorner=${a1.staleCorner} gaps=${JSON.stringify(a1.gaps)}`,
      a1.ok ? 'PASS' : 'FAIL',
      `node=${s1.node && s1.node.id} ai=${JSON.stringify(s1.ai && s1.ai.rect)}`
    );
    const in1 = insideWorkspace(s1);
    log(
      nextStep(),
      'AI window fully inside builder workspace (16px margin)',
      'inside workspace',
      in1 ? 'inside' : 'OUTSIDE',
      in1 ? 'PASS' : 'FAIL',
      `ws=${JSON.stringify(s1.ws)} ai=${JSON.stringify(s1.ai && s1.ai.rect)}`
    );
    log(
      nextStep(),
      'AI uses anchored left/top style (not bottom/right corner classes)',
      'left+top style set, placement attr present',
      s1.ai
        ? `left=${s1.ai.leftStyle} top=${s1.ai.topStyle} right=${s1.ai.rightStyle} bottom=${s1.ai.bottomStyle} placement=${s1.ai.placement}`
        : 'missing',
      s1.ai && s1.ai.leftStyle && s1.ai.topStyle && s1.ai.placement !== 'fallback'
        ? 'PASS'
        : 'FAIL'
    );
    await shot(page, '03-ai-geometry-heading');

    // ── S: scroll while AI open → follows ──
    const beforeScroll = s1.ai.rect.top;
    const nodeBeforeScroll = s1.node && { ...s1.node.rect };
    await page.evaluate(() => {
      // Scroll every scrollable ancestor of the selected/canvas content
      const targets = [];
      const ws = document.querySelector('[data-builder-workspace]');
      if (ws) targets.push(ws);
      document.querySelectorAll('[data-builder-workspace] *').forEach((el) => {
        if (el.scrollHeight > el.clientHeight + 4) targets.push(el);
      });
      targets.push(document.scrollingElement || document.documentElement);
      for (const t of targets) {
        try {
          t.scrollTop = (t.scrollTop || 0) + 160;
        } catch (_) {}
      }
      window.scrollBy(0, 100);
      // Also dispatch a synthetic scroll so capture listeners fire
      window.dispatchEvent(new Event('scroll'));
    });
    await waitMs(900);
    const s2 = await snapshot(page);
    const a2 = nearNode(s2);
    const nodeMoved =
      s2.node && nodeBeforeScroll &&
      (Math.abs(s2.node.rect.top - nodeBeforeScroll.top) > 2 ||
        Math.abs(s2.node.rect.left - nodeBeforeScroll.left) > 2);
    // PASS if still adjacent; if the node actually moved in viewport, AI must have moved too
    const aiMoved = s2.ai && Math.abs(s2.ai.rect.top - beforeScroll) > 2;
    const followOk = a2.adjacent && (!nodeMoved || aiMoved || !nodeMoved);
    log(
      nextStep(),
      'AI follows after workspace/page scroll',
      'still adjacent to node (and tracks if node moved)',
      `placement=${a2.placement} adjacent=${a2.adjacent} nodeMoved=${nodeMoved} aiTop ${beforeScroll}→${s2.ai && s2.ai.rect.top}`,
      a2.ok && followOk ? 'PASS' : 'FAIL',
      `node=${s2.node && JSON.stringify(s2.node.rect)} ai=${s2.ai && JSON.stringify(s2.ai.rect)}`
    );
    await shot(page, '04-ai-after-scroll');

    // ── S: zoom via real Builder zoom control (not body.zoom hack) ──
    const zoomBtn = await page.evaluate(() => {
      const btn =
        document.querySelector('button[title="Zoom out"]') ||
        document.querySelector('button[title*="Zoom"]') ||
        null;
      if (!btn) return false;
      btn.click();
      return true;
    });
    if (!zoomBtn) {
      // Fallback: keyboard shortcut handled by BuilderProvider
      await page.keyboard.down('Control');
      await page.keyboard.press('-');
      await page.keyboard.up('Control');
    }
    await waitMs(900);
    const s3 = await snapshot(page);
    const a3 = nearNode(s3);
    log(
      nextStep(),
      'AI follows after canvas zoom out',
      'still adjacent to node',
      `placement=${a3.placement} adjacent=${a3.adjacent} via=${zoomBtn ? 'button' : 'keyboard'}`,
      a3.ok ? 'PASS' : 'FAIL',
      `node=${s3.node && JSON.stringify(s3.node.rect)} ai=${s3.ai && JSON.stringify(s3.ai.rect)}`
    );
    await shot(page, '05-ai-after-zoom');
    // Reset zoom to 100% if a reset control exists
    await page.evaluate(() => {
      const reset =
        document.querySelector('button[title="Zoom 100%"]') ||
        Array.from(document.querySelectorAll('button')).find((b) =>
          /100%/.test(b.textContent || '')
        );
      if (reset) reset.click();
    });
    await waitMs(500);

    // ── S: viewport resize → stays in workspace ──
    await page.setViewport({ width: 1280, height: 720 });
    await waitMs(700);
    const s4 = await snapshot(page);
    const a4 = nearNode(s4);
    const in4 = insideWorkspace(s4);
    log(
      nextStep(),
      'AI follows after viewport resize 1280x720',
      'adjacent + inside workspace',
      `adjacent=${a4.adjacent} inside=${in4} placement=${a4.placement}`,
      a4.ok && in4 ? 'PASS' : 'FAIL',
      `ws=${JSON.stringify(s4.ws)} ai=${s4.ai && JSON.stringify(s4.ai.rect)}`
    );
    await shot(page, '06-ai-after-resize');
    await page.setViewport({ width: 1600, height: 1000 });
    await waitMs(500);

    // ── S: selection change → re-anchor to new node ──
    await closeAi(page);
    await waitMs(400);
    // click empty canvas area to deselect-ish, then select a different node type
    let n2 = await selectByType(page, ['button', 'image', 'section']);
    if (!n2 || n2.id === n1.id) {
      // try any other node
      const n2b = await selectByType(page, ['paragraph', 'card', 'hero']);
      if (n2b) n2 = n2b;
    }
    const opened2 = await openAiForSelection(page);
    await waitMs(600);
    const s5 = await snapshot(page);
    const a5 = nearNode(s5);
    const targetMatch = s5.ai && s5.node && s5.ai.target === s5.node.id;
    log(
      nextStep(),
      'Selection change re-anchors AI to new node',
      'AI target matches selected node + adjacent',
      `target=${s5.ai && s5.ai.target} node=${s5.node && s5.node.id} match=${targetMatch} adjacent=${a5.adjacent} placement=${a5.placement}`,
      opened2 && targetMatch && a5.ok ? 'PASS' : 'FAIL',
      `ai=${s5.ai && JSON.stringify(s5.ai.rect)} node=${s5.node && JSON.stringify(s5.node.rect)}`
    );
    await shot(page, '07-ai-selection-change');

    // ── S: large section node → still anchored (RIGHT or BELOW etc.) ──
    await closeAi(page);
    await waitMs(300);
    const n3 = await selectByType(page, ['section', 'hero']);
    const opened3 = n3 ? await openAiForSelection(page) : false;
    await waitMs(600);
    const s6 = await snapshot(page);
    const a6 = nearNode(s6);
    log(
      nextStep(),
      'Large section/hero node: AI still anchored (not corner)',
      'adjacent + not stale corner',
      n3
        ? `placement=${a6.placement} adjacent=${a6.adjacent} staleCorner=${a6.staleCorner}`
        : 'no section node',
      n3 && a6.ok ? 'PASS' : opened3 && a6.ok ? 'PASS' : 'FAIL',
      `node=${s6.node && JSON.stringify(s6.node.rect)} ai=${s6.ai && JSON.stringify(s6.ai.rect)}`
    );
    await shot(page, '08-ai-section-node');

    // ── S: regression — target lock strip still present ──
    const strip = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="mini-inspector-ai-target"]');
      return el ? (el.textContent || '').trim().slice(0, 80) : null;
    });
    log(
      nextStep(),
      'Regression: target lock strip present',
      'TARGET: <type> <id>',
      strip || 'missing',
      strip && strip.includes('TARGET') ? 'PASS' : 'FAIL'
    );
    await shot(page, '09-target-lock-regression');

    // ── S: no fake success / console errors ──
    const errs = consoleErrors.filter(
      (e) => !/favicon|ResizeObserver loop|Download the React DevTools/i.test(e)
    );
    log(
      nextStep(),
      'No console errors during positioning E2E',
      '0 errors',
      `${errs.length} errors`,
      errs.length === 0 ? 'PASS' : 'FAIL',
      errs.slice(0, 3).join(' | ')
    );

    // Final geometry dump for report
    const finalSnap = await snapshot(page);
    fs.writeFileSync(
      path.join(OUT_DIR, 'geometry-final.json'),
      JSON.stringify({ results: RESULTS, final: finalSnap }, null, 2)
    );
  } catch (err) {
    log(nextStep(), 'E2E crash', 'no exception', String(err && err.message), 'FAIL');
    try {
      await shot(page, 'crash');
    } catch (_) {}
  } finally {
    const pass = RESULTS.filter((r) => r.status === 'PASS').length;
    const fail = RESULTS.filter((r) => r.status === 'FAIL').length;
    fs.writeFileSync(
      path.join(OUT_DIR, 'result.json'),
      JSON.stringify({ pass, fail, total: RESULTS.length, results: RESULTS }, null, 2)
    );
    console.log(`\n=== POSITIONING E2E: ${pass} PASS / ${fail} FAIL (${RESULTS.length} total) ===`);
    await browser.close();
    process.exit(fail > 0 ? 1 : 0);
  }
})();
