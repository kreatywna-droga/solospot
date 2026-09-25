/**
 * SCROLLBAR CONSISTENCY REPAIR GATE v1.0 — production verification.
 * 1. Open Design System → Katalog (Styl tab).
 * 2. ds-catalog-list carries builder-canvas-scrollbar (shared mechanism).
 * 3. Loaded stylesheets contain the shared slim-scrollbar rules (6px etc).
 * 4. Scroll up/down works (wheel + thumb drag), all categories.
 * 5. Hover over thumb (screenshot; pseudo-rule exists in CSS).
 * 6. Responsive widths: 1920/1440/1280/1024/768 — class + scroll intact.
 * 7. Identity: docked Inspector scroll container uses the SAME class.
 * Env: BASE, TAG
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'https://www.solospot.pl';
const TAG = process.env.TAG || 'v1';
const STORE_ID = 's-demo';
const OUT_DIR = path.join(__dirname, '..', 'scratch', 'scrollbar-proof');
const OUT = path.join(__dirname, '..', 'scratch', `ds-scrollbar-${TAG}.json`);

const FIXTURE = {
  id: 's-demo',
  metadata: { storeName: 'Scrollbar Gate', storeSlug: 's-demo', locale: 'pl', currency: 'PLN' },
  theme: { primaryColor: '#D9A86C', secondaryColor: '#F2C27F', backgroundColor: '#090910', font: 'Inter' },
  tenantId: 'tenant-demo',
  pages: [{
    id: 'page-home', name: 'Strona', slug: '/',
    sections: [{
      id: 'sec-hero-init', type: 'hero', label: 'Hero', parentId: null,
      props: { title: 'Scrollbar Gate v1.0' },
      styles: {}, visible: true, locked: false, order: 0, children: [],
    }],
  }],
};

const CATEGORIES = ['style-packs', 'design-combinations', 'fonts', 'font-pairings', 'typography', 'colors', 'color-combinations', 'buttons', 'cards', 'backgrounds', 'hero', 'sections', 'images', 'icons'];

const CHROME = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'].find((p) => p && fs.existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const listState = (page) => page.evaluate(() => {
  const list = document.querySelector('[data-testid="ds-catalog-list"]');
  if (!list) return null;
  const r = list.getBoundingClientRect();
  return {
    hasSharedClass: list.classList.contains('builder-canvas-scrollbar'),
    hasOverflowY: list.classList.contains('overflow-y-auto'),
    className: list.className,
    scrollHeight: list.scrollHeight,
    clientHeight: list.clientHeight,
    scrollTop: Math.round(list.scrollTop),
    items: list.querySelectorAll('[data-testid="ds-catalog-item"]').length,
    rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), right: Math.round(r.right) },
  };
});

const sharedCssRules = (page) => page.evaluate(() => {
  const out = [];
  const walk = (rules) => {
    for (const r of Array.from(rules || [])) {
      try {
        if (r.selectorText && r.selectorText.includes('builder-canvas-scrollbar')) out.push(r.cssText.slice(0, 240));
        if (r.cssRules && r.cssRules.length) walk(r.cssRules);
      } catch (e) { /* cross-origin or unsupported */ }
    }
  };
  for (const s of Array.from(document.styleSheets)) {
    try { walk(s.cssRules); } catch (e) {}
  }
  return out;
});

const wheelScroll = async (page) => {
  const s = await listState(page);
  if (!s) return null;
  const cx = s.rect.x + Math.min(s.rect.w / 2, 200);
  const cy = s.rect.y + Math.min(s.rect.h / 2, 200);
  await page.mouse.move(cx, cy);
  await page.mouse.wheel({ deltaY: 400 });
  await sleep(500);
  const s2 = await listState(page);
  return { before: s.scrollTop, after: s2.scrollTop, scrolled: s2.scrollTop > s.scrollTop };
};

const thumbDrag = async (page) => {
  const s = await listState(page);
  if (!s) return null;
  const tx = s.rect.right - 4;
  const ty = s.rect.y + 30;
  await page.mouse.move(tx, ty);
  await page.mouse.down();
  await page.mouse.move(tx, ty + 120, { steps: 8 });
  await sleep(200);
  await page.mouse.up();
  await sleep(400);
  const s2 = await listState(page);
  return { before: s.scrollTop, after: s2.scrollTop, dragged: s2.scrollTop >= s.scrollTop && s2.scrollTop > 0 };
};

const openCatalog = async (page) => {
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find((x) => (x.getAttribute('title') || '').startsWith('Styl'));
    if (b) b.click();
  });
  await sleep(1800);
};

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
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

  // 1. open Design System → Katalog
  await openCatalog(page);
  R.catalog = await listState(page);
  R.cssRules = await sharedCssRules(page);
  await page.screenshot({ path: path.join(OUT_DIR, '01-katalog-desktop-1440.png') });

  // 2. reference identity: docked inspector scroll container
  R.reference = await page.evaluate(() => {
    const refs = Array.from(document.querySelectorAll('.overflow-y-auto.builder-canvas-scrollbar'));
    return refs.map((el) => ({
      className: el.className,
      isCatalog: el.getAttribute('data-testid') === 'ds-catalog-list',
    }));
  });

  // 3. scroll: wheel + thumb drag
  R.wheel = await wheelScroll(page);
  R.thumbDrag = await thumbDrag(page);
  // back to top for consistent shots
  await page.evaluate(() => { const l = document.querySelector('[data-testid="ds-catalog-list"]'); if (l) l.scrollTop = 0; });
  await sleep(300);

  // 4. hover over thumb area (screenshot) + pseudo rule probe
  const s0 = await listState(page);
  await page.mouse.move(s0.rect.right - 4, s0.rect.y + 60);
  await sleep(400);
  await page.screenshot({ path: path.join(OUT_DIR, '02-hover-thumb.png') });
  R.hoverProbe = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="ds-catalog-list"]');
    try {
      const t = getComputedStyle(el, '::-webkit-scrollbar-thumb');
      return { thumbWidth: t.width, thumbBackground: t.backgroundColor, thumbRadius: t.borderRadius, scrollbarWidth: getComputedStyle(el, '::-webkit-scrollbar').width };
    } catch (e) { return { error: String(e) }; }
  });

  // 5. all categories: open each, verify class + scroll + item render
  R.categories = [];
  for (const c of CATEGORIES) {
    const clicked = await page.evaluate((id) => {
      const b = document.querySelector(`[data-testid="ds-cat-${id}"]`);
      if (b) { b.click(); return true; } return false;
    }, c);
    await sleep(700);
    const st = await listState(page);
    R.categories.push({ category: c, clicked, hasSharedClass: st ? st.hasSharedClass : null, items: st ? st.items : null, scrollable: st ? st.scrollHeight > st.clientHeight : null });
  }
  await page.screenshot({ path: path.join(OUT_DIR, '03-last-category.png') });

  // 6. responsive widths
  R.responsive = [];
  for (const w of [1920, 1440, 1280, 1024, 768]) {
    await page.setViewport({ width: w, height: Math.max(800, Math.round(w * 0.6)) });
    await sleep(1200);
    const st = await listState(page);
    R.responsive.push({ width: w, hasSharedClass: st ? st.hasSharedClass : null, scrollable: st ? st.scrollHeight > st.clientHeight : null, items: st ? st.items : null });
    if (w === 1920 || w === 768) await page.screenshot({ path: path.join(OUT_DIR, `04-responsive-${w}.png`) });
  }
  await page.setViewport({ width: 1440, height: 900 });

  // 7. long catalog: fonts category is long — scroll to bottom
  await page.evaluate(() => { const b = document.querySelector('[data-testid="ds-cat-fonts"]'); if (b) b.click(); });
  await sleep(800);
  R.longCatalog = await wheelScroll(page);
  await page.screenshot({ path: path.join(OUT_DIR, '05-long-catalog-scrolled.png') });

  R.jsErrors = jsErrors;
  fs.writeFileSync(OUT, JSON.stringify(R, null, 2));
  console.log(JSON.stringify(R, null, 1));
  await browser.close();
})().catch((e) => { console.error('SCROLLBAR GATE PROBE FAILED:', e.stack || e.message); process.exit(1); });
