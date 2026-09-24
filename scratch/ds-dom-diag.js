/**
 * DS DOM STRUCTURE DIAGNOSTIC — how many catalog containers exist, where items live
 */
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.BASE_URL || 'https://www.solospot.pl';
const CHROME_PATH =
  process.env.CHROME_PATH ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT_DIR = path.join(__dirname, 'ds-dom-diag');
const waitMs = (ms) => new Promise((r) => setTimeout(r, ms));

async function dump(page, label) {
  const data = await page.evaluate(() => {
    const roots = Array.from(document.querySelectorAll('[data-testid="ds-catalog-root"]'));
    const lists = Array.from(document.querySelectorAll('[data-testid="ds-catalog-list"]'));
    const allItems = Array.from(document.querySelectorAll('[data-testid="ds-catalog-item"]'));
    const active = Array.from(document.querySelectorAll('[data-testid^="ds-cat-"]')).find((c) =>
      (c.className || '').includes('bg-[#D9A86C]')
    );
    const chain = (el) => {
      const out = [];
      let n = el;
      while (n && n !== document.body && out.length < 14) {
        out.push(
          `${n.tagName.toLowerCase()}${n.getAttribute && n.getAttribute('data-testid') ? `[${n.getAttribute('data-testid')}]` : ''}${
            n.id ? `#${n.id}` : ''
          }${n.className && typeof n.className === 'string' ? '.' + n.className.split(' ').slice(0, 3).join('.') : ''}`
        );
        n = n.parentElement;
      }
      return out;
    };
    return {
      activeChip: active ? active.getAttribute('data-testid') : null,
      rootCount: roots.length,
      listCount: lists.length,
      totalItems: allItems.length,
      perRoot: roots.map((r, i) => ({ i, items: r.querySelectorAll('[data-testid="ds-catalog-item"]').length })),
      perList: lists.map((l, i) => ({
        i,
        items: l.querySelectorAll('[data-testid="ds-catalog-item"]').length,
        visible: !!(l.offsetWidth || l.offsetHeight || l.getClientRects().length),
        firstIds: Array.from(l.querySelectorAll('[data-testid="ds-catalog-item"]'))
          .slice(0, 4)
          .map((x) => x.getAttribute('data-item-id')),
      })),
      firstItemChain: allItems[0] ? chain(allItems[0]) : [],
      stylePanelCount: Array.from(document.querySelectorAll('h2')).filter((h) =>
        (h.textContent || '').includes('Design System')
      ).length,
      // React fiber key info for first item
      firstItemReactKeys: allItems[0]
        ? Object.keys(allItems[0]).filter((k) => k.startsWith('__react'))
        : [],
    };
  });
  console.log(`\n===== ${label} =====`);
  console.log(JSON.stringify(data, null, 2));
  return data;
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1000'],
    defaultViewport: { width: 1600, height: 1000 },
  });
  const page = await browser.newPage();
  await page.goto(`${BASE_URL}/studio/test-store`, { waitUntil: 'networkidle2', timeout: 90000 });
  await waitMs(3000);
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const styleBtn = btns.find(
      (b) =>
        (b.getAttribute('title') || '').includes('Ctrl+5') ||
        (b.innerText || '').trim() === 'Styl'
    );
    if (styleBtn) styleBtn.click();
  });
  await waitMs(1500);

  const steps = [
    ['style-packs', 'initial style-packs'],
    ['fonts', 'after click FONTY'],
    ['colors', 'after click PALETY (stale?)'],
    ['typography', 'after click TYPOGRAFIA'],
    ['industry-presets', 'after click BRANŻE'],
  ];
  const out = {};
  for (const [cat, label] of steps) {
    await page.click(`[data-testid="ds-cat-${cat}"]`);
    await waitMs(700);
    out[label] = await dump(page, `${label} [want ${cat}]`);
    await page.screenshot({ path: path.join(OUT_DIR, `${cat}.png`) });
  }

  // Rapid 10 clicks then dump
  for (let i = 0; i < 10; i++) {
    const cat = ['fonts', 'colors', 'industry-presets', 'style-packs'][i % 4];
    await page.click(`[data-testid="ds-cat-${cat}"]`);
    await waitMs(80);
  }
  await waitMs(600);
  out['after rapid 10'] = await dump(page, 'after rapid 10');

  fs.writeFileSync(path.join(OUT_DIR, 'diag.json'), JSON.stringify(out, null, 2));
  await browser.close();
  console.log('\nwritten', path.join(OUT_DIR, 'diag.json'));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
