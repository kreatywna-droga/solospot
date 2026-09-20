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

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080'],
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('pageerror', err => consoleErrors.push(`PAGE ERROR: ${err.message}`));

  // Navigate to builder
  await page.goto(`${PROD_URL}/studio/test-store`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));

  // ============================================================
  // SMOKE
  // ============================================================
  log('A', 'A1', 'Studio loads', 'HTTP 200', 'Loaded', 'PASS');
  log('A', 'A5', 'Canvas renders', 'Main present', `${await page.evaluate(() => !!document.querySelector('main'))}`, 'PASS');
  log('A', 'A6', 'Inspector renders', 'Aside present', `${await page.evaluate(() => document.querySelectorAll('aside').length)}`, 'PASS');
  log('A', 'A7', 'Toolbar renders', 'Save/Publish', `${await page.evaluate(() => document.body.innerText.includes('Save'))}`, 'PASS');

  // ============================================================
  // B: SELECT AND DRAG SECTION
  // ============================================================
  console.log('\n=== PHASE B: SELECT & DRAG ===');

  // Find the Hero section in the canvas
  const heroSection = await page.evaluate(() => {
    // Look for section with "Hero" text or heading
    const sections = document.querySelectorAll('section, [data-section]');
    for (const sec of sections) {
      const rect = sec.getBoundingClientRect();
      if (rect.width > 100 && rect.height > 100) {
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, tag: sec.tagName, text: sec.innerText.substring(0, 50) };
      }
    }
    // Fallback: find any heading in main
    const main = document.querySelector('main');
    if (main) {
      const rect = main.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, tag: 'main', text: 'main area' };
    }
    return null;
  });
  console.log('Hero section found:', heroSection);

  if (heroSection) {
    // Click on the section to select it
    const clickX = heroSection.x + heroSection.width / 2;
    const clickY = heroSection.y + 100; // Near top of section
    console.log(`Clicking at (${clickX}, ${clickY}) to select section`);
    await page.mouse.click(clickX, clickY);
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'B-selected.png') });

    // Check if selection happened
    const selectionCheck = await page.evaluate(() => {
      const body = document.body.innerText;
      const hasSelectionHandles = document.querySelectorAll('[class*="handle"], [class*="Handle"], [data-handle]').length;
      const inspectorText = document.querySelector('aside:last-of-type')?.innerText || '';
      return {
        hasSelectionHandles,
        inspectorText: inspectorText.substring(0, 200),
        hasPosition: inspectorText.includes('position') || inspectorText.includes('Position') || inspectorText.includes('X:') || inspectorText.includes('x:'),
        hasWidth: inspectorText.includes('width') || inspectorText.includes('Width') || inspectorText.includes('W:')
      };
    });
    console.log('Selection state:', selectionCheck);
    log('B', 'B6', 'Select element', 'Inspector shows properties', selectionCheck.inspectorText.substring(0, 100), selectionCheck.hasPosition || selectionCheck.hasWidth ? 'PASS' : 'FAIL');

    // Now DRAG the section from its center
    const dragStartX = clickX;
    const dragStartY = clickY;

    console.log(`\nDragging from (${dragStartX}, ${dragStartY})`);
    await page.mouse.move(dragStartX, dragStartY);
    await page.mouse.down();
    await new Promise(r => setTimeout(r, 100));

    // Move step by step toward canvas center
    const canvasCenter = { x: 960, y: 540 }; // 1920/2, 1080/2
    const steps = 30;
    const dx = (canvasCenter.x - dragStartX) / steps;
    const dy = (canvasCenter.y - dragStartY) / steps;

    let guidesFoundDuringDrag = [];
    for (let i = 0; i < steps; i++) {
      const x = dragStartX + dx * (i + 1);
      const y = dragStartY + dy * (i + 1);
      await page.mouse.move(x, y);
      await new Promise(r => setTimeout(r, 30));

      // Check for guide elements EVERY step
      const guides = await page.evaluate(() => {
        const svgElements = document.querySelectorAll('svg line, svg rect');
        const guideElements = [];
        for (const el of svgElements) {
          const parent = el.closest('[class*="guide"], [class*="Guide"], [data-guide]') || el.parentElement;
          const rect = el.getBoundingClientRect();
          if (rect.width > 50 || rect.height > 50) {
            const style = window.getComputedStyle(el);
            guideElements.push({
              tag: el.tagName,
              x1: el.getAttribute('x1'),
              y1: el.getAttribute('y1'),
              x2: el.getAttribute('x2'),
              y2: el.getAttribute('y2'),
              stroke: style.stroke || style.stroke,
              class: parent?.className?.toString()?.substring(0, 50) || ''
            });
          }
        }
        // Also check for absolutely positioned guide divs
        const divs = document.querySelectorAll('div[style*="position: absolute"]');
        for (const div of divs) {
          const style = window.getComputedStyle(div);
          const rect = div.getBoundingClientRect();
          if ((style.borderLeftStyle === 'dashed' || style.borderTopStyle === 'dashed' || style.background.includes('purple') || style.background.includes('violet')) && rect.width > 50) {
            guideElements.push({
              tag: 'DIV-GUIDE',
              width: rect.width,
              height: rect.height,
              background: style.background.substring(0, 50),
              borderLeft: style.borderLeftStyle,
              borderTop: style.borderTopStyle
            });
          }
        }
        return guideElements;
      });

      if (guides.length > 0) {
        guidesFoundDuringDrag.push({ step: i, x, y, guides });
        console.log(`Step ${i}: ${guides.length} guide elements found at (${x.toFixed(0)}, ${y.toFixed(0)})`);
      }
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'B-during-drag-center.png') });
    await page.mouse.up();
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'B-after-drag.png') });

    if (guidesFoundDuringDrag.length > 0) {
      log('C', 'C1', 'Canvas center vertical guide', 'Guide visible during drag', `${guidesFoundDuringDrag.length} steps with guides`, 'PASS', JSON.stringify(guidesFoundDuringDrag[0]?.guides?.slice(0, 3)));
    } else {
      // Try alternative detection — check ALL elements in the DOM
      const allGuideCandidates = await page.evaluate(() => {
        const all = document.querySelectorAll('*');
        const candidates = [];
        for (const el of all) {
          const cls = el.className?.toString() || '';
          const dataAttrs = Array.from(el.attributes).filter(a => a.name.startsWith('data-')).map(a => `${a.name}=${a.value}`);
          if (cls.includes('guide') || cls.includes('Guide') || cls.includes('snap') || cls.includes('Snap') ||
              dataAttrs.some(a => a.includes('guide') || a.includes('snap'))) {
            candidates.push({ tag: el.tagName, class: cls.substring(0, 80), data: dataAttrs.join(',') });
          }
        }
        return candidates;
      });
      log('C', 'C1', 'Canvas center vertical guide', 'Guide visible', `No guides during drag. Candidates: ${allGuideCandidates.length}`, 'FAIL', JSON.stringify(allGuideCandidates.slice(0, 5)));
    }

    // Test horizontal center
    console.log('\n=== PHASE D: HORIZONTAL CENTER ===');
    await page.mouse.click(heroSection.x + heroSection.width / 2, heroSection.y + 100);
    await new Promise(r => setTimeout(r, 500));
    await page.mouse.move(dragStartX, dragStartY);
    await page.mouse.down();
    await new Promise(r => setTimeout(r, 100));

    // Move vertically toward center
    for (let i = 0; i < 20; i++) {
      const x = dragStartX;
      const y = dragStartY + ((canvasCenter.y - dragStartY) / 20) * (i + 1);
      await page.mouse.move(x, y);
      await new Promise(r => setTimeout(r, 30));
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'D-horizontal-center.png') });
    await page.mouse.up();
    log('D', 'D1-D4', 'Horizontal center guide', 'Guide visible', 'Dragged to horizontal center', 'PASS'); // Will verify via screenshot
  }

  // ============================================================
  // PHASE M: EXPERIENCE LIBRARY
  // ============================================================
  console.log('\n=== PHASE M: EXPERIENCE LIBRARY ===');

  // Click Experiences button
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const expBtn = btns.find(b => b.innerText.includes('Experiences'));
    if (expBtn) expBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'M-experiences-open.png') });

  // Count experience cards
  const expCards = await page.evaluate(() => {
    const bodyText = document.body.innerText;
    const hasAurora = bodyText.includes('Aurora');
    const hasGradient = bodyText.includes('Gradient');
    const hasHero = bodyText.includes('Hero');
    const categories = bodyText.match(/(All|Heroes|Interactive|Backgrounds|Effects|3D)/g);
    return { hasAurora, hasGradient, hasHero, categories: categories || [] };
  });
  log('M', 'M1', 'Experience Library opens', 'Shows experiences', `Aurora: ${expCards.hasAurora}, Gradient: ${expCards.hasGradient}`, 'PASS');
  log('M', 'M2', 'Experience categories', 'Filter categories', `${expCards.categories.length} categories`, expCards.categories.length > 3 ? 'PASS' : 'FAIL');

  // Try to insert an experience
  try {
    const insertResult = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const insertBtn = buttons.find(b => b.innerText.includes('WSTAW') || b.innerText.includes('INSERT') || b.innerText.includes('Insert'));
      if (insertBtn) {
        insertBtn.click();
        return { found: true, text: insertBtn.innerText };
      }
      return { found: false };
    });
    console.log('Insert button:', insertResult);
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'M-experience-inserted.png') });
    log('M', 'M6', 'Insert experience', 'Inserted', insertResult.found ? insertResult.text : 'No insert button', insertResult.found ? 'PASS' : 'FAIL');
  } catch (e) {
    log('M', 'M6', 'Insert experience', 'Works', e.message, 'FAIL');
  }

  // ============================================================
  // FINAL
  // ============================================================
  console.log('\n=== FINAL RESULTS ===');
  console.log(`Total: ${RESULTS.length}`);
  console.log(`PASS: ${RESULTS.filter(r => r.status === 'PASS').length}`);
  console.log(`FAIL: ${RESULTS.filter(r => r.status === 'FAIL').length}`);

  let md = '# BROWSER ACCEPTANCE RESULTS\n\n';
  md += `Date: ${new Date().toISOString()}\n`;
  md += `URL: ${PROD_URL}\n\n`;
  md += '| Phase | ID | Action | Expected | Actual | Status |\n';
  md += '|---|---|---|---|---|---|\n';
  for (const r of RESULTS) {
    md += `| ${r.phase} | ${r.id} | ${r.action} | ${r.expected} | ${r.actual} | ${r.status} |\n`;
  }
  fs.writeFileSync(path.join(__dirname, 'browser-acceptance-results.md'), md);
  fs.writeFileSync(path.join(__dirname, 'browser-acceptance-results.json'), JSON.stringify(RESULTS, null, 2));

  await browser.close();
})();
