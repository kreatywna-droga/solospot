/**
 * GATE v7.0 — PHASE 17 (target lock) / 18 (undo) / 19 (persistence) probe.
 * Injects a two-node fixture (Heading A + Button B) into the local store document,
 * then exercises selection, execution, undo, redo, save + reload.
 * Env: BASE, TAG
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'https://www.solospot.pl';
const TAG = process.env.TAG || 'phases';
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

const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
].find((p) => p && fs.existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const OUT = path.join(__dirname, '..', 'scratch', `v7-${TAG}.json`);

const inventory = (page) =>
  page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('[data-node-id]')).map((e) => {
      const cs = getComputedStyle(e);
      return { id: e.getAttribute('data-node-id'), color: cs.color, bg: cs.backgroundColor, text: (e.innerText || '').replace(/\s+/g, ' ').slice(0, 40) };
    });
    const mi = document.querySelector('[data-testid="mini-inspector-ai"]');
    return {
      nodes,
      mini: mi ? { target: mi.getAttribute('data-ai-target'), status: mi.getAttribute('data-ai-status'),
        head: (mi.innerText || '').replace(/\s+/g, ' ').slice(0, 200) } : null,
      selectedMarker: Array.from(document.querySelectorAll('[data-node-id]')).filter((e) => /ring|selected|outline/i.test(String(e.className))).map((e) => e.getAttribute('data-node-id')),
    };
  });

const docSnap = (page) =>
  page.evaluate((storeId) => {
    try {
      const raw = localStorage.getItem(`solospot_store_${storeId}`);
      if (!raw) return null;
      const doc = JSON.parse(raw);
      const walk = (n, acc = {}) => { acc[n.id] = { type: n.type, styles: n.styles, props: n.props }; (n.children || []).forEach((c) => walk(c, acc)); return acc; };
      const out = {};
      (doc.pages || []).forEach((p) => (p.sections || []).forEach((s) => walk(s, out)));
      return out;
    } catch (e) { return { error: String(e) }; }
  }, STORE_ID);

const clickNode = async (page, id) => {
  const box = await page.evaluate((nid) => {
    const el = document.querySelector(`[data-node-id="${nid}"]`);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + Math.min(r.height / 2, 40), w: r.width, h: r.height };
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
  await page.keyboard.type(prompt, { delay: 6 });
  await page.keyboard.press('Enter');
  let trace = null;
  for (let i = 0; i < 400 && !trace; i++) {
    await sleep(200);
    trace = await page.evaluate((n) => {
      const a = window.__SOLOSPOT_LATENCY_TRACES__ || [];
      return a.length > n ? a[a.length - 1] : null;
    }, nBefore);
  }
  await sleep(900);
  return trace;
};

const clickTestId = async (page, id) => {
  const el = await page.$(`[data-testid="${id}"]`);
  if (!el) return false;
  await el.click();
  await sleep(800);
  return true;
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

  const out = { base: BASE, steps: [] };
  const step = (name, data) => { out.steps.push({ name, ...data }); console.log('STEP', name, JSON.stringify(data).slice(0, 450)); };

  // 1. inject fixture
  await page.goto(`${BASE}/studio`, { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(2500);
  await page.evaluate((sid, fixture) => { localStorage.setItem(`solospot_store_${sid}`, JSON.stringify(fixture)); }, STORE_ID, FIXTURE);
  await page.goto(`${BASE}/studio`, { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(3500);

  step('inventory', await inventory(page));

  const ensurePanel = async (page) => {
    for (let i = 0; i < 4; i++) {
      if (await page.$('[data-testid="mini-inspector-ai-input"]')) return true;
      const b = await page.$('[data-testid="mini-inspector-ai-open"]');
      if (b) { await b.click(); await sleep(800); }
    }
    return false;
  };
  const panelState = (page) =>
    page.evaluate(() => {
      const p = document.querySelector('[data-testid="mini-inspector-ai"]');
      return p ? { target: p.getAttribute('data-ai-target'), status: p.getAttribute('data-ai-status') } : null;
    });

  // 2. PHASE 17 target lock: select Heading A, execute, then switch to Button B
  const clickedA = await clickNode(page, 'node-heading-a');
  await ensurePanel(page);
  const targetAtSubmit = await panelState(page);
  const beforeLock = await docSnap(page);
  const tA = await submit(page, 'zmień kolor na czerwony');
  // switch selection immediately after submit
  await clickNode(page, 'node-button-b');
  const afterLock = await docSnap(page);
  const changedIds = (a, b) => Object.keys(b || {}).filter((k) => JSON.stringify(a && a[k]) !== JSON.stringify(b[k]));
  step('targetLock', {
    clickedA, targetAtSubmit, tracePath: tA && tA.path, exec: tA && tA.executionStatus, intent: tA && tA.intent,
    changed: changedIds(beforeLock, afterLock),
    headingStyles: afterLock && afterLock['node-heading-a'] && afterLock['node-heading-a'].styles,
    buttonStyles: afterLock && afterLock['node-button-b'] && afterLock['node-button-b'].styles,
    sectionStyles: afterLock && afterLock['sec-hero-init'] && afterLock['sec-hero-init'].styles,
    miniPanel: (await inventory(page)).mini,
  });

  // 3. PHASE 18 undo / redo — apply a real edit first so there is something to undo
  await clickNode(page, 'node-heading-a');
  await ensurePanel(page);
  const undoTarget = await panelState(page);
  const tUndoPre = await submit(page, 'zmień tekst na UNDO_STEP');
  const beforeUndo = await docSnap(page);
  const undoOk = await clickTestId(page, 'mini-inspector-ai-undo');
  const afterUndo = await docSnap(page);
  const redoOk = await clickTestId(page, 'mini-inspector-ai-redo');
  const afterRedo = await docSnap(page);
  const diff = (a, b) => JSON.stringify(a) !== JSON.stringify(b);
  step('undoRedo', {
    undoTarget, prePath: tUndoPre && tUndoPre.path, preExec: tUndoPre && tUndoPre.executionStatus,
    undoOk, redoOk,
    undoChanged: diff(beforeUndo, afterUndo),
    redoRestored: diff(afterUndo, afterRedo) && !diff(beforeUndo, afterRedo),
    beforeUndo: beforeUndo && beforeUndo['node-heading-a'],
    afterUndo: afterUndo && afterUndo['node-heading-a'],
    afterRedo: afterRedo && afterRedo['node-heading-a'],
  });

  // 4. PHASE 19 persistence: change text -> Save -> reload
  await clickNode(page, 'node-heading-a');
  await ensurePanel(page);
  const persistTarget = await panelState(page);
  const tPersist = await submit(page, 'zmień tekst na PERSIST');
  const beforeSave = await docSnap(page);
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find((x) => (x.innerText || '').trim() === 'Save');
    if (b) b.click();
  });
  await sleep(1500);
  const afterSave = await docSnap(page);
  await page.goto(`${BASE}/studio`, { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(3500);
  const afterReload = await docSnap(page);
  const invAfter = await inventory(page);
  step('persistence', {
    path: tPersist && tPersist.path, exec: tPersist && tPersist.executionStatus, persistTarget,
    saved: !diff(beforeSave, afterSave),
    survivedReload: !diff(afterSave, afterReload),
    headingAfterReload: afterReload && afterReload['node-heading-a'],
    inventory: invAfter,
  });

  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log('WROTE', OUT);
  await browser.close();
})().catch((e) => { console.error('PHASES FAILED:', e.stack || e.message); process.exit(1); });
