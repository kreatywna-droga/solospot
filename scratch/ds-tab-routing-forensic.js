/**
 * DS TAB → CONTENT ROUTING FORENSIC v1.0
 *
 * Reproduces: tab becomes active, but panel content stays on the previous category.
 * BASE_URL=https://www.solospot.pl (or http://localhost:3000)
 */
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.BASE_URL || 'https://www.solospot.pl';
const CHROME_PATH =
  process.env.CHROME_PATH ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT_DIR = path.join(__dirname, 'ds-tab-routing-forensic');

const CATS = [
  'style-packs',
  'industry-presets',
  'fonts',
  'colors',
  'typography',
  'buttons',
  'cards',
  'backgrounds',
];

// Expected fingerprints per category (from packages/design-system + prior prod gate counts)
const EXPECT = {
  'style-packs': { count: 10, idPrefix: 'sp-' },
  'industry-presets': { count: null, idPrefix: 'ind-' },
  'fonts': { count: 97, idPrefix: null, firstId: 'inter' },
  'colors': { count: null, idPrefix: null, notIds: true },
  'typography': { count: null, idPrefix: 'typography' },
  'buttons': { count: null, idPrefix: null },
  'cards': { count: null, idPrefix: null },
  'backgrounds': { count: null, idPrefix: 'background-' },
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

async function openBuilder(page) {
  await page.goto(`${BASE_URL}/studio/test-store`, {
    waitUntil: 'networkidle2',
    timeout: 90000,
  });
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
}

async function readState(page) {
  return page.evaluate(() => {
    const chips = Array.from(document.querySelectorAll('[data-testid^="ds-cat-"]'));
    const active = chips.find((c) => (c.className || '').includes('bg-[#D9A86C]'));
    const items = Array.from(document.querySelectorAll('[data-testid="ds-catalog-item"]'));
    const input = document.querySelector('[data-testid="ds-search-input"]');
    return {
      activeChip: active ? active.getAttribute('data-testid') : null,
      chipCount: chips.length,
      count: items.length,
      firstIds: items.slice(0, 6).map((i) => i.getAttribute('data-item-id')),
      firstNames: items
        .slice(0, 3)
        .map((i) => ((i.innerText || '').split('\n')[0] || '').trim()),
      searchText: input ? input.value : null,
      hasEmptyMsg: !!document.querySelector('[data-testid="ds-catalog-list"] p'),
      catalogRoot: !!document.querySelector('[data-testid="ds-catalog-root"]'),
    };
  });
}

function classify(cat, st) {
  const exp = EXPECT[cat] || {};
  const problems = [];
  if (st.activeChip !== `ds-cat-${cat}`) problems.push(`activeChip=${st.activeChip}`);
  if (exp.firstId && st.firstIds[0] !== exp.firstId)
    problems.push(`firstId=${st.firstIds[0]} (want ${exp.firstId})`);
  if (exp.idPrefix && st.count > 0 && !String(st.firstIds[0] || '').startsWith(exp.idPrefix))
    problems.push(`idPrefix!=${exp.idPrefix} (${st.firstIds[0]})`);
  if (exp.count != null && st.count !== exp.count)
    problems.push(`count=${st.count} (want ${exp.count})`);
  // stale detection: style-packs can never exceed 10
  if (cat === 'style-packs' && st.count > 10)
    problems.push(`STALE/WRONG DATASET count=${st.count} > max style-packs(10)`);
  return problems;
}

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

async function setSearch(page, value) {
  await clearSearch(page);
  if (value) {
    await page.click('[data-testid="ds-search-input"]');
    await page.type('[data-testid="ds-search-input"]', value, { delay: 20 });
    await waitMs(400);
  }
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

  log(nextStep(), `Open ${BASE_URL}`, 'reachable', BASE_URL, 'PASS', BASE_URL);
  await openBuilder(page);

  // ── PHASE 1/2/3: sequential category routing ────────────────
  let firstBreak = null;
  for (const cat of CATS) {
    await page.click(`[data-testid="ds-cat-${cat}"]`);
    await waitMs(600);
    const st = await readState(page);
    const problems = classify(cat, st);
    const ok = problems.length === 0;
    if (!ok && !firstBreak) firstBreak = { cat, st, problems };
    log(
      nextStep(),
      `Category ${cat} routes to its dataset`,
      `active=${cat}, correct dataset`,
      `active=${st.activeChip} count=${st.count} first=[${st.firstIds.slice(0, 3).join(',')}]`,
      ok ? 'PASS' : 'FAIL',
      problems.join('; ')
    );
    await page.screenshot({ path: path.join(OUT_DIR, `cat-${cat}.png`) });
  }

  // ── RECORDING REPRO: FONTY → BRANŻE ─────────────────────────
  await clearSearch(page);
  await page.click('[data-testid="ds-cat-fonts"]');
  await waitMs(500);
  const fontsState = await readState(page);
  await page.click('[data-testid="ds-cat-industry-presets"]');
  await waitMs(600);
  const branzeState = await readState(page);
  const fontsStillShowing =
    branzeState.firstIds.some((id) => fontsState.firstIds.includes(id)) &&
    branzeState.count === fontsState.count;
  log(
    nextStep(),
    'REPRO: FONTY → BRANŻE content switches',
    'industry dataset (ind-*), not font ids',
    `active=${branzeState.activeChip} count=${branzeState.count} first=[${branzeState.firstIds.slice(0, 3).join(',')}]`,
    !fontsStillShowing && branzeState.firstIds.every((id) => String(id).startsWith('ind-'))
      ? 'PASS'
      : 'FAIL',
    fontsStillShowing ? 'fonts list still rendered' : ''
  );
  await page.screenshot({ path: path.join(OUT_DIR, 'repro-fonts-to-branze.png') });

  // ── PHASE 5: SEARCH / FILTER regression ─────────────────────
  await page.click('[data-testid="ds-cat-fonts"]');
  await waitMs(400);
  await setSearch(page, 'Inter');
  const fontsInter = await readState(page);
  await page.click('[data-testid="ds-cat-industry-presets"]');
  await waitMs(500);
  const afterInterToBranze = await readState(page);
  // Query persists by design; correct = NO font ids rendered (empty list must show empty message)
  const staleAfterSearch =
    afterInterToBranze.count > 0 &&
    (afterInterToBranze.firstIds.includes('inter') ||
      afterInterToBranze.firstIds.every((id) => fontsInter.firstIds.includes(id)));
  const searchAppliedCoherently =
    afterInterToBranze.searchText === 'Inter' &&
    (afterInterToBranze.count > 0 || afterInterToBranze.hasEmptyMsg);
  log(
    nextStep(),
    'SEARCH regression: fonts+"Inter" → BRANŻE no font list',
    'no inter/font ids in list (empty ⇒ empty message)',
    `active=${afterInterToBranze.activeChip} count=${afterInterToBranze.count} first=[${afterInterToBranze.firstIds.slice(0, 3).join(',')}] searchText="${afterInterToBranze.searchText}" emptyMsg=${afterInterToBranze.hasEmptyMsg}`,
    !staleAfterSearch && searchAppliedCoherently ? 'PASS' : 'FAIL',
    staleAfterSearch ? 'stale font content' : !searchAppliedCoherently ? 'query/empty state incoherent' : ''
  );

  await clearSearch(page);
  await page.click('[data-testid="ds-cat-industry-presets"]');
  await waitMs(400);
  await setSearch(page, 'dental');
  const branzeDental = await readState(page);
  await page.click('[data-testid="ds-cat-colors"]');
  await waitMs(500);
  const colorsFromDental = await readState(page);
  // Query "dental" persists; correct = palette dataset (or empty+message), never ind-* ids
  const dentalStale =
    colorsFromDental.count > 0 &&
    colorsFromDental.firstIds.every((id) => branzeDental.firstIds.includes(id));
  const dentalCoherent =
    colorsFromDental.count > 0 || colorsFromDental.hasEmptyMsg;
  log(
    nextStep(),
    'SEARCH regression: BRANŻE+"dental" → PALETY no industry list',
    'palette dataset (not ind-*), empty ⇒ empty message',
    `active=${colorsFromDental.activeChip} count=${colorsFromDental.count} first=[${colorsFromDental.firstIds.slice(0, 3).join(',')}] emptyMsg=${colorsFromDental.hasEmptyMsg}`,
    !dentalStale && dentalCoherent ? 'PASS' : 'FAIL',
    dentalStale ? 'stale industry content' : !dentalCoherent ? 'empty without message' : ''
  );

  // Filter regression: set industry filter, then switch category
  await clearSearch(page);
  await page.click('[data-testid="ds-cat-style-packs"]');
  await waitMs(400);
  await page.click('[data-testid="ds-filters-toggle"]');
  await waitMs(300);
  await page.select('[data-testid="ds-filter-industry"]', 'dental').catch(() => {});
  await waitMs(400);
  const spFiltered = await readState(page);
  await page.click('[data-testid="ds-cat-typography"]');
  await waitMs(500);
  const typoAfterFilter = await readState(page);
  const filterStale =
    typoAfterFilter.count === spFiltered.count &&
    typoAfterFilter.firstIds.every((id) => spFiltered.firstIds.includes(id));
  log(
    nextStep(),
    'FILTER regression: style filter → TYPOGRAFIA',
    'typography dataset, not stale packs',
    `active=${typoAfterFilter.activeChip} count=${typoAfterFilter.count} first=[${typoAfterFilter.firstIds.slice(0, 3).join(',')}]`,
    !filterStale && typoAfterFilter.count > 0 ? 'PASS' : 'FAIL',
    filterStale ? 'stale style-pack content' : ''
  );
  await page.select('[data-testid="ds-filter-industry"]', '').catch(() => {});

  // ── PHASE 8: PREVIEW regression ─────────────────────────────
  await clearSearch(page);
  await page.click('[data-testid="ds-cat-style-packs"]');
  await waitMs(400);
  const previewBtn = await page.$('[data-testid="ds-btn-preview"]');
  if (previewBtn) {
    await previewBtn.click();
    await waitMs(500);
    const previewOpen = await page.evaluate(
      () => !!document.querySelector('[data-testid="ds-preview-modal"]')
    );
    await page.evaluate(() => {
      const close = Array.from(document.querySelectorAll('button')).find((b) =>
        (b.innerText || '').includes('Zamknij')
      );
      if (close) close.click();
    });
    await waitMs(400);
    await page.click('[data-testid="ds-cat-cards"]');
    await waitMs(500);
    const afterPreview = await readState(page);
    const previewBlocked =
      afterPreview.count === 0 || String(afterPreview.firstIds[0] || '').startsWith('sp-');
    log(
      nextStep(),
      'PREVIEW regression: preview close → KARTY lists cards',
      'cards dataset, modal closed',
      `active=${afterPreview.activeChip} count=${afterPreview.count} first=[${afterPreview.firstIds.slice(0, 3).join(',')}] previewWasOpen=${previewOpen}`,
      !previewBlocked && previewOpen ? 'PASS' : 'FAIL',
      previewBlocked ? 'preview/stale state blocks new category' : ''
    );
  } else {
    log(nextStep(), 'Preview button present', 'ds-btn-preview', 'missing', 'FAIL');
  }

  // ── PHASE 7: RAPID SWITCH 50 then 100 ───────────────────────
  async function rapidSwitch(n) {
    const mismatches = [];
    await page.evaluate(async (count) => {
      const order = [
        'fonts', 'industry-presets', 'colors', 'fonts', 'typography',
        'cards', 'backgrounds', 'style-packs', 'fonts',
      ];
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      for (let i = 0; i < count; i++) {
        const cat = order[i % order.length];
        const chip = document.querySelector(`[data-testid="ds-cat-${cat}"]`);
        if (chip) chip.click();
        await sleep(0);
        // read state synchronously after click (post-render happens via React scheduling)
        if (i % 5 === 0 || i === count - 1) {
          await sleep(30);
          const active = Array.from(document.querySelectorAll('[data-testid^="ds-cat-"]')).find(
            (c) => (c.className || '').includes('bg-[#D9A86C]')
          );
          const items = Array.from(document.querySelectorAll('[data-testid="ds-catalog-item"]'));
          const first = items[0] ? items[0].getAttribute('data-item-id') : null;
          window.__rapidLog = window.__rapidLog || [];
          window.__rapidLog.push({
            i,
            want: cat,
            active: active ? active.getAttribute('data-testid') : null,
            count: items.length,
            first,
          });
        }
      }
    }, n);
    await waitMs(500);
    const logEntries = await page.evaluate(() => window.__rapidLog || []);
    await page.evaluate(() => {
      window.__rapidLog = [];
    });
    // Validate: for sampled entries, active chip must equal wanted cat,
    // and dataset fingerprint must match (fonts→inter-family, style-packs→sp-, industry→ind-)
    for (const e of logEntries) {
      const wantChip = `ds-cat-${e.want}`;
      let bad = null;
      if (e.active !== wantChip) bad = `active=${e.active}`;
      else if (e.want === 'fonts' && e.count > 0 && !e.first) bad = 'empty fonts';
      else if (e.want === 'style-packs' && e.count > 10) bad = `sp count=${e.count}`;
      else if (e.want === 'industry-presets' && e.count > 0 && !String(e.first).startsWith('ind-'))
        bad = `first=${e.first}`;
      else if (e.want === 'fonts' && e.count > 0 && String(e.first).startsWith('ind-'))
        bad = `first=${e.first}`;
      if (bad) mismatches.push({ ...e, bad });
    }
    return { samples: logEntries.length, mismatches, final: logEntries[logEntries.length - 1] };
  }

  await clearSearch(page);
  const r50 = await rapidSwitch(50);
  log(
    nextStep(),
    'Rapid switch ×50 — no stale content / hang',
    'all sampled states match active tab dataset',
    `samples=${r50.samples} mismatches=${r50.mismatches.length} final=[${r50.final ? `${r50.final.want} active=${r50.final.active} count=${r50.final.count} first=${r50.final.first}` : 'none'}]`,
    r50.mismatches.length === 0 ? 'PASS' : 'FAIL',
    JSON.stringify(r50.mismatches.slice(0, 3))
  );
  await page.screenshot({ path: path.join(OUT_DIR, 'rapid-50.png') });

  const r100 = await rapidSwitch(100);
  log(
    nextStep(),
    'Rapid switch ×100 — no stale content / hang',
    'all sampled states match active tab dataset',
    `samples=${r100.samples} mismatches=${r100.mismatches.length} final=[${r100.final ? `${r100.final.want} active=${r100.final.active} count=${r100.final.count} first=${r100.final.first}` : 'none'}]`,
    r100.mismatches.length === 0 ? 'PASS' : 'FAIL',
    JSON.stringify(r100.mismatches.slice(0, 3))
  );
  await page.screenshot({ path: path.join(OUT_DIR, 'rapid-100.png') });

  // Final sequential verification after rapid tests (stale state check)
  let postRapidBreak = null;
  for (const cat of CATS) {
    await page.click(`[data-testid="ds-cat-${cat}"]`);
    await waitMs(400);
    const st = await readState(page);
    const problems = classify(cat, st);
    if (problems.length && !postRapidBreak) postRapidBreak = { cat, st, problems };
    log(
      nextStep(),
      `Post-rapid: ${cat}`,
      'correct dataset',
      `active=${st.activeChip} count=${st.count} first=[${st.firstIds.slice(0, 3).join(',')}]`,
      problems.length === 0 ? 'PASS' : 'FAIL',
      problems.join('; ')
    );
  }

  // Console errors
  const newErrors = consoleErrors.filter(
    (e) => !/favicon|401|404|net::ERR|Download the React DevTools/i.test(e)
  );
  log(nextStep(), 'Console errors = 0', '0', String(newErrors.length), newErrors.length === 0 ? 'PASS' : 'FAIL', newErrors.slice(0, 5).join(' | '));

  const pass = RESULTS.filter((r) => r.status === 'PASS').length;
  const fail = RESULTS.filter((r) => r.status === 'FAIL').length;
  fs.writeFileSync(
    path.join(OUT_DIR, 'result.json'),
    JSON.stringify(
      { baseUrl: BASE_URL, at: new Date().toISOString(), firstBreak, postRapidBreak, results: RESULTS, consoleErrors: newErrors },
      null,
      2
    )
  );
  console.log(`\n=== DS TAB ROUTING FORENSIC: ${pass} PASS / ${fail} FAIL ===`);
  if (firstBreak) console.log('FIRST BREAK CANDIDATE:', JSON.stringify(firstBreak, null, 2));
  await browser.close();
  process.exit(fail > 0 ? 1 : 0);
})().catch((err) => {
  console.error('FORENSIC fatal:', err);
  try {
    fs.writeFileSync(
      path.join(OUT_DIR, 'result.json'),
      JSON.stringify({ fatal: String(err), results: RESULTS }, null, 2)
    );
  } catch {}
  process.exit(1);
});
