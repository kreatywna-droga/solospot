/**
 * AI COPILOT TEXTAREA — BROWSER GEOMETRY FORENSICS (READ-ONLY).
 * Measures REAL computed style + first-line geometry. No code changes.
 * Usage: node scripts/ai-copilot-textarea-forensics.js
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const BASE = process.env.PW_BASE || 'https://www.solospot.pl';
const OUT_DIR = path.join(__dirname, '..', 'scratch', 'ai-copilot-forensics');
const TS = Date.now();

const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { headers: { 'accept': 'application/json' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(httpGet(new URL(res.headers.location, url).toString()));
      }
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        if (res.statusCode >= 400) return reject(new Error('HTTP ' + res.statusCode + ' for ' + url));
        try { resolve(JSON.parse(data)); } catch (e) { reject(new Error('Non-JSON from ' + url)); }
      });
    });
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('timeout ' + url)); });
  });
}

/** In-page: find composer textarea, read computed style, measure caret + first char. */
function COMPOSER_GEO_FN() {
  const out = { found: false };
  const ta = document.querySelector('textarea[placeholder*="SoloSpot AI"]')
    || document.querySelector('aside textarea')
    || document.querySelector('textarea');
  if (!ta) { out.reason = 'no textarea'; return out; }
  out.found = true;
  const cs = getComputedStyle(ta);
  const r = ta.getBoundingClientRect();
  out.rect = { left: +r.left.toFixed(1), top: +r.top.toFixed(1), width: +r.width.toFixed(1), height: +r.height.toFixed(1) };
  out.computed = {
    paddingTop: cs.paddingTop, paddingBottom: cs.paddingBottom,
    paddingLeft: cs.paddingLeft, paddingRight: cs.paddingRight,
    lineHeight: cs.lineHeight, fontSize: cs.fontSize,
    height: cs.height, minHeight: cs.minHeight, maxHeight: cs.maxHeight,
    display: cs.display, verticalAlign: cs.verticalAlign,
    position: cs.position, transform: cs.transform,
    overflowY: cs.overflowY, textAlign: cs.textAlign,
    boxSizing: cs.boxSizing, borderTopWidth: cs.borderTopWidth,
    alignItems: cs.alignItems, justifyContent: cs.justifyContent,
    alignContent: cs.alignContent, whiteSpace: cs.whiteSpace,
  };
  const parent = ta.parentElement;
  if (parent) {
    const pcs = getComputedStyle(parent);
    const pr = parent.getBoundingClientRect();
    out.parent = {
      display: pcs.display, alignItems: pcs.alignItems,
      justifyContent: pcs.justifyContent, alignContent: pcs.alignContent,
      height: +pr.height.toFixed(1),
    };
  }
  try {
    ta.focus();
    ta.setSelectionRange(0, 0);
    const range = document.createRange();
    range.setStart(ta, 0);
    range.setEnd(ta, 0);
    const caret = range.getBoundingClientRect();
    out.caret = { top: +caret.top.toFixed(1), height: +caret.height.toFixed(1), left: +caret.left.toFixed(1) };
    if (ta.value && ta.value.length > 0) {
      ta.setSelectionRange(0, 1);
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const sr = sel.getRangeAt(0).getBoundingClientRect();
        out.firstChar = { top: +sr.top.toFixed(1), height: +sr.height.toFixed(1), left: +sr.left.toFixed(1) };
      }
      ta.setSelectionRange(ta.value.length, ta.value.length);
    }
  } catch (e) { out.measureError = String((e && e.message) || e); }
  out.caretOffsetFromTextareaTop = out.caret ? +(out.caret.top - r.top).toFixed(2) : null;
  out.firstCharOffsetFromTextareaTop = out.firstChar ? +(out.firstChar.top - r.top).toFixed(2) : null;
  out.firstCharOffsetFromPaddingTop = null;
  try {
    const pt = parseFloat(cs.paddingTop) || 0;
    if (out.firstChar) out.firstCharOffsetFromPaddingTop = +(out.firstChar.top - (r.top + pt)).toFixed(2);
    else if (out.caret) out.firstCharOffsetFromPaddingTop = +(out.caret.top - (r.top + pt)).toFixed(2);
  } catch (e2) { /* ignore */ }
  out.valueLength = ta.value ? ta.value.length : 0;
  out.scrollTop = ta.scrollTop;
  out.scrollHeight = ta.scrollHeight;
  out.placeholder = ta.getAttribute('placeholder');
  return out;
}

function setTaValue(text) {
  const ta = document.querySelector('textarea[placeholder*="SoloSpot AI"]')
    || document.querySelector('aside textarea')
    || document.querySelector('textarea');
  if (!ta) return false;
  ta.focus();
  const proto = Object.getPrototypeOf(ta);
  const desc = proto && Object.getOwnPropertyDescriptor(proto, 'value');
  if (desc && desc.set) {
    desc.set.call(ta, text);
  } else {
    ta.value = text;
  }
  ta.dispatchEvent(new Event('input', { bubbles: true }));
  ta.dispatchEvent(new Event('change', { bubbles: true }));
  try { ta.setSelectionRange(0, 0); } catch (e) { /* ignore */ }
  return true;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const chrome = CHROME_CANDIDATES.find((p) => { try { return fs.existsSync(p); } catch (e) { return false; } });
  if (!chrome) throw new Error('No Chrome/Edge found');
  console.log('[AI-TA] Browser: ' + chrome);
  console.log('[AI-TA] Target:  ' + BASE);

  const seed = await httpGet(BASE + '/api/test-auth/bootstrap-seed');
  const storeId = seed.storeId;
  if (!storeId) throw new Error('bootstrap-seed returned no storeId');
  const suffix = 'ai-ta-' + TS;
  if (seed.loginHint) {
    await httpGet(BASE + '/studio/' + suffix + '/api/bootstrap-store-data?login='
      + encodeURIComponent(seed.loginHint) + '&storeId=' + encodeURIComponent(storeId));
  }

  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--window-size=1920,1080', '--disable-blink-features=AutomationControlled'],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    page.on('dialog', async (d) => { try { await d.dismiss(); } catch (e) {} });
    const url = BASE + '/studio/' + suffix;
    console.log('\n=== OPEN ' + url + ' ===');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await sleep(6000);

    const aiClicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('aside button[title]'));
      const ai = btns.find((b) => (b.getAttribute('title') || '').indexOf('AI (') === 0);
      if (ai) { ai.click(); return true; }
      return false;
    });
    console.log('AI tab clicked: ' + aiClicked);
    await sleep(2500);

    await page.evaluate(() => {
      const ta = document.querySelector('textarea[placeholder*="SoloSpot AI"]') || document.querySelector('aside textarea');
      if (ta) ta.scrollIntoView({ block: 'nearest' });
    });
    await sleep(800);

    await page.evaluate(setTaValue, '');
    await sleep(600);
    const geoEmpty = await page.evaluate(COMPOSER_GEO_FN);
    console.log('\n--- (1) PLACEHOLDER / EMPTY ---');
    console.log(JSON.stringify(geoEmpty));

    await page.evaluate(setTaValue, 'JESTES UUUUUU!');
    await sleep(600);
    const geoSingle = await page.evaluate(COMPOSER_GEO_FN);
    console.log('\n--- (2) SINGLE LINE ---');
    console.log(JSON.stringify(geoSingle));

    await page.evaluate(setTaValue, 'Linia pierwsza testowa\nDruga linia tekstu\nTrzecia linia i jeszcze troche tekstu do zawijania w waskim polu kompozytora AI');
    await sleep(600);
    const geoMulti = await page.evaluate(COMPOSER_GEO_FN);
    console.log('\n--- (3) MULTILINE ---');
    console.log(JSON.stringify(geoMulti));

    console.log('\n=== ROOT-CAUSE ANALYSIS ===');
    console.log('padding-top: ' + (geoEmpty.computed && geoEmpty.computed.paddingTop));
    console.log('placeholder caret offset from top: ' + geoEmpty.caretOffsetFromTextareaTop + 'px');
    console.log('single-line first-char offset from top: ' + geoSingle.firstCharOffsetFromTextareaTop + 'px');
    console.log('multiline first-char offset from top: ' + geoMulti.firstCharOffsetFromTextareaTop + 'px');
    console.log('parent align-items: ' + (geoEmpty.parent && geoEmpty.parent.alignItems));

    const report = { base: BASE, url: url, aiClicked: aiClicked, empty: geoEmpty, single: geoSingle, multi: geoMulti };
    const outPath = path.join(OUT_DIR, 'forensics-' + TS + '.json');
    fs.writeFileSync(outPath, JSON.stringify(report, null, 1));
    console.log('\nReport: ' + outPath);
  } finally {
    await browser.close();
  }
}

main().catch((e) => { console.error('[AI-TA] FATAL', e); process.exit(1); });
