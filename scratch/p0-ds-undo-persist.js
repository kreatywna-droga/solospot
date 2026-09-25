/**
 * P0 probe B — Design System apply deep check (READ-ONLY prod, throwaway fixture).
 * Sequence: apply non-Inter font → SAVE → doc/canvas → UNDO → save → REDO → save
 * → RELOAD → persistence. Answers: does DS apply mutate theme AND/OR nodes,
 * does it reach canvas, undo/redo, reload survival.
 * Env: BASE, TAG
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'https://www.solospot.pl';
const TAG = process.env.TAG || 'b';
const STORE_ID = 's-demo';

const FIXTURE = {
  id: 's-demo',
  metadata: { storeName: 'P0 Probe B', storeSlug: 's-demo', locale: 'pl', currency: 'PLN' },
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
const OUT = path.join(__dirname, '..', 'scratch', `p0-ds-${TAG}.json`);

const readStore = (page) => page.evaluate((sid) => {
  try {
    const doc = JSON.parse(localStorage.getItem(`solospot_store_${sid}`) || 'null');
    if (!doc) return null;
    const nodes = {};
    const walk = (n) => { nodes[n.id] = { styles: n.styles }; (n.children || []).forEach(walk); };
    (doc.pages || []).forEach((p) => (p.sections || []).forEach(walk));
    return { themeFont: doc.theme?.font, nodeFonts: Object.fromEntries(Object.entries(nodes).map(([k, v]) => [k, v.styles?.fontFamily])) };
  } catch (e) { return { error: String(e) }; }
}, STORE_ID);

const canvasFont = (page) => page.evaluate(() => {
  const sec = document.querySelector('[data-section-id="sec-hero-init"] section');
  const h = document.querySelector('[data-section-id="sec-hero-init"] h1,h2,h3');
  return {
    section: sec ? getComputedStyle(sec).fontFamily : null,
    headline: h ? getComputedStyle(h).fontFamily : null,
  };
});

const save = async (page) => {
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find((x) => (x.innerText || '').trim() === 'Save');
    if (b) b.click();
  });
  await sleep(2000);
};

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    userDataDir: path.join(__dirname, '..', 'scratch', 'chrome-latency-profile'),
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--window-size=1600,1100'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const jsErrors = [];
  page.on('pageerror', (e) => jsErrors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) jsErrors.push(`console: ${m.text().slice(0, 200)}`); });

  const R = { base: BASE };

  await page.goto(`${BASE}/studio`, { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(2500);
  await page.evaluate((sid, fx) => localStorage.setItem(`solospot_store_${sid}`, JSON.stringify(fx)), STORE_ID, FIXTURE);
  await page.goto(`${BASE}/studio`, { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(3500);

  // open Style tab → fonts → apply non-Inter
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find((x) => (x.getAttribute('title') || '').startsWith('Styl'));
    if (b) b.click();
  });
  await sleep(1500);
  await page.click('[data-testid="ds-cat-fonts"]');
  await sleep(900);
  R.picked = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('[data-testid="ds-catalog-list"] [data-testid="ds-catalog-item"]'));
    for (let i = 0; i < items.length; i++) {
      const t = (items[i].innerText || '').trim();
      if (t && !/^Inter\b/i.test(t)) {
        const btn = items[i].querySelector('[data-testid="ds-btn-apply"]') ||
          (items[i].parentElement && items[i].parentElement.querySelector('[data-testid="ds-btn-apply"]'));
        if (btn) { btn.click(); return t.split('\n').slice(0, 1).join(''); }
      }
    }
    return null;
  });
  await sleep(3000);

  // 1. APPLY → SAVE → state
  await save(page);
  R.afterApply = { doc: await readStore(page), canvas: await canvasFont(page) };

  // 2. UNDO → SAVE → state
  await page.click('button[title^="Undo"], button[title^="Cofnij"]');
  await sleep(1500);
  await save(page);
  R.afterUndo = { doc: await readStore(page), canvas: await canvasFont(page) };

  // 3. REDO → SAVE → state
  await page.click('button[title^="Redo"], button[title^="Ponów"]');
  await sleep(1500);
  await save(page);
  R.afterRedo = { doc: await readStore(page), canvas: await canvasFont(page) };

  // 4. RELOAD → persistence
  await page.goto(`${BASE}/studio`, { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(3500);
  R.afterReload = { doc: await readStore(page), canvas: await canvasFont(page) };

  R.jsErrors = jsErrors;
  fs.writeFileSync(OUT, JSON.stringify(R, null, 2));
  console.log('P0-B →', OUT);
  console.log(JSON.stringify({
    picked: R.picked,
    afterApply: R.afterApply, afterUndo: R.afterUndo, afterRedo: R.afterRedo, afterReload: R.afterReload,
    verdict: {
      docChangedOnApply: R.afterApply.doc?.themeFont !== 'Inter' || Object.values(R.afterApply.doc?.nodeFonts || {}).some((v) => v && v !== 'Inter'),
      canvasChangedOnApply: /Inter/.test(R.afterApply.canvas?.section || 'Inter'),
      undoRevertedCanvas: R.afterUndo.canvas?.section === '"Inter"' || R.afterUndo.canvas?.section === 'Inter',
      undoRevertedDoc: R.afterUndo.doc?.themeFont === 'Inter',
      redoRestoredCanvas: R.afterRedo.canvas?.section === R.afterApply.canvas?.section,
      reloadKeptRedo: R.afterReload.canvas?.section === R.afterRedo.canvas?.section && R.afterReload.doc?.themeFont === R.afterRedo.doc?.themeFont,
    },
    jsErrors: R.jsErrors,
  }, null, 1));
  await browser.close();
})().catch((e) => { console.error('P0-B FAILED:', e.stack || e.message); process.exit(1); });
