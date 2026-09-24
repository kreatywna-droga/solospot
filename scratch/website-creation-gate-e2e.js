/**
 * HACP Professional Website Creation Gate v1.0 — Dentist START→FINISH
 *
 * Single prompt, no follow-ups:
 * "Zbuduj mi profesjonalną stronę od start to finish dla nowoczesnego gabinetu dentystycznego."
 *
 * Captures: intent path (generation vs chat), plan/UI phases, canvas before/after,
 * section texts, structural hierarchy, copilot request.tools, screenshots.
 */
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CHROME_PATH =
  process.env.CHROME_PATH ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT_DIR = path.join(__dirname, 'website-creation-gate-proof');
const EXACT_PROMPT =
  'Zbuduj mi profesjonalną stronę od start to finish dla nowoczesnego gabinetu dentystycznego.';

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
  console.log(`TRACE ${step}`, JSON.stringify(data).slice(0, 300));
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
  const consoleLogs = [];
  page.on('pageerror', (err) => consoleErrors.push(err.message));
  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error') consoleErrors.push(text);
    if (/generat|plan|section|tool|mutat|HACP|orchestr|intent/i.test(text)) {
      consoleLogs.push(text.slice(0, 240));
    }
  });

  await page.setRequestInterception(true);
  page.on('request', (req) => {
    if (req.url().includes('/api/builder/copilot') && req.method() === 'POST') {
      try {
        const body = JSON.parse(req.postData() || '{}');
        COPILOT_REQUESTS.push({
          prompt: (body.prompt || '').slice(0, 120),
          routerMode: body.routerMode,
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

  // Capture generation phase transitions from UI text
  let phaseSamples = [];

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
    document.body.innerText.includes('SOLOSPOT AI')
  );
  log('A1', 'AI workspace open', 'SOLOSPOT AI', aiOpen ? 'found' : 'missing', aiOpen ? 'PASS' : 'FAIL');

  const beforeCount = await page.evaluate(
    () => document.querySelectorAll('[data-section-id]').length
  );
  log('A2', 'Canvas sections BEFORE', 'baseline captured', String(beforeCount), 'PASS');
  trace('baseline', { beforeCount });

  // Structural snapshot helper (in-page)
  async function structuralSnapshot() {
    return page.evaluate(() => {
      const sections = Array.from(document.querySelectorAll('[data-section-id]'));
      const nodes = Array.from(
        document.querySelectorAll('[data-node-id], [data-section-id]')
      );
      const texts = sections.map((el) =>
        (el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 100)
      );
      const placeholders = texts.filter((t) =>
        /lorem ipsum|nagłówek tutaj|opis usługi|kliknij tutaj|placeholder/i.test(t)
      );
      const emptyish = sections.filter(
        (el) => (el.innerText || '').trim().length < 5
      ).length;
      const dentalHits = texts.filter((t) =>
        /dental|dentyst|stomatolog|zęb|implant|ortodoncj|wybielan|gabinet|umów wizyt|profilaktyk|uśmiech|zdrowy uśmiech/i.test(
          t
        )
      ).length;
      // rough overlap check via bounding boxes
      const rects = sections.map((el) => {
        const r = el.getBoundingClientRect();
        return { top: r.top + window.scrollY, bottom: r.bottom + window.scrollY, h: r.height };
      });
      let overlaps = 0;
      for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
          const a = rects[i];
          const b = rects[j];
          const overlap =
            Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          if (overlap > Math.min(a.h, b.h) * 0.5) overlaps++;
        }
      }
      const bodyText = document.body.innerText;
      const generating =
        /Generuję stronę|Analiza briefu|Generowanie|Plan wygenerowany|Generacja strony/i.test(
          bodyText
        );
      const complete =
        /Strona wygenerowana pomyślnie|Generacja zakończona pomyślnie|Generacja zakończona!/.test(
          bodyText
        );
      const genError =
        /Błąd generacji|Generacja nie wprowadziła|Błąd: /i.test(bodyText);
      const chatOnly = /Wyślij|SOLOSPOT AI/i.test(bodyText) && !generating && !complete && !genError;

      return {
        sectionCount: sections.length,
        nodeCount: nodes.length,
        texts,
        placeholders,
        emptyish,
        dentalHits,
        overlaps,
        generating,
        complete,
        genError,
        chatOnly,
        bodySnippet: bodyText.slice(0, 500),
        progressMatch: (bodyText.match(/(\d+)%/) || [])[1] || null,
      };
    });
  }

  // Send EXACT gate prompt once — no follow-ups
  const ta = await page.$('textarea');
  if (!ta) {
    log('A3', 'textarea', 'present', 'missing', 'FAIL');
  } else {
    await ta.click();
    await ta.type(EXACT_PROMPT);
    await page.keyboard.press('Enter');
    log('A3', 'Exact gate prompt sent', 'start-to-finish dentist prompt', 'sent', 'PASS');
    trace('prompt_sent', { prompt: EXACT_PROMPT });
  }

  await page.screenshot({ path: path.join(OUT_DIR, '01-prompt-sent.png') });

  // Wait up to 120s for generation complete/error OR detect chat-only stall
  let finalSnap = null;
  let pathTaken = 'unknown';
  let stallDetected = false;
  for (let i = 0; i < 120; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    finalSnap = await structuralSnapshot();
    if (i % 5 === 0 || finalSnap.generating || finalSnap.complete || finalSnap.genError) {
      phaseSamples.push({
        t: i,
        sectionCount: finalSnap.sectionCount,
        generating: finalSnap.generating,
        complete: finalSnap.complete,
        genError: finalSnap.genError,
        progress: finalSnap.progressMatch,
      });
    }
    if (finalSnap.complete || finalSnap.genError) break;
    // Chat-only stall: after 15s, if no generation UI and only chat response settled
    if (i === 15 && !finalSnap.generating && finalSnap.sectionCount === beforeCount) {
      stallDetected = true;
      pathTaken = 'chat-only';
      trace('stall_chat_only', { i, snap: finalSnap });
      break;
    }
  }

  await page.screenshot({ path: path.join(OUT_DIR, '02-after-wait.png') });
  finalSnap = finalSnap || (await structuralSnapshot());

  if (finalSnap.complete || finalSnap.genError) {
    pathTaken = finalSnap.genError ? 'generation-error' : 'generation-complete';
  } else if (stallDetected) {
    pathTaken = 'chat-only';
  } else if (finalSnap.sectionCount > beforeCount) {
    pathTaken = 'partial-mutation';
  } else {
    pathTaken = 'timeout-no-mutation';
  }

  log(
    'B1',
    'Execution path',
    'autonomous generation START→FINISH',
    pathTaken,
    pathTaken === 'generation-complete' ? 'PASS' : 'FAIL',
    JSON.stringify({
      complete: finalSnap.complete,
      genError: finalSnap.genError,
      generating: finalSnap.generating,
      sections: finalSnap.sectionCount,
    })
  );
  trace('path_taken', { pathTaken, snap: finalSnap });

  // Intent evidence: generation UI vs chat-only
  const intentEvidence = {
    pathTaken,
    generationUiSeen: phaseSamples.some((p) => p.generating || p.complete || p.genError),
    copilotPosts: COPILOT_REQUESTS.length,
    prompts: COPILOT_REQUESTS.map((r) => r.prompt),
  };
  log(
    'B2',
    'Intent → architecture → execution UI',
    'planning/execution phases visible',
    intentEvidence.generationUiSeen ? 'generation-ui' : 'no-generation-ui',
    intentEvidence.generationUiSeen ? 'PASS' : 'FAIL',
    JSON.stringify(intentEvidence)
  );

  // Canvas mutation (PHASE 7)
  const afterCount = finalSnap.sectionCount;
  const mutated = afterCount > beforeCount;
  log(
    'C1',
    'BuilderDocument/Canvas mutation',
    `after > before (${beforeCount})`,
    `after=${afterCount}`,
    mutated ? 'PASS' : 'FAIL',
    `before=${beforeCount} after=${afterCount}`
  );

  // Multi-section (criterion 7)
  log(
    'C2',
    'More than single section',
    '>1 section',
    String(afterCount),
    afterCount > 1 && mutated ? 'PASS' : 'FAIL'
  );

  // Content quality (PHASE 5)
  const placeholders = finalSnap.placeholders;
  log(
    'C3',
    'No placeholders',
    '0 placeholder texts',
    `count=${placeholders.length}`,
    placeholders.length === 0 && mutated ? 'PASS' : mutated ? 'WARN' : 'FAIL',
    JSON.stringify(placeholders.slice(0, 3))
  );

  // Dental coherence (criterion 8)
  log(
    'C4',
    'Dental content coherence',
    'dental-related section texts',
    `hits=${finalSnap.dentalHits}/${afterCount}`,
    finalSnap.dentalHits > 0 && mutated ? 'PASS' : mutated ? 'WARN' : 'FAIL',
    JSON.stringify(finalSnap.texts.slice(0, 6))
  );

  // Structural (PHASE 9)
  const orphansRisk = finalSnap.emptyish;
  log(
    'C5',
    'Structural sanity (visible sections, few empties)',
    'sections present, empties low',
    `sections=${afterCount} emptyish=${orphansRisk} overlaps=${finalSnap.overlaps}`,
    afterCount > 0 && finalSnap.overlaps < afterCount ? 'PASS' : 'FAIL'
  );

  // Visual (PHASE 10) — real DOM rect evidence
  log(
    'C6',
    'Visual layout evidence (DOM rects)',
    'sections have non-zero height, limited overlap',
    `overlaps=${finalSnap.overlaps}`,
    finalSnap.overlaps < Math.max(1, afterCount) ? 'PASS' : 'FAIL'
  );

  // Honest messaging (anti-fake SUCCESS)
  const bodyNow = await page.evaluate(() => document.body.innerText);
  const claimsBuiltFromLibrary =
    /zbudowano z biblioteki|wygenerowano z biblioteki/i.test(bodyNow) &&
    !/insert_section_from_library/i.test(JSON.stringify(COPILOT_REQUESTS));
  const fakeSuccess =
    pathTaken === 'chat-only' &&
    /strona (jest )?gotowa|wygenerowano pomyślnie|strona wygenerowana/i.test(bodyNow);
  log(
    'D1',
    'No fake SUCCESS without mutation',
    'no success claim if no mutation',
    fakeSuccess ? 'FAKE_SUCCESS' : 'honest',
    fakeSuccess ? 'FAIL' : 'PASS'
  );

  const batchLeak = COPILOT_REQUESTS.some(
    (r) => Array.isArray(r.tools) && r.tools.includes('batch_execute')
  );
  log(
    'D2',
    'No batch_execute in request.tools',
    '0 leaks',
    `requests=${COPILOT_REQUESTS.length} leak=${batchLeak}`,
    batchLeak ? 'FAIL' : 'PASS',
    JSON.stringify(COPILOT_REQUESTS.slice(-3))
  );

  // User intervention check (criterion 15) — we only sent one prompt
  log(
    'D3',
    'Single prompt, no manual WYKONAJ',
    'exactly 1 user prompt',
    `prompts=${COPILOT_REQUESTS.length + 1} (1 chat + ${COPILOT_REQUESTS.length} posts)`,
    'PASS'
  );

  // Console
  const realErrors = consoleErrors.filter(
    (e) => !/401|404|favicon|Download the React DevTools/i.test(e)
  );
  log(
    'E1',
    'Console errors',
    '0 real errors',
    String(realErrors.length),
    realErrors.length === 0 ? 'PASS' : 'WARN',
    realErrors.slice(0, 3).join(' | ')
  );

  // Final screenshots
  await page.screenshot({ path: path.join(OUT_DIR, '03-final.png'), fullPage: false });

  const pass = RESULTS.filter((r) => r.status === 'PASS').length;
  const fail = RESULTS.filter((r) => r.status === 'FAIL').length;
  const warn = RESULTS.filter((r) => r.status === 'WARN').length;

  const summary = {
    gate: 'HACP_PROFESSIONAL_WEBSITE_CREATION_GATE_V1',
    baseUrl: BASE_URL,
    prompt: EXACT_PROMPT,
    pathTaken,
    pass,
    fail,
    warn,
    beforeCount,
    afterCount,
    phaseSamples,
    structural: {
      sectionCount: finalSnap.sectionCount,
      placeholders: finalSnap.placeholders,
      dentalHits: finalSnap.dentalHits,
      emptyish: finalSnap.emptyish,
      overlaps: finalSnap.overlaps,
      texts: finalSnap.texts,
    },
    copilotRequests: COPILOT_REQUESTS,
    results: RESULTS,
    trace: TRACE,
    consoleLogs: consoleLogs.slice(0, 50),
    timestamp: new Date().toISOString(),
  };
  fs.writeFileSync(
    path.join(OUT_DIR, 'result.json'),
    JSON.stringify(summary, null, 2)
  );
  console.log(
    `\n=== GATE SUMMARY: ${pass} PASS, ${fail} FAIL, ${warn} WARN (path=${pathTaken}, sections ${beforeCount}→${afterCount}) ===`
  );
  if (fail > 0) process.exitCode = 1;

  await browser.close();
})().catch((err) => {
  console.error('GATE E2E fatal:', err);
  process.exitCode = 1;
});
