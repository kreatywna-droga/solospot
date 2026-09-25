/**
 * AI COPILOT COMPOSER — LIVE GEOMETRY MEASUREMENT (READ-ONLY, PRODUCTION).
 * Part 1/3: setup + in-page geometry probe.
 * NO CODE CHANGES. NO commits. Read-only geometry probe.
 * Usage: node scripts/ai-copilot-live-geometry.js
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const BASE = process.env.PW_BASE || 'https://www.solospot.pl';
const OUT_DIR = path.join(__dirname, '..', 'scratch', 'ai-copilot-live');
const EMAIL = `aigeo.bot+${Date.now()}@solospot-test.pl`;
const PASSWORD = 'AiGeo-Accept-2026!';
const TS = Date.now();

const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** In-page geometry probe for the REAL composer textarea. */
function COMPOSER_GEO_FN() {
  const out = { found: false };
  const ta = document.querySelector('textarea[placeholder*="SoloSpot AI"]')
    || document.querySelector('aside textarea')
    || document.querySelector('textarea');
  if (!ta) { out.reason = 'no textarea'; return out; }
  out.found = true;
  const R = (r) => ({
    left: +r.left.toFixed(1), top: +r.top.toFixed(1),
    right: +r.right.toFixed(1), bottom: +r.bottom.toFixed(1),
    width: +r.width.toFixed(1), height: +r.height.toFixed(1),
  });
  const cs = getComputedStyle(ta);
  const r = ta.getBoundingClientRect();
  out.textareaRect = R(r);
  out.computed = {
    paddingTop: cs.paddingTop, paddingRight: cs.paddingRight,
    paddingBottom: cs.paddingBottom, paddingLeft: cs.paddingLeft,
    lineHeight: cs.lineHeight, fontSize: cs.fontSize,
    height: cs.height, minHeight: cs.minHeight, maxHeight: cs.maxHeight,
    display: cs.display, verticalAlign: cs.verticalAlign,
    position: cs.position, transform: cs.transform,
    overflowY: cs.overflowY, overflowX: cs.overflowX,
    textAlign: cs.textAlign, whiteSpace: cs.whiteSpace,
    boxSizing: cs.boxSizing, borderTopWidth: cs.borderTopWidth,
    alignItems: cs.alignItems, justifyContent: cs.justifyContent,
    alignContent: cs.alignContent, resize: cs.resize,
  };
  out.classAttr = String(ta.className || '').slice(0, 400);
  out.value = String(ta.value || '');
  out.valueLen = out.value.length;
  out.lineCount = out.value ? out.value.split('\n').length : 0;
  out.scrollWidth = ta.scrollWidth; out.clientWidth = ta.clientWidth;
  out.scrollHeight = ta.scrollHeight; out.clientHeight = ta.clientHeight;
  out.scrollTop = ta.scrollTop;
  const parent = ta.parentElement;
  if (parent) {
    const pcs = getComputedStyle(parent);
    const pr = parent.getBoundingClientRect();
    out.parent = {
      classAttr: String(parent.className || '').slice(0, 300),
      display: pcs.display, alignItems: pcs.alignItems,
      justifyContent: pcs.justifyContent, alignContent: pcs.alignContent,
      position: pcs.position, rect: R(pr),
    };
  }
  try {
    ta.focus();
    const pos = Math.min(1, ta.value.length);
    ta.setSelectionRange(pos, pos);
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const cr = sel.getRangeAt(0).getBoundingClientRect();
      if (cr && (cr.top || cr.height)) {
        out.caretRect = R(cr);
        out.caretOffsetFromTextareaTop = +(cr.top - r.top).toFixed(1);
        out.caretHeight = +cr.height.toFixed(1);
      } else { out.caretNote = 'empty caret rect (collapsed range has no box)'; }
    } else { out.caretNote = 'no selection range'; }
  } catch (e) { out.caretError = String((e && e.message) || e); }
  try {
    const btns = parent ? Array.from(parent.querySelectorAll('button')) : [];
    out.toolbar = btns.map((b) => {
      const br = b.getBoundingClientRect();
      return {
        title: b.getAttribute('title') || '',
        text: String(b.textContent || '').trim().slice(0, 40),
        rect: R(br),
        gapFromTextareaBottom: +(br.top - r.bottom).toFixed(1),
        overlapsTextareaVertically: br.top < r.bottom && br.bottom > r.top,
      };
    });
  } catch (e) { out.toolbarError = String((e && e.message) || e); }
  return out;
}


/**
 * PART 2/3: helpers — React-safe textarea setter + screenshot.
 * READ-ONLY: only fills the composer textarea (never sends).
 */
function SET_TA_FN(v) {
  const ta = document.querySelector('textarea[placeholder*="SoloSpot AI"]')
    || document.querySelector('aside textarea')
    || document.querySelector('textarea');
  if (!ta) return false;
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype, 'value').set;
  setter.call(ta, v);
  ta.dispatchEvent(new Event('input', { bubbles: true }));
  ta.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
}

async function shot(page, name) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`), fullPage: false });
  console.log(`  [shot] ${name}.png`);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const chrome = CHROME_CANDIDATES.find((p) => p && fs.existsSync(p));
  if (!chrome) throw new Error('No Chrome/Edge found');
  console.log(`[AI-GEO] Browser: ${chrome}`);
  console.log(`[AI-GEO] Target:  ${BASE}`);

  const browser = await puppeteer.launch({
    executablePath: chrome, headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--window-size=1920,1080', '--disable-blink-features=AutomationControlled'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  page.on('dialog', async (d) => { try { await d.dismiss(); } catch (e) {} });
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push('PAGEERROR: ' + e.message));

  try {
    // ---------- setup: register → login → onboarding → store ----------
    console.log('\n=== SETUP / register+login+store ===');
    await fetch(`${BASE}/api/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD, name: 'AI Geo' }),
    }).catch((e) => console.log('[AI-GEO] register note:', e.message));
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2', timeout: 60000 });
    await sleep(1500);
    await page.evaluate((email, pass) => {
      const set = (el, v) => {
        if (!el) return;
        Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, v);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      };
      set(document.querySelector('input[type="email"]'), email);
      set(document.querySelector('input[type="password"]'), pass);
    }, EMAIL, PASSWORD);
    await sleep(700);
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }).catch(() => {}),
      page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button[type="submit"]'))[0]
          || Array.from(document.querySelectorAll('button')).find((b) => /zaloguj/i.test(b.textContent || ''));
        if (btn) btn.click();
      }),
    ]);
    await sleep(3500);
    await page.evaluate(async (url, email) => {
      await fetch(`${url}/api/onboarding/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerEmail: email, packageId: 'starter', storeName: 'AI Geo' }),
      }).catch(() => {});
    }, BASE, EMAIL);

    // ---------- open studio + AI tab, then measure 3 states ----------
    console.log('\n=== STUDIO / open + AI tab ===');
    const storeId = await page.evaluate(async (url) => {
      const r = await fetch(`${url}/api/stores`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `AI Geo ${Date.now()}`, slug: `ai-geo-${Date.now()}` }),
      });
      const b = await r.json();
      return b.store && b.store.id;
    }, BASE);
    console.log('storeId:', storeId || 'FAILED');
    if (!storeId) throw new Error('store creation failed');
    await page.goto(`${BASE}/studio/${storeId}`, { waitUntil: 'networkidle2', timeout: 120000 });
    await page.waitForSelector('[data-builder-workspace]', { timeout: 60000 });
    await sleep(5000);
    const aiClicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('aside button[title]'));
      const ai = btns.find((b) => (b.getAttribute('title') || '').indexOf('AI (') === 0);
      if (ai) { ai.click(); return true; }
      return false;
    });
    console.log('AI tab clicked:', aiClicked);
    await sleep(2500);
    await page.evaluate(() => {
      const ta = document.querySelector('aside textarea');
      if (ta) ta.scrollIntoView({ block: 'nearest' });
    });
    await sleep(800);
    console.log('\n=== (1) EMPTY / PLACEHOLDER ===');
    await page.evaluate(SET_TA_FN, '');
    await sleep(600);
    const empty = await page.evaluate(COMPOSER_GEO_FN);
    console.log(JSON.stringify(empty));
    await shot(page, 'ta-1-placeholder');
    console.log('\n=== (2) SINGLE LINE: "JESTEŚ UUUUUU!" ===');
    await page.evaluate(SET_TA_FN, 'JESTE\u015A UUUUUU!');
    await sleep(600);
    const single = await page.evaluate(COMPOSER_GEO_FN);
    console.log(JSON.stringify(single));
    await shot(page, 'ta-2-single');
    console.log('\n=== (3) MULTILINE ===');
    await page.evaluate(SET_TA_FN, 'Linia pierwsza testowa\nDruga linia tekstu\nTrzecia linia i jeszcze troche tekstu');
    await sleep(600);
    const multi = await page.evaluate(COMPOSER_GEO_FN);
    console.log(JSON.stringify(multi));
    await shot(page, 'ta-3-multi');
    console.log('\n================ COMPARISON ================');
    for (const [label, s] of [['empty', empty], ['single', single], ['multi', multi]]) {
      if (!s.found) { console.log(`${label}: NOT FOUND (${s.reason || '?'})`); continue; }
      const c = s.computed || {};
      console.log(`${label}: taH=${s.textareaRect && s.textareaRect.height}`
        + ` padT=${c.paddingTop} padB=${c.paddingBottom} padL=${c.paddingLeft} padR=${c.paddingRight}`
        + ` lh=${c.lineHeight} fs=${c.fontSize}`
        + ` caretOff=${s.caretOffsetFromTextareaTop} caretH=${s.caretHeight}`
        + (s.caretNote ? ` note=${s.caretNote}` : '')
        + ` parentAlign=${s.parent && s.parent.alignItems}`
        + ` scrollH=${s.scrollHeight} clientH=${s.clientHeight}`);
    }
    fs.writeFileSync(
      path.join(OUT_DIR, `live-geometry-${TS}.json`),
      JSON.stringify({ base: BASE, email: EMAIL, empty, single, multi }, null, 1)
    );
    console.log('Report:', path.join(OUT_DIR, `live-geometry-${TS}.json`));
    if (consoleErrors.length) console.log('Page errors:', consoleErrors.slice(0, 3).join(' | '));
  } finally {
    await browser.close();
  }
}

main().catch((e) => { console.error('[AI-GEO] FATAL', e); process.exit(1); });