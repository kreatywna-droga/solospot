/**
 * NS26 verify (v2): single selection frame + section background image/video.
 * Uses REAL mouse clicks (dispatchEvent click on wrong element caused false negatives).
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const BASE = process.env.NS24_BASE || 'https://www.solospot.pl';
const EMAIL = `ns26.bot+${Date.now()}@solospot-test.pl`;
const PASSWORD = 'Ns26-Acceptance-2026!';
const OUT_DIR = path.join(__dirname, '..', 'scratch', 'ns26-proof');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`) });
  console.log(`  [shot] ${name}.png`);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
    defaultViewport: { width: 1600, height: 1000 },
  });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
  const results = [];
  const step = (n, ok, d = '') => { results.push({ n, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? ' — ' + d : ''}`); };

  try {
    await fetch(`${BASE}/api/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD, name: 'NS26' }),
    });
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2', timeout: 60000 });
    await sleep(1500);
    await page.type('input[type="email"]', EMAIL);
    await page.type('input[type="password"]', PASSWORD);
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }).catch(() => {}),
      page.keyboard.press('Enter'),
    ]);
    await sleep(3000);
    await page.evaluate(async (url, email) => {
      await fetch(`${url}/api/onboarding/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerEmail: email, packageId: 'starter', storeName: 'NS26 Store' }),
      });
    }, BASE, EMAIL);
    const store = await page.evaluate(async (url) => {
      const r = await fetch(`${url}/api/stores`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'NS26 Store', slug: `ns26-${Date.now()}` }),
      });
      const b = await r.json();
      return b.store && b.store.id;
    }, BASE);
    step('setup (register/login/tenant/store)', Boolean(store));
    await page.goto(`${BASE}/studio/${store}`, { waitUntil: 'networkidle2', timeout: 90000 });
    await sleep(6000);

    // Real mouse click on the EXISTING heading (starter template contains one)
    const hBox = await page.evaluate(() => {
      const el = document.querySelector('[data-node-id="elem_heading_1"], [data-node-type="heading"]');
      if (!el) return null;
      el.scrollIntoView({ block: 'center' });
      const r = el.getBoundingClientRect();
      return { x: r.left + Math.min(120, r.width / 2), y: r.top + r.height / 2 };
    });
    await sleep(800);
    if (hBox) await page.mouse.click(hBox.x, hBox.y);
    await sleep(1800);
    const frameInfo = await page.evaluate(() => {
      const imgNode = document.querySelector('[data-node-id="elem_heading_1"], [data-node-type="heading"]');
      const hasNodeRing = imgNode ? /ring-2/.test(imgNode.className) : false;
      const boxed = Array.from(document.querySelectorAll('div')).filter((d) => {
        const s = getComputedStyle(d);
        return s.borderTopWidth === '2px' && s.borderTopStyle === 'solid' &&
          (s.borderTopColor || '').replace(/\s/g, '') === 'rgb(124,58,237)';
      });
      return { hasNodeRing, overlayFrames: boxed.length };
    });
    step('click element → EXACTLY ONE selection frame (no node ring)', Boolean(hBox) && !frameInfo.hasNodeRing && frameInfo.overlayFrames === 1,
      `nodeRing=${frameInfo.hasNodeRing} overlayFrames=${frameInfo.overlayFrames}`);
    await shot(page, '01-single-frame');

    // Real click on a root section (hero) → background tabs
    const sBox = await page.evaluate(() => {
      const el = document.querySelector('[data-section-id="sec_hero"]') || document.querySelector('[data-section-id]');
      if (!el) return null;
      el.scrollIntoView({ block: 'center' });
      const r = el.getBoundingClientRect();
      // click on the section wrapper edge (avoid inner links)
      return { x: r.left + Math.min(30, r.width * 0.1), y: r.top + Math.min(25, r.height * 0.1) };
    });
    await sleep(600);
    if (sBox) await page.mouse.click(sBox.x, sBox.y);
    await sleep(1800);
    const tabs = await page.evaluate(() => {
      const t = document.body.innerText;
      return {
        bgLabel: t.includes('Tło sekcji'),
        colorTab: Array.from(document.querySelectorAll('button')).some((b) => b.textContent && b.textContent.includes('Kolor')),
        imgTab: Array.from(document.querySelectorAll('button')).some((b) => b.textContent && b.textContent.includes('Zdj')),
        videoTab: Array.from(document.querySelectorAll('button')).some((b) => b.textContent && b.textContent.includes('Wideo')),
      };
    });
    step('click root section (hero) → Kolor/Zdjęcie/Wideo tabs', tabs.bgLabel && tabs.colorTab && tabs.imgTab && tabs.videoTab, JSON.stringify(tabs));
    await shot(page, '02-bg-tabs');

    // Switch to Zdjęcie tab and set URL
    const imgTabClicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const tab = btns.find((b) => b.textContent && b.textContent.includes('Zdj') && !b.textContent.includes('wgraj') && !b.textContent.includes('Kolor'));
      if (tab) { tab.click(); return true; }
      return false;
    });
    await sleep(900);
    const bgSet = await page.evaluate(() => {
      const input = Array.from(document.querySelectorAll('input[placeholder="https://..."]'))[0];
      if (!input) return false;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    });
    await sleep(2000);
    const bgRendered = await page.evaluate(() => {
      // Walk the hero subtree — the background may be on the section wrapper
      // or on the runtime-rendered <section> (config.image path).
      const hero = document.querySelector('[data-section-id="sec_hero"]') || document.querySelector('[data-section-id]');
      if (!hero) return false;
      let found = false;
      const check = (el) => {
        const s = getComputedStyle(el);
        if (s.backgroundImage && s.backgroundImage !== 'none' && s.backgroundImage.includes('unsplash')) found = true;
        Array.from(el.children).forEach((c) => check(c));
      };
      check(hero);
      return found;
    });
    step('set bg image URL → canvas renders it', imgTabClicked && bgSet && bgRendered, `tab=${imgTabClicked} set=${bgSet} rendered=${bgRendered}`);
    await shot(page, '03-bg-image');

    // Video tab
    const videoTabClicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const tab = btns.find((b) => b.textContent && b.textContent.trim().startsWith('🎬'));
      if (tab) { tab.click(); return true; }
      return false;
    });
    await sleep(900);
    const vidSet = await page.evaluate(() => {
      const input = Array.from(document.querySelectorAll('input[placeholder*="mp4"]'))[0];
      if (!input) return false;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, 'https://cdn.coverr.co/videos/coverr-a-city-from-above-1583/1080p.mp4');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    });
    await sleep(2500);
    const videoEl = await page.evaluate(() => {
      const el = document.querySelector('[data-section-id] video');
      return { present: !!el, src: el ? (el.src || '') : '' };
    });
    step('set bg video URL → canvas <video> renders', videoTabClicked && vidSet && videoEl.present, `tab=${videoTabClicked} set=${vidSet} present=${videoEl.present} src=${videoEl.src.slice(0, 50)}`);
    await shot(page, '04-bg-video');

    // Save + API persistence
    await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button')).find((x) => x.textContent && x.textContent.includes('Save'));
      if (b) b.click();
    });
    await sleep(5000);
    const persisted = await page.evaluate(async (url, sid) => {
      const r = await fetch(`${url}/api/stores/${sid}`);
      const data = await r.json();
      const pages = data.store && data.store.config && data.store.config.pages;
      if (!Array.isArray(pages)) return { ok: false };
      let hasBgImg = false, hasBgVideo = false;
      const walk = (secs) => {
        for (const s of secs) {
          const st = s.styles || {};
          if (st.backgroundImage && st.backgroundImage.includes('url(')) hasBgImg = true;
          if (s.config && s.config.backgroundVideo) hasBgVideo = true;
          if (Array.isArray(s.children)) walk(s.children);
        }
      };
      for (const p of pages) walk(p.sections || []);
      return { ok: hasBgVideo, hasBgImg, hasBgVideo };
    }, BASE, store);
    step('save → bg video persisted in store config (API)', persisted.ok, JSON.stringify(persisted));
    await shot(page, '05-saved');

    console.log('\n==================== NS26 VERDICT ====================');
    const failed = results.filter((r) => !r.ok);
    console.log(`PASS: ${results.length - failed.length}/${results.length}`);
    if (failed.length) failed.forEach((f) => console.log('  FAIL: ' + f.n));
    if (errors.length) { console.log(`PAGE ERRORS (${errors.length}):`); errors.slice(0, 5).forEach((e) => console.log('  ' + e.slice(0, 150))); }
    fs.writeFileSync(path.join(OUT_DIR, 'results.json'), JSON.stringify({ results, errors }, null, 2));
  } catch (err) {
    console.error('FATAL:', err.message);
    await shot(page, 'FATAL').catch(() => {});
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}
main();
