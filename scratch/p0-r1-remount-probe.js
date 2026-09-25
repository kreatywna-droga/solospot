/**
 * P0 probe E — R1 remount/removal regression on production.
 * 1. Fresh fixture (translate 100px/40px) → mount renders x (fresh-load).
 * 2. Drag hero → committed styles change → Save (localStorage fallback).
 * 3. Reload → anchor still renders committed transform (mount path).
 * 4. TABLET viewport → back to DESKTOP → transform survives re-render.
 * Env: BASE, TAG
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'https://www.solospot.pl';
const TAG = process.env.TAG || 'e';
const STORE_ID = 's-demo';

const FIXTURE = {
  id: 's-demo',
  metadata: { storeName: 'P0 Probe E', storeSlug: 's-demo', locale: 'pl', currency: 'PLN' },
  theme: { primaryColor: '#7c3aed', secondaryColor: '#f1f5f9', font: 'Inter' },
  tenantId: 'tenant-demo',
  pages: [{
    id: 'page-home', name: 'Strona Glowna', slug: '/',
    sections: [{
      id: 'sec-hero-init', type: 'hero', label: 'Hero', parentId: null,
      props: { title: 'SoloSpot Visual Builder v2.0', subtitle: 'Biblioteka', cta: 'Rozpocznij zakupy' },
      styles: { translateX: '100px', translateY: '40px' },
      responsive: { tablet: { translateX: '60px', translateY: '0px' } },
      visible: true, locked: false, order: 0, children: [],
    }],
  }],
};

const CHROME = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'].find((p) => p && fs.existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const OUT = path.join(__dirname, '..', 'scratch', `p0-r1-${TAG}.json`);

const heroX = (page) => page.evaluate(() => {
  const el = document.querySelector('[data-section-id="sec-hero-init"]');
  return el ? Math.round(el.getBoundingClientRect().x) : null;
});
const heroTransform = (page) => page.evaluate(() => document.querySelector('[data-section-id="sec-hero-init"]')?.style?.transform || null);
const readStyles = (page) => page.evaluate((sid) => {
  try {
    const doc = JSON.parse(localStorage.getItem(`solospot_store_${sid}`) || 'null');
    let n = null;
    const walk = (x) => { if (x.id === 'sec-hero-init') n = { styles: x.styles, responsive: x.responsive }; (x.children || []).forEach(walk); };
    (doc.pages || []).forEach((p) => (p.sections || []).forEach(walk));
    return n;
  } catch (e) { return { error: String(e) }; }
}, STORE_ID);

const setViewport = async (page, name) => {
  const clicked = await page.evaluate((n) => {
    const b = Array.from(document.querySelectorAll('button')).find((x) => ((x.getAttribute('title') || '') || '').toLowerCase().startsWith(n.toLowerCase() + ' ('));
    if (b) { b.click(); return b.getAttribute('title'); }
    return null;
  }, name);
  await sleep(1200);
  return clicked;
};

const dragHero = async (page, dx, dy) => {
  const box = await page.evaluate(() => {
    const el = document.querySelector('[data-section-id="sec-hero-init"]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + Math.min(r.height / 2, 80) };
  });
  if (!box) return null;
  await page.mouse.move(box.x, box.y);
  await page.mouse.down();
  for (let i = 1; i <= 8; i++) await page.mouse.move(box.x + (dx * i) / 8, box.y + (dy * i) / 8, { steps: 2 });
  await sleep(120);
  await page.mouse.up();
  await sleep(1200);
  return heroTransform(page);
};

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', userDataDir: path.join(__dirname, '..', 'scratch', 'chrome-latency-profile'), args: ['--no-sandbox', '--disable-dev-shm-usage', '--window-size=1600,1100'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const jsErrors = [];
  page.on('pageerror', (e) => jsErrors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) jsErrors.push(`console: ${m.text().slice(0, 200)}`); });

  const R = { base: BASE };

  // 1. fresh mount
  await page.goto(`${BASE}/studio`, { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(2500);
  await page.evaluate((sid, fx) => localStorage.setItem(`solospot_store_${sid}`, JSON.stringify(fx)), STORE_ID, FIXTURE);
  await page.goto(`${BASE}/studio`, { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(3500);
  R.freshMount = { x: await heroX(page), transform: await heroTransform(page), expectedX: 535 };

  // select hero
  const sel = await page.evaluate(() => { const e = document.querySelector('[data-section-id]'); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + Math.min(r.height / 2, 60) }; });
  await page.mouse.click(sel.x, sel.y);
  await sleep(700);

  // 2. drag + save
  R.dragTransform = await dragHero(page, 120, 0);
  R.stylesAfterDrag = await readStyles(page);
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find((x) => (x.innerText || '').trim() === 'Save');
    if (b) b.click();
  });
  await sleep(2000);
  R.stylesAfterSave = await readStyles(page);

  // 3. reload → mount renders committed transform
  await page.goto(`${BASE}/studio`, { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(3500);
  R.afterReload = { x: await heroX(page), transform: await heroTransform(page) };

  // 4. viewport cycle TABLET → DESKTOP (remount path)
  R.tabletBtn = await setViewport(page, 'Tablet');
  R.tablet = { x: await heroX(page), transform: await heroTransform(page) };
  R.desktopBtn = await setViewport(page, 'Desktop');
  R.backDesktop = { x: await heroX(page), transform: await heroTransform(page) };

  R.jsErrors = jsErrors;
  fs.writeFileSync(OUT, JSON.stringify(R, null, 2));
  console.log(JSON.stringify(R, null, 1));
  await browser.close();
})().catch((e) => { console.error('P0-E FAILED:', e.stack || e.message); process.exit(1); });
