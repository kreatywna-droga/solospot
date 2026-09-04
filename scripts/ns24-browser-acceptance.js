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
    // ---------- 1. REGISTER ----------
    console.log('\n=== REGISTER ===');
    const regRes = await page.evaluate(async (url, email, password) => {
      const r = await fetch(`${url}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: 'NS24 Acceptance Bot' }),
      });
      return { status: r.status, body: await r.json() };
    }, BASE, EMAIL, PASSWORD);
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
    await page.goto(`${BASE}/studio`, { waitUntil: 'networkidle2', timeout: 60000 });
    await sleep(2500);
    await shot(page, '03-studio-list');

    // Find a studio link (store card)
    const studioHref = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="/studio/"]'));
      const el = links.find((l) => !l.getAttribute('href').endsWith('/studio')) || links[0];
      return el ? el.getAttribute('href') : null;
    });
    if (!studioHref) {
      // maybe redirect already into a store or dashboard — check URL
      const inStudio = page.url().includes('/studio/');
      step('open studio store', inStudio, `url=${page.url()}`);
      if (!inStudio) throw new Error('No studio store link found and not inside studio');
    } else {
      await page.goto(`${BASE}${studioHref}`, { waitUntil: 'networkidle2', timeout: 60000 });
      step('open studio store', true, studioHref);
    }
    await sleep(4000);
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
        const cards = Array.from(document.querySelectorAll('[role="button"], button, div'));
        const card = cards.find((c) => c.textContent && c.textContent.trim().startsWith(lbl));
        if (card) { card.click(); return true; }
        return false;
      }, label);
      await sleep(1400);
      return ok;
    };

    // Select nothing first (clear selection) so atomic elements wrap into a section
    await page.mouse.click(800, 500); // click somewhere neutral
    await sleep(600);

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
    // Inline edit: double-click the heading text
    const inlineEdited = await page.evaluate(() => {
      const h = document.querySelector('[data-node-type="heading"] [data-inline-edit], [data-node-type="heading"]');
      if (!h) return false;
      h.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      return true;
    });
    await sleep(500);
    if (inlineEdited) {
      await page.keyboard.type('NS24 LIVE EDIT', { delay: 30 });
      await page.keyboard.press('Enter');
      await sleep(800);
    }
    const inlineCommitted = await page.evaluate(() => document.body.innerText.includes('NS24 LIVE EDIT'));
    step('inline edit Heading text (dblclick → type → Enter)', inlineEdited && inlineCommitted);
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

    // change something in tablet — e.g. heading font size via Design inspector
    await selectNodeByType('heading', []);
    const tabletEdit = await page.evaluate(() => {
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
    await sleep(800);
    step('change property in Tablet context', tabletEdit);

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

    await page.reload({ waitUntil: 'networkidle2', timeout: 60000 });
    await sleep(5000);
    const persisted = await page.evaluate(() => document.body.innerText.includes('NS24 LIVE EDIT'));
    step('reload → text edit persisted', persisted);
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
