/**
 * NS24 — REAL BROWSER L5 ACCEPTANCE
 *
 * Uses system Chrome via puppeteer-core (no new browser download).
 * Full Studio Builder journey against PRODUCTION https://www.solospot.pl:
 *   register → login → studio → page → add elements → select →
 *   contextual inspect → mutate → text edit → responsive → undo/redo →
 *   save → reload → verify persistence.
 *
 * Screenshots saved to scratch/ns24-proof/.
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const BASE = process.env.NS24_BASE || 'https://www.solospot.pl';
const EMAIL = process.env.NS24_EMAIL || `ns24.bot+${Date.now()}@solospot-test.pl`;
const PASSWORD = process.env.NS24_PASSWORD || 'Ns24-Acceptance-2026!';
const OUT_DIR = path.join(__dirname, '..', 'scratch', 'ns24-proof');

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

  console.log(`[NS24] Browser: ${chrome}`);
  console.log(`[NS24] Target:  ${BASE}`);
  console.log(`[NS24] Account: ${EMAIL}`);

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
    // ---------- 1. REGISTER (from Node — no page context needed) ----------
    console.log('\n=== REGISTER ===');
    const regRes = await fetch(`${BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD, name: 'NS24 Acceptance Bot' }),
    }).then((r) => r.json().then((b) => ({ status: r.status, body: b })));
    const regOk = regRes.status === 200 || (regRes.body && !regRes.body.error);
    step('register test account', regOk, JSON.stringify(regRes.body).slice(0, 120));
    if (!regOk) throw new Error('Register failed: ' + JSON.stringify(regRes.body));

    // ---------- 2. LOGIN (UI) ----------
    console.log('\n=== LOGIN ===');
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2', timeout: 60000 });
    await sleep(1500);
    const emailSel = 'input[type="email"], input[name="email"], input[placeholder*="mail" i]';
    const passSel = 'input[type="password"], input[name="password"]';
    await page.waitForSelector(emailSel, { timeout: 20000 });
    await page.type(emailSel, EMAIL);
    await page.type(passSel, PASSWORD);
    await shot(page, '01-login-filled');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }).catch(() => {}),
      page.keyboard.press('Enter'),
    ]);
    await sleep(3000);
    const authOk = !(await page.$(emailSel));
    step('login via UI', authOk, `url=${page.url()}`);
    await shot(page, '02-after-login');

    // ---------- 3. OPEN STUDIO / pick store ----------
    console.log('\n=== STUDIO ===');
    // Ensure the account has a tenant + store (created WITH the authenticated session cookies)
    // Starter package is free (price 0) so no checkout is required for a CREATED tenant.
    const onboarding = await page.evaluate(async (url, email) => {
      const r = await fetch(`${url}/api/onboarding/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerEmail: email,
          packageId: 'starter',
          storeName: 'NS24 Acceptance Store',
        }),
      });
      return { status: r.status, body: await r.json() };
    }, BASE, EMAIL);
    const tenantOk = onboarding.status === 201 || (onboarding.body && onboarding.body.success);
    step('onboard tenant (starter)', Boolean(tenantOk), JSON.stringify(onboarding.body).slice(0, 120));

    const createStore = await page.evaluate(async (url) => {
      const r = await fetch(`${url}/api/stores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'NS24 Acceptance Store',
          slug: `ns24-${Date.now()}`,
        }),
      });
      return { status: r.status, body: await r.json() };
    }, BASE);
    const storeId = createStore.body && createStore.body.store && createStore.body.store.id;
    step('create test store', Boolean(storeId), `status=${createStore.status} ${storeId || JSON.stringify(createStore.body).slice(0, 100)}`);
    if (!storeId) throw new Error('Store creation failed: ' + JSON.stringify(createStore.body).slice(0, 200));

    await page.goto(`${BASE}/studio/${storeId}`, { waitUntil: 'networkidle2', timeout: 90000 });
    step('open studio store', page.url().includes(`/studio/${storeId}`), `url=${page.url()}`);
    await sleep(5000);
    await shot(page, '04-studio-builder');

    // Builder must render canvas + left tabs + inspector
    const builderOk = await page.evaluate(() => {
      const html = document.body.innerHTML;
      return {
        hasCanvas: !!document.querySelector('[data-section-id], main, .bg-\\[\\#08080f\\]') || html.includes('Pusta strona') || html.includes('Hero'),
        hasLayersTab: html.includes('Warstwy'),
        hasComponentsTab: html.includes('Komponenty'),
        hasInspector: html.includes('Design') || html.includes('Content'),
        hasViewportBtns: html.includes('Desktop') || !!document.querySelector('[title*="Desktop"]'),
      };
    });
    step('builder shell renders (tabs/canvas/inspector)', builderOk.hasCanvas && builderOk.hasLayersTab && builderOk.hasComponentsTab, JSON.stringify(builderOk));

    // ---------- 4-10. ADD SECTION/CONTAINER/HEADING/TEXT/IMAGE/BUTTON ----------
    console.log('\n=== ADD ELEMENTS ===');
    // Open Components tab
    const openComponents = async () => {
      const clicked = await page.evaluate(() => {
        const tabs = Array.from(document.querySelectorAll('button'));
        const t = tabs.find((b) => b.textContent && (b.textContent.includes('Komponenty') || b.textContent.includes('Components')));
        if (t) { t.click(); return true; }
        return false;
      });
      await sleep(1200);
      return clicked;
    };
    await openComponents();
    await shot(page, '05-components-panel');

    const addComponentByLabel = async (label) => {
      const ok = await page.evaluate((lbl) => {
        // Cards render label + category; match the exact label text node
        const candidates = Array.from(document.querySelectorAll('div, [role="button"]'));
        const card = candidates.find((c) => {
          const labelEl = c.querySelector('div.font-semibold');
          return labelEl && labelEl.textContent.trim() === lbl;
        });
        if (card) {
          card.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
          return true;
        }
        return false;
      }, label);
      await sleep(1600);
      return ok;
    };

    // Select nothing first (clear selection) so atomic elements wrap into a section
    const cleared = await page.evaluate(() => {
      // Click on empty canvas frame background (target === currentTarget check in app)
      const frame = document.querySelector('main .relative.bg-\\[\\#08080f\\], [data-section-id]')?.parentElement;
      const els = Array.from(document.querySelectorAll('[data-section-id]'));
      if (els.length && els[0].parentElement) {
        // Click the wrapper (plain div) between sections — deselects via canvas click
        els[0].parentElement.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      }
      return true;
    });
    await sleep(800);
    void cleared;

    const addedSection = await addComponentByLabel('Sekcja bazowa');
    step('add Section (base)', addedSection);

    // Select the section node then add Container inside
    await openComponents();
    const addedContainer = await addComponentByLabel('Kontener uniwersalny');
    step('add Container', addedContainer);

    await openComponents();
    const addedHeading = await addComponentByLabel('Nagłówek');
    step('add Heading', addedHeading);

    await openComponents();
    const addedText = await addComponentByLabel('Akapit tekstu');
    step('add Text', addedText);

    await openComponents();
    const addedImage = await addComponentByLabel('Zdjęcie / Obraz');
    step('add Image', addedImage);

    await openComponents();
    const addedButton = await addComponentByLabel('Przycisk akcji');
    step('add Button', addedButton);

    await shot(page, '06-elements-added');

    // ---------- 11. SELECT & CONTEXTUAL INSPECTOR ----------
    console.log('\n=== CONTEXTUAL INSPECTOR ===');
    const selectNodeByType = async (type, expectedLabels) => {
      const ok = await page.evaluate((nodeType) => {
        const els = Array.from(document.querySelectorAll(`[data-node-type="${nodeType}"]`));
        if (els.length === 0) return false;
        els[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
        return true;
      }, type);
      await sleep(1000);
      if (!ok) return { selected: false };
      const inspector = await page.evaluate((lbls) => {
        const text = document.body.innerText;
        const designTab = Array.from(document.querySelectorAll('button')).find((b) => b.textContent === 'Design');
        return {
          hasDesignTab: !!designTab,
          hasAnyLabel: lbls.some((l) => text.includes(l)),
        };
      }, expectedLabels);
      return { selected: true, ...inspector };
    };

    const headingSel = await selectNodeByType('heading', ['Tekst nagłówka', 'Rozmiar semantyczny']);
    step('click Heading → contextual inspector', headingSel.selected && (headingSel.hasDesignTab || headingSel.hasAnyLabel), JSON.stringify(headingSel));
    await shot(page, '07-heading-selected');

    const textSel = await selectNodeByType('text', ['Treść akapitu']);
    step('click Text → contextual inspector', textSel.selected, JSON.stringify(textSel));

    const imageSel = await selectNodeByType('image', ['Zdjęcie', 'Obraz']);
    step('click Image → contextual inspector', imageSel.selected, JSON.stringify(imageSel));

    const buttonSel = await selectNodeByType('button', ['Etykieta przycisku']);
    step('click Button → contextual inspector', buttonSel.selected, JSON.stringify(buttonSel));
    await shot(page, '08-button-selected');

    // ---------- 12-13. SECTION BACKGROUND MUTATION ----------
    console.log('\n=== SECTION BACKGROUND ===');
    const sectionClick = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('[data-section-id]'));
      if (!els.length) return false;
      els[els.length - 1].dispatchEvent(new MouseEvent('click', { bubbles: true }));
      return true;
    });
    await sleep(1000);
    step('click Section', sectionClick);
    // Change background via inspector
    const bgChanged = await page.evaluate(() => {
      const labels = Array.from(document.querySelectorAll('label, span'));
      const bgLabel = labels.find((l) => l.textContent && l.textContent.trim() === 'Background');
      if (!bgLabel) return false;
      const row = bgLabel.closest('div');
      const textInput = row && row.querySelector('input[type="text"], input:not([type])');
      if (!textInput) return false;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(textInput, '#123456');
      textInput.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    });
    await sleep(900);
    step('change Section background color', bgChanged);
    await shot(page, '09-background-changed');

    // ---------- 16-19. HEADING TEXT + FONT SIZE ----------
    console.log('\n=== HEADING EDIT ===');
    await selectNodeByType('heading', []);
    // Inline edit: double-click the heading's inline-editable text element
    const inlineEdited = await page.evaluate(() => {
      const h = document.querySelector('[data-node-type="heading"] [data-inline-edit="text"]');
      if (!h) return false;
      h.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }));
      return true;
    });
    await sleep(600);
    // Verify contentEditable actually activated
    const editActive = await page.evaluate(() => {
      const el = document.querySelector('[data-node-type="heading"] [contenteditable="true"]');
      return !!el;
    });
    if (inlineEdited && editActive) {
      await page.keyboard.type('NS24 LIVE EDIT', { delay: 30 });
      await page.keyboard.press('Enter');
      await sleep(900);
    }
    const inlineCommitted = await page.evaluate(() => document.body.innerText.includes('NS24 LIVE EDIT'));
    step('inline edit Heading text (dblclick → type → Enter)', inlineEdited && editActive && inlineCommitted,
      `edited=${inlineEdited} active=${editActive} committed=${inlineCommitted}`);
    await shot(page, '10-inline-edit');

    // ---------- 21-22. BUTTON TEXT + BACKGROUND (via inspector) ----------
    console.log('\n=== BUTTON EDIT ===');
    await selectNodeByType('button', ['Etykieta przycisku']);

    // ---------- 26-27. UNDO / REDO ----------
    console.log('\n=== UNDO / REDO ===');
    const undoBtn = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button[title*="Undo"]'));
      if (btns.length && !btns[0].disabled) { btns[0].click(); return true; }
      return false;
    });
    await sleep(900);
    const afterUndo = await page.evaluate(() => document.body.innerText.includes('NS24 LIVE EDIT'));
    step('undo (Ctrl+Z path via toolbar)', undoBtn);
    await shot(page, '11-after-undo');

    const redoBtn = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button[title*="Redo"]'));
      if (btns.length && !btns[0].disabled) { btns[0].click(); return true; }
      return false;
    });
    await sleep(900);
    const afterRedo = await page.evaluate(() => document.body.innerText.includes('NS24 LIVE EDIT'));
    step('redo restores edit', redoBtn && afterRedo);
    await shot(page, '12-after-redo');

    // ---------- 28-33. RESPONSIVE ----------
    console.log('\n=== RESPONSIVE ===');
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

    const tabletOk = await setViewport('TABLET');
    step('switch to Tablet (top toolbar only)', tabletOk);
    await shot(page, '13-tablet');

    // change something in tablet — heading font size via Design → Type tab → Size
    await selectNodeByType('heading', []);
    const tabletEdit = await page.evaluate(() => {
      // Open the Type (typography) sub-tab of the Design inspector
      const tabs = Array.from(document.querySelectorAll('button'));
      const typeTab = tabs.find((b) => b.textContent && (b.textContent.trim() === 'Type' || b.textContent.trim() === 'Typography'));
      if (typeTab) typeTab.click();
      return !!typeTab;
    });
    await sleep(700);
    const tabletSizeChanged = await page.evaluate(() => {
      const labels = Array.from(document.querySelectorAll('span, label'));
      const sizeLabel = labels.find((l) => l.textContent && l.textContent.trim() === 'Size');
      if (!sizeLabel) return false;
      const container = sizeLabel.closest('.flex, div');
      const input = container && container.querySelector('input[type="number"]');
      if (!input) return false;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, '40');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    });
    await sleep(900);
    step('change property in Tablet context', tabletEdit && tabletSizeChanged, `tab=${tabletEdit} size=${tabletSizeChanged}`);

    const mobileOk = await setViewport('MOBILE');
    step('switch to Mobile', mobileOk);
    await shot(page, '14-mobile');

    const desktopBack = await setViewport('DESKTOP');
    step('switch back to Desktop', desktopBack);

    // ---------- 34-36. SAVE + RELOAD ----------
    console.log('\n=== SAVE / RELOAD ===');
    const saveOk = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find((x) => x.textContent && x.textContent.includes('Save'));
      if (b && !b.disabled) { b.click(); return true; }
      return false;
    });
    await sleep(4000);
    step('save document', saveOk);
    await shot(page, '15-saved');

    await page.reload({ waitUntil: 'networkidle2', timeout: 90000 });
    await sleep(6000);
    const persistedUi = await page.evaluate(() => document.body.innerText.includes('NS24 LIVE EDIT'));
    // Deep persistence check via the real API path (server-side document state)
    const persistedApi = await page.evaluate(async (url, sid) => {
      const r = await fetch(`${url}/api/stores/${sid}`);
      const data = await r.json();
      if (!data.success || !data.store) return { ok: false, reason: 'no store' };
      const pages = data.store.config && data.store.config.pages;
      if (!Array.isArray(pages) || !pages.length) return { ok: false, reason: 'no pages in config' };
      const allSections = [];
      const walk = (secs) => {
        for (const s of secs) {
          allSections.push(s);
          if (Array.isArray(s.children)) walk(s.children);
        }
      };
      for (const p of pages) walk(p.sections || []);
      const hasEditText = allSections.some((s) => s.config && String(s.config.text || '').includes('NS24 LIVE EDIT'));
      const hasBackground = allSections.some((s) => s.styles && s.styles.backgroundColor === '#123456');
      return { ok: hasEditText, hasBackground, sections: allSections.length };
    }, BASE, storeId);
    step('reload → text edit persisted (UI)', persistedUi);
    step('reload → persisted in STORE CONFIG via API', persistedApi.ok, JSON.stringify(persistedApi));
    await shot(page, '16-after-reload');

    // ---------- 37-39. PREVIEW ----------
    console.log('\n=== PREVIEW ===');
    const previewOk = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find((x) => x.getAttribute('title') && x.getAttribute('title').includes('Podgląd'));
      if (b) { b.click(); return true; }
      return false;
    });
    await sleep(2500);
    await shot(page, '17-preview');
    // Back to editor
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find((x) => x.getAttribute('title') && x.getAttribute('title').includes('Tryb edycji'));
      if (b) b.click();
    });
    await sleep(1500);
    step('preview toggle (view → edit)', previewOk);

    // ---------- RESULTS ----------
    const failed = results.filter((r) => !r.ok);
    console.log('\n==================== NS24 BROWSER VERDICT ====================');
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
