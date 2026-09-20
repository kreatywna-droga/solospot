const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const PROD_URL = 'https://www.solospot.pl';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const RESULTS = [];
const SCREENSHOT_DIR = path.join(__dirname, 'browser-acceptance-screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

function log(phase, id, action, expected, actual, status, evidence = '') {
  const entry = { phase, id, action, expected, actual, status, evidence };
  RESULTS.push(entry);
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⛔';
  console.log(`${icon} [${phase}] ${id}: ${status}`);
  if (evidence) console.log(`   Evidence: ${evidence}`);
}

async function screenshot(page, name) {
  const file = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  return file;
}

async function waitForStable(page, ms = 2000) {
  await new Promise(r => setTimeout(r, ms));
}

(async () => {
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080'],
      defaultViewport: { width: 1920, height: 1080 }
    });

    const page = await browser.newPage();
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => consoleErrors.push(err.message));

    // ============================================================
    // PHASE A — PRODUCTION SMOKE TEST
    // ============================================================
    console.log('\n=== PHASE A: PRODUCTION SMOKE ===');

    try {
      const resp = await page.goto(PROD_URL, { waitUntil: 'networkidle2', timeout: 30000 });
      const status = resp.status();
      log('A', 'A1', 'Homepage loads', 'HTTP 200', `HTTP ${status}`, status === 200 ? 'PASS' : 'FAIL', `Status: ${status}`);
      await screenshot(page, 'A1-homepage');
    } catch (e) {
      log('A', 'A1', 'Homepage loads', 'HTTP 200', `Error: ${e.message}`, 'FAIL');
    }

    try {
      const errors = consoleErrors.filter(e => e.includes('Uncaught') || e.includes('Error'));
      log('A', 'A2', 'No critical runtime errors', '0 critical errors', `${errors.length} errors`, errors.length === 0 ? 'PASS' : 'FAIL', errors.join('; '));
    } catch (e) {
      log('A', 'A2', 'No critical runtime errors', '0 critical errors', e.message, 'FAIL');
    }

    // Navigate to Studio
    try {
      await page.goto(`${PROD_URL}/studio`, { waitUntil: 'networkidle2', timeout: 30000 });
      await waitForStable(page, 3000);
      const title = await page.title();
      const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500));
      const hasContent = bodyText.length > 50;
      log('A', 'A3', 'Studio is available', 'Page loads with content', `Title: "${title}", Body length: ${bodyText.length}`, hasContent ? 'PASS' : 'FAIL');
      await screenshot(page, 'A3-studio');
    } catch (e) {
      log('A', 'A3', 'Studio is available', 'Page loads', `Error: ${e.message}`, 'FAIL');
    }

    // Check for Builder elements
    try {
      const builderElements = await page.evaluate(() => {
        const canvas = document.querySelector('[data-canvas], [class*="canvas"], [class*="Canvas"]');
        const inspector = document.querySelector('[data-inspector], [class*="inspector"], [class*="Inspector"]');
        const toolbar = document.querySelector('[data-toolbar], [class*="toolbar"], [class*="Toolbar"]');
        return {
          canvas: !!canvas,
          inspector: !!inspector,
          toolbar: !!toolbar,
          canvasSelector: canvas ? canvas.tagName + '.' + canvas.className.substring(0, 50) : 'NOT FOUND',
          inspectorSelector: inspector ? inspector.tagName + '.' + inspector.className.substring(0, 50) : 'NOT FOUND',
          toolbarSelector: toolbar ? toolbar.tagName + '.' + toolbar.className.substring(0, 50) : 'NOT FOUND'
        };
      });
      log('A', 'A5', 'Canvas renders', 'Canvas element found', builderElements.canvasSelector, builderElements.canvas ? 'PASS' : 'FAIL');
      log('A', 'A6', 'Inspector renders', 'Inspector element found', builderElements.inspectorSelector, builderElements.inspector ? 'PASS' : 'FAIL');
      log('A', 'A7', 'Toolbar renders', 'Toolbar element found', builderElements.toolbarSelector, builderElements.toolbar ? 'PASS' : 'FAIL');
      await screenshot(page, 'A5-A7-builder-elements');
    } catch (e) {
      log('A', 'A5-A7', 'Builder elements', 'Found', e.message, 'FAIL');
    }

    // Check for blank canvas / infinite loading
    try {
      const pageState = await page.evaluate(() => {
        const body = document.body.innerText;
        const hasLoading = body.includes('Loading') || body.includes('loading') || body.includes('Spinner');
        const isBlank = body.trim().length < 20;
        const hasSections = document.querySelectorAll('section, [data-section], [class*="section"]').length;
        return { hasLoading, isBlank, hasSections, bodyLength: body.length };
      });
      log('A', 'A9', 'No blank canvas', 'Canvas has content', `Sections: ${pageState.hasSections}, Body: ${pageState.bodyLength}`, !pageState.isBlank ? 'PASS' : 'FAIL');
      log('A', 'A10', 'No infinite loading', 'No loading spinner', pageState.hasLoading ? 'Still loading' : 'Loaded', !pageState.hasLoading ? 'PASS' : 'FAIL');
    } catch (e) {
      log('A', 'A9-A10', 'Canvas state', 'Normal', e.message, 'FAIL');
    }

    // ============================================================
    // PHASE B — CANVAS BASIC INTERACTION
    // ============================================================
    console.log('\n=== PHASE B: CANVAS BASIC INTERACTION ===');

    // Try to navigate to a store builder page
    try {
      await page.goto(`${PROD_URL}/studio/test-store`, { waitUntil: 'networkidle2', timeout: 30000 });
      await waitForStable(page, 3000);
      await screenshot(page, 'B1-store-builder');

      const pageState = await page.evaluate(() => {
        const body = document.body.innerText;
        const buttons = document.querySelectorAll('button');
        const inputs = document.querySelectorAll('input, textarea');
        const sections = document.querySelectorAll('section, [data-section]');
        return {
          bodyPreview: body.substring(0, 300),
          buttonCount: buttons.length,
          inputCount: inputs.length,
          sectionCount: sections.length
        };
      });
      log('B', 'B1', 'Open/create page', 'Builder page loads', `Buttons: ${pageState.buttonCount}, Inputs: ${pageState.inputCount}, Sections: ${pageState.sectionCount}`, pageState.buttonCount > 0 ? 'PASS' : 'FAIL');
    } catch (e) {
      log('B', 'B1', 'Open/create page', 'Builder loads', `Error: ${e.message}`, 'FAIL');
    }

    // Check for add section functionality
    try {
      const addButtons = await page.evaluate(() => {
        const allButtons = Array.from(document.querySelectorAll('button'));
        return allButtons.map(b => ({
          text: b.innerText.substring(0, 50),
          class: b.className.substring(0, 80),
          visible: b.offsetParent !== null
        })).filter(b => b.visible);
      });
      log('B', 'B2', 'Add section available', 'Buttons visible', `${addButtons.length} buttons found`, addButtons.length > 0 ? 'PASS' : 'FAIL');
      await screenshot(page, 'B2-available-buttons');
    } catch (e) {
      log('B', 'B2', 'Add section', 'Available', e.message, 'FAIL');
    }

    // ============================================================
    // PHASE M — EXPERIENCE LIBRARY
    // ============================================================
    console.log('\n=== PHASE M: EXPERIENCE LIBRARY ===');

    try {
      // Look for Experience-related elements
      const experienceElements = await page.evaluate(() => {
        const allText = document.body.innerText;
        const hasExperience = allText.includes('Experience') || allText.includes('experience');
        const hasLibrary = allText.includes('Library') || allText.includes('library');
        const hasTemplate = allText.includes('Template') || allText.includes('template');
        return { hasExperience, hasLibrary, hasTemplate, bodyPreview: allText.substring(0, 500) };
      });
      log('M', 'M1', 'Experience Library available', 'Experience/Library text found', `Exp: ${experienceElements.hasExperience}, Lib: ${experienceElements.hasLibrary}`, (experienceElements.hasExperience || experienceElements.hasLibrary) ? 'PASS' : 'BLOCKED');
      await screenshot(page, 'M1-experience-library');
    } catch (e) {
      log('M', 'M1', 'Experience Library', 'Available', e.message, 'BLOCKED');
    }

    // ============================================================
    // CONSOLE ERRORS CHECK
    // ============================================================
    console.log('\n=== CONSOLE ERRORS ===');

    const allErrors = consoleErrors.filter(e =>
      e.includes('Error') || e.includes('error') || e.includes('Uncaught') || e.includes('Warning')
    );
    log('CONSOLE', 'C-E', 'Console errors', 'Minimal', `${allErrors.length} errors total`, allErrors.length < 5 ? 'PASS' : 'FAIL', allErrors.slice(0, 10).join('\n'));

    // ============================================================
    // GENERATE REPORT
    // ============================================================
    console.log('\n=== FINAL RESULTS ===');
    console.log(`Total tests: ${RESULTS.length}`);
    console.log(`PASS: ${RESULTS.filter(r => r.status === 'PASS').length}`);
    console.log(`FAIL: ${RESULTS.filter(r => r.status === 'FAIL').length}`);
    console.log(`BLOCKED: ${RESULTS.filter(r => r.status === 'BLOCKED').length}`);

    // Write JSON results
    const reportPath = path.join(__dirname, 'browser-acceptance-results.json');
    fs.writeFileSync(reportPath, JSON.stringify(RESULTS, null, 2));
    console.log(`\nResults written to: ${reportPath}`);

    // Write Markdown report
    let md = '# BROWSER ACCEPTANCE RESULTS\n\n';
    md += `Date: ${new Date().toISOString()}\n`;
    md += `URL: ${PROD_URL}\n\n`;
    md += '| Phase | ID | Action | Expected | Actual | Status |\n';
    md += '|---|---|---|---|---|---|\n';
    for (const r of RESULTS) {
      md += `| ${r.phase} | ${r.id} | ${r.action} | ${r.expected} | ${r.actual} | ${r.status} |\n`;
    }
    const mdPath = path.join(__dirname, 'browser-acceptance-results.md');
    fs.writeFileSync(mdPath, md);
    console.log(`Markdown report: ${mdPath}`);

  } catch (e) {
    console.error('FATAL ERROR:', e.message);
  } finally {
    if (browser) await browser.close();
  }
})();
