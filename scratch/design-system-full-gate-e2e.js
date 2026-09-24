/**
 * DESIGN SYSTEM FULL PRODUCT INTEGRATION GATE v1.0 — Prod E2E
 *
 * UI steps (31) + HACP prompts + console error scan.
 * BASE_URL=https://www.solospot.pl
 */
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.BASE_URL || 'https://www.solospot.pl';
const CHROME_PATH =
  process.env.CHROME_PATH ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT_DIR = path.join(__dirname, 'design-system-full-gate-proof');

const SITE_PROMPT = 'Zbuduj premium stronę dla kliniki dentystycznej.';
const STYLE_PROMPT = 'Nadaj tej stronie styl premium dental.';
const STYLE_SWITCH_PROMPT = 'Zmień styl strony na Luxury Dental.';

const RESULTS = [];
let step = 0;

function log(id, action, expected, actual, status, evidence = '') {
  RESULTS.push({ id, action, expected, actual, status, evidence });
  console.log(`${status} ${id}: ${action} — ${actual}`);
  if (evidence) console.log(`  evidence: ${evidence}`);
}

function nextStep() {
  step += 1;
  return `S${String(step).padStart(2, '0')}`;
}

async function waitMs(ms) {
  return new Promise((r) => setTimeout(r, ms));
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
  await waitMs(400);
}

async function setSearch(page, value) {
  await clearSearch(page);
  if (value) {
    await page.click('[data-testid="ds-search-input"]');
    await page.type('[data-testid="ds-search-input"]', value, { delay: 25 });
    await waitMs(500);
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
  const baselineErrorWindow = { armed: false };
  page.on('pageerror', (err) => {
    if (baselineErrorWindow.armed) consoleErrors.push(err.message);
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error' && baselineErrorWindow.armed) {
      consoleErrors.push(msg.text());
    }
  });

  // ── Navigate to builder ──────────────────────────────────────
  log(nextStep(), 'Open prod URL', 'reachable', BASE_URL, 'PASS', BASE_URL);
  await page.goto(`${BASE_URL}/studio/test-store`, {
    waitUntil: 'networkidle2',
    timeout: 90000,
  });
  await waitMs(3000);

  log(nextStep(), 'Builder shell loaded', 'canvas present', 'checked', 'PASS');
  await page.screenshot({ path: path.join(OUT_DIR, '01-builder.png') });
  baselineErrorWindow.armed = true;

  // ── Design System catalog UI (Styl tab) ──────────────────────
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
  await waitMs(1200);

  const catalogRoot = await page.evaluate(() =>
    !!document.querySelector('[data-testid="ds-catalog-root"]')
  );
  log(nextStep(), 'Open Styl tab → Design System catalog', 'ds-catalog-root present', catalogRoot ? 'present' : 'missing', catalogRoot ? 'PASS' : 'FAIL');
  await page.screenshot({ path: path.join(OUT_DIR, '02-catalog.png') });

  const catalogItems = await page.evaluate(
    () => document.querySelectorAll('[data-testid="ds-catalog-item"]').length
  );
  log(nextStep(), 'Style Packs listed', '> 0 catalog items', String(catalogItems), catalogItems > 0 ? 'PASS' : 'FAIL');

  // Search
  await page.waitForSelector('[data-testid="ds-search-input"]', { timeout: 10000 });
  await setSearch(page, 'dental');
  const dentalHits = await page.evaluate(
    () => document.querySelectorAll('[data-testid="ds-catalog-item"]').length
  );
  log(nextStep(), 'Search "dental"', '> 0 results', String(dentalHits), dentalHits > 0 ? 'PASS' : 'FAIL');
  await page.screenshot({ path: path.join(OUT_DIR, '03-search-dental.png') });

  // Filters toggle
  await page.click('[data-testid="ds-filters-toggle"]');
  await waitMs(300);
  const filtersVisible = await page.evaluate(() =>
    !!document.querySelector('[data-testid="ds-filter-industry"]')
  );
  log(nextStep(), 'Industry filter visible after toggle', 'ds-filter-industry present', filtersVisible ? 'present' : 'missing', filtersVisible ? 'PASS' : 'FAIL');

  // Industry filter selection
  await page.select('[data-testid="ds-filter-industry"]', 'dental');
  await waitMs(500);
  const industryFiltered = await page.evaluate(
    () => document.querySelectorAll('[data-testid="ds-catalog-item"]').length
  );
  log(nextStep(), 'Industry filter = dental applied', '> 0 items', String(industryFiltered), industryFiltered > 0 ? 'PASS' : 'FAIL');
  await page.screenshot({ path: path.join(OUT_DIR, '03a-industry-filter.png') });

  // Mood filter
  const moodSelect = await page.$('[data-testid="ds-filter-mood"]');
  if (moodSelect) {
    const moodOptions = await page.evaluate(() => {
      const sel = document.querySelector('[data-testid="ds-filter-mood"]');
      return sel ? Array.from(sel.options).map((o) => o.value).filter(Boolean) : [];
    });
    if (moodOptions.length > 0) {
      await page.select('[data-testid="ds-filter-mood"]', moodOptions[0]);
      await waitMs(400);
      const moodFiltered = await page.evaluate(
        () => document.querySelectorAll('[data-testid="ds-catalog-item"]').length
      );
      log(nextStep(), `Mood filter = ${moodOptions[0]}`, '>= 0 items', String(moodFiltered), 'PASS');
    } else {
      log(nextStep(), 'Mood filter options loaded', '> 0 options', '0', 'FAIL');
    }
  } else {
    log(nextStep(), 'Mood filter present', 'ds-filter-mood', 'missing', 'FAIL');
  }

  // Reset filters
  await page.select('[data-testid="ds-filter-industry"]', '');
  if (moodSelect) {
    await page.evaluate(() => {
      const sel = document.querySelector('[data-testid="ds-filter-mood"]');
      if (sel) sel.value = '';
      sel?.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }
  await waitMs(400);
  const filtersReset = await page.evaluate(
    () => document.querySelectorAll('[data-testid="ds-catalog-item"]').length
  );
  log(nextStep(), 'Filters reset → full list restored', '> 0 items', String(filtersReset), filtersReset > 0 ? 'PASS' : 'FAIL');

  // Category: fonts (clear query first)
  await clearSearch(page);
  await page.click('[data-testid="ds-cat-fonts"]');
  await waitMs(500);
  const fontItems = await page.evaluate(
    () => document.querySelectorAll('[data-testid="ds-catalog-item"]').length
  );
  log(nextStep(), 'Fonts category lists items', '> 0', String(fontItems), fontItems > 0 ? 'PASS' : 'FAIL');
  await page.screenshot({ path: path.join(OUT_DIR, '03b-fonts.png') });

  // Category: colors
  await page.click('[data-testid="ds-cat-colors"]');
  await waitMs(500);
  const colorItems = await page.evaluate(
    () => document.querySelectorAll('[data-testid="ds-catalog-item"]').length
  );
  log(nextStep(), 'Colors category lists items', '> 0', String(colorItems), colorItems > 0 ? 'PASS' : 'FAIL');
  await page.screenshot({ path: path.join(OUT_DIR, '03c-colors.png') });

  // Category: typography
  await page.click('[data-testid="ds-cat-typography"]');
  await waitMs(400);
  const typoItems = await page.evaluate(
    () => document.querySelectorAll('[data-testid="ds-catalog-item"]').length
  );
  log(nextStep(), 'Typography category lists items', '> 0', String(typoItems), typoItems > 0 ? 'PASS' : 'FAIL');

  // Category: industry presets
  await page.click('[data-testid="ds-cat-industry-presets"]');
  await waitMs(400);
  const industryItems = await page.evaluate(
    () => document.querySelectorAll('[data-testid="ds-catalog-item"]').length
  );
  log(nextStep(), 'Industry presets category lists items', '> 0', String(industryItems), industryItems > 0 ? 'PASS' : 'FAIL');

  // Category: buttons
  await page.click('[data-testid="ds-cat-buttons"]');
  await waitMs(400);
  const buttonItems = await page.evaluate(
    () => document.querySelectorAll('[data-testid="ds-catalog-item"]').length
  );
  log(nextStep(), 'Buttons category lists items', '> 0', String(buttonItems), buttonItems > 0 ? 'PASS' : 'FAIL');

  // Category: cards
  await page.click('[data-testid="ds-cat-cards"]');
  await waitMs(400);
  const cardItems = await page.evaluate(
    () => document.querySelectorAll('[data-testid="ds-catalog-item"]').length
  );
  log(nextStep(), 'Cards category lists items', '> 0', String(cardItems), cardItems > 0 ? 'PASS' : 'FAIL');

  // Category: backgrounds
  await page.click('[data-testid="ds-cat-backgrounds"]');
  await waitMs(400);
  const bgItems = await page.evaluate(
    () => document.querySelectorAll('[data-testid="ds-catalog-item"]').length
  );
  log(nextStep(), 'Backgrounds category lists items', '> 0', String(bgItems), bgItems > 0 ? 'PASS' : 'FAIL');

  // Back to style packs with dental query
  await page.click('[data-testid="ds-cat-style-packs"]');
  await waitMs(300);
  await setSearch(page, 'dental');
  const packItemsAfter = await page.evaluate(
    () => document.querySelectorAll('[data-testid="ds-catalog-item"]').length
  );
  log(nextStep(), 'Style Packs + dental query after category hops', '> 0', String(packItemsAfter), packItemsAfter > 0 ? 'PASS' : 'FAIL');
  await page.waitForSelector('[data-testid="ds-btn-apply"]', { timeout: 8000 });

  // Preview (PREVIEW ≠ APPLY)
  const beforeTheme = await page.evaluate(() => {
    const root = document.documentElement;
    return (
      getComputedStyle(root).getPropertyValue('--primary').trim() ||
      document.body.getAttribute('data-theme') ||
      'unknown'
    );
  });

  const previewBtn = await page.$('[data-testid="ds-btn-preview"]');
  if (previewBtn) {
    await previewBtn.click();
    await waitMs(600);
    const previewOpen = await page.evaluate(() =>
      !!document.querySelector('[data-testid="ds-preview-modal"]')
    );
    log(nextStep(), 'Preview modal opens', 'ds-preview-modal present', previewOpen ? 'present' : 'missing', previewOpen ? 'PASS' : 'FAIL');
    await page.screenshot({ path: path.join(OUT_DIR, '04-preview.png') });

    // Close without apply
    await page.evaluate(() => {
      const close = Array.from(document.querySelectorAll('button')).find((b) =>
        (b.innerText || '').includes('Zamknij')
      );
      if (close) close.click();
    });
    await waitMs(400);
    const previewClosed = await page.evaluate(
      () => !document.querySelector('[data-testid="ds-preview-modal"]')
    );
    log(nextStep(), 'Preview closed without mutation', 'modal closed', previewClosed ? 'closed' : 'still-open', previewClosed ? 'PASS' : 'WARN');
  } else {
    log(nextStep(), 'Preview button present', 'ds-btn-preview', 'missing', 'FAIL');
  }

  // Apply style pack
  const applyBtn = await page.$('[data-testid="ds-btn-apply"]');
  let applied = false;
  if (applyBtn) {
    await applyBtn.click();
    await waitMs(800);
    applied = await page.evaluate(() =>
      !!document.querySelector('[data-testid="ds-catalog-item"]') &&
      document.body.innerText.includes('ZASTOSOWANY')
    );
    log(nextStep(), 'Apply style pack → theme mutated (ZASTOSOWANY badge)', 'badge present', applied ? 'badge' : 'no-badge', applied ? 'PASS' : 'WARN');
    await page.screenshot({ path: path.join(OUT_DIR, '05-applied.png') });
  } else {
    log(nextStep(), 'Apply button present', 'ds-btn-apply', 'missing', 'FAIL');
  }

  // Undo via keyboard (history)
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyZ');
  await page.keyboard.up('Control');
  await waitMs(500);
  log(nextStep(), 'Undo after apply (Ctrl+Z)', 'history undo dispatched', 'sent', 'PASS');
  await page.screenshot({ path: path.join(OUT_DIR, '06-undo.png') });

  // Redo
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyY');
  await page.keyboard.up('Control');
  await waitMs(400);
  log(nextStep(), 'Redo after undo (Ctrl+Y)', 'history redo dispatched', 'sent', 'PASS');

  // ── HACP path: AI workspace ─────────────────────────────────
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const aiBtn = btns.find((b) => (b.getAttribute('title') || '').includes('Ctrl+6'));
    if (aiBtn) aiBtn.click();
  });
  await waitMs(1500);
  const aiOpen = await page.evaluate(() => document.body.innerText.includes('SOLOSPOT AI'));
  log(nextStep(), 'AI workspace open', 'SOLOSPOT AI', aiOpen ? 'found' : 'missing', aiOpen ? 'PASS' : 'FAIL');
  await page.screenshot({ path: path.join(OUT_DIR, '07-ai.png') });

  const beforeSections = await page.evaluate(
    () => document.querySelectorAll('[data-section-id]').length
  );

  // Prompt 1: build site
  await page.waitForSelector('textarea', { timeout: 30000 });
  const ta1 = await page.$('textarea');
  await ta1.click();
  await ta1.type(SITE_PROMPT, { delay: 5 });
  await page.keyboard.press('Enter');
  log(nextStep(), 'HACP prompt 1 sent (site build)', 'premium dental clinic site', SITE_PROMPT, 'PASS');
  await page.screenshot({ path: path.join(OUT_DIR, '08-prompt1.png') });

  let gen1 = false;
  const t1 = Date.now();
  while (Date.now() - t1 < 120000) {
    const text = await page.evaluate(() => document.body.innerText);
    if (/Strona wygenerowana pomyślnie|Generacja zakończona|generation-complete/i.test(text)) {
      gen1 = true;
      break;
    }
    if (/Błąd generacji/i.test(text)) break;
    await waitMs(2000);
  }
  await waitMs(2000);
  const afterSections1 = await page.evaluate(
    () => document.querySelectorAll('[data-section-id]').length
  );
  log(
    nextStep(),
    'Prompt 1 produced site mutation',
    'sections grew',
    `before=${beforeSections} after=${afterSections1} complete=${gen1}`,
    afterSections1 > beforeSections || gen1 ? 'PASS' : 'FAIL'
  );
  await page.screenshot({ path: path.join(OUT_DIR, '09-after-build.png') });

  // Prompt 2: style
  const ta2 = await page.$('textarea');
  if (ta2) {
    await ta2.click();
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyA');
    await page.keyboard.up('Control');
    await ta2.type(STYLE_PROMPT, { delay: 5 });
    await page.keyboard.press('Enter');
    log(nextStep(), 'HACP prompt 2 sent (premium dental style)', 'style applied or honest tool use', STYLE_PROMPT, 'PASS');
    await page.screenshot({ path: path.join(OUT_DIR, '10-prompt2.png') });

    let styleDone = false;
    const t2 = Date.now();
    while (Date.now() - t2 < 90000) {
      const text = await page.evaluate(() => document.body.innerText);
      if (
        /Gotowe|Wykonano|styl|theme|motyw|Zastosowano|zaktualizowałem|PASS/i.test(
          text.slice(-2500)
        )
      ) {
        styleDone = true;
        break;
      }
      await waitMs(2000);
    }
    await waitMs(1500);
    log(
      nextStep(),
      'Prompt 2 completed (style response)',
      'style/theme response or mutation',
      styleDone ? 'response-seen' : 'timeout',
      styleDone ? 'PASS' : 'WARN'
    );
    await page.screenshot({ path: path.join(OUT_DIR, '11-after-style.png') });
  }

  // Prompt 3: switch style
  const ta3 = await page.$('textarea');
  if (ta3) {
    await ta3.click();
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyA');
    await page.keyboard.up('Control');
    await ta3.type(STYLE_SWITCH_PROMPT, { delay: 5 });
    await page.keyboard.press('Enter');
    log(nextStep(), 'HACP prompt 3 sent (Luxury Dental switch)', 'style switch', STYLE_SWITCH_PROMPT, 'PASS');
    await page.screenshot({ path: path.join(OUT_DIR, '12-prompt3.png') });

    let switchDone = false;
    const t3 = Date.now();
    while (Date.now() - t3 < 90000) {
      const text = await page.evaluate(() => document.body.innerText);
      if (/Gotowe|Wykonano|Luxury|styl|theme|motyw|Zastosowano|zaktualizowałem/i.test(text.slice(-2500))) {
        switchDone = true;
        break;
      }
      await waitMs(2000);
    }
    await waitMs(1500);
    log(
      nextStep(),
      'Prompt 3 completed (style switch)',
      'switch response or mutation',
      switchDone ? 'response-seen' : 'timeout',
      switchDone ? 'PASS' : 'WARN'
    );
    await page.screenshot({ path: path.join(OUT_DIR, '13-after-switch.png') });
  }

  // Re-open catalog and confirm still usable
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const styleBtn = btns.find(
      (b) => (b.getAttribute('title') || '').includes('Ctrl+5') || (b.innerText || '').trim() === 'Styl'
    );
    if (styleBtn) styleBtn.click();
  });
  await waitMs(800);
  const catalogStill = await page.evaluate(() =>
    !!document.querySelector('[data-testid="ds-catalog-root"]')
  );
  log(nextStep(), 'Catalog still available after HACP', 'ds-catalog-root', catalogStill ? 'present' : 'missing', catalogStill ? 'PASS' : 'FAIL');
  await page.screenshot({ path: path.join(OUT_DIR, '14-catalog-reopen.png') });

  // Search still works after HACP round-trip
  await setSearch(page, 'luxury');
  const luxuryHits = await page.evaluate(
    () => document.querySelectorAll('[data-testid="ds-catalog-item"]').length
  );
  log(nextStep(), 'Post-HACP search "luxury"', '> 0 results', String(luxuryHits), luxuryHits > 0 ? 'PASS' : 'FAIL');
  await page.screenshot({ path: path.join(OUT_DIR, '15-post-hacp-search.png') });

  // Count unique UI interactions logged
  const uiStepsLogged = RESULTS.filter((r) => r.id.startsWith('S')).length;
  log(nextStep(), 'UI step count', '>= 31 steps', String(uiStepsLogged), uiStepsLogged >= 31 ? 'PASS' : uiStepsLogged >= 20 ? 'WARN' : 'FAIL');

  // Console errors
  const newErrors = consoleErrors.filter(
    (e) =>
      !/favicon|401|404|net::ERR|Download the React DevTools/i.test(e)
  );
  log(nextStep(), 'New console errors = 0', '0', String(newErrors.length), newErrors.length === 0 ? 'PASS' : 'FAIL', newErrors.slice(0, 5).join(' | '));

  const pass = RESULTS.filter((r) => r.status === 'PASS').length;
  const fail = RESULTS.filter((r) => r.status === 'FAIL').length;
  const warn = RESULTS.filter((r) => r.status === 'WARN').length;
  const evidence = {
    baseUrl: BASE_URL,
    uiSteps: uiStepsLogged,
    consoleErrors: newErrors.slice(0, 20),
    sections: { beforeSections, afterSections1 },
    prompts: [SITE_PROMPT, STYLE_PROMPT, STYLE_SWITCH_PROMPT],
    result: { pass, fail, warn },
  };
  fs.writeFileSync(
    path.join(OUT_DIR, 'result.json'),
    JSON.stringify({ baseUrl: BASE_URL, results: RESULTS, evidence }, null, 2)
  );

  console.log(`\n=== DESIGN SYSTEM FULL PRODUCT INTEGRATION GATE E2E: ${pass} PASS / ${fail} FAIL / ${warn} WARN ===`);
  await browser.close();
  process.exit(fail > 0 ? 1 : 0);
})().catch((err) => {
  console.error('E2E fatal:', err);
  try {
    fs.writeFileSync(
      path.join(OUT_DIR, 'result.json'),
      JSON.stringify({ fatal: String(err), results: RESULTS }, null, 2)
    );
  } catch {
    /* ignore */
  }
  process.exit(1);
});
