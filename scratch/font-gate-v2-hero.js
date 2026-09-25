/**
 * FONT GATE v1.0 — Phase 2: hero/section headline target reproduction (READ-ONLY).
 *
 * Real SoloSpot stores keep the headline as the HERO section title (props.title).
 * This run selects the hero SECTION and runs the same font commands, capturing
 * BuilderDocument vs Canvas computed font for the hero <h1>.
 *
 * Env: BASE, TAG
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'https://www.solospot.pl';
const TAG = process.env.TAG || 'hero';
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
  { id: 'B', prompt: 'zmień czcionkę na Playfair Display' },
  { id: 'E', prompt: 'zmień kolor na czerwony' },
  { id: 'A', prompt: 'zmień czcionkę na inną' },
  { id: 'D', prompt: 'zmień czcionkę na Cormorant Garamond' },
];

const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
].find((p) => p && fs.existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const OUT = path.join(__dirname, '..', 'scratch', `font-gate-hero-${TAG}.json`);

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

/** Hero headline = first big heading inside the hero section on canvas. */
const heroCanvas = async (page) =>
  page.evaluate(() => {
    const el = document.querySelector('[data-section-id="sec-hero-init"]') || document.querySelector('[data-node-id="sec-hero-init"]');
    if (!el) return { missing: true };
    const h = el.querySelector('h1,h2,h3') || el;
    const cs = getComputedStyle(h);
    const sec = getComputedStyle(el);
    return {
      titleText: (h.innerText || '').slice(0, 50),
      titleFontFamily: cs.fontFamily,
      titleFontSize: cs.fontSize,
      sectionFontFamily: sec.fontFamily,
      inlineStyle: (h.getAttribute('style') || '').slice(0, 300),
      sectionInline: (el.getAttribute('style') || '').slice(0, 300),
      bg: sec.backgroundColor,
    };
  });

const panelSnap = (page) =>
  page.evaluate(() => {
    const p = document.querySelector('[data-testid="mini-inspector-ai"]');
    if (!p) return null;
    return {
      target: p.getAttribute('data-ai-target'), status: p.getAttribute('data-ai-status'),
      badge: (document.querySelector('[data-testid="mini-inspector-ai-status"]') || {}).textContent,
      full: (p.innerText || '').slice(0, 400),
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
  await sleep(1500);
  return trace;
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
  page.on('console', async (m) => {
    if (!/EXECUTION_TRACE/.test(m.text())) return;
    try { execTraces.push(await Promise.all(m.args().map((a) => a.jsonValue().catch(() => null)))); }
    catch { execTraces.push([m.text()]); }
  });

  const out = { base: BASE, steps: [] };

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

  for (const t of PROMPTS) {
    await clickNode(page, 'sec-hero-init');
    await ensurePanel(page);
    const beforePanel = await panelSnap(page);
    const beforeDoc = await docSnap(page);
    const beforeCanvas = await heroCanvas(page);
    const t0 = Date.now();
    const trace = await submit(page, t.prompt);
    const wallMs = Date.now() - t0;
    await sleep(1800);
    await saveDoc(page);
    const afterDoc = await docSnap(page);
    const afterCanvas = await heroCanvas(page);
    const afterPanel = await panelSnap(page);
    const tr = execTraces.splice(0);
    const rec = {
      id: t.id, prompt: t.prompt, wallMs,
      target: beforePanel && beforePanel.target,
      path: trace && trace.path, exec: trace && trace.executionStatus,
      intent: trace && trace.intent, notes: trace && trace.notes,
      consoleTrace: tr, panelAfter: afterPanel,
      docStylesBefore: beforeDoc['sec-hero-init'].styles,
      docStylesAfter: afterDoc['sec-hero-init'].styles,
      docFontAfter: afterDoc['sec-hero-init'].styles.fontFamily,
      docFontChanged: JSON.stringify(beforeDoc['sec-hero-init'].styles) !== JSON.stringify(afterDoc['sec-hero-init'].styles),
      canvasBefore: beforeCanvas, canvasAfter: afterCanvas,
      canvasFontChanged: beforeCanvas.titleFontFamily !== afterCanvas.titleFontFamily,
      canvasBgChanged: beforeCanvas.bg !== afterCanvas.bg,
      theme: afterDoc.theme,
    };
    out.steps.push(rec);
    console.log('HERO', JSON.stringify({
      id: t.id, prompt: t.prompt, path: rec.path, exec: rec.exec, target: rec.target, wallMs,
      notes: rec.notes,
      docStyles: rec.docStylesAfter, docFontChanged: rec.docFontChanged,
      canvasFontBefore: beforeCanvas.titleFontFamily, canvasFontAfter: afterCanvas.titleFontFamily,
      canvasFontChanged: rec.canvasFontChanged, canvasBgChanged: rec.canvasBgChanged,
      msg: afterPanel && afterPanel.full && afterPanel.full.split('\n').slice(4, 7).join(' | '),
      tool: JSON.stringify(tr).slice(0, 300),
    }));
  }

  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log('WROTE', OUT);
  await browser.close();
})().catch((e) => { console.error('HERO GATE FAILED:', e.stack || e.message); process.exit(1); });
