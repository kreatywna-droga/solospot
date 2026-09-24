/**
 * DS DEEP ITEM COMPOSITION — all ids + react fiber keys for the stale list
 */
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.BASE_URL || 'https://www.solospot.pl';
const CHROME_PATH =
  process.env.CHROME_PATH ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT_DIR = path.join(__dirname, 'ds-deep-diag');
const waitMs = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1600, height: 1000 },
  });
  const page = await browser.newPage();
  await page.goto(`${BASE_URL}/studio/test-store`, { waitUntil: 'networkidle2', timeout: 90000 });
  await waitMs(3000);
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find(
      (x) => (x.getAttribute('title') || '').includes('Ctrl+5') || (x.innerText || '').trim() === 'Styl'
    );
    if (b) b.click();
  });
  await waitMs(1500);

  const grab = async (label) => {
    const d = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('[data-testid="ds-catalog-item"]'));
      const ids = items.map((i) => i.getAttribute('data-item-id'));
      const meta = items.slice(0, 8).map((el) => {
        const fk = Object.keys(el).find((k) => k.startsWith('__reactFiber$'));
        const fiber = fk ? el[fk] : null;
        return {
          id: el.getAttribute('data-item-id'),
          firstLine: ((el.innerText || '').split('\n')[0] || '').trim(),
          fiberKey: fiber ? fiber.key : null,
          fiberType: fiber && fiber.type ? String(typeof fiber.type === 'function' ? fiber.type.name || 'fn' : fiber.type) : null,
          pendingPropsId: fiber && fiber.pendingProps ? fiber.pendingProps['data-item-id'] : fiber && fiber.memoizedProps ? fiber.memoizedProps['data-item-id'] : null,
        };
      });
      const active = Array.from(document.querySelectorAll('[data-testid^="ds-cat-"]')).find((c) =>
        (c.className || '').includes('bg-[#D9A86C]')
      );
      const input = document.querySelector('[data-testid="ds-search-input"]');
      const indSel = document.querySelector('[data-testid="ds-filter-industry"]');
      const moodSel = document.querySelector('[data-testid="ds-filter-mood"]');
      return {
        activeChip: active ? active.getAttribute('data-testid') : null,
        total: ids.length,
        ids,
        meta,
        search: input ? input.value : null,
        industryFilter: indSel ? indSel.value : null,
        moodFilter: moodSel ? moodSel.value : null,
        emptyMsg: (document.querySelector('[data-testid="ds-catalog-list"] p') || {}).textContent || null,
      };
    });
    console.log(`\n===== ${label} =====`);
    console.log(
      JSON.stringify(
        { ...d, ids: d.ids.length <= 80 ? d.ids : d.ids.slice(0, 40).concat(['...'], d.ids.slice(-5)) },
        null,
        2
      )
    );
    fs.writeFileSync(path.join(OUT_DIR, `${label.replace(/\W+/g, '_')}.json`), JSON.stringify(d, null, 2));
    return d;
  };

  await grab('01-initial-style-packs');
  await page.click('[data-testid="ds-cat-fonts"]');
  await waitMs(700);
  await grab('02-fonts');
  await page.click('[data-testid="ds-cat-colors"]');
  await waitMs(700);
  const colors = await grab('03-colors-after-fonts');
  // composition analysis
  const colorLike = colors.ids.filter((id) => !['inter','space-grotesk','outfit','figtree','hanken-grotesk','geist','onest','sora','epilogue','archivo'].includes(id));
  console.log(`\ncomposition: total=${colors.ids.length} fontLike=${colors.ids.length - colorLike.length} other=${colorLike.length}`);
  console.log('first fontLike indexes:', colors.ids.map((id, i) => (['inter','space-grotesk','outfit','figtree','hanken-grotesk','geist','onest'].includes(id) ? i : -1)).filter((i) => i >= 0));

  await page.click('[data-testid="ds-cat-industry-presets"]');
  await waitMs(700);
  await grab('04-industry-after-colors');

  await page.click('[data-testid="ds-cat-style-packs"]');
  await waitMs(700);
  await grab('05-style-packs-again');

  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
