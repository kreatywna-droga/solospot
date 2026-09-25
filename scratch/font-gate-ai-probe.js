/**
 * FONT GATE v1.0 — AI-path probe: force an underspecified/design font prompt
 * through the LLM tool-call route (like the original report) and verify the
 * generated set_node_styles now reaches the canvas.
 * Env: BASE, TAG, PROMPT
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'https://www.solospot.pl';
const TAG = process.env.TAG || 'aiprobe';
const PROMPT = process.env.PROMPT || 'dobierz mi elegancką szeryfową czcionkę do tego nagłówka';
const STORE_ID = 's-demo';

const FIXTURE = {
  id: 's-demo',
  metadata: { storeName: 'SoloSpot Visual Builder', storeSlug: 's-demo', locale: 'pl', currency: 'PLN' },
  theme: { primaryColor: '#7c3aed', secondaryColor: '#f1f5f9', font: 'Inter' },
  tenantId: 'tenant-demo',
  pages: [{
    id: 'page-home', name: 'Strona Główna', slug: '/',
    sections: [{
      id: 'sec-hero-init', type: 'hero', label: 'Hero', parentId: null,
      props: { title: 'SoloSpot Visual Builder v2.0', subtitle: 'Biblioteka', cta: 'Rozpocznij zakupy' },
      styles: {}, responsive: {}, visible: true, locked: false, order: 0, children: [],
    }],
  }],
};

const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
].find((p) => p && fs.existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const OUT = path.join(__dirname, '..', 'scratch', `font-gate-ai-${TAG}.json`);

const saveDoc = async (page) => {
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find((x) => (x.innerText || '').trim() === 'Save');
    if (b) b.click();
  });
  await sleep(1200);
};
const docSnap = (page) => page.evaluate((storeId) => {
  try {
    const doc = JSON.parse(localStorage.getItem(`solospot_store_${storeId}`) || 'null');
    if (!doc) return null;
    const out = {};
    const walk = (n) => { out[n.id] = { styles: n.styles, props: n.props }; (n.children || []).forEach(walk); };
    (doc.pages || []).forEach((p) => (p.sections || []).forEach(walk));
    return out;
  } catch (e) { return { error: String(e) }; }
}, STORE_ID);
const heroCanvas = async (page) => page.evaluate(() => {
  const a = document.querySelector('[data-section-id="sec-hero-init"]');
  if (!a) return { missing: true };
  const sec = a.querySelector('section'); const h = a.querySelector('h1,h2,h3');
  if (!sec || !h) return { missing: 'sec/h' };
  const declared = getComputedStyle(sec).fontFamily.split(',')[0].replace(/["']/g, '').trim();
  const faces = Array.from(document.fonts).filter((f) => f.family.replace(/["']/g, '') === declared)
    .map((f) => `${f.weight}:${f.status}`);
  let w = null; try { const r = document.createRange(); r.selectNodeContents(h); w = Math.round(r.getBoundingClientRect().width * 10) / 10; } catch {}
  return { sectionFontFamily: getComputedStyle(sec).fontFamily, declared, headline: (h.innerText || '').slice(0, 40), faces, textWidth: w };
});
const panelSnap = (page) => page.evaluate(() => {
  const p = document.querySelector('[data-testid="mini-inspector-ai"]');
  if (!p) return null;
  return { target: p.getAttribute('data-ai-target'), status: p.getAttribute('data-ai-status'),
    message: (p.innerText || '').split('\n').slice(4, 8).join(' | ').slice(0, 300) };
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
    const el = document.querySelector(`[data-section-id="${nid}"]`) || document.querySelector(`[data-node-id="${nid}"]`);
    if (!el) return null; const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + Math.min(r.height / 2, 60) };
  }, id);
  if (!box) return false; await page.mouse.click(box.x, box.y); await sleep(700); return true;
};
const submit = async (page, prompt) => {
  const n = await page.evaluate(() => (window.__SOLOSPOT_LATENCY_TRACES__ || []).length);
  const input = await page.$('[data-testid="mini-inspector-ai-input"]');
  if (!input) throw new Error('input missing');
  await input.click({ clickCount: 3 });
  await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control');
  await page.keyboard.type(prompt, { delay: 5 });
  await page.keyboard.press('Enter');
  let trace = null;
  for (let i = 0; i < 900 && !trace; i++) {
    await sleep(200);
    trace = await page.evaluate((k) => { const a = window.__SOLOSPOT_LATENCY_TRACES__ || []; return a.length > k ? a[a.length - 1] : null; }, n);
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
    try { execTraces.push(await Promise.all(m.args().map((a) => a.jsonValue().catch(() => null)))); } catch {}
  });

  await page.goto(`${BASE}/studio`, { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(2500);
  await page.evaluate((sid, fx) => localStorage.setItem(`solospot_store_${sid}`, JSON.stringify(fx)), STORE_ID, FIXTURE);
  await page.goto(`${BASE}/studio`, { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(3500);
  const sel = await page.evaluate(() => { const e = document.querySelector('[data-section-id]'); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + Math.min(r.height / 2, 60) }; });
  await page.mouse.click(sel.x, sel.y);
  await sleep(800);
  await ensurePanel(page);
  await clickNode(page, 'sec-hero-init');
  await ensurePanel(page);

  const beforeDoc = await docSnap(page);
  const beforeCanvas = await heroCanvas(page);
  const trace = await submit(page, PROMPT);
  // wait for font faces (if any) after the tool executed
  await sleep(3500);
  await saveDoc(page);
  const afterDoc = await docSnap(page);
  await sleep(2500);
  const afterCanvas = await heroCanvas(page);
  const panel = await panelSnap(page);
  const tr = execTraces.splice(0);

  const out = {
    prompt: PROMPT, path: trace && trace.path, exec: trace && trace.executionStatus,
    intent: trace && trace.intent, notes: trace && trace.notes,
    beforeNode: beforeDoc['sec-hero-init'], afterNode: afterDoc['sec-hero-init'],
    beforeCanvas, afterCanvas, panel, consoleTrace: tr,
    canvasFontChanged: beforeCanvas.sectionFontFamily !== afterCanvas.sectionFontFamily,
    docFontChanged: JSON.stringify(beforeDoc['sec-hero-init'].styles) !== JSON.stringify(afterDoc['sec-hero-init'].styles),
  };
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log('AIPROBE', JSON.stringify({
    prompt: PROMPT, path: out.path, exec: out.exec, intent: out.intent,
    tool: JSON.stringify(tr).slice(0, 420),
    docFont: beforeDoc['sec-hero-init'].styles.fontFamily, '->': afterDoc['sec-hero-init'].styles.fontFamily,
    canvasFont: beforeCanvas.sectionFontFamily, '->2': afterCanvas.sectionFontFamily,
    docFontChanged: out.docFontChanged, canvasFontChanged: out.canvasFontChanged,
    width: beforeCanvas.textWidth, '->3': afterCanvas.textWidth, faces: afterCanvas.faces,
    msg: panel && panel.message,
  }));
  await browser.close();
})().catch((e) => { console.error('AI PROBE FAILED:', e.stack || e.message); process.exit(1); });
