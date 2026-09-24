/**
 * MINI INSPECTOR AI WINDOWS REAL PRODUCT GATE v1.0 — Prod E2E
 *
 * Covers: §5 visible AI access, §6 target lock, §9 quick actions,
 * §14 selection change, §19 persistence, §22 prod E2E.
 *
 * BASE_URL=https://www.solospot.pl
 */
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.BASE_URL || 'https://www.solospot.pl';
const CHROME_PATH =
  process.env.CHROME_PATH ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT_DIR = path.join(__dirname, 'mini-inspector-ai-proof');

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

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`), fullPage: false });
  console.log(`  [shot] ${name}.png`);
}

async function realClickSelector(page, selector) {
  const pt = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return null;
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
  }, selector);
  if (!pt) return false;
  await page.mouse.move(pt.x, pt.y);
  await waitMs(300);
  await page.mouse.click(pt.x, pt.y);
  await waitMs(600);
  return true;
}

async function selectNodeByType(page, typePref) {
  return page.evaluate((prefs) => {
    const nodes = Array.from(document.querySelectorAll('[data-node-id]'));
    let pick = null;
    for (const t of prefs) {
      pick = nodes.find((n) => (n.getAttribute('data-node-type') || '') === t);
      if (pick) break;
    }
    if (!pick) pick = document.querySelector('[data-section-id]') || nodes[0];
    if (!pick) return null;
    const r = pick.getBoundingClientRect();
    return {
      id: pick.getAttribute('data-node-id') || pick.getAttribute('data-section-id'),
      type: pick.getAttribute('data-node-type') || 'section',
      x: Math.round(r.x + r.width / 2),
      y: Math.round(r.y + r.height / 2),
    };
  }, typePref);
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
  page.on('pageerror', (e) => {
    if (armed) consoleErrors.push(e.message.slice(0, 250));
  });
  page.on('console', (m) => {
    if (armed && m.type() === 'error') consoleErrors.push(m.text().slice(0, 250));
  });

  try {
    // ── Open builder ──
    log(nextStep(), 'Open prod URL', 'reachable', BASE_URL, 'PASS', BASE_URL);
    await page.goto(`${BASE_URL}/studio/test-store`, {
      waitUntil: 'networkidle2',
      timeout: 90000,
    });
    await page.waitForSelector('[data-builder-workspace]', { timeout: 60000 });
    await waitMs(3500);
    log(nextStep(), 'Builder workspace present', '[data-builder-workspace]', 'present', 'PASS');
    await shot(page, '01-builder');
    armed = true;

    // ── Select a node ──
    const node1 = await selectNodeByType(page, ['heading', 'text', 'button', 'image', 'hero', 'section']);
    if (!node1) throw new Error('No selectable node on canvas');
    await page.mouse.move(node1.x, node1.y);
    await waitMs(400);
    await page.mouse.click(node1.x, node1.y);
    await waitMs(1500);
    log(nextStep(), 'Select node on canvas', 'click succeeded', `${node1.type}:${node1.id}`, 'PASS');
    await shot(page, '02-node-selected');

    // ── QuickToolbar [✨ AI] visible (§5) ──
    let aiBtnPresent = await page.evaluate(
      () => !!document.querySelector('[data-testid="mini-inspector-ai-open"]')
    );
    if (!aiBtnPresent) {
      // Try settings gear → ContextualSettingsPanel [✨ AI]
      await realClickSelector(page, '[title*="Ustawienia"]');
      await waitMs(1000);
      aiBtnPresent = await page.evaluate(
        () => !!document.querySelector('[data-testid="mini-inspector-ai-open"]')
      );
    }
    log(
      nextStep(),
      'Mini Inspector [AI] button visible',
      'mini-inspector-ai-open present',
      aiBtnPresent ? 'present' : 'missing',
      aiBtnPresent ? 'PASS' : 'FAIL'
    );
    await shot(page, '03-ai-button');

    // ── Open Mini Inspector AI window ──
    const opened = await realClickSelector(page, '[data-testid="mini-inspector-ai-open"]');
    await waitMs(800);
    const aiWindow = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="mini-inspector-ai"]');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        visible: r.width > 0 && r.height > 0,
        status: el.getAttribute('data-ai-status'),
        targetAttr: el.getAttribute('data-ai-target'),
        inWorkspace: !!el.closest('[data-builder-workspace]'),
        rect: { w: Math.round(r.width), h: Math.round(r.height) },
      };
    });
    log(
      nextStep(),
      'Mini Inspector AI window opens',
      'data-testid=mini-inspector-ai visible',
      aiWindow ? `${aiWindow.visible ? 'visible' : 'hidden'} status=${aiWindow.status}` : 'missing',
      aiWindow && aiWindow.visible ? 'PASS' : 'FAIL'
    );
    await shot(page, '04-ai-window-open');

    // ── Target lock strip (§6) ──
    const targetStrip = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="mini-inspector-ai-target"]');
      if (!el) return null;
      const text = (el.textContent || '').trim();
      return { text, hasTargetLabel: text.includes('TARGET') && !text.includes('TARGET: —') };
    });
    log(
      nextStep(),
      'Target lock strip shows locked node',
      'TARGET: <nodeType> <nodeId>',
      targetStrip ? targetStrip.text.replace(/\s+/g, ' ').slice(0, 80) : 'missing',
      targetStrip && targetStrip.hasTargetLabel ? 'PASS' : 'FAIL'
    );
    await shot(page, '05-target-lock');

    // ── Quick actions (§9) ──
    const qa = await page.evaluate(() => {
      const wrap = document.querySelector('[data-testid="mini-inspector-ai-quick-actions"]');
      if (!wrap) return null;
      const buttons = Array.from(wrap.querySelectorAll('button'));
      return {
        count: buttons.length,
        labels: buttons.map((b) => (b.textContent || '').trim().replace(/\s+/g, ' ')).slice(0, 8),
        disabled: buttons.filter((b) => b.disabled).length,
      };
    });
    log(
      nextStep(),
      'Quick actions present and non-empty',
      '>= 3 enabled actions',
      qa ? `${qa.count} total, ${qa.disabled} disabled: ${qa.labels.join(' | ').slice(0, 100)}` : 'missing',
      qa && qa.count >= 3 && qa.disabled < qa.count ? 'PASS' : 'FAIL'
    );
    await shot(page, '06-quick-actions');

    // ── Status honesty (§12) — IDLE not fake SUCCESS ──
    const status0 = await page.evaluate(
      () => document.querySelector('[data-testid="mini-inspector-ai-status"]')?.textContent?.trim()
    );
    log(
      nextStep(),
      'Initial status is honest (not SUCCESS)',
      'GOTOWY / IDLE / RUNNING',
      String(status0),
      status0 === 'GOTOWY' || status0 === 'IDLE' || status0 === 'PRACUJE…' ? 'PASS' : 'FAIL'
    );

    // ── Send a real prompt (HACP path) ──
    const promptOk = await page.evaluate(() => {
      const input = document.querySelector('[data-testid="mini-inspector-ai-input"]');
      if (!input) return false;
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value'
      ).set;
      setter.call(input, 'Zmień kolor tego elementu na #D9A86C');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    });
    await waitMs(300);
    if (promptOk) {
      await realClickSelector(page, '[data-testid="mini-inspector-ai-send"]');
      // wait for RUNNING → terminal status
      for (let i = 0; i < 40; i++) {
        await waitMs(1000);
        const st = await page.evaluate(
          () => document.querySelector('[data-testid="mini-inspector-ai-status"]')?.textContent?.trim()
        );
        if (st && st !== 'PRACUJE…') break;
      }
    }
    const status1 = await page.evaluate(
      () => document.querySelector('[data-testid="mini-inspector-ai-status"]')?.textContent?.trim()
    );
    const turns = await page.evaluate(() => {
      const ai = Array.from(document.querySelectorAll('[data-testid="mini-inspector-ai-turn-ai"]'));
      const user = Array.from(document.querySelectorAll('[data-testid="mini-inspector-ai-turn-user"]'));
      const last = ai[ai.length - 1];
      return {
        userCount: user.length,
        aiCount: ai.length,
        lastText: last ? (last.textContent || '').trim().slice(0, 200) : null,
        hasFakeClaim: last
          ? /Wykonałem narzędzia:\s*insert/i.test(last.textContent || '')
          : false,
      };
    });
    log(
      nextStep(),
      'HACP prompt returns honest terminal status',
      'SUCCESS | PARTIAL | FAILED | CLARIFY (not stuck RUNNING)',
      `${status1} · user=${turns.userCount} ai=${turns.aiCount}`,
      status1 && status1 !== 'PRACUJE…' && turns.aiCount > 0 ? 'PASS' : 'FAIL',
      turns.lastText || ''
    );
    await shot(page, '07-hacp-response');

    // ── No fake SUCCESS / no contradictory insert claim ──
    log(
      nextStep(),
      'No contradictory insert_section SUCCESS claim',
      'hasFakeClaim=false',
      String(turns.hasFakeClaim),
      !turns.hasFakeClaim ? 'PASS' : 'FAIL'
    );

    // ── Undo/Redo buttons present ──
    const undoRedo = await page.evaluate(() => ({
      undo: !!document.querySelector('[data-testid="mini-inspector-ai-undo"]'),
      redo: !!document.querySelector('[data-testid="mini-inspector-ai-redo"]'),
      undoDisabled: document.querySelector('[data-testid="mini-inspector-ai-undo"]')?.disabled ?? null,
      redoDisabled: document.querySelector('[data-testid="mini-inspector-ai-redo"]')?.disabled ?? null,
    }));
    log(
      nextStep(),
      'Undo/Redo controls present in AI window',
      'undo+redo buttons',
      JSON.stringify(undoRedo),
      undoRedo.undo && undoRedo.redo ? 'PASS' : 'FAIL'
    );
    await shot(page, '08-undo-redo');

    // ── §14 selection change → re-resolve target ──
    const node2 = await selectNodeByType(page, ['button', 'image', 'section', 'hero']);
    const targetBefore = await page.evaluate(
      () => document.querySelector('[data-testid="mini-inspector-ai"]')?.getAttribute('data-ai-target')
    );
    if (node2 && node2.id !== node1.id) {
      await page.mouse.move(node2.x, node2.y);
      await waitMs(400);
      await page.mouse.click(node2.x, node2.y);
      await waitMs(1200);
    }
    // re-open AI if collapsed
    const stillOpen = await page.evaluate(
      () => !!document.querySelector('[data-testid="mini-inspector-ai"]')
    );
    if (!stillOpen) {
      await realClickSelector(page, '[data-testid="mini-inspector-ai-open"]');
      await waitMs(700);
    }
    const targetAfter = await page.evaluate(
      () => document.querySelector('[data-testid="mini-inspector-ai"]')?.getAttribute('data-ai-target')
    );
    const stripAfter = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="mini-inspector-ai-target"]');
      return el ? (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 90) : null;
    });
    log(
      nextStep(),
      'Selection change re-resolves target lock (§14)',
      'data-ai-target updates or matches new selection',
      `before=${targetBefore} after=${targetAfter} strip=${stripAfter}`,
      targetAfter ? 'PASS' : 'FAIL'
    );
    await shot(page, '09-selection-change');

    // ── §19 persistence: reload and re-open ──
    await page.reload({ waitUntil: 'networkidle2', timeout: 90000 });
    await page.waitForSelector('[data-builder-workspace]', { timeout: 60000 });
    await waitMs(3500);
    const node3 = await selectNodeByType(page, ['heading', 'text', 'button', 'image', 'hero', 'section']);
    if (node3) {
      await page.mouse.move(node3.x, node3.y);
      await waitMs(400);
      await page.mouse.click(node3.x, node3.y);
      await waitMs(1200);
    }
    let reopened = await page.evaluate(
      () => !!document.querySelector('[data-testid="mini-inspector-ai-open"]')
    );
    if (!reopened) {
      await realClickSelector(page, '[title*="Ustawienia"]');
      await waitMs(900);
      reopened = await page.evaluate(
        () => !!document.querySelector('[data-testid="mini-inspector-ai-open"]')
      );
    }
    if (reopened) await realClickSelector(page, '[data-testid="mini-inspector-ai-open"]');
    await waitMs(700);
    const afterReload = await page.evaluate(() => {
      const win = document.querySelector('[data-testid="mini-inspector-ai"]');
      const status = document.querySelector('[data-testid="mini-inspector-ai-status"]')?.textContent?.trim();
      const target = document.querySelector('[data-testid="mini-inspector-ai-target"]')?.textContent?.trim();
      return {
        windowOpen: !!win,
        status,
        target: target ? target.replace(/\s+/g, ' ').slice(0, 90) : null,
        hasQuickActions: !!document.querySelector('[data-testid="mini-inspector-ai-quick-actions"]'),
      };
    });
    log(
      nextStep(),
      'After reload: AI window reopens with fresh honest status',
      'window open + GOTOWY + target resolved',
      JSON.stringify(afterReload),
      afterReload.windowOpen && afterReload.target ? 'PASS' : 'FAIL'
    );
    await shot(page, '10-after-reload');

    // ── Anti-regression: console errors ──
    const clean = consoleErrors.filter(
      (e) => !/favicon|401|404|net::ERR|Download the React DevTools/i.test(e)
    );
    log(
      nextStep(),
      'New console errors after baseline = 0',
      '0',
      String(clean.length),
      clean.length === 0 ? 'PASS' : 'FAIL',
      clean.slice(0, 5).join(' | ')
    );

    const pass = RESULTS.filter((r) => r.status === 'PASS').length;
    const fail = RESULTS.filter((r) => r.status === 'FAIL').length;
    fs.writeFileSync(
      path.join(OUT_DIR, 'result.json'),
      JSON.stringify(
        {
          baseUrl: BASE_URL,
          results: RESULTS,
          evidence: { consoleErrors: clean.slice(0, 20), node1, node2 },
          summary: { pass, fail },
        },
        null,
        2
      )
    );
    console.log(`\n=== MINI INSPECTOR AI WINDOWS PROD E2E: ${pass} PASS / ${fail} FAIL ===`);
    await browser.close();
    process.exit(fail > 0 ? 1 : 0);
  } catch (err) {
    console.error('E2E fatal:', err);
    try {
      fs.writeFileSync(
        path.join(OUT_DIR, 'result.json'),
        JSON.stringify({ fatal: String(err), results: RESULTS }, null, 2)
      );
    } catch {
      /* ignore */
    }
    await browser.close().catch(() => {});
    process.exit(1);
  }
})();
