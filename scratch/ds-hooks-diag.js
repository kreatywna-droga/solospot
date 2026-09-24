/**
 * DS REACT HOOK DUMP — read DesignSystemCatalog hook state (category, query, items)
 */
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.BASE_URL || 'https://www.solospot.pl';
const CHROME_PATH =
  process.env.CHROME_PATH ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT_DIR = path.join(__dirname, 'ds-hooks-diag');
const waitMs = (ms) => new Promise((r) => setTimeout(r, ms));

function dumpHooks(label) {
  // find fiber of DesignSystemCatalog by walking from container element
  const root = document.querySelector('[data-testid="ds-catalog-root"]');
  if (!root) return { label, error: 'no root' };
  const fk = Object.keys(root).find((k) => k.startsWith('__reactFiber$'));
  let fiber = root ? root[fk] : null;
  let comp = null;
  let f = fiber;
  while (f) {
    const n = f.type && f.type.name;
    if (n === 'DesignSystemCatalog') { comp = f; break; }
    f = f.return;
  }
  if (!comp) return { label, error: 'DesignSystemCatalog fiber not found' };
  const hooks = [];
  let h = comp.memoizedState;
  let i = 0;
  while (h && i < 30) {
    const memo = h.memoizedState;
    let summary;
    if (Array.isArray(memo)) {
      summary = {
        kind: 'array',
        length: memo.length,
        firstIds: memo.slice(0, 6).map((x) => (x && (x.id || x.family || x.name)) || String(x)),
        lastIds: memo.slice(-3).map((x) => (x && (x.id || x.family || x.name)) || String(x)),
      };
    } else if (memo && typeof memo === 'object') {
      summary = { kind: 'object', keys: Object.keys(memo).slice(0, 8), value: memo };
    } else {
      summary = { kind: typeof memo, value: memo };
    }
    hooks.push({ i, summary });
    h = h.next;
    i++;
  }
  const domItems = Array.from(document.querySelectorAll('[data-testid="ds-catalog-item"]')).map((el) => el.getAttribute('data-item-id'));
  return { label, hooks, domCount: domItems.length, domFirst: domItems.slice(0, 6), domLast: domItems.slice(-4) };
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1600, height: 1000 },
  });
  const page = await browser.newPage();
  page.on('console', (m) => console.log('[page]', m.type(), m.text()));
  await page.goto(`${BASE_URL}/studio/test-store`, { waitUntil: 'networkidle2', timeout: 90000 });
  await waitMs(3000);
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find(
      (x) => (x.getAttribute('title') || '').includes('Ctrl+5') || (x.innerText || '').trim() === 'Styl'
    );
    if (b) b.click();
  });
  await waitMs(1500);

  const steps = [
    ['style-packs', '01-initial-sp'],
    ['fonts', '02-fonts'],
    ['colors', '03-colors'],
    ['industry-presets', '04-industry'],
  ];
  const out = {};
  for (const [cat, label] of steps) {
    await page.click(`[data-testid="ds-cat-${cat}"]`);
    await waitMs(800);
    const d = await page.evaluate(dumpHooks, label);
    out[label] = d;
    console.log('\n=====', label, '=====');
    console.log(JSON.stringify(d, null, 2));
  }
  fs.writeFileSync(path.join(OUT_DIR, 'hooks.json'), JSON.stringify(out, null, 2));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
