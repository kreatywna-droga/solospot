/**
 * FLOATING PANELS + WORKSPACE LAYOUT — REAL BROWSER ACCEPTANCE
 *
 * Verifies the three fixes in a REAL browser against a real Builder instance
 * (production or local dev), using system Chrome via puppeteer-core.
 *
 *   FIX 1 — floating parameter panel uses the SAME surface system as the Inspector
 *   FIX 2 — every floating parameter panel stays 100% inside the Builder workspace
 *           (16px margin, maxHeight + internal scroll, never off-screen)
 *   FIX 3 — "Zapisz Experience" + "Dodaj sekcję" are one centered group, 24px above
 *           the workspace bottom edge, fully visible with Inspector OPEN *and* CLOSED
 *
 * Screenshots → scratch/panel-proof/.
 *
 * Usage:
 *   node scripts/panel-workspace-acceptance.js
 *   PW_BASE=http://localhost:3000 node scripts/panel-workspace-acceptance.js
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const BASE = process.env.PW_BASE || 'https://www.solospot.pl';
const OUT_DIR = path.join(__dirname, '..', 'scratch', 'panel-proof');
const MARGIN = 16;
const DOCK_OFFSET = 24;

const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];

const VIEWPORTS = [
  { w: 1920, h: 1080, name: '1920x1080' },
  { w: 1600, h: 900, name: '1600x900' },
  { w: 1440, h: 900, name: '1440x900' },
  { w: 1366, h: 768, name: '1366x768' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}
const near = (a, b, tol = 1.5) => Math.abs(a - b) <= tol;

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`), fullPage: false });
  console.log(`  [shot] ${name}.png`);
}

/** Measures workspace, floating panel, Inspector and bottom-action dock. */
function SNAPSHOT_FN() {
  const round = (n) => Math.round(n * 100) / 100;
  const R = (r) => ({
    left: round(r.left), top: round(r.top), right: round(r.right), bottom: round(r.bottom),
    width: round(r.width), height: round(r.height),
    cx: round(r.left + r.width / 2), cy: round(r.top + r.height / 2),
  });
  const bg = (el) => (el ? getComputedStyle(el).backgroundColor : null);

  const wsEl = document.querySelector('[data-builder-workspace]');
  const ws = wsEl ? R(wsEl.getBoundingClientRect()) : null;

  // Floating parameter panel: position fixed + z-index 9999 (ContextualSettingsPanel)
  const panel = Array.from(document.querySelectorAll('div')).find((el) => {
    const cs = getComputedStyle(el);
    return cs.position === 'fixed' && cs.zIndex === '9999';
  });
  let panelData = null;
  if (panel) {
    const card = panel.firstElementChild;
    const header = card ? card.firstElementChild : null;
    const body = card && card.children.length > 1 ? card.children[1] : null;
    panelData = {
      rect: R(panel.getBoundingClientRect()),
      cardBg: bg(card),
      headerBg: bg(header),
      maxHeightStyle: card ? card.style.maxHeight : null,
      bodyOverflowY: body ? getComputedStyle(body).overflowY : null,
      bodyScrollable: body ? body.scrollHeight > body.clientHeight + 1 : false,
      controlCount: panel.querySelectorAll('input,select,button,textarea').length,
    };
  }

  // Inspector (right panel) — the <aside> using border-l (the left sidebar uses border-r)
  const asides = Array.from(document.querySelectorAll('aside'));
  const aside = asides.find((a) => (a.className || '').includes('border-l')) || null;
  const inspRoot = aside ? aside.firstElementChild : null;
  const inspector = aside && inspRoot
    ? { present: true, rect: R(aside.getBoundingClientRect()), rootBg: bg(inspRoot), headerBg: bg(inspRoot.firstElementChild) }
    : { present: false, rect: null, rootBg: null, headerBg: null };

  // Workspace-level bottom actions (Zapisz Experience + Dodaj sekcję)
  const dock = document.querySelector('[data-testid="section-action-dock"]');
  let dockData = null;
  if (dock) {
    const r = R(dock.getBoundingClientRect());
    const cs = getComputedStyle(dock);
    dockData = {
      rect: r,
      position: cs.position,
      buttons: Array.from(dock.querySelectorAll('button')).map((b) => (b.textContent || '').trim()),
      visibility: cs.visibility,
      opacity: cs.opacity,
    };
  }

  return { ws, panelData, inspector, dockData, nodeCount: document.querySelectorAll('[data-node-id]').length };
}

async function snapshot(page) {
  return page.evaluate(SNAPSHOT_FN);
}

/** Asserts a rect is fully inside the workspace with the given margin. */
function insideWorkspace(rect, ws, margin = MARGIN) {
  const problems = [];
  if (!rect || !ws) return ['missing rect'];
  if (rect.left < ws.left + margin - 1) problems.push(`left ${rect.left} < ${Math.round(ws.left + margin)}`);
  if (rect.right > ws.right - margin + 1) problems.push(`right ${rect.right} > ${Math.round(ws.right - margin)}`);
  if (rect.top < ws.top + margin - 1) problems.push(`top ${rect.top} < ${Math.round(ws.top + margin)}`);
  if (rect.bottom > ws.bottom - margin + 1) problems.push(`bottom ${rect.bottom} > ${Math.round(ws.bottom - margin)}`);
  return problems;
}

function overlap(a, b) {
  if (!a || !b) return 0;
  const x = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const y = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  return Math.round(x * y);
}

/** Real mouse click at the centre of a button located by its title. */
async function clickByTitle(page, needle) {
  const handle = await page.evaluateHandle((n) => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) =>
      (b.getAttribute('title') || '').includes(n)
    );
    return btn || null;
  }, needle);
  const el = handle.asElement();
  if (!el) return false;
  const box = await el.boundingBox();
  if (!box) return false;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await sleep(1000);
  return true;
}

/**
 * Selects a section using a REAL mouse click (the Builder uses pointer events,
 * so synthetic events do not select anything).
 */
async function selectSection(page) {
  const point = await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('[data-node-id]'));
    const section =
      nodes.find((n) => (n.getAttribute('data-node-type') || '') === 'section') ||
      document.querySelector('[data-section-id]') ||
      nodes[0];
    if (!section) return null;
    const r = section.getBoundingClientRect();
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
  });
  if (!point) return false;
  await page.mouse.move(point.x, point.y);
  await sleep(400);
  await page.mouse.click(point.x, point.y);
  await sleep(1400);
  return true;
}

/** Opens the floating parameter panel via the QuickToolbar settings (gear) button. */
async function openSettingsPanel(page) {
  const clicked = await clickByTitle(page, 'Ustawienia elementu (Settings)');
  await sleep(1200);
  return clicked;
}

/** Opens/closes the right Inspector, verifying the resulting state. */
async function toggleInspector(page, open) {
  const isPresent = async () => (await snapshot(page)).inspector.present;
  if ((await isPresent()) === open) return open ? 'already-open' : 'already-closed';
  const needles = open ? ['Otwórz inspektor'] : ['Schowaj inspektor (Alt+I)', 'Schowaj inspektor'];
  for (const needle of needles) {
    const clicked = await clickByTitle(page, needle);
    if (!clicked) continue;
    await sleep(900);
    if ((await isPresent()) === open) return open ? 'opened' : 'closed';
  }
  return 'failed';
}

/** Real mouse click on a button inside the bottom-action dock. */
async function clickDockButton(page, text) {
  const point = await page.evaluate((t) => {
    const dock = document.querySelector('[data-testid="section-action-dock"]');
    if (!dock) return null;
    const btn = Array.from(dock.querySelectorAll('button')).find((b) =>
      (b.textContent || '').includes(t)
    );
    if (!btn) return null;
    const r = btn.getBoundingClientRect();
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
  }, text);
  if (!point) return false;
  await page.mouse.move(point.x, point.y);
  await sleep(200);
  await page.mouse.click(point.x, point.y);
  await sleep(1200);
  return true;
}

/** Runs the three assertions for the workspace-level bottom action group. */
function checkDock(snap, label) {
  const d = snap.dockData;
  if (!d) {
    check(`dock rendered (${label})`, false, 'no [data-testid="section-action-dock"]');
    return;
  }
  check(`dock rendered as one group (${label})`, d.buttons.length >= 1 && d.buttons.length <= 2, `buttons=[${d.buttons.join(' | ')}]`);
  check(`dock fully inside workspace (${label})`, insideWorkspace(d.rect, snap.ws).length === 0, insideWorkspace(d.rect, snap.ws).join('; '));
  check(`dock centered in workspace (${label})`, near(d.rect.cx, snap.ws.cx, 2), `dock.cx=${d.rect.cx} ws.cx=${snap.ws.cx}`);
  check(`dock ${DOCK_OFFSET}px above workspace bottom (${label})`, near(snap.ws.bottom - d.rect.bottom, DOCK_OFFSET, 2), `gap=${Math.round(snap.ws.bottom - d.rect.bottom)}px`);
  check(`dock fully visible / not clipped (${label})`, d.visibility === 'visible' && d.rect.height > 20, `h=${d.rect.height} vis=${d.visibility}`);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const chrome = CHROME_CANDIDATES.find((p) => fs.existsSync(p));
  if (!chrome) throw new Error('No Chrome/Edge found');

  console.log(`[PANEL] Browser: ${chrome}`);
  console.log(`[PANEL] Target:  ${BASE}`);

  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--window-size=1920,1080'],
    defaultViewport: { width: 1920, height: 1080 },
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(`PAGEERROR: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(`CONSOLE: ${m.text()}`); });

  try {
    const storeId = `pw-panel-${Date.now()}`;
    await page.goto(`${BASE}/studio/${storeId}`, { waitUntil: 'networkidle2', timeout: 120000 });
    await page.waitForSelector('[data-builder-workspace]', { timeout: 60000 });
    await sleep(3500);
    console.log(`\n=== WORKSPACE === url=${page.url()}`);

    // ---------- SELECT SECTION ----------
    const selected = await selectSection(page);
    await sleep(1800);
    check('section selected in canvas', selected);
    await shot(page, '01-section-selected');

    let snap = await snapshot(page);
    check('builder workspace present', Boolean(snap.ws), snap.ws ? `${snap.ws.width}x${snap.ws.height}` : 'missing');
    check('canvas has nodes', snap.nodeCount > 0, `nodes=${snap.nodeCount}`);

    // ---------- FIX 3: bottom actions, Inspector OPEN ----------
    console.log('\n=== FIX 3 / BOTTOM ACTIONS (Inspector OPEN) ===');
    await toggleInspector(page, true);
    await sleep(1200);
    snap = await snapshot(page);
    check('Inspector open', snap.inspector.present);
    checkDock(snap, 'Inspector OPEN');
    await shot(page, '02-dock-inspector-open');

    // ---------- FIX 3: Inspector CLOSED ----------
    console.log('\n=== FIX 3 / BOTTOM ACTIONS (Inspector CLOSED) ===');
    const closed = await toggleInspector(page, false);
    await sleep(1400);
    snap = await snapshot(page);
    check('Inspector closed', !snap.inspector.present, `toggle=${closed}`);
    checkDock(snap, 'Inspector CLOSED');
    await shot(page, '03-dock-inspector-closed');

    // Re-open Inspector so FIX 1 can compare surfaces side by side
    await toggleInspector(page, true);
    await sleep(1200);

    // ---------- FIX 1 + FIX 2: floating parameter panel ----------
    console.log('\n=== FIX 1 + FIX 2 / FLOATING PARAMETER PANEL ===');
    const opened = await openSettingsPanel(page);
    await sleep(1600);
    snap = await snapshot(page);
    check('floating parameter panel opened from QuickToolbar', opened && Boolean(snap.panelData), snap.panelData ? '' : 'panel not found');

    if (snap.panelData) {
      const p = snap.panelData;
      // FIX 1 — identical surface system to the Inspector
      check('Inspector surface measured for comparison', Boolean(snap.inspector.rootBg), `${snap.inspector.rootBg}`);
      check('FIX 1: panel body surface == Inspector surface', p.cardBg === snap.inspector.rootBg, `panel=${p.cardBg} inspector=${snap.inspector.rootBg}`);
      check('FIX 1: panel header surface == Inspector header', p.headerBg === snap.inspector.headerBg, `panel=${p.headerBg} inspector=${snap.inspector.headerBg}`);
      check('FIX 1: legacy #2A2A2F panel surface removed', p.cardBg !== 'rgb(42, 42, 47)', `panel=${p.cardBg}`);

      // FIX 2 — workspace bounds, maxHeight, internal scroll
      const vp = await page.evaluate(() => `${window.innerWidth}x${window.innerHeight}`);
      check('FIX 2: panel fully inside workspace (16px margin)', insideWorkspace(p.rect, snap.ws).length === 0, `${insideWorkspace(p.rect, snap.ws).join('; ')} | panel=${JSON.stringify(p.rect)} ws=${JSON.stringify(snap.ws)} vp=${vp}`);
      const maxH = parseFloat(p.maxHeightStyle || '0');
      check('FIX 2: maxHeight capped to workspace height', maxH > 0 && maxH <= snap.ws.height - MARGIN * 2 + 1, `maxHeight=${maxH} wsHeight=${snap.ws.height}`);
      check('FIX 2: panel body scrolls internally', p.bodyOverflowY === 'auto', `overflow-y=${p.bodyOverflowY}`);

      // Regression guard: a transformed ancestor (canvas zoom wrapper) turns into the
      // containing block for position:fixed and skews the panel by the canvas offset.
      const geo = await page.evaluate(() => {
        const el = Array.from(document.querySelectorAll('div')).find((d) => {
          const cs = getComputedStyle(d);
          return cs.position === 'fixed' && cs.zIndex === '9999';
        });
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return {
          styleLeft: parseFloat(el.style.left), styleTop: parseFloat(el.style.top),
          rectLeft: r.left, rectTop: r.top,
          offsetParent: el.offsetParent ? el.offsetParent.tagName : null,
        };
      });
      check('FIX 2: panel is viewport-anchored (no transformed containing block)', Boolean(geo) && near(geo.rectLeft, geo.styleLeft, 1.5) && near(geo.rectTop, geo.styleTop, 1.5), geo ? `style=(${geo.styleLeft},${geo.styleTop}) rect=(${geo.rectLeft},${geo.rectTop}) offsetParent=${geo.offsetParent}` : 'panel not found');
      check('all panel parameters remain accessible', p.controlCount > 0, `controls=${p.controlCount}`);

      // PHASE 19 TEST 4 — panel must not cover the bottom actions
      if (snap.dockData) {
        check('PHASE 19 T4: bottom actions NOT covered by panel', overlap(p.rect, snap.dockData.rect) === 0, `overlap=${overlap(p.rect, snap.dockData.rect)}px2`);
      }

      // PHASE 15 — internal panel scroll must not move page / panel / canvas
      const beforeX = p.rect.left;
      const beforeY = p.rect.top;
      const beforeScroll = await page.evaluate(() => window.scrollY);
      await page.evaluate(() => {
        const card = Array.from(document.querySelectorAll('div')).find((el) => {
          const cs = getComputedStyle(el);
          return cs.position === 'fixed' && cs.zIndex === '9999';
        });
        const body = card && card.children.length > 1 ? card.children[1] : null;
        if (body) body.scrollTop = 400;
      });
      await sleep(600);
      const after = await snapshot(page);
      const pageScroll = await page.evaluate(() => window.scrollY);
      check('PHASE 15: panel scroll does not scroll the page', pageScroll === beforeScroll, `scrollY=${pageScroll}`);
      check('PHASE 15: panel scroll does not move the panel', Boolean(after.panelData) && near(after.panelData.rect.left, beforeX, 1) && near(after.panelData.rect.top, beforeY, 1), after.panelData ? `x=${after.panelData.rect.left} y=${after.panelData.rect.top}` : 'panel lost');
    }
    await shot(page, '04-panel-open');

    // ---------- PHASE 14: responsive workspace ----------
    console.log('\n=== PHASE 14 / RESPONSIVE WORKSPACE ===');
    for (const vp of VIEWPORTS) {
      await page.setViewport({ width: vp.w, height: vp.h });
      await sleep(1500);
      const s = await snapshot(page);
      const dockProblems = s.dockData ? insideWorkspace(s.dockData.rect, s.ws) : ['no dock'];
      check(`[${vp.name}] dock visible + inside workspace`, dockProblems.length === 0, dockProblems.join('; '));
      if (s.dockData) {
        check(`[${vp.name}] dock centered + 24px above bottom`, near(s.dockData.rect.cx, s.ws.cx, 2) && near(s.ws.bottom - s.dockData.rect.bottom, DOCK_OFFSET, 2), `cx=${s.dockData.rect.cx}/${s.ws.cx} gap=${Math.round(s.ws.bottom - s.dockData.rect.bottom)}`);
      }
      if (s.panelData) {
        const pp = insideWorkspace(s.panelData.rect, s.ws);
        check(`[${vp.name}] floating panel fully inside workspace`, pp.length === 0, pp.join('; '));
        const mh = parseFloat(s.panelData.maxHeightStyle || '0');
        check(`[${vp.name}] panel maxHeight within workspace`, mh > 0 && mh <= s.ws.height - MARGIN * 2 + 1, `maxHeight=${mh} ws=${s.ws.height}`);
      }
      await shot(page, `05-responsive-${vp.name}`);
    }

    // ---------- PHASE 19 TEST 3: reduced browser height ----------
    console.log('\n=== PHASE 19 T3 / REDUCED VIEWPORT HEIGHT ===');
    await page.setViewport({ width: 1440, height: 620 });
    await sleep(1500);
    const small = await snapshot(page);
    check('dock visible + inside workspace at 1440x620', Boolean(small.dockData) && insideWorkspace(small.dockData.rect, small.ws).length === 0, small.dockData ? insideWorkspace(small.dockData.rect, small.ws).join('; ') : 'no dock');
    if (small.panelData) {
      check('panel fully inside workspace at 1440x620', insideWorkspace(small.panelData.rect, small.ws).length === 0, insideWorkspace(small.panelData.rect, small.ws).join('; '));
    }
    await shot(page, '06-reduced-height');

    // ---------- REGRESSION: functionality untouched ----------
    console.log('\n=== REGRESSION / FUNCTIONALITY ===');
    const addClicked = await clickDockButton(page, 'Dodaj sekcj');
    await sleep(2600);
    const libraryOpen = await page.evaluate(() => {
      const textHit = Array.from(document.querySelectorAll('div,span,h1,h2,h3')).some((el) =>
        (el.textContent || '').includes('Bibliotek')
      );
      const dialogHit = Boolean(
        document.querySelector('[role="dialog"], [aria-modal="true"], [data-testid*="section-library"]')
      );
      return textHit || dialogHit;
    });
    check('REGRESSION: "Dodaj sekcję" still opens the section library', addClicked && libraryOpen, `clicked=${addClicked} library=${libraryOpen}`);
    await shot(page, '07-add-section-still-works');

    // Close the library again so the panel can be re-tested
    const libClose = await page.evaluate(() => {
      const close = Array.from(document.querySelectorAll('button')).find((b) => {
        const t = (b.textContent || '').trim().toLowerCase();
        return t === 'zamknij' || t === 'close' || (b.getAttribute('aria-label') || '').toLowerCase() === 'close';
      });
      if (!close) return null;
      const r = close.getBoundingClientRect();
      return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
    });
    if (libClose) await page.mouse.click(libClose.x, libClose.y);
    await sleep(900);

    // Panel close button regression (only if a panel is currently open)
    const panelNow = await snapshot(page);
    if (panelNow.panelData) {
      const closedOk = await clickByTitle(page, 'Zamknij panel');
      await sleep(900);
      const gone = await snapshot(page);
      check('REGRESSION: panel close button works', closedOk && !gone.panelData, `clicked=${closedOk} stillOpen=${Boolean(gone.panelData)}`);
    }

    const pageErrors = consoleErrors.filter((e) => e.startsWith('PAGEERROR'));
    check('no uncaught page errors', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | '));
  } catch (err) {
    check('acceptance run completed', false, String(err && err.message ? err.message : err));
  } finally {
    await browser.close();
  }

  const failed = results.filter((r) => !r.ok);
  console.log('\n================ SUMMARY ================');
  console.log(`TOTAL ${results.length}  PASS ${results.length - failed.length}  FAIL ${failed.length}`);
  if (failed.length) {
    console.log('FAILED CHECKS:');
    failed.forEach((f) => console.log(` - ${f.name} :: ${f.detail}`));
  }
  console.log('Screenshots:', OUT_DIR);
  console.log('RESULT:', failed.length ? 'FAIL' : 'PASS');
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
