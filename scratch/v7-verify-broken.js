/**
 * GATE v7.0 — targeted verification of the ORIGINAL failure prompts
 * (ł / background vocabulary). READ-ONLY wrt the repo.
 *
 * Before the repair these were rejected UNRESOLVED → AI path → provider abort
 * → "Nie udało się wykonać polecenia.".
 * Expected now: FAST_PATH / EXECUTED with a real BuilderDocument mutation
 * (or an honest CLARIFY if the value is not concrete).
 *
 * Env: BASE, TAG
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://localhost:3000';
const TAG = process.env.TAG || 'broken';
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
          styles: { backgroundColor: '#000000' }, responsive: {}, visible: true, locked: false, order: 0,
          children: [
            { id: 'node-heading-a', type: 'heading', label: 'Heading A', parentId: 'sec-hero-init',
              props: { text: 'Naglowek A' }, styles: { color: '#ffffff' }, responsive: {}, visible: true, locked: false, order: 0, children: [] },
          ],
        },
      ],
    },
  ],
};

/** prompt → node the command must land on */
const CASES = [
  ['node-heading-a', 'zmień nagłówek na TEST'],
  ['node-heading-a', 'zmień tytuł na Witaj świecie'],
  ['sec-hero-init', 'zmień tło na niebieski'],
  ['sec-hero-init', 'ustaw tło sekcji na czerwony'],
  ['sec-hero-init', 'zmień tło na gradient'],
];

const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
].find((p) => p && fs.existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const OUT = path.join(__dirname, '..', 'scratch', `v7-${TAG}.json`);

const saveDoc = async (page) => {
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find((x) => (x.innerText || '').trim() === 'Save');
    if (b) b.click();
  });
  await sleep(1100);
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

const panelSnap = (page) =>
  page.evaluate(() => {
    const p = document.querySelector('[data-testid="mini-inspector-ai"]');
    if (!p) return null;
    const txt = p.innerText || '';
    return {
      status: p.getAttribute('data-ai-status'),
      message: txt.includes('Nie udało się wykonać polecenia') ? 'Nie udało się wykonać polecenia'
        : txt.includes('Polecenie wykonane pomyślnie') ? 'Polecenie wykonane pomyślnie'
        : txt.includes('Potrzebuję więcej informacji') ? 'Potrzebuję więcej informacji' : null,
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

const diffIds = (a, b) => Object.keys(b || {}).filter((k) => JSON.stringify(a && a[k]) !== JSON.stringify(b[k]));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    userDataDir: path.join(__dirname, '..', 'scratch', 'chrome-latency-profile'),
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--window-size=1600,1100'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1100 });
  await page.evaluateOnNewDocument(() => { try { localStorage.setItem('solospot.latency', '1'); } catch {} });

  const out = { base: BASE, cases: [] };

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

  for (const [nodeId, prompt] of CASES) {
    await clickNode(page, nodeId);
    await ensurePanel(page);
    const before = await docSnap(page);
    const t0 = Date.now();
    const trace = await submit(page, prompt);
    const wallMs = Date.now() - t0;
    await saveDoc(page);
    const after = await docSnap(page);
    const panel = await panelSnap(page);
    const rec = {
      prompt, node: nodeId, wallMs,
      path: trace && trace.path, exec: trace && trace.executionStatus,
      intent: trace && trace.intent, notes: trace && trace.notes,
      mutated: diffIds(before, after), panel,
      after: after && after[nodeId],
    };
    out.cases.push(rec);
    console.log('CASE', JSON.stringify(rec));
  }

  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log('WROTE', OUT);
  await browser.close();
})().catch((e) => { console.error('VERIFY FAILED:', e.stack || e.message); process.exit(1); });
