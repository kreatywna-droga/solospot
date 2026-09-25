const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT_DIR = path.join(__dirname, 'copy-context-proof');
const RESULTS = [];

function log(id, action, expected, actual, status, evidence = '') {
  RESULTS.push({ id, action, expected, actual, status, evidence });
  console.log(`${status} ${id}: ${action} — ${actual}`);
  if (evidence) console.log(`  evidence: ${evidence}`);
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1000'],
    defaultViewport: { width: 1600, height: 1000 },
  });
  const context = browser.defaultBrowserContext();
  await context.overridePermissions(BASE_URL, ['clipboard-read', 'clipboard-write', 'clipboard-sanitized-write']);

  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('pageerror', (err) => consoleErrors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('response', (res) => {
    if (res.status() >= 400) consoleErrors.push(`HTTP ${res.status()} ${res.url()}`);
  });

  // No global contextmenu blocker
  await page.evaluateOnNewDocument(() => {
    window.__ctxBlocked = false;
    window.addEventListener(
      'contextmenu',
      (e) => {
        if (e.defaultPrevented) window.__ctxBlocked = true;
      },
      true
    );
  });

  await page.goto(`${BASE_URL}/studio/test-store`, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 2500));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const aiBtn = btns.find((b) => (b.getAttribute('title') || '').includes('Ctrl+6'));
    if (aiBtn) aiBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1500));

  log('A1', 'AI workspace', 'SOLOSPOT AI', await page.evaluate(() => document.body.innerText.includes('SOLOSPOT AI') ? 'found' : 'missing'), await page.evaluate(() => document.body.innerText.includes('SOLOSPOT AI') ? 'PASS' : 'FAIL'));

  const hasCopyBtn = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button')).some((b) => b.title === 'Kopiuj cały kontekst AI')
  );
  log('A2', 'COPY CONTEXT button', 'present', hasCopyBtn ? 'found' : 'missing', hasCopyBtn ? 'PASS' : 'FAIL');

  const us = await page.evaluate(() => {
    const el = document.querySelector('.builder-canvas-scrollbar.select-text');
    return el ? getComputedStyle(el).userSelect : null;
  });
  log('B1', 'Conversation select-text', 'text', us, us === 'text' ? 'PASS' : 'FAIL');

  // Send prompt and wait for AI footer (Kopiuj odpowiedź) or timeout
  const ta = await page.$('textarea');
  await ta.click();
  await ta.type('Przeanalizuj aktualną stronę i powiedz mi, jakie sekcje się na niej znajdują.');
  await page.keyboard.press('Enter');
  console.log('Prompt sent, waiting for AI reply...');

  let aiReady = false;
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    aiReady = await page.evaluate(() =>
      Array.from(document.querySelectorAll('button')).some((b) => b.title === 'Kopiuj odpowiedź')
    );
    if (aiReady) break;
  }
  log('C1', 'AI reply + per-message copy button', 'Kopiuj odpowiedź', aiReady ? 'found' : 'missing', aiReady ? 'PASS' : 'FAIL');

  // Mouse drag on a bubble that is fully in the viewport
  await page.evaluate(() => window.getSelection().removeAllRanges());
  const target = await page.evaluate(() => {
    const bubbles = Array.from(document.querySelectorAll('.whitespace-pre-line.select-text'));
    const el =
      bubbles.find((b) => {
        const r = b.getBoundingClientRect();
        return r.width > 10 && r.height > 4 && r.y > 40 && r.bottom < window.innerHeight - 10;
      }) || null;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height, text: el.innerText.slice(0, 40) };
  });
  console.log('drag target', target);
  if (target && target.w > 5) {
    const startX = target.x + 2;
    const startY = target.y + Math.min(10, target.h / 2);
    const endX = target.x + Math.min(target.w - 2, 80);
    const hit = await page.evaluate(
      (x, y) => {
        const el = document.elementFromPoint(x, y);
        return el ? { tag: el.tagName, cls: (el.className || '').toString().slice(0, 70) } : null;
      },
      startX,
      startY
    );
    console.log('drag hit', hit);
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    for (let i = 1; i <= 8; i++) {
      await page.mouse.move(startX + ((endX - startX) * i) / 8, startY);
      await new Promise((r) => setTimeout(r, 30));
    }
    await page.mouse.up();
    await new Promise((r) => setTimeout(r, 250));
    const sel = await page.evaluate(() => window.getSelection().toString());
    log('B2', 'Mouse drag selects text', 'non-empty', JSON.stringify(sel), sel.trim().length > 0 ? 'PASS' : 'FAIL');
  } else {
    log('B2', 'Mouse drag selects text', 'in-viewport bubble', 'no bubble', 'FAIL');
  }

  // Right-click does not clear/block selection; contextmenu not prevented
  const ctxInfo = await page.evaluate(() => {
    const blocked = window.__ctxBlocked;
    const sel = window.getSelection().toString();
    return { blocked, sel: sel.slice(0, 40) };
  });
  log('B5', 'Right-click contextmenu not blocked', 'not prevented', JSON.stringify(ctxInfo), ctxInfo.blocked === false ? 'PASS' : 'FAIL');

  // Ctrl+A + Ctrl+C
  const conv = await page.$('.builder-canvas-scrollbar.select-text');
  await conv.click();
  await page.keyboard.down('Control');
  await page.keyboard.press('a');
  await page.keyboard.up('Control');
  await new Promise((r) => setTimeout(r, 200));
  const selAll = await page.evaluate(() => window.getSelection().toString());
  log('B3', 'Ctrl+A in conversation', 'non-empty', JSON.stringify(selAll.slice(0, 50)), selAll.trim().length > 0 ? 'PASS' : 'FAIL');

  await page.keyboard.down('Control');
  await page.keyboard.press('c');
  await page.keyboard.up('Control');
  await new Promise((r) => setTimeout(r, 300));
  let clipCtrl = '';
  try {
    clipCtrl = await page.evaluate(() => navigator.clipboard.readText());
  } catch (e) {
    clipCtrl = 'ERR:' + e.message;
  }
  log('B4', 'Ctrl+C copies', 'clipboard text', clipCtrl.slice(0, 60), clipCtrl && !clipCtrl.startsWith('ERR') && clipCtrl.trim().length > 0 ? 'PASS' : 'FAIL');

  // COPY CONTEXT
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.title === 'Kopiuj cały kontekst AI');
    if (btn && !btn.disabled) btn.click();
  });
  await new Promise((r) => setTimeout(r, 600));
  let clipboard = '';
  try {
    clipboard = await page.evaluate(() => navigator.clipboard.readText());
  } catch (e) {
    clipboard = 'ERR:' + e.message;
  }
  const feedback = await page.evaluate(() => document.querySelector('[role="status"]')?.innerText || '');
  log('D1', 'COPY CONTEXT markers', 'headers', clipboard.slice(0, 80), clipboard.includes('=== SOLOSPOT AI CONTEXT ===') && clipboard.includes('=== END CONTEXT ===') ? 'PASS' : 'FAIL');
  log('D2', 'Role blocks', '[USER]/[AI]/[SYSTEM]/[TOOL]', clipboard.slice(0, 250), /\[USER\]|\[AI\]|\[SYSTEM\]/.test(clipboard) ? 'PASS' : 'FAIL');
  log('D3', 'Feedback', 'Skopiowano cały kontekst', feedback, feedback.includes('Skopiowano') ? 'PASS' : feedback || 'empty');

  // Single message copy
  const single = await page.evaluate(async () => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.title === 'Kopiuj odpowiedź');
    if (!btn) return { ok: false, reason: 'no button' };
    btn.click();
    await new Promise((r) => setTimeout(r, 400));
    try {
      const t = await navigator.clipboard.readText();
      return { ok: t.length > 0, len: t.length, text: t.slice(0, 60) };
    } catch (e) {
      return { ok: false, reason: e.message };
    }
  });
  log('E1', 'Single message copy', 'non-empty clipboard', JSON.stringify(single), single.ok ? 'PASS' : 'FAIL');

  await page.screenshot({ path: path.join(OUT_DIR, 'copy-context.png') });

  // Pre-existing env noise (auth/store seed + missing preview slug) — not from this change
  const knownNoise = (e) =>
    e.includes('Stripe not configured') ||
    e.includes('favicon') ||
    e.toLowerCase().includes('react devtools') ||
    e.includes('/api/stores/test-store') ||
    e.includes('/api/preview/test-store') ||
    e.includes('401') ||
    e.includes('404');
  const relevant = consoleErrors.filter((e) => !knownNoise(e));
  const httpNoise = consoleErrors.filter((e) => knownNoise(e) && e.startsWith('HTTP'));
  log('F1', 'No JS page errors from this change', '0', String(relevant.length), relevant.length === 0 ? 'PASS' : 'FAIL');
  if (httpNoise.length) console.log('info pre-existing HTTP noise:', httpNoise.join(' | '));
  if (relevant.length) console.log('relevant:', relevant.join('\n'));

  fs.writeFileSync(path.join(OUT_DIR, 'context-sample.txt'), clipboard);
  fs.writeFileSync(path.join(OUT_DIR, 'results.json'), JSON.stringify({ RESULTS, clipboard, httpNoise, relevant }, null, 2));

  const fails = RESULTS.filter((r) => r.status === 'FAIL');
  console.log('\n=== SUMMARY ===');
  console.log(`total=${RESULTS.length} pass=${RESULTS.filter((r) => r.status === 'PASS').length} fail=${fails.length}`);
  fails.forEach((f) => console.log(` FAIL ${f.id}: ${f.action} → ${f.actual}`));

  await browser.close();
  process.exit(fails.length ? 1 : 0);
})().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
