/**
 * AI COPILOT TEXTAREA — GEOMETRY ROOT-CAUSE MEASUREMENT (READ-ONLY)
 * No product code is modified. Output → scratch/ai-geometry/.
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const BASE = process.env.AIGEO_BASE || 'https://www.solospot.pl';
const EMAIL = `aigeo.bot+${Date.now()}@solospot-test.pl`;
const PASSWORD = 'AiGeo-Accept-2026!';
const OUT_DIR = path.join(__dirname, '..', 'scratch', 'ai-geometry');

const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];

/** In-page measurement of the composer textarea. `mode` is only a label. */
const MEASURE_FN = (mode) => {
  const round = (n) => Math.round(n * 100) / 100;
  const ta = document.querySelector('textarea[placeholder*="SoloSpot"]');
  if (!ta) return { mode, found: false };
  const cs = getComputedStyle(ta);
  const parent = ta.parentElement;
  const pcs = parent ? getComputedStyle(parent) : null;
  const r = ta.getBoundingClientRect();

  // First-line geometry: collapsed-range caret at offset 0 in first child.
  let caretTopRelBorderBox = null;
  let caretLeftRelBorderBox = null;
  try {
    const range = document.createRange();
    range.setStart(ta.firstChild || ta, 0);
    range.collapse(true);
    const rects = range.getClientRects();
    if (rects.length) {
      caretTopRelBorderBox = round(rects[0].top - r.top);
      caretLeftRelBorderBox = round(rects[0].left - r.left);
    }
  } catch (e) { /* zero-width range on empty textarea → rects stay empty */ }
  const expectedTop = round(parseFloat(cs.borderTopWidth) + parseFloat(cs.paddingTop));
  const lh = parseFloat(cs.lineHeight); const fs = parseFloat(cs.fontSize);
  const halfLeading = (!isNaN(lh) && !isNaN(fs)) ? round((lh - fs) / 2) : null;

  // Overlay buttons that live inside the composer box
  const overlays = [];
  if (parent) {
    parent.querySelectorAll('button').forEach((b) => {
      const br = b.getBoundingClientRect();
      const bs = getComputedStyle(b);
      overlays.push({
        label: (b.getAttribute('title') || (b.textContent || '').trim()).slice(0, 28),
        position: bs.position,
        rect: { left: Math.round(br.left), top: Math.round(br.top), right: Math.round(br.right), bottom: Math.round(br.bottom), h: Math.round(br.height) },
      });
    });
  }

  // Ancestor chain flex alignment (first 6 levels)
  const chain = [];
  let el = ta;
  for (let i = 0; i < 6 && el && el !== document.body; i++) {
    const s = getComputedStyle(el);
    chain.push({ tag: el.tagName.toLowerCase(), display: s.display, alignItems: s.alignItems, justifyContent: s.justifyContent });
    el = el.parentElement;
  }

  return {
    mode, found: true,
    rect: { left: round(r.left), top: round(r.top), width: round(r.width), height: round(r.height) },
    computed: {
      paddingTop: cs.paddingTop, paddingRight: cs.paddingRight,
      paddingBottom: cs.paddingBottom, paddingLeft: cs.paddingLeft,
      lineHeight: cs.lineHeight, fontSize: cs.fontSize,
      height: cs.height, minHeight: cs.minHeight, maxHeight: cs.maxHeight,
      display: cs.display, verticalAlign: cs.verticalAlign,
      position: cs.position, transform: cs.transform, boxSizing: cs.boxSizing,
      textAlign: cs.textAlign, overflowY: cs.overflowY,
      borderTop: cs.borderTopWidth, borderLeft: cs.borderLeftWidth,
      rows: ta.getAttribute('rows'), cls: ta.className.slice(0, 200),
    },
    parent: pcs ? { display: pcs.display, alignItems: pcs.alignItems, justifyContent: pcs.justifyContent, padding: pcs.padding, cls: String(parent.className).slice(0, 160) } : null,
    firstLine: {
      caretTopRelBorderBox, caretLeftRelBorderBox,
      expectedBoxTop: expectedTop, halfLeadingPx: halfLeading,
      note: 'caret on empty textarea range may be null; compare STATE 2/3',
    },
    scroll: { scrollHeight: ta.scrollHeight, clientHeight: ta.clientHeight, scrollTop: ta.scrollTop, valueLines: ta.value ? ta.value.split('\n').length : 0, valueLen: ta.value.length },
    overlays, ancestorChain: chain,
  };
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const chrome = CHROME_CANDIDATES.find((p) => fs.existsSync(p));
  if (!chrome) throw new Error('No Chrome/Edge found');
  console.log(`[AIGEO] Browser: ${chrome}`);
  console.log(`[AIGEO] Target:  ${BASE}`);

  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--window-size=1600,1000'],
    defaultViewport: { width: 1600, height: 1000 },
  });
  const page = await browser.newPage();

  try {
    const regRes = await fetch(`${BASE}/api/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD, name: 'AIGeo Bot' }),
    }).then((r) => r.json().then((b) => ({ status: r.status, body: b })));
    console.log('register:', regRes.status, JSON.stringify(regRes.body).slice(0, 100));

    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2', timeout: 60000 });
    await sleep(1500);
    const emailSel = 'input[type="email"], input[name="email"], input[placeholder*="mail" i]';
    const passSel = 'input[type="password"], input[name="password"]';
    await page.waitForSelector(emailSel, { timeout: 20000 });
    await page.type(emailSel, EMAIL);
    await page.type(passSel, PASSWORD);
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }).catch(() => {}),
      page.keyboard.press('Enter'),
    ]);
    await sleep(3000);

    await page.evaluate(async (url, email) => {
      await fetch(`${url}/api/onboarding/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerEmail: email, packageId: 'starter', storeName: 'AIGeo Store' }),
      });
    }, BASE, EMAIL);
    const storeId = await page.evaluate(async (url) => {
      const r = await fetch(`${url}/api/stores`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'AIGeo Store', slug: `aigeo-${Date.now()}` }),
      });
      const b = await r.json();
      return b && b.store && b.store.id;
    }, BASE);
    if (!storeId) throw new Error('store creation failed');
    console.log('storeId:', storeId);

    await page.goto(`${BASE}/studio/${storeId}`, { waitUntil: 'networkidle2', timeout: 90000 });
    await page.waitForSelector('[data-builder-workspace]', { timeout: 60000 });
    await sleep(4000);

    const aiOpened = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        (b.getAttribute('title') || '').startsWith('AI ('));
      if (btn) { btn.click(); return true; }
      return false;
    });
    console.log('AI tab clicked:', aiOpened);
    await sleep(2000);

    const taSel = 'textarea[placeholder*="SoloSpot"]';
    await page.waitForSelector(taSel, { timeout: 20000 });

    const dump = (label, obj) => {
      console.log(`\n===== ${label} =====`);
      console.log(JSON.stringify(obj, null, 1));
    };

    await page.evaluate(() => {
      const ta = document.querySelector('textarea[placeholder*="SoloSpot"]');
      if (ta) ta.focus();
    });
    await sleep(600);
    dump('STATE 1 — PLACEHOLDER (empty)', await page.evaluate(`(${MEASURE_FN.toString()})('placeholder-empty')`));
    await (await page.$(taSel)).screenshot({ path: path.join(OUT_DIR, 'ta-1-placeholder.png') });

    await page.evaluate((sel) => {
      const ta = document.querySelector(sel);
      if (ta) { ta.value = ''; ta.dispatchEvent(new Event('input', { bubbles: true })); }
    }, taSel);
    await page.type(taSel, 'JESTES UUUUUU!');
    await sleep(600);
    dump('STATE 2 — SINGLE LINE', await page.evaluate(`(${MEASURE_FN.toString()})('single-line')`));
    await (await page.$(taSel)).screenshot({ path: path.join(OUT_DIR, 'ta-2-single.png') });

    await page.evaluate((sel) => {
      const ta = document.querySelector(sel);
      if (ta) { ta.value = ''; ta.dispatchEvent(new Event('input', { bubbles: true })); }
    }, taSel);
    await page.type(taSel, 'Pierwsza linia tekstu\nDruga linia tekstu\nTrzecia linia tekstu\nCzwarta linia tekstu');
    await sleep(600);
    dump('STATE 3 — MULTI LINE', await page.evaluate(`(${MEASURE_FN.toString()})('multi-line')`));
    await (await page.$(taSel)).screenshot({ path: path.join(OUT_DIR, 'ta-3-multi.png') });

    console.log('\n[AIGEO] done. Screenshots:', OUT_DIR);
  } finally {
    await browser.close();
  }
}

main().catch((e) => { console.error('FATAL', e); process.exit(1); });
