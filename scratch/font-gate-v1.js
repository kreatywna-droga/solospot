/**
 * FONT CHANGE REAL EXECUTION GATE v1.0 — production forensic harness (READ-ONLY).
 *
 * For each prompt, traces the FULL chain:
 *   Mini Inspector -> intent -> FastPath -> set_node_styles -> BuilderCommand
 *   -> BuilderDocument (localStorage after Save) -> Canvas computed style
 *   -> font loading (document.fonts) -> persistence (reload) -> undo/redo
 *
 * Captures per prompt:
 *   trace  : window.__SOLOSPOT_LATENCY_TRACES__ entry (path, exec, intent, notes, tool)
 *   console: [HacpBridge] EXECUTION_TRACE entries (tool + args)
 *   doc    : BuilderDocument node styles BEFORE/AFTER (Save -> localStorage)
 *   canvas : computed fontFamily + rendered width + fonts.check BEFORE/AFTER
 *   panel  : status + message
 *   errors : page errors + console errors during the run
 *
 * Env: BASE, TAG
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'https://www.solospot.pl';
const TAG = process.env.TAG || 'fontv1';
const STORE_ID = 's-demo';

const FIXTURE = {
  id: 's-demo',
  metadata: { storeName: 'SoloSpot Visual Builder', storeSlug: 's-demo', locale: 'pl', currency: 'PLN' },
  theme: { primaryColor: '#7c3aed', secondaryColor: '#f1f5f9', font: 'Inter' },
  tenantId: 'tenant-demo',
  pages: [
    {
      id: 'page-home', name: 'Strona Główna', slug: '/',
      sections: [
        {
          id: 'sec-hero-init', type: 'hero', label: 'Hero', parentId: null,
          props: { title: 'SoloSpot Visual Builder v2.0', subtitle: 'Biblioteka', cta: 'Rozpocznij zakupy' },
          styles: {}, responsive: {}, visible: true, locked: false, order: 0,
          children: [
            { id: 'node-heading-a', type: 'heading', label: 'Heading A', parentId: 'sec-hero-init',
              props: { text: 'Naglowek A' }, styles: { color: '#ffffff' }, responsive: {}, visible: true, locked: false, order: 0, children: [] },
            { id: 'node-button-b', type: 'button', label: 'Button B', parentId: 'sec-hero-init',
              props: { label: 'Kliknij' }, styles: { color: '#ffffff' }, responsive: {}, visible: true, locked: false, order: 1, children: [] },
          ],
        },
      ],
    },
  ],
};

const PROMPTS = [
  { id: 'A', prompt: 'zmień czcionkę na inną', expect: 'font' },
  { id: 'B', prompt: 'zmień czcionkę na Playfair Display', expect: 'Playfair Display' },
  { id: 'C', prompt: 'zmień czcionkę na Inter', expect: 'Inter' },
  { id: 'D', prompt: 'zmień czcionkę na Cormorant Garamond', expect: 'Cormorant Garamond' },
  { id: 'E', prompt: 'zmień kolor na czerwony', expect: 'color' },
  { id: 'F', prompt: 'zmień napis na MARCIN BERNATOWICZ', expect: 'text' },
];

const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
].find((p) => p && fs.existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const OUT = path.join(__dirname, '..', 'scratch', `font-gate-${TAG}.json`);

const saveDoc = async (page) => {
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find((x) => (x.innerText || '').trim() === 'Save');
    if (b) b.click();
  });
  await sleep(1200);
};

const docSnap = (page) =>
  page.evaluate((storeId) => {
    try {
      const raw = localStorage.getItem(`solospot_store_${storeId}`);
      if (!raw) return null;
      const doc = JSON.parse(raw);
      const out = {};
      const walk = (n) => { out[n.id] = { type: n.type, styles: n.styles, props: n.props }; (n.children || []).forEach(walk); };
      (doc.pages || []).forEach((p) => (p.sections || []).forEach(walk));
      return out;
    } catch (e) { return { error: String(e) }; }
  }, STORE_ID);

/** Real canvas truth: computed style + rendered geometry + font loading. */
const canvasSnap = async (page) => {
    const base = await page.evaluate(() => {
    const el = document.querySelector('[data-node-id="node-heading-a"]');
    if (!el) return { missing: true };
    const inner = el.querySelector('h1,h2,h3,h4,p,span') || el;
    const cs = getComputedStyle(inner);
    const r = inner.getBoundingClientRect();
    return {
      fontFamily: cs.fontFamily,
      fontWeight: cs.fontWeight,
      fontSize: cs.fontSize,
      renderedWidth: Math.round(r.width * 10) / 10,
      renderedText: (inner.innerText || '').slice(0, 40),
      inlineStyle: inner.getAttribute('style') || '',
    };
  });
  const fonts = await page.evaluate(() => {
    const families = ['Playfair Display', 'Inter', 'Cormorant Garamond'];
    const out = {};
    for (const f of families) {
      try { out[f] = document.fonts.check(`700 28px "${f}"`); } catch { out[f] = 'n/a'; }
    }
    out.loadedFaces = Array.from(document.fonts).map((x) => `${x.family}:${x.weight}:${x.status}`).slice(0, 40);
    return out;
  });
  return { ...base, fontsCheck: fonts };
};

const panelSnap = (page) =>
  page.evaluate(() => {
    const p = document.querySelector('[data-testid="mini-inspector-ai"]');
    if (!p) return null;
    const txt = p.innerText || '';
    return {
      target: p.getAttribute('data-ai-target'), status: p.getAttribute('data-ai-status'),
      badge: (document.querySelector('[data-testid="mini-inspector-ai-status"]') || {}).textContent,
      full: txt.slice(0, 400),
    };
  });

const ensurePanel = async (page) => {
  for (let i = 0; i < 4; i++) {
    if (await page.$('[data-testid="mini-inspector-ai-input"]')) return true;
    const b = await page.$('[data-testid="mini-inspector-ai-open"]');
    if (b) { await b.click(); await sleep(700); }
  }
  return false;
};

const clickNode = async (page, id) => {
  const box = await page.evaluate((nid) => {
    const el = document.querySelector(`[data-node-id="${nid}"]`) || document.querySelector(`[data-section-id="${nid}"]`);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + Math.min(r.height / 2, 40) };
  }, id);
  if (!box) return false;
  await page.mouse.click(box.x, box.y);
  await sleep(650);
  return true;
};

const submit = async (page, prompt) => {
  const nBefore = await page.evaluate(() => (window.__SOLOSPOT_LATENCY_TRACES__ || []).length);
  const input = await page.$('[data-testid="mini-inspector-ai-input"]');
  if (!input) throw new Error('input missing');
  await input.click({ clickCount: 3 });
  await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control');
  await page.keyboard.type(prompt, { delay: 5 });
  await page.keyboard.press('Enter');
  let trace = null;
  for (let i = 0; i < 900 && !trace; i++) {
    await sleep(200);
    trace = await page.evaluate((n) => {
      const a = window.__SOLOSPOT_LATENCY_TRACES__ || [];
      return a.length > n ? a[a.length - 1] : null;
    }, nBefore);
  }
  await sleep(900);
  return trace;
};

const clickQuick = async (page, testid) => page.evaluate((id) => {
  const b = document.querySelector(`[data-testid="${id}"]`);
  if (!b) return false; b.click(); return true;
}, testid);

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    userDataDir: path.join(__dirname, '..', 'scratch', 'chrome-latency-profile'),
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--window-size=1600,1100'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1100 });
  await page.evaluateOnNewDocument(() => { try { localStorage.setItem('solospot.latency', '1'); } catch {} });

  const execTraces = [];
  const consoleErrors = [];
  const pageErrors = [];
  const apiCalls = [];
  page.on('console', async (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 300));
    if (!/EXECUTION_TRACE/.test(m.text())) return;
    try { execTraces.push(await Promise.all(m.args().map((a) => a.jsonValue().catch(() => null)))); }
    catch { execTraces.push([m.text()]); }
  });
  page.on('pageerror', (e) => pageErrors.push(String(e).slice(0, 300)));
  page.on('response', async (res) => {
    if (res.url().includes('/api/builder/copilot') && res.request().method() === 'POST') {
      let b = null; try { b = await res.json(); } catch {}
      apiCalls.push({ status: b && b.status, intent: b && b.intent, tool: b && (b.tool || b.toolName),
        message: b && String(b.message || '').slice(0, 160), llm: b && b.latency && b.latency.llmRequestCount });
    }
  });

  const out = { base: BASE, steps: [], persistence: null, undoRedo: null,
    consoleErrors, pageErrors, totalApiCalls: 0 };

  // ── boot with fixture ──────────────────────────────────────────────────
  await page.goto(`${BASE}/studio`, { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(2500);
  await page.evaluate((sid, fx) => localStorage.setItem(`solospot_store_${sid}`, JSON.stringify(fx)), STORE_ID, FIXTURE);
  await page.goto(`${BASE}/studio`, { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(3500);

  const sel = await page.evaluate(() => {
    const e = document.querySelector('[data-section-id]');
    const r = e.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + Math.min(r.height / 2, 100) };
  });
  await page.mouse.click(sel.x, sel.y);
  await sleep(700);
  await ensurePanel(page);

  // ── PROMPTS A–F ────────────────────────────────────────────────────────
  for (const t of PROMPTS) {
    await clickNode(page, 'node-heading-a');
    await ensurePanel(page);
    const beforePanel = await panelSnap(page);
    const beforeDoc = await docSnap(page);
    const beforeCanvas = await canvasSnap(page);
    const t0 = Date.now();
    const trace = await submit(page, t.prompt);
    const wallMs = Date.now() - t0;
    // wait for possible async font load + canvas repaint
    await sleep(1800);
    const midCanvas = await canvasSnap(page);
    await saveDoc(page);
    const afterDoc = await docSnap(page);
    const afterCanvas = await canvasSnap(page);
    const afterPanel = await panelSnap(page);
    const tr = execTraces.splice(0);
    const api = apiCalls.splice(0);
    out.totalApiCalls += api.length;

    const hB = beforeDoc && beforeDoc['node-heading-a'];
    const hA = afterDoc && afterDoc['node-heading-a'];
    const rec = {
      id: t.id, prompt: t.prompt, wallMs,
      target: beforePanel && beforePanel.target,
      path: trace && trace.path, exec: trace && trace.executionStatus,
      intent: trace && trace.intent, ok: trace && trace.ok,
      notes: trace && trace.notes,
      traceKeys: trace ? Object.keys(trace) : [],
      toolCalls: trace && (trace.toolCalls || trace.tools || trace.toolCall || null),
      stages: trace && trace.stages && trace.stages.map((s) => `${s.stage}:${Math.round(s.durationMs)}`),
      consoleTrace: tr, api,
      panelAfter: afterPanel,
      docBefore: hB, docAfter: hA,
      docFontChanged: JSON.stringify((hB && hB.styles) || {}) !== JSON.stringify((hA && hA.styles) || {}),
      canvasBefore: beforeCanvas, canvasMid: midCanvas, canvasAfter: afterCanvas,
      canvasFontChanged: beforeCanvas.fontFamily !== afterCanvas.fontFamily,
      widthChanged: beforeCanvas.renderedWidth !== afterCanvas.renderedWidth,
    };
    out.steps.push(rec);
    console.log('STEP', JSON.stringify({
      id: t.id, prompt: t.prompt, path: rec.path, exec: rec.exec, intent: rec.intent, wallMs,
      notes: rec.notes,
      docFont: hB && hB.styles && hB.styles.fontFamily, '->': hA && hA.styles && hA.styles.fontFamily,
      canvasFont: beforeCanvas.fontFamily, '->2': afterCanvas.fontFamily,
      w: beforeCanvas.renderedWidth, '->3': afterCanvas.renderedWidth,
      fontsCheck: afterCanvas.fontsCheck && { P: afterCanvas.fontsCheck['Playfair Display'], I: afterCanvas.fontsCheck['Inter'], C: afterCanvas.fontsCheck['Cormorant Garamond'] },
      api: api.length, tool: rec.consoleTrace.length ? JSON.stringify(rec.consoleTrace).slice(0, 260) : null,
    }));
  }

  // ── UNDO / REDO (font from step D if it changed) ───────────────────────
  {
    await clickNode(page, 'node-heading-a');
    await ensurePanel(page);
    const pre = await docSnap(page);
    const undoClicked = await clickQuick(page, 'mini-inspector-ai-undo');
    await sleep(1100);
    await saveDoc(page);
    const afterUndo = await docSnap(page);
    const redoClicked = await clickQuick(page, 'mini-inspector-ai-redo');
    await sleep(1100);
    await saveDoc(page);
    const afterRedo = await docSnap(page);
    const canvasNow = await canvasSnap(page);
    out.undoRedo = {
      preFont: pre['node-heading-a'].styles.fontFamily,
      undoFont: afterUndo['node-heading-a'].styles.fontFamily,
      redoFont: afterRedo['node-heading-a'].styles.fontFamily,
      undoClicked, redoClicked, canvasNow,
      undoWorked: JSON.stringify(pre['node-heading-a'].styles) !== JSON.stringify(afterUndo['node-heading-a'].styles),
      redoWorked: JSON.stringify(afterUndo['node-heading-a'].styles) !== JSON.stringify(afterRedo['node-heading-a'].styles),
    };
    console.log('UNDOREDO', JSON.stringify(out.undoRedo));
  }

  // ── PERSISTENCE — reload and re-read ───────────────────────────────────
  {
    const saved = await docSnap(page);
    const savedCanvas = await canvasSnap(page);
    await page.goto(`${BASE}/studio`, { waitUntil: 'networkidle2', timeout: 90000 });
    await sleep(4000);
    const reloaded = await docSnap(page);
    const reloadCanvas = await canvasSnap(page);
    out.persistence = {
      savedFont: saved['node-heading-a'].styles.fontFamily,
      reloadedFont: reloaded && reloaded['node-heading-a'].styles.fontFamily,
      survived: reloaded ? JSON.stringify(saved) === JSON.stringify(reloaded) : false,
      savedCanvas: savedCanvas.fontFamily, reloadedCanvas: reloadCanvas.fontFamily,
      reloadFontsCheck: reloadCanvas.fontsCheck,
    };
    console.log('PERSIST', JSON.stringify(out.persistence));
  }

  out.totalApiCalls = out.totalApiCalls; // placeholder
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log('CONSOLE_ERRORS', consoleErrors.length, JSON.stringify(consoleErrors.slice(0, 5)));
  console.log('PAGE_ERRORS', pageErrors.length, JSON.stringify(pageErrors.slice(0, 5)));
  console.log('WROTE', OUT);
  await browser.close();
})().catch((e) => { console.error('FONT GATE FAILED:', e.stack || e.message); process.exit(1); });
