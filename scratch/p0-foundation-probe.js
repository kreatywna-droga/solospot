/**
 * P0 FOUNDATION STABILITY â€” production runtime probe (READ-ONLY on prod data,
 * uses throwaway localStorage fixture s-demo).
 * Covers: studio load, Design System apply â†’ BuilderDocument â†’ Canvas,
 * Mini Inspector fast-path command, undo/redo, save+reload persistence,
 * responsive breakpoint switch, JS console errors.
 * Env: BASE (default https://www.solospot.pl), TAG
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'https://www.solospot.pl';
const TAG = process.env.TAG || 'prod';
const STORE_ID = 's-demo';

const FIXTURE = {
  id: 's-demo',
  metadata: { storeName: 'P0 Foundation Probe', storeSlug: 's-demo', locale: 'pl', currency: 'PLN' },
  theme: { primaryColor: '#7c3aed', secondaryColor: '#f1f5f9', font: 'Inter' },
  tenantId: 'tenant-demo',
  pages: [{
    id: 'page-home', name: 'Strona GĹ‚Ăłwna', slug: '/',
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
const OUT = path.join(__dirname, '..', 'scratch', `p0-foundation-${TAG}.json`);

const readStore = (page) => page.evaluate((sid) => {
  try {
    const doc = JSON.parse(localStorage.getItem(`solospot_store_${sid}`) || 'null');
    if (!doc) return null;
    const nodes = {};
    const walk = (n) => { nodes[n.id] = { styles: n.styles, props: n.props }; (n.children || []).forEach(walk); };
    (doc.pages || []).forEach((p) => (p.sections || []).forEach(walk));
    return { theme: doc.theme, nodes };
  } catch (e) { return { error: String(e) }; }
}, STORE_ID);

const canvasState = (page) => page.evaluate(() => {
  const a = document.querySelector('[data-section-id="sec-hero-init"]');
  if (!a) return { missing: true };
  const sec = a.querySelector('section'); const h = a.querySelector('h1,h2,h3');
  const bp = document.querySelector('[data-active-bp]')?.getAttribute('data-active-bp') ||
    (window.__SOLOSPOT_BP__ || null);
  return {
    sectionFont: sec ? getComputedStyle(sec).fontFamily : null,
    headlineFont: h ? getComputedStyle(h).fontFamily : null,
    headlineText: h ? (h.innerText || '').slice(0, 30) : null,
    sectionBg: sec ? getComputedStyle(sec).backgroundColor : null,
    canvasBpAttr: bp,
  };
});

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
  page.on('console', (m) => { if (m.type() === 'error') jsErrors.push(`console: ${m.text().slice(0, 200)}`); });

  const R = { base: BASE, jsErrors: [], steps: {} };

  // 1. LOAD
  await page.goto(`${BASE}/studio`, { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(2500);
  await page.evaluate((sid, fx) => localStorage.setItem(`solospot_store_${sid}`, JSON.stringify(fx)), STORE_ID, FIXTURE);
  await page.goto(`${BASE}/studio`, { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(3500);
  R.steps.load = { studio: !!(await page.$('[data-section-id]')), jsErrors: jsErrors.splice(0) };

  // 2. SELECT HERO
  const sel = await page.evaluate(() => { const e = document.querySelector('[data-section-id]'); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + Math.min(r.height / 2, 60) }; });
  await page.mouse.click(sel.x, sel.y);
  await sleep(800);
  R.steps.select = { selected: await page.evaluate(() => document.querySelectorAll('[data-node-selected="true"],.ring-2,[data-selected="true"]').length > 0), jsErrors: jsErrors.splice(0) };

  // 3. DESIGN SYSTEM: open Style tab â†’ fonts category â†’ apply FIRST font
  const ds = { opened: false, applied: false };
  try {
    const styleTab = await page.$x ? null : null;
    const clicked = await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button')).find((x) => (x.getAttribute('title') || '').startsWith('Styl'));
      if (b) { b.click(); return b.getAttribute('title'); } return null;
    });
    ds.tab = clicked;
    await sleep(1500);
    ds.opened = !!(await page.$('[data-testid="ds-catalog-root"]'));
    if (ds.opened) {
      await page.click('[data-testid="ds-cat-fonts"]');
      await sleep(900);
      const before = { doc: await readStore(page), canvas: await canvasState(page) };
      const pick = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('[data-testid="ds-catalog-list"] [data-testid="ds-catalog-item"]'));
        for (let i = 0; i < items.length; i++) {
          const t = (items[i].innerText || '').trim();
          if (t && !/^Inter\b/i.test(t)) {
            const btn = items[i].querySelector('[data-testid="ds-btn-apply"]') ||
              (items[i].parentElement && items[i].parentElement.querySelector('[data-testid="ds-btn-apply"]'));
            if (btn) { btn.click(); return { index: i, text: t.split('\n').slice(0, 2).join(' | ').slice(0, 80) }; }
          }
        }
        const btns = document.querySelectorAll('[data-category="fonts"] [data-testid="ds-btn-apply"]');
        if (btns.length > 1) { btns[1].click(); return { index: 1, text: 'second apply btn' }; }
        if (btns[0]) { btns[0].click(); return { index: 0, text: 'only apply btn (Inter)' }; }
        return null;
      });
      ds.item = pick ? pick.text : null;
      if (pick) ds.applied = true;
      await sleep(3000);
      const after = { doc: await readStore(page), canvas: await canvasState(page) };
      R.steps.designSystem = {
        ...ds, before, after,
        themeFontChanged: before.doc?.theme?.font !== after.doc?.theme?.font,
        nodeFontWritten: after.doc?.nodes['sec-hero-init']?.styles?.fontFamily,
        canvasFontChanged: before.canvas?.sectionFont !== after.canvas?.sectionFont,
        jsErrors: jsErrors.splice(0),
      };
    } else {
      R.steps.designSystem = { ...ds, jsErrors: jsErrors.splice(0) };
    }
  } catch (e) { R.steps.designSystem = { ...ds, error: String(e), jsErrors: jsErrors.splice(0) }; }

  // 4. UNDO (Ctrl+Z) after DS apply
  if (R.steps.designSystem?.applied) {
    const preUndo = { doc: await readStore(page), canvas: await canvasState(page) };
    await page.click('button[title^="Undo"], button[title^="Cofnij"]');
    await sleep(1500);
    const postUndo = { doc: await readStore(page), canvas: await canvasState(page) };
    R.steps.undo = {
      themeFont: preUndo.doc?.theme?.font, '->': postUndo.doc?.theme?.font,
      canvasFont: preUndo.canvas?.sectionFont, '->2': postUndo.canvas?.sectionFont,
      undoChangedDoc: JSON.stringify(preUndo.doc?.theme) !== JSON.stringify(postUndo.doc?.theme),
      jsErrors: jsErrors.splice(0),
    };
  }

  // 5. MINI INSPECTOR fast-path command (color) â€” HACP health
  try {
    const opened = await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button')).find((x) => (x.getAttribute('data-testid') || '') === 'mini-inspector-ai-open');
      if (b) { b.click(); return true; } return !!document.querySelector('[data-testid="mini-inspector-ai-input"]');
    });
    await sleep(900);
    const beforeMI = await canvasState(page);
    const input = await page.$('[data-testid="mini-inspector-ai-input"]');
    if (input) {
      await input.click({ clickCount: 3 });
      await page.keyboard.type('zmieĹ„ kolor na zielony', { delay: 5 });
      await page.keyboard.press('Enter');
      await sleep(6000);
    }
    const afterMI = await canvasState(page);
    R.steps.miniInspector = {
      opened, executed: await page.evaluate(() => document.querySelector('[data-testid="mini-inspector-ai"]')?.getAttribute('data-ai-status')),
      bgBefore: beforeMI.sectionBg, bgAfter: afterMI.sectionBg,
      bgChanged: beforeMI.sectionBg !== afterMI.sectionBg,
      jsErrors: jsErrors.splice(0),
    };
  } catch (e) { R.steps.miniInspector = { error: String(e), jsErrors: jsErrors.splice(0) }; }

  // 6. PERSISTENCE: Save â†’ reload â†’ check theme + canvas
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find((x) => (x.innerText || '').trim() === 'Save');
    if (b) b.click();
  });
  await sleep(2500);
  const saved = { doc: await readStore(page), canvas: await canvasState(page) };
  await page.goto(`${BASE}/studio`, { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(3500);
  const reloaded = { doc: await readStore(page), canvas: await canvasState(page) };
  R.steps.persistence = {
    savedThemeFont: saved.doc?.theme?.font, reloadedThemeFont: reloaded.doc?.theme?.font,
    themeSurvived: saved.doc?.theme?.font === reloaded.doc?.theme?.font,
    savedCanvasFont: saved.canvas?.sectionFont, reloadedCanvasFont: reloaded.canvas?.sectionFont,
    canvasFontSurvived: saved.canvas?.sectionFont === reloaded.canvas?.sectionFont,
    headlineSurvived: reloaded.canvas?.headlineText,
    jsErrors: jsErrors.splice(0),
  };

  // 7. RESPONSIVE: switch Tablet / Mobile / Desktop via TopBar breakpoint buttons
  try {
    const states = {};
    for (const bp of ['Tablet', 'Mobile', 'Desktop']) {
      await page.evaluate((name) => {
        const b = Array.from(document.querySelectorAll('button')).find((x) => (x.getAttribute('title') || '').startsWith(name + ' ('));
        if (b) b.click();
      }, bp);
      await sleep(1200);
      states[bp] = await page.evaluate(() => {
        const activeBtn = Array.from(document.querySelectorAll('button')).find((x) =>
          (x.getAttribute('title') || '').match(/^(Desktop|Tablet|Mobile) \(/) &&
          (x.className || '').includes('F2C27F'));
        const hero = document.querySelector('[data-section-id]');
        const w = hero ? hero.getBoundingClientRect() : null;
        const frame = hero ? hero.closest('.shadow-2xl') : null;
        return {
          activeViewportBtn: activeBtn ? activeBtn.getAttribute('title') : null,
          heroWidth: w ? Math.round(w.width) : null,
          frameWidth: frame ? Math.round(frame.getBoundingClientRect().width) : null,
        };
      });
      states[bp].jsErrors = jsErrors.splice(0);
    }
    R.steps.responsive = states;
  } catch (e) { R.steps.responsive = { error: String(e), jsErrors: jsErrors.splice(0) }; }

  R.totalJsErrors = jsErrors.length;
  fs.writeFileSync(OUT, JSON.stringify(R, null, 2));
  console.log('P0 PROBE â†’', OUT);
  console.log(JSON.stringify({
    load: R.steps.load, select: R.steps.select,
    ds: R.steps.designSystem && {
      opened: R.steps.designSystem.opened, applied: R.steps.designSystem.applied,
      themeFontChanged: R.steps.designSystem.themeFontChanged,
      nodeFontWritten: R.steps.designSystem.nodeFontWritten,
      canvasFontChanged: R.steps.designSystem.canvasFontChanged,
      themeBefore: R.steps.designSystem.before?.doc?.theme?.font,
      themeAfter: R.steps.designSystem.after?.doc?.theme?.font,
      canvasBefore: R.steps.designSystem.before?.canvas?.sectionFont,
      canvasAfter: R.steps.designSystem.after?.canvas?.sectionFont,
      item: R.steps.designSystem.item,
    },
    undo: R.steps.undo, mi: R.steps.miniInspector, persist: R.steps.persistence,
    responsive: R.steps.responsive,
    totalJsErrors: R.totalJsErrors,
  }, null, 1));
  await browser.close();
})().catch((e) => { console.error('P0 PROBE FAILED:', e.stack || e.message); process.exit(1); });

