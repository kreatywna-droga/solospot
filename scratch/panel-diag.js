/**
 * DIAGNOSTIC (throwaway) — inspect the live Builder DOM to understand why the
 * acceptance run could not find the dock / gear button / Inspector.
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');

const BASE = process.env.PW_BASE || 'https://www.solospot.pl';
const CHROME = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe']
  .find((p) => fs.existsSync(p));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox'], defaultViewport: { width: 1920, height: 1080 },
  });
  const page = await browser.newPage();
  await page.goto(`${BASE}/studio/diag-${Date.now()}`, { waitUntil: 'networkidle2', timeout: 120000 });
  await page.waitForSelector('[data-builder-workspace]', { timeout: 60000 });
  await sleep(4000);

  const dump = await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('[data-node-id]')).map((n) => ({
      tag: n.tagName,
      id: n.getAttribute('data-node-id'),
      type: n.getAttribute('data-node-type'),
      cls: (n.className || '').toString().slice(0, 70),
      rect: (() => { const r = n.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; })(),
    }));
    const asides = Array.from(document.querySelectorAll('aside')).map((a) => ({
      w: a.style.width, cls: (a.className || '').toString().slice(0, 60),
      bg: getComputedStyle(a).backgroundColor,
      firstBg: a.firstElementChild ? getComputedStyle(a.firstElementChild).backgroundColor : null,
      text: (a.textContent || '').slice(0, 40),
    }));
    const buttons = Array.from(document.querySelectorAll('button'))
      .map((b) => (b.getAttribute('title') || '').trim())
      .filter(Boolean).slice(0, 40);
    return {
      url: location.href,
      nodes,
      asides,
      buttons,
      hasDockString: document.body.innerHTML.includes('section-action-dock'),
      hasDockEl: Boolean(document.querySelector('[data-testid="section-action-dock"]')),
      fixed9999: Array.from(document.querySelectorAll('div')).filter((el) => {
        const cs = getComputedStyle(el);
        return cs.position === 'fixed' && cs.zIndex === '9999';
      }).length,
      bodyText: (document.body.innerText || '').slice(0, 300),
    };
  });

  console.log(JSON.stringify(dump, null, 2));
  await page.screenshot({ path: 'scratch/panel-proof/diag-initial.png' });

  // Real mouse click on the first canvas node
  if (dump.nodes.length) {
    const n = dump.nodes[0];
    await page.mouse.click(n.rect.x + Math.round(n.rect.w / 2), n.rect.y + Math.round(n.rect.h / 2));
    await sleep(2000);
    const after = await page.evaluate(() => ({
      hasDockEl: Boolean(document.querySelector('[data-testid="section-action-dock"]')),
      dockButtons: Array.from(document.querySelectorAll('[data-testid="section-action-dock"] button')).map((b) => b.textContent),
      gear: Boolean(document.querySelector('button[title="Ustawienia elementu (Settings)"]')),
      titles: Array.from(document.querySelectorAll('button')).map((b) => b.getAttribute('title')).filter(Boolean).slice(0, 30),
      anyToolbar: document.body.innerHTML.includes('Ustawienia elementu'),
    }));
    console.log('\n=== AFTER REAL CLICK ===');
    console.log(JSON.stringify(after, null, 2));
    await page.screenshot({ path: 'scratch/panel-proof/diag-after-click.png' });

    if (after.gear) {
      const gear = await page.$('button[title="Ustawienia elementu (Settings)"]');
      const box = await gear.boundingBox();
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await sleep(1800);
      const panel = await page.evaluate(() => {
        const el = Array.from(document.querySelectorAll('div')).find((d) => {
          const cs = getComputedStyle(d);
          return cs.position === 'fixed' && cs.zIndex === '9999';
        });
        if (!el) return { found: false };
        const r = el.getBoundingClientRect();
        const card = el.firstElementChild;
        return {
          found: true,
          rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
          cardBg: card ? getComputedStyle(card).backgroundColor : null,
          headerBg: card && card.firstElementChild ? getComputedStyle(card.firstElementChild).backgroundColor : null,
          maxHeight: card ? card.style.maxHeight : null,
        };
      });
      console.log('\n=== PANEL ===');
      console.log(JSON.stringify(panel, null, 2));
      await page.screenshot({ path: 'scratch/panel-proof/diag-panel.png' });
    }
  }

  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
