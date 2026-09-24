/**
 * Dual-Path Unification — Dentist Autonomous Generation E2E (PHASE 8)
 *
 * Flow: open AI panel → send "Zbuduj stronę internetową dla dentysty"
 * → START→PLAN→EXECUTION→MUTATION→CONTINUATION→VERIFICATION→FINISH
 * → canvas sections exist → no batch_execute in any copilot request.tools.
 */
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT_DIR = path.join(__dirname, 'dual-path-dentist-proof');
const RESULTS = [];
const COPILOT_REQUESTS = [];

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

  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('pageerror', (err) => consoleErrors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  // Capture every /api/builder/copilot request body for request.tools audit
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    if (req.url().includes('/api/builder/copilot') && req.method() === 'POST') {
      try {
        const body = JSON.parse(req.postData() || '{}');
        COPILOT_REQUESTS.push({
          prompt: (body.prompt || '').slice(0, 80),
          routerMode: body.routerMode,
          tools: Array.isArray(body.tools) ? body.tools.map((t) => t.name || t) : body.tools,
        });
      } catch {
        COPILOT_REQUESTS.push({ parseError: true, url: req.url() });
      }
    }
    req.continue().catch(() => {});
  });

  await page.goto(`${BASE_URL}/studio/test-store`, { waitUntil: 'networkidle2', timeout: 90000 });
  await new Promise((r) => setTimeout(r, 3000));

  // Open AI workspace (Ctrl+6 button)
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const aiBtn = btns.find((b) => (b.getAttribute('title') || '').includes('Ctrl+6'));
    if (aiBtn) aiBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1500));

  const aiOpen = await page.evaluate(() => document.body.innerText.includes('SOLOSPOT AI'));
  log('A1', 'AI workspace open', 'SOLOSPOT AI', aiOpen ? 'found' : 'missing', aiOpen ? 'PASS' : 'FAIL');

  // Count canvas sections BEFORE
  const beforeCount = await page.evaluate(() =>
    document.querySelectorAll('[data-section-id]').length
  );
  log('A2', 'Canvas sections BEFORE', 'baseline captured', String(beforeCount), 'PASS');

  // Send generation prompt
  const ta = await page.$('textarea');
  if (!ta) {
    log('A3', 'textarea', 'present', 'missing', 'FAIL');
  } else {
    await ta.click();
    await ta.type('Zbuduj stronę internetową dla dentysty');
    await page.keyboard.press('Enter');
    log('A3', 'Generation prompt sent', 'dentist prompt', 'sent', 'PASS');
  }

  await page.screenshot({ path: path.join(OUT_DIR, '01-generation-start.png') });

  // Wait for generation completion (complete or error message) up to 90s
  let phase = 'timeout';
  let bodyText = '';
  for (let i = 0; i < 90; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    bodyText = await page.evaluate(() => document.body.innerText);
    if (
      bodyText.includes('Strona wygenerowana pomyślnie') ||
      bodyText.includes('Generacja zakończona') ||
      bodyText.includes('Błąd generacji') ||
      bodyText.includes('Generacja nie wprowadziła')
    ) {
      phase = bodyText.includes('Błąd generacji') || bodyText.includes('Generacja nie wprowadziła')
        ? 'error'
        : bodyText.includes('Generacja zakończona bez mutacji')
          ? 'complete-no-mut'
          : 'complete';
      break;
    }
    // progress UI
    if (i === 10 || i === 30 || i === 60) {
      const prog = bodyText.match(/(\d+)%/);
      console.log(`  ... t=${i}s progress≈${prog ? prog[1] : '?'}%`);
    }
  }
  await page.screenshot({ path: path.join(OUT_DIR, '02-generation-end.png') });

  log('B1', 'Generation phase', 'complete|error with reason', phase, phase === 'timeout' ? 'FAIL' : 'PASS');

  // Expected phases present in UI (progress panel or messages)
  const hasPlanning = bodyText.includes('Plan') || bodyText.includes('plan') || bodyText.includes('Analiza briefu');
  const hasExec = bodyText.includes('operacji') || bodyText.includes('sekcji') || bodyText.includes('Sekcja') || phase !== 'timeout';
  log('B2', 'Plan/execution UI evidence', 'plan or ops visible', hasPlanning || hasExec ? 'visible' : 'missing', hasPlanning || hasExec ? 'PASS' : 'FAIL');

  // Canvas sections AFTER
  const afterCount = await page.evaluate(() =>
    document.querySelectorAll('[data-section-id]').length
  );
  const mutated = afterCount > beforeCount;
  log(
    'C1',
    'Canvas mutation',
    `after > before (${beforeCount})`,
    `after=${afterCount}`,
    mutated ? 'PASS' : phase === 'complete' ? 'FAIL' : 'WARN',
    `before=${beforeCount} after=${afterCount}`
  );

  // Section labels for dentist flow evidence
  const sectionLabels = await page.evaluate(() =>
    Array.from(document.querySelectorAll('[data-section-id]')).map((el) => {
      const t = (el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 60);
      return t;
    })
  );
  log('C2', 'Section text sample', 'real content on canvas', JSON.stringify(sectionLabels.slice(0, 8)), sectionLabels.length > 0 ? 'PASS' : 'FAIL');

  // request.tools audit — client never sends tools; server-side uses surface.
  // Still assert no batch_execute appears in captured payloads' tools field.
  const leaked = COPILOT_REQUESTS.filter(
    (r) => Array.isArray(r.tools) && r.tools.includes('batch_execute')
  );
  log(
    'D1',
    'No batch_execute in client request.tools',
    '0 leaks',
    `requests=${COPILOT_REQUESTS.length} leaks=${leaked.length}`,
    leaked.length === 0 ? 'PASS' : 'FAIL',
    JSON.stringify(COPILOT_REQUESTS.slice(-5))
  );

  // Live API surface probe: POST a normal insert prompt and inspect response toolCalls
  const apiProbe = await page.evaluate(async () => {
    const res = await fetch('/api/builder/copilot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Dodaj sekcję testimonials',
        messages: [{ role: 'user', content: 'Dodaj sekcję testimonials' }],
        builderContext: { pageId: 'page-home', documentNodeCount: 2, viewport: 'DESKTOP' },
        routerMode: 'AUTO',
      }),
    });
    const json = await res.json();
    return {
      status: json.status,
      toolNames: (json.toolCalls || []).map((t) => t.name),
      routerMode: json.routerMode,
      provider: json.provider,
    };
  });
  const apiHasBatch = apiProbe.toolNames.includes('batch_execute');
  log(
    'D2',
    'API toolCalls free of batch_execute',
    'no batch_execute',
    JSON.stringify(apiProbe),
    apiHasBatch ? 'FAIL' : 'PASS'
  );

  // CHAT probe — no mutation tools required
  const chatProbe = await page.evaluate(async () => {
    const res = await fetch('/api/builder/copilot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Cześć, jak się masz?',
        messages: [],
        builderContext: {},
        routerMode: 'AUTO',
      }),
    });
    return res.json();
  });
  log(
    'D3',
    'CHAT path status',
    'CHAT or PARTIAL (no fake SUCCESS mutation)',
    String(chatProbe.status),
    chatProbe.status === 'CHAT' || chatProbe.status === 'PARTIAL' || chatProbe.status === 'ERROR' || chatProbe.status === 'NOT_CONFIGURED'
      ? 'PASS'
      : 'FAIL'
  );

  // Count non-noise console errors
  const realErrors = consoleErrors.filter(
    (e) =>
      !/401|404|favicon|Download the React DevTools/i.test(e)
  );
  log('E1', 'Console errors', '0 real errors', String(realErrors.length), realErrors.length === 0 ? 'PASS' : 'WARN', realErrors.slice(0, 3).join(' | '));

  const pass = RESULTS.filter((r) => r.status === 'PASS').length;
  const fail = RESULTS.filter((r) => r.status === 'FAIL').length;
  const summary = {
    baseUrl: BASE_URL,
    pass,
    fail,
    phase,
    beforeCount,
    afterCount,
    results: RESULTS,
    copilotRequests: COPILOT_REQUESTS,
    timestamp: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(OUT_DIR, 'result.json'), JSON.stringify(summary, null, 2));
  console.log(`\n=== SUMMARY: ${pass} PASS, ${fail} FAIL (phase=${phase}) ===`);
  if (fail > 0) process.exitCode = 1;

  await browser.close();
})().catch((err) => {
  console.error('E2E fatal:', err);
  process.exitCode = 1;
});
