/** P0 diagnostic â€” duplicate section renders / font source of h1. Env: BASE */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const BASE = process.env.BASE || 'https://www.solospot.pl';
const STORE_ID = 's-demo';
const FIXTURE = {
  id: 's-demo',
  metadata: { storeName: 'P0 Diag', storeSlug: 's-demo', locale: 'pl', currency: 'PLN' },
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
const CHROME = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'].find((p) => p && fs.existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', userDataDir: path.join(__dirname, '..', 'scratch', 'chrome-latency-profile'), args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`${BASE}/studio`, { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(2500);
  await page.evaluate((sid, fx) => localStorage.setItem(`solospot_store_${sid}`, JSON.stringify(fx)), STORE_ID, FIXTURE);
  await page.goto(`${BASE}/studio`, { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(3500);
  // reproduce: apply non-Inter font via DS, NO reload
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find((x) => (x.getAttribute('title') || '').startsWith('Styl'));
    if (b) b.click();
  });
  await sleep(1500);
  await page.click('[data-testid="ds-cat-fonts"]');
  await sleep(900);
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('[data-testid="ds-catalog-list"] [data-testid="ds-catalog-item"]'));
    for (const it of items) {
      const t = (it.innerText || '').trim();
      if (t && !/^Inter\b/i.test(t)) {
        const btn = it.querySelector('[data-testid="ds-btn-apply"]') || (it.parentElement && it.parentElement.querySelector('[data-testid="ds-btn-apply"]'));
        if (btn) { btn.click(); return; }
      }
    }
  });
  await sleep(3500);
  const applied = await page.evaluate(() => ({
    sectionFonts: Array.from(document.querySelectorAll('[data-section-id="sec-hero-init"]')).map((w) => {
      const s = w.matches('section') ? w : w.querySelector('section');
      return s ? getComputedStyle(s).fontFamily : null;
    }),
  }));
  console.log('APPLIED', JSON.stringify(applied));
  const diag = await page.evaluate(() => {
    const bareH = document.querySelector('h1,h2,h3');
    const scoped = document.querySelector('[data-section-id="sec-hero-init"] h1,h2,h3');
    console.logBare = null;
    const bad = {
      bareTag: bareH && bareH.tagName, bareText: bareH && (bareH.innerText||'').slice(0,30),
      bareFont: bareH && getComputedStyle(bareH).fontFamily,
      scopedIsSame: bareH === scoped,
      bodyFont: getComputedStyle(document.body).fontFamily,
      htmlFont: getComputedStyle(document.documentElement).fontFamily,
      scopedFont: scoped && getComputedStyle(scoped).fontFamily,
    };
    window.__BAD = bad;
    const wrappers = Array.from(document.querySelectorAll('[data-section-id="sec-hero-init"]'));
    const dump = wrappers.map((w, i) => {
      const sec = w.matches('section') ? w : w.querySelector('section');
      const h = w.querySelector('h1,h2,h3');
      const r = w.getBoundingClientRect();
      return {
        i, tag: w.tagName, visible: r.width > 0 && r.height > 0,
        rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width) },
        ancestorModal: !!w.closest('[role="dialog"], .modal, [class*="modal" i]'),
        sectionFont: sec ? getComputedStyle(sec).fontFamily : null,
        h1Font: h ? getComputedStyle(h).fontFamily : null,
        h1FontInline: h ? (h.getAttribute('style') || '').slice(0, 120) : null,
        h1Class: h ? (h.className || '').slice(0, 120) : null,
        h1InsideSameSection: h && sec ? sec.contains(h) : null,
      };
    });
    const cssRules = [];
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        for (const rule of Array.from(sheet.cssRules || [])) {
          if (rule.selectorText && /h1|font-family/i.test(rule.selectorText + (rule.style?.fontFamily || '')) && /h1/.test(rule.selectorText)) {
            cssRules.push(`${rule.selectorText} { font-family: ${rule.style.fontFamily} }`);
          }
        }
      } catch {}
    }
    return { bad, wrapperCount: wrappers.length, dump, cssRules: cssRules.slice(0, 10) };
  });
  console.log(JSON.stringify({bad: diag.bad }, null, 1)); console.log(JSON.stringify({wrapperCount: diag.wrapperCount, dump: diag.dump}, null, 1));
  await browser.close();
})().catch((e) => { console.error('DIAG FAILED:', e.stack || e.message); process.exit(1); });



