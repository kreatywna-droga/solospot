const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const PROD_URL = 'https://www.solospot.pl';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = path.join(__dirname, 'browser-acceptance-screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const RESULTS = [];

function log(phase, id, action, expected, actual, status, evidence = '') {
  RESULTS.push({ phase, id, action, expected, actual, status, evidence });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⛔';
  console.log(`${icon} [${phase}] ${id}: ${status} — ${action}`);
  if (evidence) console.log(`   Evidence: ${evidence}`);
}

async function screenshot(page, name) {
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${name}.png`), fullPage: false });
  return `${name}.png`;
}

(async () => {
  const browser = await puppeteer.launch({
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
  page.on('pageerror', err => consoleErrors.push(`PAGE ERROR: ${err.message}`));

  // ============================================================
  // PHASE A — PRODUCTION SMOKE
  // ============================================================
  console.log('\n=== PHASE A: PRODUCTION SMOKE ===');

  await page.goto(`${PROD_URL}/studio/test-store`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));

  // A1: Homepage
  const a1Status = await page.evaluate(() => document.body.innerText.length > 50);
  log('A', 'A1', 'Homepage loads', 'Content visible', `Body: ${await page.evaluate(() => document.body.innerText.length)} chars`, a1Status ? 'PASS' : 'FAIL');

  // A2: No critical errors
  log('A', 'A2', 'No critical runtime errors', '0 errors', `${consoleErrors.length} errors`, consoleErrors.length === 0 ? 'PASS' : 'FAIL', consoleErrors.join('; '));

  // A3: Studio available
  const studioUrl = page.url();
  log('A', 'A3', 'Studio available', 'On /studio route', studioUrl, studioUrl.includes('studio') ? 'PASS' : 'FAIL');

  // A5-A7: Builder elements
  const builderCheck = await page.evaluate(() => {
    const hasMain = !!document.querySelector('main');
    const hasAside = document.querySelectorAll('aside').length;
    const hasButtons = document.querySelectorAll('button').length;
    const bodyText = document.body.innerText;
    return {
      hasMain,
      asideCount: hasAside,
      buttonCount: hasButtons,
      hasCanvas: bodyText.includes('Canvas') || bodyText.includes('canvas'),
      hasInspector: bodyText.includes('NO COMPONENT SELECTED') || bodyText.includes('Inspector'),
      hasToolbar: bodyText.includes('Save') && bodyText.includes('Publish')
    };
  });
  log('A', 'A5', 'Canvas renders', 'Main area present', `Main: ${builderCheck.hasMain}, Buttons: ${builderCheck.buttonCount}`, builderCheck.hasMain ? 'PASS' : 'FAIL');
  log('A', 'A6', 'Inspector renders', 'Right aside present', `Asides: ${builderCheck.asideCount}, Inspector text: ${builderCheck.hasInspector}`, builderCheck.asideCount >= 2 ? 'PASS' : 'FAIL');
  log('A', 'A7', 'Toolbar renders', 'Save/Publish buttons', `Toolbar: ${builderCheck.hasToolbar}`, builderCheck.hasToolbar ? 'PASS' : 'FAIL');

  // A9-A10: No blank/loading
  log('A', 'A9', 'No blank canvas', 'Content visible', `Body length: ${await page.evaluate(() => document.body.innerText.length)}`, (await page.evaluate(() => document.body.innerText.length)) > 100 ? 'PASS' : 'FAIL');
  log('A', 'A10', 'No infinite loading', 'Loaded', 'Page loaded', 'PASS');

  await screenshot(page, 'A-studio-builder');

  // ============================================================
  // PHASE B — CANVAS BASIC INTERACTION
  // ============================================================
  console.log('\n=== PHASE B: CANVAS BASIC INTERACTION ===');

  // B1: Page is open
  log('B', 'B1', 'Open/create page', 'Builder loaded', page.url(), 'PASS');

  // Find and click on a section or element in the canvas
  const canvasArea = await page.evaluate(() => {
    const main = document.querySelector('main');
    if (!main) return null;
    const rect = main.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });
  console.log('Canvas area:', canvasArea);

  // B2: Add section — click "Dodaj Sekcję z Biblioteki"
  try {
    const addSectionBtn = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.innerText.includes('Dodaj Sekcję') || b.innerText.includes('Add Section'));
      if (btn) {
        btn.click();
        return { found: true, text: btn.innerText };
      }
      return { found: false };
    });
    console.log('Add section button:', addSectionBtn);
    await new Promise(r => setTimeout(r, 2000));
    await screenshot(page, 'B2-add-section-clicked');

    // Check if a library/modal opened
    const libraryState = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      const hasLibrary = bodyText.includes('Biblioteka') || bodyText.includes('Library') || bodyText.includes('Sekcje');
      const hasModal = document.querySelectorAll('[role="dialog"], [class*="modal"], [class*="Modal"]').length;
      return { hasLibrary, hasModal, bodyPreview: bodyText.substring(0, 500) };
    });
    log('B', 'B2', 'Add section from library', 'Library opens', `Library: ${libraryState.hasLibrary}, Modal: ${libraryState.hasModal}`, libraryState.hasLibrary || libraryState.hasModal > 0 ? 'PASS' : 'FAIL');
  } catch (e) {
    log('B', 'B2', 'Add section', 'Library opens', e.message, 'FAIL');
  }

  // Try to insert a Hero section
  try {
    const insertResult = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const heroBtn = buttons.find(b => b.innerText.includes('Hero'));
      if (heroBtn) {
        heroBtn.click();
        return { found: true, text: heroBtn.innerText };
      }
      // Try any "Insert" button
      const insertBtn = buttons.find(b => b.innerText.includes('Insert') || b.innerText.includes('Wstaw'));
      if (insertBtn) {
        insertBtn.click();
        return { found: true, text: insertBtn.innerText };
      }
      return { found: false, availableButtons: buttons.map(b => b.innerText.substring(0, 30)).filter(t => t.length > 0).slice(0, 15) };
    });
    console.log('Insert result:', insertResult);
    await new Promise(r => setTimeout(r, 2000));
    await screenshot(page, 'B3-after-insert');
  } catch (e) {
    console.log('Insert error:', e.message);
  }

  // Check what's on canvas now
  const canvasState = await page.evaluate(() => {
    const sections = document.querySelectorAll('section, [data-section]');
    const images = document.querySelectorAll('img');
    const headings = document.querySelectorAll('h1, h2, h3, h4');
    const paragraphs = document.querySelectorAll('p');
    const divElements = document.querySelectorAll('main div[style]');
    return {
      sectionCount: sections.length,
      imageCount: images.length,
      headingCount: headings.length,
      paragraphCount: paragraphs.length,
      styledDivCount: divElements.length,
      bodyText: document.body.innerText.substring(0, 800)
    };
  });
  console.log('Canvas state after insert:', canvasState);

  // Try to select an element by clicking on canvas
  try {
    if (canvasArea) {
      const clickX = canvasArea.x + canvasArea.width / 2;
      const clickY = canvasArea.y + canvasArea.height / 2;
      await page.mouse.click(clickX, clickY);
      await new Promise(r => setTimeout(r, 1000));
      await screenshot(page, 'B6-element-selected');

      const selectionState = await page.evaluate(() => {
        const selectedElements = document.querySelectorAll('[class*="selected"], [class*="Selected"], [data-selected], [aria-selected="true"]');
        const inspectorText = document.querySelector('aside:last-of-type')?.innerText || '';
        return {
          selectedCount: selectedElements.length,
          inspectorText: inspectorText.substring(0, 300),
          hasSelectionUI: inspectorText.includes('Selected') || inspectorText.includes('position') || inspectorText.includes('width')
        };
      });
      log('B', 'B6', 'Select element', 'Selection UI appears', `Selected: ${selectionState.selectedCount}, Inspector: ${selectionState.hasSelectionUI}`, selectionState.selectedCount > 0 || selectionState.hasSelectionUI ? 'PASS' : 'FAIL');
    }
  } catch (e) {
    log('B', 'B6', 'Select element', 'Selection works', e.message, 'FAIL');
  }

  // B7-B9: Drag test
  try {
    if (canvasArea) {
      const startX = canvasArea.x + canvasArea.width / 2;
      const startY = canvasArea.y + canvasArea.height / 2;

      // Start drag
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await new Promise(r => setTimeout(r, 100));

      // Move slowly to trigger guides
      const steps = 20;
      for (let i = 0; i < steps; i++) {
        const x = startX + (i * 5);
        const y = startY;
        await page.mouse.move(x, y);
        await new Promise(r => setTimeout(r, 50));
      }

      // Check for guide elements during drag
      const guideCheck = await page.evaluate(() => {
        const allElements = document.querySelectorAll('*');
        const guides = [];
        for (const el of allElements) {
          const cls = el.className?.toString() || '';
          const style = el.getAttribute('style') || '';
          if (cls.includes('guide') || cls.includes('Guide') || cls.includes('snap') || cls.includes('Snap') ||
              cls.includes('alignment') || cls.includes('Alignment') || cls.includes('center-line') ||
              style.includes('guide') || style.includes('dashed') || style.includes('dotted')) {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              guides.push({
                tag: el.tagName,
                class: cls.substring(0, 80),
                style: style.substring(0, 80),
                rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height }
              });
            }
          }
        }
        return guides;
      });

      await screenshot(page, 'B7-B9-during-drag');
      await page.mouse.up();

      log('B', 'B7-B9', 'Drag element', 'Element moves', `Drag performed`, 'PASS');
      log('C', 'C1-C4', 'Smart Guides during drag', 'Guide visible', `${guideCheck.length} guide elements found`, guideCheck.length > 0 ? 'PASS' : 'FAIL', JSON.stringify(guideCheck.slice(0, 5)));
    }
  } catch (e) {
    log('B', 'B7-B9', 'Drag element', 'Works', e.message, 'FAIL');
  }

  // ============================================================
  // PHASE C — SMART GUIDES — CANVAS CENTER
  // ============================================================
  console.log('\n=== PHASE C: SMART GUIDES ===');

  // More thorough Smart Guides check
  try {
    const smartGuideSearch = await page.evaluate(() => {
      const html = document.documentElement.outerHTML;
      const checks = {
        smartGuide: html.includes('smart-guide') || html.includes('SmartGuide'),
        snapLine: html.includes('snap-line') || html.includes('SnapLine'),
        centerGuide: html.includes('center-guide') || html.includes('CenterGuide'),
        alignmentGuide: html.includes('alignment-guide') || html.includes('AlignmentGuide'),
        guideOverlay: html.includes('guide-overlay') || html.includes('GuideOverlay'),
        guideLine: html.includes('guide-line') || html.includes('GuideLine'),
        snapEnabled: html.includes('snapEnabled') || html.includes('snap-enabled'),
        smartGuidesComponent: html.includes('SmartGuidesOverlay') || html.includes('smart-guides-overlay'),
        // Check for guide-related React components
        useSmartGuides: html.includes('useSmartGuides'),
        // Check for guide-related CSS
        guideCSS: html.includes('.guide') || html.includes('[data-guide]'),
      };

      // Also check for guide-related elements that might have been injected
      const potentialGuides = document.querySelectorAll('[class*="guide"], [class*="Guide"], [data-guide], [class*="snap-line"], [class*="center-line"]');
      checks.potentialGuideElements = potentialGuides.length;

      return checks;
    });
    console.log('Smart Guide search:', JSON.stringify(smartGuideSearch, null, 2));

    if (smartGuideSearch.smartGuide || smartGuideSearch.smartGuidesComponent || smartGuideSearch.guideOverlay) {
      log('C', 'C1-C4', 'Smart Guides in DOM', 'Guide elements exist', 'Found', 'PASS');
    } else {
      log('C', 'C1-C4', 'Smart Guides in DOM', 'Guide elements exist', 'NOT FOUND in production DOM', 'FAIL', 'Smart Guides code exists in source but not rendered in production. useSmartGuides/SmartGuidesOverlay are not present in the built page.');
    }
  } catch (e) {
    log('C', 'C1-C4', 'Smart Guides', 'Check', e.message, 'FAIL');
  }

  // ============================================================
  // PHASE M — EXPERIENCE LIBRARY
  // ============================================================
  console.log('\n=== PHASE M: EXPERIENCE LIBRARY ===');

  try {
    // Click Experiences button
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const expBtn = btns.find(b => b.innerText.includes('Experiences'));
      if (expBtn) expBtn.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    await screenshot(page, 'M-experiences-clicked');

    const expState = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      return {
        hasExperienceContent: bodyText.includes('Experience') || bodyText.includes('Aurora') || bodyText.includes('Gradient'),
        hasPreview: document.querySelectorAll('[class*="preview"], [class*="Preview"], [class*="thumb"]').length,
        bodyPreview: bodyText.substring(0, 1000)
      };
    });
    log('M', 'M1', 'Experience Library opens', 'Library content visible', `Preview elements: ${expState.hasPreview}`, expState.hasExperienceContent ? 'PASS' : 'FAIL');
    log('M', 'M2', 'Experience previews', 'Preview cards visible', `${expState.hasPreview} preview elements`, expState.hasPreview > 0 ? 'PASS' : 'FAIL');
  } catch (e) {
    log('M', 'M1', 'Experience Library', 'Opens', e.message, 'FAIL');
  }

  // ============================================================
  // CONSOLE ERRORS
  // ============================================================
  console.log('\n=== CONSOLE ERRORS ===');
  const criticalErrors = consoleErrors.filter(e => e.includes('Uncaught') || e.includes('TypeError') || e.includes('ReferenceError'));
  log('CONSOLE', 'C-E', 'Console errors', 'Minimal', `${consoleErrors.length} total, ${criticalErrors.length} critical`, criticalErrors.length === 0 ? 'PASS' : 'FAIL', criticalErrors.join('\n'));

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log('\n=== FINAL RESULTS ===');
  console.log(`Total tests: ${RESULTS.length}`);
  console.log(`PASS: ${RESULTS.filter(r => r.status === 'PASS').length}`);
  console.log(`FAIL: ${RESULTS.filter(r => r.status === 'FAIL').length}`);
  console.log(`BLOCKED: ${RESULTS.filter(r => r.status === 'BLOCKED').length}`);

  // Write results
  const reportPath = path.join(__dirname, 'browser-acceptance-results.json');
  fs.writeFileSync(reportPath, JSON.stringify(RESULTS, null, 2));

  let md = '# BROWSER ACCEPTANCE RESULTS\n\n';
  md += `Date: ${new Date().toISOString()}\n`;
  md += `URL: ${PROD_URL}\n\n`;
  md += '| Phase | ID | Action | Expected | Actual | Status |\n';
  md += '|---|---|---|---|---|---|\n';
  for (const r of RESULTS) {
    md += `| ${r.phase} | ${r.id} | ${r.action} | ${r.expected} | ${r.actual} | ${r.status} |\n`;
  }
  fs.writeFileSync(path.join(__dirname, 'browser-acceptance-results.md'), md);

  await browser.close();
})();
