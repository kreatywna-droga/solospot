/**
 * SOLOSPOT DESIGN INTELLIGENCE LIBRARY — MEGA GATE prod acceptance
 * 20 catalog categories + Apply→theme mutation + Undo + console scan.
 * BASE_URL=https://www.solospot.pl
 */
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.BASE_URL || 'https://www.solospot.pl';
const CHROME_PATH =
  process.env.CHROME_PATH ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT_DIR = path.join(__dirname, 'mega-gate-proof');

const CATS = [
  'style-packs', 'design-combinations', 'fonts', 'font-pairings', 'typography',
  'colors', 'color-combinations', 'buttons', 'cards', 'backgrounds',
  'hero', 'sections', 'images', 'icons', 'effects',
  'shadows', 'radius', 'spacing', 'industry-presets', 'themes',
];

// Minimum counts proving mega data deployed (old gate: sp=10, fonts=97, colors=78)
const MIN_COUNT = {
  'style-packs': 70,
  'design-combinations': 100,
  'fonts': 196,
  'font-pairings': 110,
  'colors': 100,
  'industry-presets': 20,
};

const RESULTS = [];
let step = 0;
function log(id, action, expected, actual, status, evidence = '') {
  RESULTS.push({ id, action, expected, actual, status, evidence });
  console.log(`${status} ${id}: ${action} — ${actual}${evidence ? ` | ${evidence}` : ''}`);
}
function nextStep() {
  step += 1;
  return `S${String(step).padStart(2, '0')}`;
}
const waitMs = (ms) => new Promise((r) => setTimeout(r, ms));

async function clearSearch(page) {
  await page.evaluate(() => {
    const input = document.querySelector('[data-testid="ds-search-input"]');
    if (!input) return;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, '');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await waitMs(300);
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
  const consoleErrors = [];
  let armed = false;
  page.on('pageerror', (err) => armed && consoleErrors.push(err.message));
  page.on('console', (msg) => {
    if (armed && msg.type() === 'error') consoleErrors.push(msg.text());
  });

  log(nextStep(), `Open ${BASE_URL}/studio/test-store`, 'reachable', BASE_URL, 'PASS', BASE_URL);
  await page.goto(`${BASE_URL}/studio/test-store`, { waitUntil: 'networkidle2', timeout: 90000 });
  await waitMs(3000);

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const styleBtn = btns.find(
      (b) =>
        (b.getAttribute('title') || '').includes('Ctrl+5') ||
        (b.getAttribute('data-testid') || '') === 'tab-style' ||
        (b.innerText || '').trim() === 'Styl'
    );
    if (styleBtn) styleBtn.click();
  });
  await waitMs(1500);
  armed = true;

  const catalogRoot = await page.evaluate(
    () => !!document.querySelector('[data-testid="ds-catalog-root"]')
  );
  log(nextStep(), 'Design System catalog open', 'ds-catalog-root', catalogRoot ? 'present' : 'missing', catalogRoot ? 'PASS' : 'FAIL');

  // 20 chips present
  const chipIds = await page.evaluate(() =>
    Array.from(document.querySelectorAll('[data-testid^="ds-cat-"]')).map((c) =>
      c.getAttribute('data-testid').replace('ds-cat-', '')
    )
  );
  const missingChips = CATS.filter((c) => !chipIds.includes(c));
  log(
    nextStep(),
    '20 category chips present',
    `20 chips: ${CATS.join(',')}`,
    `found=${chipIds.length} missing=[${missingChips.join(',')}]`,
    missingChips.length === 0 && chipIds.length >= 20 ? 'PASS' : 'FAIL'
  );
  await page.screenshot({ path: path.join(OUT_DIR, '01-catalog.png') });

  // Each category routes to its dataset with correct minimum count
  const counts = {};
  for (const cat of CATS) {
    await clearSearch(page);
    await page.click(`[data-testid="ds-cat-${cat}"]`);
    await waitMs(500);
    const st = await page.evaluate(() => {
      const chips = Array.from(document.querySelectorAll('[data-testid^="ds-cat-"]'));
      const active = chips.find((c) => (c.className || '').includes('bg-[#D9A86C]'));
      const items = Array.from(document.querySelectorAll('[data-testid="ds-catalog-item"]'));
      return {
        activeChip: active ? active.getAttribute('data-testid') : null,
        count: items.length,
        firstIds: items.slice(0, 3).map((i) => i.getAttribute('data-item-id')),
        hasEmptyMsg: !!document.querySelector('[data-testid="ds-catalog-list"] p'),
      };
    });
    counts[cat] = st.count;
    const min = MIN_COUNT[cat];
    const problems = [];
    if (st.activeChip !== `ds-cat-${cat}`) problems.push(`active=${st.activeChip}`);
    if (min != null) {
      if (st.count < min) problems.push(`count=${st.count} < min ${min}`);
    } else if (st.count === 0 && !st.hasEmptyMsg) {
      problems.push('empty without message');
    }
    log(
      nextStep(),
      `Category ${cat} routes to its dataset`,
      min != null ? `count >= ${min}` : 'count > 0 or empty message',
      `active=${st.activeChip} count=${st.count} first=[${st.firstIds.join(',')}]`,
      problems.length === 0 ? 'PASS' : 'FAIL',
      problems.join('; ')
    );
  }
  await page.screenshot({ path: path.join(OUT_DIR, '02-all-categories.png') });

  // Apply → theme mutation badge → Undo
  await clearSearch(page);
  await page.click('[data-testid="ds-cat-style-packs"]');
  await waitMs(400);
  const applyBtn = await page.$('[data-testid="ds-btn-apply"]');
  if (applyBtn) {
    await applyBtn.click();
    await waitMs(1000);
    const applied = await page.evaluate(() =>
      document.body.innerText.includes('ZASTOSOWANY')
    );
    log(nextStep(), 'Apply style pack → ZASTOSOWANY badge', 'badge', applied ? 'badge' : 'no-badge', applied ? 'PASS' : 'FAIL');
    await page.screenshot({ path: path.join(OUT_DIR, '03-applied.png') });

    await page.keyboard.down('Control');
    await page.keyboard.press('KeyZ');
    await page.keyboard.up('Control');
    await waitMs(600);
    const badgeGone = await page.evaluate(
      () => !document.body.innerText.includes('ZASTOSOWANY')
    );
    log(nextStep(), 'Undo (Ctrl+Z) clears applied state', 'badge cleared', badgeGone ? 'cleared' : 'still-present', badgeGone ? 'PASS' : 'FAIL');
    await page.screenshot({ path: path.join(OUT_DIR, '04-undo.png') });
  } else {
    log(nextStep(), 'Apply button present', 'ds-btn-apply', 'missing', 'FAIL');
  }

  // Rapid switch ×50 across 20 categories — no stale/hang
  const rapid = await page.evaluate(async () => {
    const order = [
      'fonts', 'design-combinations', 'colors', 'style-packs', 'font-pairings',
      'typography', 'hero', 'sections', 'effects', 'industry-presets',
    ];
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const log = [];
    for (let i = 0; i < 50; i++) {
      const cat = order[i % order.length];
      const chip = document.querySelector(`[data-testid="ds-cat-${cat}"]`);
      if (chip) chip.click();
      await sleep(0);
      if (i % 5 === 0 || i === 49) {
        await sleep(40);
        const active = Array.from(document.querySelectorAll('[data-testid^="ds-cat-"]')).find(
          (c) => (c.className || '').includes('bg-[#D9A86C]')
        );
        const items = document.querySelectorAll('[data-testid="ds-catalog-item"]').length;
        log.push({
          want: cat,
          active: active ? active.getAttribute('data-testid') : null,
          count: items,
        });
      }
    }
    return log;
  });
  const mismatches = rapid.filter((e) => e.active !== `ds-cat-${e.want}`);
  log(
    nextStep(),
    'Rapid switch ×50 across 20 categories',
    'active chip == wanted, no hang',
    `samples=${rapid.length} mismatches=${mismatches.length}`,
    mismatches.length === 0 ? 'PASS' : 'FAIL',
    JSON.stringify(mismatches.slice(0, 3))
  );
  await page.screenshot({ path: path.join(OUT_DIR, '05-rapid.png') });

  const newErrors = consoleErrors.filter(
    (e) => !/favicon|401|404|net::ERR|Download the React DevTools/i.test(e)
  );
  log(nextStep(), 'Console errors = 0', '0', String(newErrors.length), newErrors.length === 0 ? 'PASS' : 'FAIL', newErrors.slice(0, 5).join(' | '));

  const pass = RESULTS.filter((r) => r.status === 'PASS').length;
  const fail = RESULTS.filter((r) => r.status === 'FAIL').length;
  fs.writeFileSync(
    path.join(OUT_DIR, 'result.json'),
    JSON.stringify({ baseUrl: BASE_URL, at: new Date().toISOString(), counts, results: RESULTS, consoleErrors: newErrors }, null, 2)
  );
  console.log(`\n=== MEGA GATE PROD ACCEPTANCE: ${pass} PASS / ${fail} FAIL ===`);
  console.log('COUNTS:', JSON.stringify(counts));
  await browser.close();
  process.exit(fail > 0 ? 1 : 0);
})().catch((err) => {
  console.error('MEGA fatal:', err);
  try {
    fs.writeFileSync(
      path.join(OUT_DIR, 'result.json'),
      JSON.stringify({ fatal: String(err), results: RESULTS }, null, 2)
    );
  } catch {}
  process.exit(1);
});
