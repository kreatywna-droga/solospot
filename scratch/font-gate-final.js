/**
 * FONT CHANGE REAL EXECUTION GATE v1.0 — FINAL production acceptance (READ-ONLY).
 *
 * Fixture = real SoloSpot store shape: the headline lives in the HERO section
 * (props.title), selected node = the hero section.
 *
 * §9 prompts A–F (+ a dedicated font op before undo), each with the full chain:
 *   tool -> BuilderCommand -> BuilderDocument (Save->localStorage) -> Canvas
 *   (runtime <section> font + headline text render width + font loading)
 *   -> panel verification status
 * §6 persistence (reload)  §7 undo/redo on real document
 *
 * Env: BASE, TAG
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'https://www.solospot.pl';
const TAG = process.env.TAG || 'final';
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
          styles: {}, responsive: {}, visible: true, locked: false, order: 0, children: [],
        },
      ],
    },
  ],
};

const PROMPTS = [
  { id: 'A', prompt: 'zmień czcionkę na inną' },
  { id: 'B', prompt: 'zmień czcionkę na Playfair Display' },
  { id: 'C', prompt: 'zmień czcionkę na Inter' },
  { id: 'D', prompt: 'zmień czcionkę na Cormorant Garamond' },
  { id: 'E', prompt: 'zmień kolor na czerwony' },
  { id: 'F', prompt: 'zmień napis na MARCIN BERNATOWICZ' },
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
      const out = { theme: doc.theme };
      const walk = (n) => { out[n.id] = { type: n.type, styles: n.styles, props: n.props }; (n.children || []).forEach(walk); };
      (doc.pages || []).forEach((p) => (p.sections || []).forEach(walk));
      return out;
    } catch (e) { return { error: String(e) }; }
  }, STORE_ID);

/** Canvas truth for the hero headline: runtime <section> font + real text render. */
const heroCanvas = async (page) =>
  page.evaluate(async () => {
    const anchor = document.querySelector('[data-section-id="sec-hero-init"]');
    if (!anchor) return { missing: true };
    const sec = anchor.querySelector('section');
    const h = anchor.querySelector('h1,h2,h3');
    if (!sec || !h) return { missing: 'sec/h', anchorOnly: true };

    // real rendered text width of the headline (changes only if the actual
    // glyphs change — i.e. the font file is applied, not just the CSS value)
    let textWidth = null;
    try {
      const range = document.createRange();
      range.selectNodeContents(h);
      textWidth = Math.round(range.getBoundingClientRect().width * 10) / 10;
    } catch {}

    // font loading truth: faces for the current family must be 'loaded'
    const declared = getComputedStyle(sec).fontFamily.split(',')[0].replace(/["']/g, '').trim();
    const faces = Array.from(document.fonts)
      .filter((f) => f.family.replace(/["']/g, '') === declared)
      .map((f) => `${f.weight}:${f.status}`);
    let fontsCheck = null;
    try { fontsCheck = document.fonts.check(`400 16px "${declared}"`); } catch {}

    return {
      sectionFontFamily: getComputedStyle(sec).fontFamily,
      declaredFamily: declared,
      headlineFontFamily: getComputedStyle(h).fontFamily,
      headlineText: (h.innerText || '').slice(0, 50),
      headlineInline: (h.getAttribute('style') || '').slice(0, 200),
      sectionBg: getComputedStyle(sec).backgroundColor,
      textWidth,
      faces,
      fontsCheck,
    };
  });

const panelSnap = (page) =>
  page.evaluate(() => {
    const p = document.querySelector('[data-testid="mini-inspector-ai"]');
    if (!p) return null;
    const txt = p.innerText || '';
    return {
      target: p.getAttribute('data-ai-target'), status: p.getAttribute('data-ai-status'),
      badge: (document.querySelector('[data-testid="mini-inspector-ai-status"]') || {}).textContent,
      message: txt.split('\n').slice(4, 8).join(' | ').slice(0, 300),
      full: txt.slice(0, 500),
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
    return { x: r.x + r.width / 2, y: r.y + Math.min(r.height / 2, 60) };
  }, id);
  if (!box) return false;
  await page.mouse.click(box.x, box.y);
  await sleep(700);
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
  await sleep(1200);
  return trace;
};

const clickQuick = async (page, testid) => page.evaluate((id) => {
  const b = document.querySelector(`[data-testid="${id}"]`);
  if (!b) return false; b.click(); return true;
}, testid);

/** Wait until the declared family has a 'loaded' face (real glyph rendering). */
const waitFontLoaded = async (page, family, ms = 6000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const ok = await page.evaluate((f) =>
      Array.from(document.fonts).some((x) => x.family.replace(/["']/g, '') === f && x.status === 'loaded'),
    family);
    if (ok) return true;
    await sleep(300);
  }
  return false;
};

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
  const jsErrors = [];
  const apiCalls = [];
  page.on('console', async (m) => {
    if (m.type() === 'error') {
      const t = m.text();
      (/Failed to load resource/.test(t) ? consoleErrors : jsErrors).push(t.slice(0, 300));
    }
    if (!/EXECUTION_TRACE/.test(m.text())) return;
    try { execTraces.push(await Promise.all(m.args().map((a) => a.jsonValue().catch(() => null)))); }
    catch { execTraces.push([m.text()]); }
  });
  page.on('pageerror', (e) => jsErrors.push('PAGEERROR ' + String(e).slice(0, 300)));
  page.on('response', async (res) => {
    if (res.url().includes('/api/builder/copilot') && res.request().method() === 'POST') {
      let b = null; try { b = await res.json(); } catch {}
      apiCalls.push({ status: b && b.status, intent: b && b.intent,
        message: b && String(b.message || '').slice(0, 160), llm: b && b.latency && b.latency.llmRequestCount });
    }
  });

  const out = { base: BASE, steps: [], undoRedo: null, persistence: null, final: {} };

  await page.goto(`${BASE}/studio`, { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(2500);
  await page.evaluate((sid, fx) => localStorage.setItem(`solospot_store_${sid}`, JSON.stringify(fx)), STORE_ID, FIXTURE);
  await page.goto(`${BASE}/studio`, { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(3500);

  const sel = await page.evaluate(() => {
    const e = document.querySelector('[data-section-id]');
    const r = e.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + Math.min(r.height / 2, 60) };
  });
  await page.mouse.click(sel.x, sel.y);
  await sleep(800);
  await ensurePanel(page);

  // ── §9 A–F ─────────────────────────────────────────────────────────────
  for (const t of PROMPTS) {
    await clickNode(page, 'sec-hero-init');
    await ensurePanel(page);
    const beforePanel = await panelSnap(page);
    const beforeDoc = await docSnap(page);
    const beforeCanvas = await heroCanvas(page);
    const t0 = Date.now();
    const trace = await submit(page, t.prompt);
    const wallMs = Date.now() - t0;
    const fontLoaded = await waitFontLoaded(page, (beforeCanvas && beforeCanvas.declaredFamily) || 'x', 1500);
    await sleep(900);
    await saveDoc(page);
    const afterDoc = await docSnap(page);
    const afterCanvas = await heroCanvas(page);
    // re-check font load for the family actually declared AFTER the change
    const loadedAfter = await waitFontLoaded(page, (afterCanvas && afterCanvas.declaredFamily) || 'x', 6000);
    const afterCanvas2 = await heroCanvas(page);
    const afterPanel = await panelSnap(page);
    const tr = execTraces.splice(0);
    const api = apiCalls.splice(0);

    const nB = beforeDoc['sec-hero-init'];
    const nA = afterDoc['sec-hero-init'];
    const rec = {
      id: t.id, prompt: t.prompt, wallMs,
      target: beforePanel && beforePanel.target,
      path: trace && trace.path, exec: trace && trace.executionStatus,
      intent: trace && trace.intent, notes: trace && trace.notes,
      consoleTrace: tr, api, panelAfter: afterPanel,
      nodeBefore: nB, nodeAfter: nA,
      docChanged: JSON.stringify(nB) !== JSON.stringify(nA),
      docFontAfter: nA.styles.fontFamily, docColorAfter: nA.styles.backgroundColor,
      docTitleAfter: nA.props && (nA.props.title || nA.props.text),
      canvasBefore: beforeCanvas, canvasAfter: afterCanvas2,
      canvasFontChanged: beforeCanvas.sectionFontFamily !== afterCanvas2.sectionFontFamily,
      canvasBgChanged: beforeCanvas.sectionBg !== afterCanvas2.sectionBg,
      textWidthBefore: beforeCanvas.textWidth, textWidthAfter: afterCanvas2.textWidth,
      fontFaceLoaded: loadedAfter,
    };
    out.steps.push(rec);
    console.log('STEP', JSON.stringify({
      id: t.id, prompt: t.prompt, path: rec.path, exec: rec.exec, intent: rec.intent, wallMs,
      notes: rec.notes, target: rec.target,
      docFont: nB.styles.fontFamily, '->': nA.styles.fontFamily,
      docColor: nB.styles.backgroundColor, '->2': nA.styles.backgroundColor,
      docTitle: rec.docTitleAfter,
      canvasFont: beforeCanvas.sectionFontFamily, '->3': afterCanvas2.sectionFontFamily,
      canvasBg: beforeCanvas.sectionBg, '->4': afterCanvas2.sectionBg,
      width: beforeCanvas.textWidth, '->5': afterCanvas2.textWidth,
      faces: afterCanvas2.faces, fontLoaded: rec.fontFaceLoaded,
      docChanged: rec.docChanged, api: api.length,
      msg: afterPanel && afterPanel.message,
      tool: JSON.stringify(tr).slice(0, 320),
    }));
  }

  // ── §7 UNDO / REDO on a font change ────────────────────────────────────
  {
    await clickNode(page, 'sec-hero-init');
    await ensurePanel(page);
    const pre = await docSnap(page);
    const preCanvas = await heroCanvas(page);
    const t = await submit(page, 'zmień czcionkę na Playfair Display');
    await waitFontLoaded(page, 'Playfair Display', 6000);
    await saveDoc(page);
    const applied = await docSnap(page);
    const appliedCanvas = await heroCanvas(page);
    const undoClicked = await clickQuick(page, 'mini-inspector-ai-undo');
    await sleep(1300);
    await saveDoc(page);
    const undone = await docSnap(page);
    const undoneCanvas = await heroCanvas(page);
    const redoClicked = await clickQuick(page, 'mini-inspector-ai-redo');
    await sleep(1300);
    await saveDoc(page);
    const redone = await docSnap(page);
    const redoneCanvas = await heroCanvas(page);
    const tr = execTraces.splice(0);
    apiCalls.splice(0);
    out.undoRedo = {
      path: t && t.path, exec: t && t.executionStatus, undoClicked, redoClicked, tr,
      preFont: pre['sec-hero-init'].styles.fontFamily,
      appliedFont: applied['sec-hero-init'].styles.fontFamily,
      undoneFont: undone['sec-hero-init'].styles.fontFamily,
      redoFont: redone['sec-hero-init'].styles.fontFamily,
      preCanvasFont: preCanvas.sectionFontFamily,
      appliedCanvasFont: appliedCanvas.sectionFontFamily,
      undoneCanvasFont: undoneCanvas.sectionFontFamily,
      redoCanvasFont: redoneCanvas.sectionFontFamily,
      undoWorked: applied['sec-hero-init'].styles.fontFamily !== undone['sec-hero-init'].styles.fontFamily
        && pre['sec-hero-init'].styles.fontFamily === undone['sec-hero-init'].styles.fontFamily,
      redoWorked: undone['sec-hero-init'].styles.fontFamily === redone['sec-hero-init'].styles.fontFamily,
      undoCanvasWorked: appliedCanvas.sectionFontFamily !== undoneCanvas.sectionFontFamily,
      redoCanvasWorked: undoneCanvas.sectionFontFamily === redoneCanvas.sectionFontFamily,
    };
    console.log('UNDOREDO', JSON.stringify(out.undoRedo));
  }

  // ── §6 PERSISTENCE — reload ────────────────────────────────────────────
  {
    const saved = await docSnap(page);
    const savedCanvas = await heroCanvas(page);
    await page.goto(`${BASE}/studio`, { waitUntil: 'networkidle2', timeout: 90000 });
    await sleep(4500);
    const reloaded = await docSnap(page);
    const reloadedCanvas = await heroCanvas(page);
    await waitFontLoaded(page, (reloadedCanvas && reloadedCanvas.declaredFamily) || 'x', 6000);
    const reloadedCanvas2 = await heroCanvas(page);
    out.persistence = {
      savedFont: saved['sec-hero-init'].styles.fontFamily,
      reloadedFont: reloaded && reloaded['sec-hero-init'].styles.fontFamily,
      docSurvived: reloaded ? JSON.stringify(saved) === JSON.stringify(reloaded) : false,
      savedCanvasFont: savedCanvas.sectionFontFamily,
      reloadedCanvasFont: reloadedCanvas2.sectionFontFamily,
      canvasSurvived: savedCanvas.sectionFontFamily === reloadedCanvas2.sectionFontFamily,
      headlineText: reloadedCanvas2.headlineText,
      faces: reloadedCanvas2.faces,
    };
    console.log('PERSIST', JSON.stringify(out.persistence));
  }

  out.final = {
    consoleResourceErrors: consoleErrors.length,
    jsErrors: jsErrors.length,
    jsErrorList: jsErrors.slice(0, 10),
    resourceErrorList: consoleErrors.slice(0, 10),
  };
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log('JS_ERRORS', jsErrors.length, JSON.stringify(jsErrors.slice(0, 5)));
  console.log('RESOURCE_ERRORS', consoleErrors.length);
  console.log('WROTE', OUT);
  await browser.close();
})().catch((e) => { console.error('FONT GATE FINAL FAILED:', e.stack || e.message); process.exit(1); });
