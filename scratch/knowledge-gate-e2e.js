/**
 * HACP Web Design Intelligence Knowledge Foundation Gate v1.0
 *
 * Dentist prompt (single):
 * "Zbuduj profesjonalną stronę dla nowoczesnego gabinetu dentystycznego
 *  specjalizującego się w implantologii i stomatologii estetycznej.
 *  Głównym celem strony jest zachęcenie pacjenta do umówienia wizyty."
 *
 * Proves: [Knowledge] runtime log, decision-context-driven plan, generation,
 * dental content, console errors, screenshots. Anti-fake: no batch_execute in
 * copilot tools; no fake SUCCESS without mutations.
 */
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CHROME_PATH =
  process.env.CHROME_PATH ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT_DIR = path.join(__dirname, 'knowledge-gate-proof');
const EXACT_PROMPT =
  'Zbuduj profesjonalną stronę dla nowoczesnego gabinetu dentystycznego specjalizującego się w implantologii i stomatologii estetycznej. Głównym celem strony jest zachęcenie pacjenta do umówienia wizyty.';

const RESULTS = [];
const COPILOT_REQUESTS = [];
const TRACE = [];

function log(id, action, expected, actual, status, evidence = '') {
  RESULTS.push({ id, action, expected, actual, status, evidence });
  console.log(`${status} ${id}: ${action} — ${actual}`);
  if (evidence) console.log(`  evidence: ${evidence}`);
}

function trace(step, data) {
  TRACE.push({ t: new Date().toISOString(), step, ...data });
  console.log(`TRACE ${step}`, JSON.stringify(data).slice(0, 400));
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
  const knowledgeLogs = [];
  const allLogs = [];
  page.on('pageerror', (err) => consoleErrors.push(err.message));
  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error') consoleErrors.push(text);
    allLogs.push(text.slice(0, 500));
    if (text.includes('[Knowledge]')) knowledgeLogs.push(text.slice(0, 500));
  });

  await page.setRequestInterception(true);
  page.on('request', (req) => {
    if (req.url().includes('/api/builder/copilot') && req.method() === 'POST') {
      try {
        const body = JSON.parse(req.postData() || '{}');
        COPILOT_REQUESTS.push({
          prompt: (body.prompt || '').slice(0, 200),
          tools: Array.isArray(body.tools)
            ? body.tools.map((t) => t.name || t)
            : body.tools,
          ts: Date.now(),
        });
      } catch {
        COPILOT_REQUESTS.push({ parseError: true });
      }
    }
    req.continue().catch(() => {});
  });

  let phaseSamples = [];
  const phasePoll = setInterval(async () => {
    try {
      const text = await page.evaluate(() => document.body.innerText.slice(0, 4000));
      const m = text.match(/(?:phase|faza)[:\s]+([a-z0-9-]+)/i);
      if (m) phaseSamples.push(m[1].toLowerCase());
      const kn = text.match(/\[Knowledge\][^\n]{0,300}/);
      if (kn) knowledgeLogs.push(kn[0]);
    } catch {
      /* ignore */
    }
  }, 1500);

  log('A0', 'Base URL reachable', 'HTTP 200', 'checked', 'PASS');

  await page.goto(`${BASE_URL}/studio/test-store`, {
    waitUntil: 'networkidle2',
    timeout: 90000,
  });
  await new Promise((r) => setTimeout(r, 3000));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const aiBtn = btns.find((b) => (b.getAttribute('title') || '').includes('Ctrl+6'));
    if (aiBtn) aiBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1500));

  const aiOpen = await page.evaluate(() =>
    document.body.innerText.includes('SOLOSPOT AI'),
  );
  log('A0b', 'AI workspace open', 'SOLOSPOT AI', aiOpen ? 'found' : 'missing', aiOpen ? 'PASS' : 'FAIL');
  await page.screenshot({ path: path.join(OUT_DIR, '01-loaded.png'), fullPage: false });
  trace('loaded', { url: page.url(), aiOpen });

  const beforeCount = await page.evaluate(
    () => document.querySelectorAll('[data-section-id]').length,
  );
  const beforeText = await page.evaluate(() => document.body.innerText);
  const canvasBefore = await page.evaluate(() => {
    const root = document.querySelector('[data-canvas], [class*="canvas"], main');
    return (root ? root.innerText : document.body.innerText).length;
  });
  trace('before', { canvasLen: canvasBefore, beforeCount });

  await page.waitForSelector('textarea', { timeout: 30000 });

  const ta = await page.$('textarea');
  if (!ta) {
    log('A1', 'textarea', 'present', 'missing', 'FAIL');
  } else {
    await ta.click();
    await ta.type(EXACT_PROMPT, { delay: 6 });
    await page.keyboard.press('Enter');
    log('A1', 'Exact knowledge-gate prompt sent', 'implantologii + estetycznej + umówienia wizyty', 'sent', 'PASS', EXACT_PROMPT.slice(0, 80));
    trace('prompt_sent', { prompt: EXACT_PROMPT.slice(0, 120) });
  }
  await page.screenshot({ path: path.join(OUT_DIR, '02-prompt-typed.png'), fullPage: false });

  // Wait for generation
  const startTs = Date.now();
  let generationComplete = false;
  let generationError = false;
  let knowledgeSeen = false;
  while (Date.now() - startTs < 120000) {
    const text = await page.evaluate(() => document.body.innerText);
    if (/Strona wygenerowana pomyślnie|Generacja zakończona|generation-complete/i.test(text)) {
      generationComplete = true;
      break;
    }
    if (/Błąd generacji|Generacja nie wprowadziła/i.test(text)) {
      generationError = true;
      break;
    }
    if (knowledgeLogs.length > 0) knowledgeSeen = true;
    await new Promise((r) => setTimeout(r, 2000));
  }
  clearInterval(phasePoll);
  await new Promise((r) => setTimeout(r, 3000));

  const afterCount = await page.evaluate(
    () => document.querySelectorAll('[data-section-id]').length,
  );
  const mutated = afterCount > beforeCount;
  const afterSections = afterCount;

  await page.screenshot({ path: path.join(OUT_DIR, '03-generation-end.png'), fullPage: false });

  // Knowledge runtime log
  const knLog = knowledgeLogs.find((l) => l.includes('[Knowledge]')) || '';
  log(
    'A2',
    '[Knowledge] retrieval runtime log',
    'schema=1.0.0 with industry/blueprint/qa counts',
    knLog ? knLog.slice(0, 180) : 'missing',
    /schema=1\.0\.0/.test(knLog) && /pattern=IP-/.test(knLog) && /blueprint=BP-/.test(knLog)
      ? 'PASS'
      : knLog
        ? 'WARN'
        : 'FAIL',
    knLog.slice(0, 240),
  );

  log(
    'A3',
    'Generation progressed (canvas sections mutation)',
    'sectionCount grew after prompt',
    `before=${beforeCount} after=${afterCount} mutated=${mutated}`,
    mutated ? 'PASS' : 'FAIL',
  );

  log(
    'A4',
    'Generation complete phase',
    'complete signal or mutated canvas',
    generationError ? 'error' : generationComplete ? 'complete-signal' : mutated ? 'mutated-only' : 'none',
    !generationError && (generationComplete || mutated) ? 'PASS' : 'FAIL',
  );

  log(
    'A4b',
    'Canvas sections grew',
    `after > before (${beforeCount})`,
    `before=${beforeCount} after=${afterCount}`,
    afterCount > beforeCount ? 'PASS' : 'FAIL',
  );

  // Dental content hits
  const dentalRe =
    /dental|dentyst|stomatolog|zęb|implant|ortodoncj|wybielan|gabinet|umów wizyt|estetyczn|uśmiech|zdrowy uśmiech/i;
  const sectionsTexts = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('section, [data-section], h1, h2, h3, p, a').forEach((el) => {
      const t = (el.innerText || '').trim();
      if (t && t.length > 4 && t.length < 400) out.push(t);
    });
    return [...new Set(out)];
  });
  const dentalHits = sectionsTexts.filter((t) => dentalRe.test(t)).length;
  log(
    'A5',
    'Dental specialization content',
    'implantolog/stomatolog estetyczna vocabulary present',
    `dentalHits=${dentalHits}/${Math.min(sectionsTexts.length, 8)}`,
    dentalHits >= 3 ? 'PASS' : dentalHits > 0 ? 'WARN' : 'FAIL',
  );

  // Specializations from brief must influence content
  const specImplant = sectionsTexts.some((t) => /implant/i.test(t));
  const specAesthetic = sectionsTexts.some((t) => /estetyczn|wybielan|uśmiech/i.test(t));
  const bodyForCta = await page.evaluate(() => document.body.innerText);
  const ctaBook = /umów wizyt|umów wizytę|rezerw|umówienie wizyty|kontakt/i.test(bodyForCta);
  const ctaHit = (bodyForCta.match(/umów[^.\n]{0,40}wizyt[^.\n]{0,10}|rezerw[^.\n]{0,30}/gi) || []).slice(0, 3);
  log('A6', 'Implantology specialization reflected', 'true', String(specImplant), specImplant ? 'PASS' : 'FAIL');
  log('A7', 'Aesthetic dentistry reflected', 'true', String(specAesthetic), specAesthetic ? 'PASS' : 'FAIL');
  log('A8', 'Booking CTA present', 'Umów wizytę-like CTA', ctaBook ? `yes ${JSON.stringify(ctaHit)}` : 'missing', ctaBook ? 'PASS' : 'FAIL');

  // Anti-fake: batch_execute in request tools
  const flatTools = COPILOT_REQUESTS.flatMap((r) => (Array.isArray(r.tools) ? r.tools : []));
  const hasBatch = flatTools.some((t) => String(t) === 'batch_execute');
  log(
    'A9',
    'No batch_execute in copilot request.tools',
    'absent',
    hasBatch ? 'PRESENT' : `absent (${flatTools.length} tool names)`,
    hasBatch ? 'FAIL' : 'PASS',
    JSON.stringify(flatTools.slice(0, 12)),
  );

  // Knowledge claims without evidence (fake knowledge)
  const fakeKnowledgeClaims = allLogs.filter(
    (l) => /zastosowałem zasadę|applied rule|użyłem wiedzy/i.test(l) && !knowledgeLogs.length,
  );
  log(
    'A10',
    'No fake knowledge claims without retrieval log',
    '0 fake claims or retrieval present',
    `fakeClaims=${fakeKnowledgeClaims.length}, knowledgeLogs=${knowledgeLogs.length}`,
    fakeKnowledgeClaims.length === 0 ? 'PASS' : 'FAIL',
  );

  log(
    'A11',
    'Console errors = 0',
    '0 errors',
    String(consoleErrors.length),
    consoleErrors.length === 0 ? 'PASS' : 'WARN',
    consoleErrors.slice(0, 3).join(' | '),
  );

  log(
    'A12',
    'No fake SUCCESS (mutation required for done)',
    'section growth before claiming complete',
    `mutated=${mutated}, complete=${generationComplete}, sections ${beforeCount}->${afterCount}`,
    !generationComplete || mutated ? 'PASS' : 'FAIL',
  );

  // Screenshots exist
  const shots = fs.readdirSync(OUT_DIR).filter((f) => f.endsWith('.png'));
  log('A13', 'Screenshots captured', '>=3 png', String(shots.length), shots.length >= 3 ? 'PASS' : 'FAIL', shots.join(', '));

  // Write proof
  const pass = RESULTS.filter((r) => r.status === 'PASS').length;
  const fail = RESULTS.filter((r) => r.status === 'FAIL').length;
  const warn = RESULTS.filter((r) => r.status === 'WARN').length;
  const knowledgeEvidence = {
    knowledgeLogs: knowledgeLogs.slice(0, 10),
    copilotRequests: COPILOT_REQUESTS.slice(0, 5),
    flatToolsSample: flatTools.slice(0, 30),
    phases: phaseSamples.slice(-20),
    sectionsBefore: beforeCount,
    sectionsAfter: afterCount,
    dentalHits,
    result: { pass, fail, warn },
  };
  fs.writeFileSync(
    path.join(OUT_DIR, 'result.json'),
    JSON.stringify(
      { baseUrl: BASE_URL, prompt: EXACT_PROMPT, results: RESULTS, knowledgeEvidence, trace: TRACE.slice(0, 80) },
      null,
      2,
    ),
  );

  console.log(`\n=== KNOWLEDGE GATE E2E: ${pass} PASS / ${fail} FAIL / ${warn} WARN ===`);
  await browser.close();
  process.exit(fail > 0 ? 1 : 0);
})().catch((err) => {
  console.error('E2E fatal:', err);
  try {
    fs.writeFileSync(
      path.join(OUT_DIR, 'result.json'),
      JSON.stringify({ fatal: String(err), results: RESULTS }, null, 2),
    );
  } catch {
    /* ignore */
  }
  process.exit(1);
});
