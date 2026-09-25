const puppeteer = require('puppeteer-core');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1000'],
    defaultViewport: { width: 1600, height: 1000 },
  });
  const ctx = browser.defaultBrowserContext();
  await ctx.overridePermissions(BASE_URL, ['clipboard-read', 'clipboard-write', 'clipboard-sanitized-write']);
  const page = await browser.newPage();
  await page.goto(`${BASE_URL}/studio/test-store`, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 2500));

  // AI tab
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const aiBtn = btns.find((b) => (b.getAttribute('title') || '').includes('Ctrl+6') || (b.title || '').includes('AI'));
    if (aiBtn) aiBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1200));

  // send message
  const ta = await page.$('textarea');
  await ta.click();
  await ta.type('Zrób audyt.');
  await page.keyboard.press('Enter');
  await new Promise((r) => setTimeout(r, 10000));

  const diag = await page.evaluate(() => {
    const bubbles = Array.from(document.querySelectorAll('.whitespace-pre-line.select-text'));
    const info = bubbles.map((el, i) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      let p = el.parentElement;
      const chain = [];
      let depth = 0;
      while (p && depth < 8) {
        const pcs = getComputedStyle(p);
        chain.push({
          tag: p.tagName,
          cls: (p.className || '').toString().slice(0, 80),
          userSelect: pcs.userSelect || pcs.webkitUserSelect,
          pointerEvents: pcs.pointerEvents,
        });
        p = p.parentElement;
        depth++;
      }
      return {
        i,
        text: (el.innerText || '').slice(0, 60),
        rect: { x: r.x, y: r.y, w: r.width, h: r.height },
        userSelect: cs.userSelect || cs.webkitUserSelect,
        pointerEvents: cs.pointerEvents,
        visible: r.width > 0 && r.height > 0,
        chain,
      };
    });
    const copyBtns = Array.from(document.querySelectorAll('button')).map((b) => ({
      title: b.title,
      text: (b.textContent || '').trim().slice(0, 40),
      disabled: b.disabled,
    })).filter((b) => b.title || /copy|kopiuj/i.test(b.text));
    return { bubbles: info, copyBtns, bodyHasAudit: document.body.innerText.includes('audyt') };
  });
  console.log(JSON.stringify(diag, null, 2));

  // try drag on last visible bubble with good coords
  const target = diag.bubbles.filter((b) => b.visible && b.rect.w > 20).pop();
  if (target) {
    // clear any selection
    await page.evaluate(() => window.getSelection().removeAllRanges());
    const startX = target.rect.x + 1;
    const startY = target.rect.y + target.rect.h / 2;
    const endX = Math.min(target.rect.x + target.rect.w - 1, target.rect.x + 60);
    console.log('drag', { startX, startY, endX });

    // check element at point
    const hit = await page.evaluate(
      (x, y) => {
        const el = document.elementFromPoint(x, y);
        if (!el) return null;
        const cs = getComputedStyle(el);
        return {
          tag: el.tagName,
          cls: (el.className || '').toString().slice(0, 100),
          userSelect: cs.userSelect,
          text: (el.innerText || '').slice(0, 40),
        };
      },
      startX,
      startY
    );
    console.log('elementFromPoint start:', hit);

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) {
      const x = startX + ((endX - startX) * i) / 10;
      await page.mouse.move(x, startY, { steps: 1 });
      await new Promise((r) => setTimeout(r, 30));
    }
    await page.mouse.up();
    await new Promise((r) => setTimeout(r, 200));
    const sel = await page.evaluate(() => window.getSelection().toString());
    console.log('selection after drag:', JSON.stringify(sel));

    // try double-click word select
    await page.evaluate(() => window.getSelection().removeAllRanges());
    await page.mouse.click(startX + 5, startY, { clickCount: 2 });
    await new Promise((r) => setTimeout(r, 200));
    const sel2 = await page.evaluate(() => window.getSelection().toString());
    console.log('selection after dblclick:', JSON.stringify(sel2));

    // select from center of text node via caretPosition
    await page.evaluate(() => window.getSelection().removeAllRanges());
    const rangeInfo = await page.evaluate((bx, by, bw, bh) => {
      const el = document.elementFromPoint(bx + 2, by);
      // walk up to find .select-text
      let n = el;
      while (n && !(n.classList && n.classList.contains('select-text'))) n = n.parentElement;
      if (!n) return { ok: false };
      const range = document.createRange();
      const walker = document.createTreeWalker(n, NodeFilter.SHOW_TEXT);
      const first = walker.nextNode();
      if (!first) return { ok: false, reason: 'no text node' };
      range.setStart(first, 0);
      range.setEnd(first, Math.min(first.length, 20));
      const s = window.getSelection();
      s.removeAllRanges();
      s.addRange(range);
      return { ok: true, sample: s.toString(), node: first.nodeValue?.slice(0, 30) };
    }, target.rect.x, target.rect.y, target.rect.w, target.rect.h);
    console.log('range select:', rangeInfo);
  }

  // single copy buttons
  const copyInfo = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('button[title]'));
    return all.map((b) => ({ title: b.title, text: (b.textContent || '').trim().slice(0, 30) }));
  });
  console.log('titled buttons:', copyInfo);

  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
