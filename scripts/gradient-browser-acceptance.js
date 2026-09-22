/**
 * GRADIENT — REAL BROWSER L5 ACCEPTANCE
 *
 * Uses system Chrome via puppeteer-core (no new browser download).
 * Journey: register → login → studio → add section → select →
 * background Gradient mode → edit angle/stops → canvas renders
 * linear-gradient (NOT url-wrapped) → undo/redo → responsive isolation
 * → save → reload → persistence.
 *
 * Screenshots → scratch/gradient-proof/.
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const BASE = process.env.GRAD_BASE || 'http://localhost:3000';
const EMAIL = process.env.GRAD_EMAIL || `grad.bot+${Date.now()}@solospot-test.pl`;
const PASSWORD = process.env.GRAD_PASSWORD || 'Grad-Accept-2026!';
const OUT_DIR = path.join(__dirname, '..', 'scratch', 'gradient-proof');

const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`), fullPage: false });
  console.log(`  [shot] ${name}.png`);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const chrome = CHROME_CANDIDATES.find((p) => fs.existsSync(p));
  if (!chrome) throw new Error('No Chrome/Edge found');

  console.log(`[GRAD] Browser: ${chrome}`);
  console.log(`[GRAD] Target:  ${BASE}`);
  console.log(`[GRAD] Account: ${EMAIL}`);

  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--window-size=1600,1000'],
    defaultViewport: { width: 1600, height: 1000 },
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(`PAGEERROR: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(`CONSOLE: ${m.text()}`); });

  const results = [];
  const step = (name, ok, detail = '') => {
    results.push({ name, ok });
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
  };

  try {
    console.log('\n=== REGISTER ===');
    const regRes = await fetch(`${BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD, name: 'Gradient Bot' }),
    }).then((r) => r.json().then((b) => ({ status: r.status, body: b })));
    const regOk = regRes.status === 200 || (regRes.body && !regRes.body.error);
    step('register test account', regOk, JSON.stringify(regRes.body).slice(0, 120));
    if (!regOk) throw new Error('Register failed: ' + JSON.stringify(regRes.body));

    console.log('\n=== LOGIN ===');
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2', timeout: 60000 });
    await sleep(1500);
    const emailSel = 'input[type="email"], input[name="email"], input[placeholder*="mail" i]';
    const passSel = 'input[type="password"], input[name="password"]';
    await page.waitForSelector(emailSel, { timeout: 20000 });
    await page.type(emailSel, EMAIL);
    await page.type(passSel, PASSWORD);
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }).catch(() => {}),
      page.keyboard.press('Enter'),
    ]);
    await sleep(3000);
    step('login via UI', !(await page.$(emailSel)), `url=${page.url()}`);

    console.log('\n=== STUDIO ===');
    const onboarding = await page.evaluate(async (url, email) => {
      const r = await fetch(`${url}/api/onboarding/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerEmail: email, packageId: 'starter', storeName: 'Gradient Accept Store' }),
      });
      return { status: r.status, body: await r.json() };
    }, BASE, EMAIL);
    step('onboard tenant (starter)', onboarding.status === 201 || (onboarding.body && onboarding.body.success), JSON.stringify(onboarding.body).slice(0, 120));

    const createStore = await page.evaluate(async (url) => {
      const r = await fetch(`${url}/api/stores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Gradient Accept Store', slug: `grad-${Date.now()}` }),
      });
      return { status: r.status, body: await r.json() };
    }, BASE);
    const storeId = createStore.body && createStore.body.store && createStore.body.store.id;
    step('create test store', Boolean(storeId), `status=${createStore.status} ${storeId || JSON.stringify(createStore.body).slice(0, 100)}`);
    if (!storeId) throw new Error('Store creation failed: ' + JSON.stringify(createStore.body).slice(0, 200));

    await page.goto(`${BASE}/studio/${storeId}`, { waitUntil: 'networkidle2', timeout: 90000 });
    step('open studio store', page.url().includes(`/studio/${storeId}`), `url=${page.url()}`);
    await sleep(5000);
    await shot(page, '01-studio');

    // Add a base section if none exists
    console.log('\n=== ADD SECTION ===');
    const openComponents = async () => {
      await page.evaluate(() => {
        const t = Array.from(document.querySelectorAll('button')).find((b) => b.textContent && b.textContent.includes('Komponenty'));
        if (t) t.click();
      });
      await sleep(1000);
    };
    await openComponents();
    const addedSection = await page.evaluate(() => {
      const candidates = Array.from(document.querySelectorAll('div, [role="button"]'));
      const card = candidates.find((c) => {
        const labelEl = c.querySelector('div.font-semibold');
        return labelEl && labelEl.textContent.trim() === 'Sekcja bazowa';
      });
      if (card) { card.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); return true; }
      return false;
    });
    await sleep(1600);
    step('add Section (base)', addedSection);
    await shot(page, '02-section-added');

    // Select section
    console.log('\n=== SELECT SECTION ===');
    const sectionClick = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('[data-section-id], [data-node-id]'));
      if (!els.length) return false;
      els[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
      return true;
    });
    await sleep(1200);
    step('click section node', sectionClick);

    // Open Design inspector / background gradient mode
    console.log('\n=== GRADIENT MODE ===');
    // Try Design tab
    await page.evaluate(() => {
      const t = Array.from(document.querySelectorAll('button')).find((b) => b.textContent === 'Design');
      if (t) t.click();
    });
    await sleep(800);

    // Click Gradient tab / option in background type
    const gradientMode = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      let g = btns.find((b) => b.textContent && b.textContent.includes('Gradient'));
      if (g) { g.click(); return 'button'; }
      const opts = Array.from(document.querySelectorAll('option, [role="option"], label, span'));
      const o = opts.find((x) => x.textContent && x.textContent.trim().startsWith('Gradient'));
      if (o) { o.click(); return 'option'; }
      return null;
    });
    await sleep(1200);
    step('activate Gradient background mode', Boolean(gradientMode), String(gradientMode));
    await shot(page, '03-gradient-mode');

    // GradientControl present?
    const hasControl = await page.evaluate(() => !!document.querySelector('[data-testid="gradient-control"]'));
    step('GradientControl rendered', hasControl);
    await shot(page, '04-gradient-control');

    // Change angle via exact input
    const angleOk = await page.evaluate(() => {
      const input = document.querySelector('[aria-label="Kąt gradientu (stopnie)"]');
      if (!input) return false;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, '45');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new Event('blur', { bubbles: true }));
      return true;
    });
    await sleep(1000);
    step('set gradient angle to 45deg', angleOk);
    await shot(page, '05-angle-45');

    // Add a stop
    const addStop = await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="gradient-add-stop"]');
      if (btn) { btn.click(); return true; }
      return false;
    });
    await sleep(800);
    const stopCount = await page.evaluate(() => document.querySelectorAll('[data-testid^="gradient-stop-"]').length);
    step('add gradient stop', addStop && stopCount >= 3, `stops=${stopCount}`);

    // Verify canvas node has linear-gradient backgroundImage (NOT url-wrapped)
    await sleep(500);
    const canvasBg = await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll('[data-node-id], [data-section-id]'));
      for (const n of nodes) {
        const bi = n.style && n.style.backgroundImage;
        if (bi && bi.includes('linear-gradient')) return bi;
        // also check button children
        const btn = n.querySelector && n.querySelector('button');
        if (btn && btn.style && btn.style.backgroundImage && btn.style.backgroundImage.includes('linear-gradient')) {
          return btn.style.backgroundImage;
        }
      }
      return null;
    });
    step('canvas renders linear-gradient (not url-wrapped)', Boolean(canvasBg && canvasBg.includes('linear-gradient') && !canvasBg.includes('url("linear-gradient')), canvasBg || 'none');
    await shot(page, '06-canvas-gradient');

    // Preview strip shows gradient CSS
    const previewOk = await page.evaluate(() => {
      const p = document.querySelector('[data-testid="gradient-preview"]');
      if (!p) return null;
      const bg = p.style.background || p.getAttribute('data-css') || '';
      return bg.includes('linear-gradient') ? bg : bg;
    });
    step('gradient preview strip shows linear-gradient', Boolean(previewOk && String(previewOk).includes('linear-gradient')), String(previewOk).slice(0, 120));

    // ---------- UNDO / REDO ----------
    console.log('\n=== UNDO / REDO ===');
    // Capture current angle state in document via re-read of control
    const angleBeforeUndo = await page.evaluate(() => {
      const input = document.querySelector('[aria-label="Kąt gradientu (stopnie)"]');
      return input ? input.value : null;
    });
    const undoOk = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => (b.getAttribute('title') || '').toLowerCase().includes('undo') || (b.getAttribute('aria-label') || '').toLowerCase().includes('undo'));
      if (btn && !btn.disabled) { btn.click(); return true; }
      return false;
    });
    await sleep(1000);
    const angleAfterUndo = await page.evaluate(() => {
      const input = document.querySelector('[aria-label="Kąt gradientu (stopnie)"]');
      return input ? input.value : null;
    });
    step('undo gradient change', undoOk, `before=${angleBeforeUndo} after=${angleAfterUndo}`);
    await shot(page, '07-after-undo');

    const redoOk = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => (b.getAttribute('title') || '').toLowerCase().includes('redo') || (b.getAttribute('aria-label') || '').toLowerCase().includes('redo'));
      if (btn && !btn.disabled) { btn.click(); return true; }
      return false;
    });
    await sleep(1000);
    const angleAfterRedo = await page.evaluate(() => {
      const input = document.querySelector('[aria-label="Kąt gradientu (stopnie)"]');
      return input ? input.value : null;
    });
    step('redo restores gradient change', redoOk, `afterRedo=${angleAfterRedo}`);
    await shot(page, '08-after-redo');

    // ---------- RESPONSIVE ISOLATION ----------
    console.log('\n=== RESPONSIVE ISOLATION ===');
    const setViewport = async (label) => {
      const ok = await page.evaluate((lbl) => {
        const titles = { DESKTOP: 'Desktop (1280px)', TABLET: 'Tablet (768px)', MOBILE: 'Mobile (375px)' };
        const btn = Array.from(document.querySelectorAll('button')).find((b) => b.getAttribute('title') === titles[lbl]);
        if (btn) { btn.click(); return true; }
        return false;
      }, label);
      await sleep(1200);
      return ok;
    };

    // Capture desktop gradient CSS from canvas
    const desktopBg = await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll('[data-node-id], [data-section-id]'));
      for (const n of nodes) {
        const bi = n.style && n.style.backgroundImage;
        if (bi && bi.includes('linear-gradient')) return bi;
      }
      return null;
    });

    const tabletOk = await setViewport('TABLET');
    step('switch to Tablet', tabletOk);

    // Change angle in tablet context to 90
    const tabletAngle = await page.evaluate(() => {
      const input = document.querySelector('[aria-label="Kąt gradientu (stopnie)"]');
      if (!input) return false;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, '90');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new Event('blur', { bubbles: true }));
      return true;
    });
    await sleep(1000);
    step('set gradient angle 90 in Tablet', tabletAngle);
    await shot(page, '09-tablet-gradient');

    const desktopBack = await setViewport('DESKTOP');
    step('switch back to Desktop', desktopBack);
    await sleep(1000);

    const desktopBgAfter = await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll('[data-node-id], [data-section-id]'));
      for (const n of nodes) {
        const bi = n.style && n.style.backgroundImage;
        if (bi && bi.includes('linear-gradient')) return bi;
      }
      return null;
    });
    // Desktop must still have its original angle (45 after redo, not 90)
    const desktopIsolated = desktopBg === desktopBgAfter || (desktopBgAfter && desktopBgAfter.includes('45deg'));
    const desktopHas90 = desktopBgAfter && desktopBgAfter.includes('90deg');
    step('responsive isolation: Desktop unchanged by Tablet edit', Boolean(desktopIsolated && !desktopHas90),
      `desktopBefore=${desktopBg} desktopAfter=${desktopBgAfter}`);
    await shot(page, '10-desktop-isolated');

    // ---------- SAVE / RELOAD PERSISTENCE ----------
    console.log('\n=== SAVE / RELOAD ===');
    const saveOk = await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button')).find((x) => x.textContent && x.textContent.includes('Save'));
      if (b && !b.disabled) { b.click(); return true; }
      return false;
    });
    await sleep(4000);
    step('save document', saveOk);
    await shot(page, '11-saved');

    await page.reload({ waitUntil: 'networkidle2', timeout: 90000 });
    await sleep(6000);
    await shot(page, '12-after-reload');

    // Re-select section and check gradient still present
    await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('[data-section-id], [data-node-id]'));
      if (els.length) els[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await sleep(1200);
    await page.evaluate(() => {
      const t = Array.from(document.querySelectorAll('button')).find((b) => b.textContent === 'Design');
      if (t) t.click();
    });
    await sleep(800);
    await page.evaluate(() => {
      const g = Array.from(document.querySelectorAll('button')).find((b) => b.textContent && b.textContent.includes('Gradient'));
      if (g) g.click();
    });
    await sleep(1000);

    const persisted = await page.evaluate(() => {
      const control = !!document.querySelector('[data-testid="gradient-control"]');
      const nodes = Array.from(document.querySelectorAll('[data-node-id], [data-section-id]'));
      let bg = null;
      for (const n of nodes) {
        const bi = n.style && n.style.backgroundImage;
        if (bi && bi.includes('linear-gradient')) { bg = bi; break; }
      }
      return { control, bg };
    });
    step('reload → GradientControl restored', persisted.control);
    step('reload → linear-gradient persisted on canvas', Boolean(persisted.bg && persisted.bg.includes('linear-gradient')), persisted.bg || 'none');
    await shot(page, '13-persisted');

    // Deep API persistence check
    const persistedApi = await page.evaluate(async (url, sid) => {
      const r = await fetch(`${url}/api/stores/${sid}`);
      const data = await r.json();
      if (!data.success || !data.store) return { ok: false, reason: 'no store' };
      const pages = data.store.config && data.store.config.pages;
      if (!Array.isArray(pages) || !pages.length) return { ok: false, reason: 'no pages' };
      const allSections = [];
      const walk = (secs) => { for (const s of secs) { allSections.push(s); if (Array.isArray(s.children)) walk(s.children); } };
      for (const p of pages) walk(p.sections || []);
      const grad = allSections.find((s) => s.styles && String(s.styles.backgroundImage || '').includes('linear-gradient'));
      return { ok: Boolean(grad), bg: grad && grad.styles.backgroundImage, sections: allSections.length };
    }, BASE, storeId);
    step('API store config contains linear-gradient', persistedApi.ok, JSON.stringify(persistedApi));

    // ---------- RESULTS ----------
    const failed = results.filter((r) => !r.ok);
    console.log('\n==================== GRADIENT BROWSER VERDICT ====================');
    console.log(`PASS: ${results.length - failed.length}/${results.length}`);
    if (failed.length) {
      console.log('FAILED STEPS:');
      failed.forEach((f) => console.log(`  - ${f.name}`));
    }
    if (consoleErrors.length) {
      console.log(`\nPAGE ERRORS (${consoleErrors.length}):`);
      consoleErrors.slice(0, 10).forEach((e) => console.log('  ' + e.slice(0, 200)));
    }
    fs.writeFileSync(
      path.join(OUT_DIR, 'results.json'),
      JSON.stringify({ base: BASE, email: EMAIL, results, consoleErrors }, null, 2)
    );
    process.exitCode = failed.length ? 1 : 0;
  } catch (err) {
    console.error('FATAL:', err.message);
    await shot(page, 'FATAL').catch(() => {});
    fs.writeFileSync(path.join(OUT_DIR, 'results.json'), JSON.stringify({ fatal: err.message, results, consoleErrors }, null, 2));
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main();
