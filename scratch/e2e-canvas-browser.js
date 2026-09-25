/**
 * FAZA 7 — Canvas Browser Verification v3
 * Strategies (in order):
 *  C1: Library insert "+ Dodaj Sekcję z Biblioteki" → new [data-node-id] on canvas
 *  C2: Select hero → Inspector/QuickToolbar color input → bg #ff0000
 *  C3: React fiber dispatch UPDATE_PROPS on BuilderProvider (same production dispatch path)
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME = 'C:\\Users\\HP\\.cache\\puppeteer\\chrome\\win64-153.0.8010.36\\chrome-win64\\chrome.exe';
const OUT = path.join(__dirname, 'e2e-canvas-proof');
fs.mkdirSync(OUT, { recursive: true });
const log = (...a) => console.log('[CANVAS]', ...a);
const L = (step, data) => console.log(JSON.stringify({ step, ...data }));

const dumpCanvas = (page) => page.evaluate(() => {
  const nodes = [];
  document.querySelectorAll('[data-node-id],[data-section-id]').forEach((el) => {
    const id = el.getAttribute('data-node-id') || el.getAttribute('data-section-id');
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    nodes.push({ id, bg: cs.backgroundColor, text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80), w: Math.round(r.width), h: Math.round(r.height), visible: r.width > 0 && r.height > 0 });
  });
  const ids = new Set(nodes.map((n) => n.id));
  return {
    url: location.href,
    uniqueIds: Array.from(ids),
    nodeCount: nodes.length,
    uniqueCount: ids.size,
    nodes: nodes.slice(0, 60),
    hasMain: !!document.querySelector('main'),
    bodySample: document.body.innerText.slice(0, 350),
  };
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--window-size=1600,1100'],
    defaultViewport: { width: 1600, height: 1100 },
  });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 250)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 250)); });

  let status = 'UNVERIFIED';
  let pathUsed = null;
  const evidence = {};

  try {
    await page.goto('http://localhost:3000/studio/s-demo', { waitUntil: 'networkidle0', timeout: 90000 });
    await sleep(5000);
    const before = await dumpCanvas(page);
    await page.screenshot({ path: path.join(OUT, 'before.png') });
    L('CANVAS_BEFORE', { uniqueCount: before.uniqueCount, uniqueIds: before.uniqueIds, nodeCount: before.nodeCount });

    // ── C1: Library insert ──
    const openedLib = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button,a,[role=button]')).find((x) =>
        /Dodaj Sekcję z Biblioteki|Biblioteka sekcji|Sekcje/i.test((x.textContent || '').trim())
      );
      if (btn) { btn.click(); return (btn.textContent || '').trim().slice(0, 40); }
      return null;
    });
    log('openedLib', openedLib);
    await sleep(1200);

    const inserted = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('[role=button],button,article,div[class*="card"]'));
      const c = cards.find((x) => /testimonial/i.test(x.textContent || '') && (x.textContent || '').length < 300);
      if (c) { c.click(); return (c.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60); }
      return null;
    });
    log('insertedCard', inserted);
    await sleep(1500);
    // close modal
    await page.keyboard.press('Escape');
    await sleep(500);
    await page.keyboard.press('Escape');
    await sleep(800);

    let after = await dumpCanvas(page);
    let newIds = after.uniqueIds.filter((id) => !before.uniqueIds.includes(id));
    evidence.c1 = { openedLib, inserted, newIds: newIds.slice(0, 10), uniqueBefore: before.uniqueCount, uniqueAfter: after.uniqueCount };
    L('CANVAS_C1_LIBRARY', evidence.c1);

    if (newIds.length > 0) {
      pathUsed = 'C1_library_insert';
      status = 'VERIFIED';
    }

    // ── C2: select hero + color input ──
    if (status !== 'VERIFIED') {
      const selected = await page.evaluate(() => {
        const els = Array.from(document.querySelectorAll('[data-section-id],[data-node-id]'));
        const hero = els.find((e) => /hero/i.test(e.getAttribute('data-section-id') || e.getAttribute('data-node-id') || ''));
        const target = hero || els[0];
        if (!target) return null;
        const id = target.getAttribute('data-section-id') || target.getAttribute('data-node-id');
        target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
        target.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
        target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        return id;
      });
      log('selected', selected);
      await sleep(1200);

      // open contextual / style if needed
      await page.evaluate(() => {
        const b = Array.from(document.querySelectorAll('button')).find((x) => /Styl|Style|Tło|Kolor/i.test((x.textContent || '') + (x.title || '')));
        if (b) b.click();
      });
      await sleep(600);

      const uiMut = await page.evaluate(() => {
        const colorInputs = Array.from(document.querySelectorAll('input[type="color"]'));
        const hexish = Array.from(document.querySelectorAll('input')).filter((i) => /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test((i.value || '').trim()));
        const target = colorInputs[0] || hexish.find((i) => i.offsetParent !== null) || null;
        if (!target) return { ok: false, reason: 'no-input', colorInputs: colorInputs.length, hexish: hexish.length };
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(target, '#ff0000');
        target.dispatchEvent(new Event('input', { bubbles: true }));
        target.dispatchEvent(new Event('change', { bubbles: true }));
        return { ok: true, colorInputs: colorInputs.length, hexish: hexish.length, val: target.value };
      });
      log('uiMut', uiMut);
      await sleep(1000);
      after = await dumpCanvas(page);
      const red = after.nodes.filter((n) => /rgb\(255,\s*0,\s*0\)/i.test(n.bg));
      evidence.c2 = { selected, uiMut, redCount: red.length, red: red.slice(0, 3) };
      L('CANVAS_C2_COLOR', evidence.c2);
      if (red.length > 0) {
        pathUsed = 'C2_ui_color';
        status = 'VERIFIED';
      }
    }

    // ── C3: React fiber dispatch on BuilderProvider (production dispatch gateway) ──
    if (status !== 'VERIFIED') {
      const fiberResult = await page.evaluate(() => {
        const root = document.getElementById('__next') || document.body;
        const key = Object.keys(root).find((k) => k.startsWith('__reactContainer') || k.startsWith('__reactFiber'));
        if (!key) return { ok: false, reason: 'no-react-root' };

        const seen = new Set();
        let found = null;
        let visited = 0;
        const walk = (fiber, depth) => {
          if (!fiber || depth > 90 || found || visited > 8000) return;
          visited++;
          if (seen.has(fiber)) return;
          seen.add(fiber);
          const props = fiber.memoizedProps || {};
          const maybe = props.value || props;
          if (maybe && typeof maybe === 'object' && maybe.document && typeof maybe.dispatch === 'function') {
            found = { source: 'props.value', keys: Object.keys(maybe).slice(0, 20), versionBefore: maybe.document?.version, docRef: maybe.document };
            const pageId = maybe.document?.pages?.[0]?.id || maybe.canvas?.selectedPageId || 'page-home';
            const results = [];
            try {
              maybe.dispatch({ type: 'SET_NODE_STYLES', nodeId: 'sec-hero-init', styles: { backgroundColor: '#FF0000' } });
              results.push('SET_NODE_STYLES:ok');
            } catch (e) { results.push('SET_NODE_STYLES:' + String(e.message || e)); }
            try {
              maybe.dispatch({ type: 'UPDATE_PROPS', pageId, sectionId: 'sec-hero-init', props: { backgroundColor: '#FF0000', background: '#FF0000', title: 'MARCIN BERNATOWICZ' } });
              results.push('UPDATE_PROPS:ok');
            } catch (e) { results.push('UPDATE_PROPS:' + String(e.message || e)); }
            try {
              maybe.dispatch({
                type: 'ADD_SECTION',
                pageId,
                sectionType: 'section',
                label: 'Canvas Browser Proof',
                defaultProps: {},
                children: [],
              });
              results.push('ADD_SECTION:ok');
            } catch (e) { results.push('ADD_SECTION:' + String(e.message || e)); }
            found.dispatched = results;
            found.versionAfterDispatch = maybe.document?.version;
            found.sectionIdsAfter = (maybe.document?.pages?.[0]?.sections || []).map((s) => s.id);
            found.pageId = pageId;
            return;
          }
          walk(fiber.child, depth + 1);
          walk(fiber.sibling, depth + 1);
        };
        walk(root[key], 0);
        return found ? { ok: true, ...found, visited } : { ok: false, reason: 'no-builder-context', visited };
      });
      log('fiberResult', fiberResult);
      await sleep(1500);
      after = await dumpCanvas(page);
      const red = after.nodes.filter((n) => /rgb\(255,\s*0,\s*0\)/i.test(n.bg));
      const textHasMarcin = after.nodes.some((n) => /MARCIN BERNATOWICZ|Canvas Browser Proof/i.test(n.text));
      const newIds3 = after.uniqueIds.filter((id) => !before.uniqueIds.includes(id));
      const docChanged = Boolean(fiberResult.versionAfterDispatch && fiberResult.versionAfterDispatch !== fiberResult.versionBefore);
      const sectionsGrew = Boolean(fiberResult.sectionIdsAfter && fiberResult.sectionIdsAfter.length > (fiberResult.sectionCountBefore || 0));
      evidence.c3 = {
        fiberResult: { ...fiberResult, docRef: undefined },
        redCount: red.length,
        textHasMarcin,
        newIds: newIds3.slice(0, 8),
        uniqueAfter: after.uniqueCount,
        docChanged,
        sectionsGrew,
      };
      L('CANVAS_C3_FIBER', evidence.c3);
      // Document mutation proven via version bump + section list; Canvas DOM via red/new node
      if (red.length > 0 || textHasMarcin || newIds3.length > 0 || (docChanged && (fiberResult.sectionIdsAfter || []).length >= 2)) {
        pathUsed = pathUsed || (red.length || textHasMarcin || newIds3.length ? 'C3_react_dispatch_dom' : 'C3_react_dispatch_document_only');
        // Prefer DOM proof; if only document version changed without DOM, still try harder
        if (red.length > 0 || textHasMarcin || newIds3.length > 0) {
          status = 'VERIFIED';
        } else if (docChanged) {
          // Document mutated through production dispatch; wait for React re-render
          await sleep(2000);
          after = await dumpCanvas(page);
          const red2 = after.nodes.filter((n) => /rgb\(255,\s*0,\s*0\)/i.test(n.bg));
          const newIds4 = after.uniqueIds.filter((id) => !before.uniqueIds.includes(id));
          const text2 = after.nodes.some((n) => /MARCIN BERNATOWICZ|Canvas Browser Proof/i.test(n.text));
          evidence.c3.rerender = { redCount: red2.length, newIds: newIds4, text2, uniqueAfter: after.uniqueCount, ids: after.uniqueIds };
          L('CANVAS_C3_RERENDER', evidence.c3.rerender);
          if (red2.length > 0 || newIds4.length > 0 || text2) status = 'VERIFIED';
        }
      }
    }

    await page.screenshot({ path: path.join(OUT, 'after.png') });
    evidence.errors = errors.slice(0, 8);
    evidence.pathUsed = pathUsed;
    evidence.status = status;
    evidence.beforeUnique = before.uniqueIds;
    evidence.afterUnique = after.uniqueIds;
    evidence.afterRed = after.nodes.filter((n) => /rgb\(255,\s*0,\s*0\)/i.test(n.bg)).slice(0, 5);

    L('FAZA7_CANVAS_BROWSER', {
      status,
      pathUsed,
      red: evidence.afterRed,
      newIds: after.uniqueIds.filter((id) => !before.uniqueIds.includes(id)).slice(0, 10),
      uniqueBefore: before.uniqueCount,
      uniqueAfter: after.uniqueCount,
      errors: errors.slice(0, 5),
      note: 'Document→Canvas DOM proof via [data-node-id]/[data-section-id] delta',
    });
  } catch (e) {
    status = 'UNVERIFIED';
    L('FAZA7_CANVAS_ERROR', { error: String(e?.message || e), status });
  }

  await browser.close();
  fs.writeFileSync(path.join(OUT, 'result.json'), JSON.stringify({ status, pathUsed, evidence, at: new Date().toISOString() }, null, 2));
  log('FINAL', status, pathUsed);
})().catch((e) => {
  L('FAZA7_FATAL', { error: String(e?.message || e) });
  process.exit(1);
});
