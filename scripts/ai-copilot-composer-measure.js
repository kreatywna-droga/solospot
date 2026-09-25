/**
 * AI COPILOT COMPOSER — READ-ONLY GEOMETRY MEASUREMENT (NO CODE CHANGES).
 * PART 1/2: measure helpers.
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const BASE = process.env.PW_BASE || 'https://www.solospot.pl';
const OUT_DIR = path.join(__dirname, '..', 'scratch', 'ai-copilot-forensics');
const CHROME = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe']
  .find((p) => p && fs.existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function MEASURE_FN() {
  const out = { found: false };
  const ta = document.querySelector('aside textarea[placeholder*="SoloSpot"]')
    || document.querySelector('aside textarea')
    || document.querySelector('textarea');
  if (!ta) { out.reason = 'no textarea in aside'; return out; }
  out.found = true;
  const cs = getComputedStyle(ta);
  const r = ta.getBoundingClientRect();
  out.rect = {
    left: +r.left.toFixed(1), top: +r.top.toFixed(1),
    width: +r.width.toFixed(1), height: +r.height.toFixed(1),
  };
  out.computed = {
    paddingTop: cs.paddingTop, paddingRight: cs.paddingRight,
    paddingBottom: cs.paddingBottom, paddingLeft: cs.paddingLeft,
    lineHeight: cs.lineHeight, fontSize: cs.fontSize,
    height: cs.height, minHeight: cs.minHeight, maxHeight: cs.maxHeight,
    display: cs.display, verticalAlign: cs.verticalAlign,
    position: cs.position, transform: cs.transform,
    alignItems: cs.alignItems, justifyContent: cs.justifyContent,
    textAlign: cs.textAlign, whiteSpace: cs.whiteSpace,
    overflowY: cs.overflowY, overflowX: cs.overflowX,
    boxSizing: cs.boxSizing,
  };
  const parent = ta.parentElement;
  if (parent) {
    const pcs = getComputedStyle(parent);
    const pr = parent.getBoundingClientRect();
    out.parent = {
      pclass: String(parent.className || '').slice(0, 160),
      display: pcs.display, alignItems: pcs.alignItems,
      justifyContent: pcs.justifyContent, position: pcs.position,
      height: +pr.height.toFixed(1),
    };
  }
  out.valueLen = ta.value ? ta.value.length : 0;
  try {
    if (ta.value.length > 0) {
      const probe = document.createElement('span');
      probe.textContent = ta.value[0] === '\n' ? 'X' : ta.value[0];
      const s = probe.style;
      s.position = 'absolute'; s.visibility = 'hidden'; s.whiteSpace = 'pre';
      s.font = cs.font; s.letterSpacing = cs.letterSpacing;
      ta.parentElement.appendChild(probe);
      const pr2 = probe.getBoundingClientRect();
      out.firstCharTop = +pr2.top.toFixed(1);
      out.firstCharOffsetFromTextareaTop = +(pr2.top - r.top).toFixed(1);
      probe.remove();
      ta.focus();
      try { ta.setSelectionRange(1, 1); } catch (e) {}
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const cr = sel.getRangeAt(0).getBoundingClientRect();
        if (cr && cr.top) {
          out.caretTop = +cr.top.toFixed(1);
          out.caretOffsetFromTextareaTop = +(cr.top - r.top).toFixed(1);
          out.caretHeight = +cr.height.toFixed(1);
        }
      }
    }
  } catch (e) { out.measureError = String((e && e.message) || e); }
  try {
    out.toolbar = Array.from(parent.querySelectorAll('button')).map((b) => {
      const br = b.getBoundingClientRect();
      return {
        title: (b.getAttribute('title') || '').slice(0, 40),
        left: +br.left.toFixed(1), top: +br.top.toFixed(1),
        width: +br.width.toFixed(1), height: +br.height.toFixed(1),
      };
    });
  } catch (e) { /* ignore */ }
  return out;
}

function SET_TA_FN(v) {
  const ta = document.querySelector('aside textarea[placeholder*="SoloSpot"]')
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
(async () => {
  if (!CHROME) throw new Error('No Chrome/Edge found');
  console.log('[AI-GEO] Browser: ' + CHROME);
  console.log('[AI-GEO] Target:  ' + BASE);
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--window-size=1920,1080', '--disable-blink-features=AutomationControlled'],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    page.on('dialog', async (d) => { try { await d.dismiss(); } catch (e) {} });
    const url = BASE + '/studio/ai-geo-' + Date.now();
    console.log('OPEN ' + url);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });
    await page.waitForSelector('[data-builder-workspace]', { timeout: 60000 });
    await sleep(5000);
    const aiClicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('aside button[title]'));
      const ai = btns.find((b) => (b.getAttribute('title') || '').indexOf('AI (') === 0);
      if (ai) { ai.click(); return true; }
      return false;
    });
    console.log('AI tab clicked: ' + aiClicked);
    await sleep(2500);
    await page.evaluate(() => {
      const ta = document.querySelector('aside textarea');
      if (ta) ta.scrollIntoView({ block: 'nearest' });
    });
    await sleep(800);
    await page.evaluate(SET_TA_FN, '');
    await sleep(600);
    const empty = await page.evaluate(MEASURE_FN);
    console.log('--- (1) EMPTY / PLACEHOLDER ---');
    console.log(JSON.stringify(empty));
    await page.evaluate(SET_TA_FN, 'JESTEŚ UUUUUU!');
    await sleep(600);
    const single = await page.evaluate(MEASURE_FN);
    console.log('--- (2) SINGLE LINE ---');
    console.log(JSON.stringify(single));
    await page.evaluate(SET_TA_FN, 'Linia pierwsza testowa\nDruga linia tekstu\nTrzecia linia i jeszcze troche tekstu');
    await sleep(600);
    const multi = await page.evaluate(MEASURE_FN);
    console.log('--- (3) MULTILINE ---');
    console.log(JSON.stringify(multi));
    console.log('=== COMPARISON ===');
    const rows = [['empty', empty], ['single', single], ['multi', multi]];
    for (const pair of rows) {
      const label = pair[0]; const s = pair[1];
      if (!s.found) { console.log(label + ': NOT FOUND'); continue; }
      console.log(label + ': rectH=' + s.rect.height
        + ' padT=' + (s.computed && s.computed.paddingTop)
        + ' padB=' + (s.computed && s.computed.paddingBottom)
        + ' padL=' + (s.computed && s.computed.paddingLeft)
        + ' padR=' + (s.computed && s.computed.paddingRight)
        + ' lh=' + (s.computed && s.computed.lineHeight)
        + ' firstCharOff=' + s.firstCharOffsetFromTextareaTop
        + ' caretOff=' + s.caretOffsetFromTextareaTop
        + ' parentAlign=' + (s.parent && s.parent.alignItems));
    }
    fs.mkdirSync(OUT_DIR, { recursive: true });
    const outPath = path.join(OUT_DIR, 'composer-geo-' + Date.now() + '.json');
    fs.writeFileSync(outPath, JSON.stringify({ base: BASE, url, empty, single, multi }, null, 1));
    console.log('Report: ' + outPath);
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error('[AI-GEO] FATAL', e); process.exit(1); });

