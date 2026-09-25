/**
 * P0 probe C â€” RESPONSIVE write/read proof on production.
 * 1. Select hero, drag at DESKTOP â†’ expect node.styles.translateX (base write).
 * 2. Switch to TABLET, drag â†’ expect node.responsive.tablet.translateX (bp write).
 * 3. Back to DESKTOP â†’ hero x-position returns to base value (bp read isolation).
 * 4. Save + reload â†’ responsive data survives.
 * Env: BASE, TAG
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'https://www.solospot.pl';
const TAG = process.env.TAG || 'c';
const STORE_ID = 's-demo';

const FIXTURE = {
  id: 's-demo',
  metadata: { storeName: 'P0 Probe C', storeSlug: 's-demo', locale: 'pl', currency: 'PLN' },
  theme: { primaryColor: '#7c3aed', secondaryColor: '#f1f5f9', font: 'Inter' },
  tenantId: 'tenant-demo',
  pages: [{
    id: 'page-home', name: 'Strona GĹ‚Ăłwna', slug: '/',
    sections: [{
      id: 'sec-hero-init', type: 'hero', label: 'Hero', parentId: null,
      props: { title: 'SoloSpot Visual Builder v2.0', subtitle: 'Biblioteka', cta: 'Rozpocznij zakupy' },
      styles: { translateX: '100px', translateY: '40px' }, responsive: {}, visible: true, locked: false, order: 0, children: [],
    }],
  }],
};

const CHROME = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'].find((p) => p && fs.existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const OUT = path.join(__dirname, '..', 'scratch', `p0-responsive-${TAG}.json`);

const readNode = (page) => page.evaluate((sid) => {
  try {
    const doc = JSON.parse(localStorage.getItem(`solospot_store_${sid}`) || 'null');
    if (!doc) return null;
    let n = null;
    const walk = (x) => { if (x.id === 'sec-hero-init') n = { styles: x.styles, responsive: x.responsive }; (x.children || []).forEach(walk); };
    (doc.pages || []).forEach((p) => (p.sections || []).forEach(walk));
    return n;
  } catch (e) { return { error: String(e) }; }
}, STORE_ID);

const heroX = (page) => page.evaluate(() => {
  const el = document.querySelector('[data-section-id="sec-hero-init"]');
  return el ? Math.round(el.getBoundingClientRect().x) : null;
});

const setViewport = async (page, name) => {
  await page.evaluate((n) => {
    const b = Array.from(document.querySelectorAll('button')).find((x) => (x.getAttribute('title') || '').startsWith(n + ' ('));
    if (b) b.click();
  }, name);
  await sleep(1200);
};

const dragHero = async (page, dx, dy) => {
  const box = await page.evaluate(() => {
    const el = document.querySelector('[data-section-id="sec-hero-init"]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const x = r.x + r.width / 2, y = r.y + r.height / 2;
    const hit = document.elementFromPoint(x, y);
    window.__dragEvts = 0;
    window.addEventListener('solospot:node-drag-move', () => { window.__dragEvts++; });
    return {
      x, y, rx: Math.round(r.x),
      hitTag: hit && hit.tagName, hitClass: hit && (hit.className || '').toString().slice(0, 100),
      hitPath: hit ? (function () { let p = hit, s = []; while (p && s.length < 5) { s.push(p.tagName + (p.id ? '#' + p.id : '')); p = p.parentElement; } return s.join('<'); })() : null,
    };
  });
  if (!box) return null;
  await page.mouse.move(box.x, box.y);
  await page.mouse.down();
  for (let i = 1; i <= 8; i++) await page.mouse.move(box.x + (dx * i) / 8, box.y + (dy * i) / 8, { steps: 2 });
  const midTransform = await page.evaluate(() => document.querySelector('[data-section-id="sec-hero-init"]')?.style?.transform || null);
  await sleep(120);
  await page.mouse.up();
  await sleep(1200);
  const evts = await page.evaluate(() => window.__dragEvts || 0);
  const finalTransform = await page.evaluate(() => document.querySelector('[data-section-id="sec-hero-init"]')?.style?.transform || null);
  return { ...box, midTransform, finalTransform, dragEvents: evts };
};

const save = async (page) => {
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find((x) => (x.innerText || '').trim() === 'Save');
    if (b) b.click();
  });
  await sleep(2000);
};

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', userDataDir: path.join(__dirname, '..', 'scratch', 'chrome-latency-profile'), args: ['--no-sandbox', '--disable-dev-shm-usage', '--window-size=1600,1100'] });
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

  // select hero
  const sel = await page.evaluate(() => { const e = document.querySelector('[data-section-id]'); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + Math.min(r.height / 2, 60) }; });
  await page.mouse.click(sel.x, sel.y);
  await sleep(900);

    // MEASURE ONLY: does fresh load render saved translate?
  const xFresh = await heroX(page);
  const nodeFresh = await readNode(page);
  R.freshLoad = { xFresh, naturalExpected: 471, renderedExpected: 535, node: nodeFresh, jsErrors };
  fs.writeFileSync(OUT, JSON.stringify(R, null, 2));
  console.log('FRESH', JSON.stringify(R.freshLoad));
  await browser.close();
})().catch((e) => { console.error('P0-C FAILED:', e.stack || e.message); process.exit(1); });
