/**
 * SOLOSPOT — CANVAS SMART GUIDES UX v2.0
 * DEFINITIVE REAL-BROWSER ACCEPTANCE TEST (D1–D23)
 *
 * Drives the real Builder through puppeteer/Chrome and records:
 *   - whether guide SVG lines actually appear during drag
 *   - their exact SVG + screen coordinates
 *   - whether they align with the dragged element (delta in px)
 *   - whether snap moves the element onto the axis
 *   - whether guides disappear on release
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const CHROME = 'C:\\Users\\HP\\.cache\\puppeteer\\chrome\\win64-153.0.8010.36\\chrome-win64\\chrome.exe';
const OUT = path.join(__dirname, 'sg-proof');
fs.mkdirSync(OUT, { recursive: true });

const BASE = process.env.SG_URL || 'http://localhost:3000/studio/s-demo';
const results = [];
const log = (...a) => console.log('[ACC]', ...a);
function record(id, action, expected, actual, status) {
  results.push({ id, action, expected, actual, status });
  log(`${status === 'PASS' ? 'OK ' : 'XX '} ${id} | ${action} | ${actual}`);
}

// ---- guide reading (SVG coords + screen coords) ----
const readGuides = (page) => page.evaluate(() => {
  const out = [];
  document.querySelectorAll('svg.pointer-events-none').forEach(s => {
    const lines = Array.from(s.querySelectorAll('line'));
    if (!lines.length) return;
    const sr = s.getBoundingClientRect();
    const attrW = +s.getAttribute('width'), attrH = +s.getAttribute('height');
    const scaleX = sr.width / attrW, scaleY = sr.height / attrH;
    out.push({
      attrW, attrH, svgRectL: +sr.left.toFixed(2), svgRectT: +sr.top.toFixed(2),
      scaleX: +scaleX.toFixed(4),
      lines: lines.map(l => {
        const x1 = +l.getAttribute('x1'), y1 = +l.getAttribute('y1');
        const x2 = +l.getAttribute('x2'), y2 = +l.getAttribute('y2');
        return {
          x1, y1, x2, y2,
          isVert: Math.abs(x1 - x2) < 0.01,
          stroke: l.getAttribute('stroke'),
          screenX: +(sr.left + x1 * scaleX).toFixed(2),
          screenY: +(sr.top + y1 * scaleY).toFixed(2),
        };
      }),
      texts: Array.from(s.querySelectorAll('text')).map(t => t.textContent),
    });
  });
  return out;
});

const elemRect = (page, id) => page.evaluate((id) => {
  const e = document.querySelector('[data-node-id="' + id + '"]') || document.querySelector('[data-section-id="' + id + '"]');
  if (!e) return null;
  const r = e.getBoundingClientRect();
  return { l: +r.left.toFixed(2), t: +r.top.toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2),
           cx: +(r.left + r.width / 2).toFixed(2), cy: +(r.top + r.height / 2).toFixed(2),
           r: +(r.left + r.width).toFixed(2), b: +(r.top + r.height).toFixed(2) };
}, id);

const canvasGeom = (page) => page.evaluate(() => {
  const R = e => { const r = e.getBoundingClientRect(); return { l:+r.left.toFixed(2), t:+r.top.toFixed(2), w:+r.width.toFixed(2), h:+r.height.toFixed(2) }; };
  const frame = document.querySelector('div.shadow-2xl');
  let zoom = 1;
  let n = document.querySelector('[data-section-id]');
  while (n) { const t = getComputedStyle(n).transform; if (t && t.startsWith('matrix')) { zoom = parseFloat(t.split('(')[1].split(',')[0]); break; } n = n.parentElement; }
  return { frame: frame ? R(frame) : null, frameClientW: frame ? frame.clientWidth : null, zoom };
});


// ---- component insertion (real UI path: Components panel → click card) ----
async function openComponentsPanel(page) {
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find(x => (x.textContent || '').includes('Komponenty'));
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 900));
}
async function addComponent(page, label) {
  await openComponentsPanel(page);
  const ok = await page.evaluate((label) => {
    const cards = Array.from(document.querySelectorAll('[role=button][draggable=true]'));
    const c = cards.find(x => (x.textContent || '').trim().toLowerCase().includes(label.toLowerCase()));
    if (c) { c.click(); return (c.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40); }
    return null;
  }, label);
  await new Promise(r => setTimeout(r, 1100));
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 500));
  return ok;
}

// ---- drag engine: presses, moves in steps, samples guides every step ----
async function dragAndSample(page, elId, from, to, steps = 24, delay = 35) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down({ button: 'left' });
  await new Promise(r => setTimeout(r, 150));
  const samples = [];
  for (let i = 1; i <= steps; i++) {
    const nx = from.x + (to.x - from.x) * (i / steps);
    const ny = from.y + (to.y - from.y) * (i / steps);
    await page.mouse.move(nx, ny, { steps: 1 });
    await new Promise(r => setTimeout(r, delay));
    const g = await readGuides(page);
    const er = await elemRect(page, elId);
    const flat = g.flatMap(s => s.lines.map(l => ({ ...l, scaleX: s.scaleX })));
    samples.push({ i, mouse: { x: +nx.toFixed(1), y: +ny.toFixed(1) }, elem: er, guideCount: flat.length, guides: flat });
  }
  return samples;
}

function findGuide(samples, stroke) {
  let best = null;
  for (const s of samples) {
    if (!s.elem) continue;
    for (const g of s.guides) {
      if (stroke && g.stroke !== stroke) continue;
      const ref = g.isVert ? s.elem.cx : s.elem.cy;
      const val = g.isVert ? g.screenX : g.screenY;
      const delta = Math.abs(val - ref);
      // also allow edge-matching (left/right/top/bottom)
      const dLeft = Math.abs(g.screenX - s.elem.l);
      const dRight = Math.abs(g.screenX - s.elem.r);
      const dTop = Math.abs(g.screenY - s.elem.t);
      const dBot = Math.abs(g.screenY - s.elem.b);
      const dEdge = Math.min(dLeft, dRight, dTop, dBot);
      const use = Math.min(delta, dEdge);
      if (!best || use < best.use) best = { sample: s, guide: g, use: +use.toFixed(2), delta: +delta.toFixed(2) };
    }
  }
  return best;
}

// ---- Guides toggle ----
async function guidesToggleState(page) {
  return page.evaluate(() => {
    const b = document.querySelector('button[title^="Wyłącz prowadnice"]') || document.querySelector('button[title^="Włącz prowadnice"]');
    if (!b) return null;
    return { title: b.getAttribute('title'), enabled: (b.getAttribute('title') || '').startsWith('Wyłącz') };
  });
}
async function clickGuidesToggle(page) {
  const ok = await page.evaluate(() => {
    const b = document.querySelector('button[title^="Wyłącz prowadnice"]') || document.querySelector('button[title^="Włącz prowadnice"]');
    if (!b) return false; b.click(); return true;
  });
  await new Promise(r => setTimeout(r, 700));
  return ok;
}

// ---- Zoom via UI buttons ----
async function clickZoom(page, dir /* 'in' | 'out' */) {
  const cls = dir === 'in' ? 'lucide-zoom-in' : 'lucide-zoom-out';
  const ok = await page.evaluate((cls) => {
    const svg = document.querySelector('svg.' + cls);
    if (!svg) return false;
    const b = svg.closest('button');
    if (!b) return false; b.click(); return true;
  }, cls);
  await new Promise(r => setTimeout(r, 800));
  return ok;
}

// ---- select a node by data-node-id prefix ----
async function selectNode(page, prefix) {
  return page.evaluate((prefix) => {
    const e = document.querySelector('[data-node-id^="' + prefix + '"]');
    if (!e) return null;
    const id = e.getAttribute('data-node-id');
    const r = e.getBoundingClientRect();
    const ev = new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 });
    e.dispatchEvent(ev);
    e.click();
    return id;
  }, prefix);
}
async function nodeIds(page) {
  return page.evaluate(() => Array.from(document.querySelectorAll('[data-node-id]')).map(e => e.getAttribute('data-node-id')));
}

// ===========================================================================
// MAIN — D1..D23
// ===========================================================================
(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--window-size=1600,1100'],
    defaultViewport: { width: 1600, height: 1100 },
  });
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push('PE: ' + e.message.slice(0, 200)));
  page.on('console', m => { if (m.type() === 'error') pageErrors.push('C: ' + m.text().slice(0, 200)); });

  const shot = async (n) => { await page.screenshot({ path: path.join(OUT, n), fullPage: true }); log('  shot ' + n); };
  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  // ---------------------------------------------------------------- D1
  log('=== D1: open Editor ===');
  await page.goto(BASE, { waitUntil: 'networkidle0', timeout: 90000 });
  await wait(4000);
  const d1 = await page.evaluate(() => ({
    sections: document.querySelectorAll('[data-section-id]').length,
    nodes: document.querySelectorAll('[data-node-id]').length,
    hasCanvas: !!document.querySelector('div.shadow-2xl'),
    url: location.href,
  }));
  record('D1', 'Open SoloSpot Editor → Canvas',
    'Editor loads with canvas + sections',
    `sections=${d1.sections} nodes=${d1.nodes} canvas=${d1.hasCanvas}`,
    d1.hasCanvas ? 'PASS' : 'FAIL');
  await shot('D1-editor-open.png');
  const geom = await canvasGeom(page);
  log('  canvas geom:', JSON.stringify(geom));

  // ---------------------------------------------------------------- D2
  log('=== D2: add an IMAGE and select it ===');
  const imgCard = await addComponent(page, 'Obraz');
  await wait(1200);
  let imgId = await page.evaluate(() => {
    const ids = Array.from(document.querySelectorAll('[data-node-id]')).map(e => e.getAttribute('data-node-id'));
    const img = ids.find(i => /image|img|obraz/i.test(i));
    return img || ids[ids.length - 1] || null;
  });
  await selectNode(page, imgId ? imgId.split('_').slice(0, 2).join('_') : 'node_');
  await wait(600);
  const imgRect = imgId ? await elemRect(page, imgId) : null;
  record('D2', 'Add image component + select',
    'Image node exists and is selectable',
    `id=${imgId} card="${imgCard}" rect=${imgRect ? imgRect.w + 'x' + imgRect.h : 'null'}`,
    imgId && imgRect && imgRect.w > 0 ? 'PASS' : 'FAIL');
  await shot('D2-image-added.png');


