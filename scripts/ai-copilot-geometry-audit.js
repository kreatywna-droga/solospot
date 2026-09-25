/**
 * AI COPILOT TEXT INPUT — FORENSIC GEOMETRY AUDIT (no code changes)
 * Renders an EXACT replica of the copilot composer DOM (classes copied verbatim
 * from AiCopilotWorkspace.tsx lines 1339/1382/1396/1402/1422) in a static harness
 * page and measures, in REAL Chrome via puppeteer-core:
 *  - computed style of <textarea>: padding-*, line-height, height, min/max-height,
 *    display, vertical-align, align-items/justify-content, transform, position
 *  - first-line geometry for: placeholder (empty), single-line, multi-line
 * Usage: node scripts/ai-copilot-geometry-audit.js
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'scratch', 'ai-copilot-proof');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

// EXACT replica of the composer (classes verbatim from AiCopilotWorkspace.tsx)
function harnessHTML() {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<script src="https://cdn.tailwindcss.com"><\/script>
<style>html,body{background:#202024;margin:0;padding:40px;font-family:ui-sans-serif,system-ui,sans-serif}</style>
</head><body>
<div style="width:360px">
<div id="composer" class="relative flex items-start gap-2 bg-[#18181B] border border-white/10 rounded-2xl p-2 transition-all">
<button id="attachBtn" class="absolute left-2 bottom-2 p-1 rounded-md bg-white/[0.05] border border-white/10 text-zinc-400" title="plus">+</button>
<textarea id="copilotInput" rows="3" placeholder="Napisz do SoloSpot AI..."
class="flex-1 bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none resize-none min-h-[60px] max-h-[130px] pt-2 pb-7 pl-2 pr-1 leading-relaxed"></textarea>
<button id="modelBtn" class="absolute left-9 bottom-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/[0.05] border border-white/10 text-[10px] font-medium text-zinc-300" title="model"><span>Model</span></button>
<button id="sendBtn" class="w-9 h-9 rounded-xl bg-gradient-to-r from-[#D9A86C] to-[#F2C27F] text-[#18181B] flex items-center justify-center disabled:opacity-30 shadow-md flex-shrink-0 mb-0.5" title="send">&gt;</button>
</div>
</div>
</body></html>`;
}
async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'harness.html'), harnessHTML());
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--window-size=1280,900'],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.setContent(harnessHTML(), { waitUntil: 'domcontentloaded', timeout: 15000 });
    await sleep(4000); // let tailwind CDN generate utilities (its connection stays open)
    const out = [];
    for (const v of ['', 'JESTES UUUUUU!', 'Pierwsza linia\nDruga linia tekstu\nTrzecia linia']) {
      const m = await page.evaluate((val) => {
        const ta = document.getElementById('copilotInput');
        ta.value = val; ta.scrollTop = 0;
        void ta.offsetHeight;
        const cs = getComputedStyle(ta);
        const r = ta.getBoundingClientRect();
        const parent = ta.parentElement;
        const pcs = parent ? getComputedStyle(parent) : null;
        return {
          kind: val === '' ? 'PLACEHOLDER(empty)' : (val.includes('\n') ? 'MULTILINE' : 'SINGLE_LINE'),
          computed: {
            paddingTop: cs.paddingTop, paddingRight: cs.paddingRight,
            paddingBottom: cs.paddingBottom, paddingLeft: cs.paddingLeft,
            lineHeight: cs.lineHeight, fontSize: cs.fontSize,
            height: cs.height, minHeight: cs.minHeight, maxHeight: cs.maxHeight,
            display: cs.display, verticalAlign: cs.verticalAlign,
            alignItems: cs.alignItems, justifyContent: cs.justifyContent,
            transform: cs.transform, position: cs.position,
            boxSizing: cs.boxSizing, overflowY: cs.overflowY,
            whiteSpace: cs.whiteSpace, textAlign: cs.textAlign,
            borderTop: cs.borderTopWidth, borderBottom: cs.borderBottomWidth,
          },
          rect: { x: Math.round(r.x * 100) / 100, y: Math.round(r.y * 100) / 100, w: Math.round(r.width * 100) / 100, h: Math.round(r.height * 100) / 100 },
          scrollHeight: ta.scrollHeight, clientHeight: ta.clientHeight,
          parentAlignItems: pcs ? pcs.alignItems : null,
          parentJustify: pcs ? pcs.justifyContent : null,
        };
      }, v);
      out.push(m);
      console.log('\n===== CASE: ' + m.kind + ' =====');
      console.log(JSON.stringify(m, null, 1));
    }
    fs.writeFileSync(path.join(OUT_DIR, 'geometry.json'), JSON.stringify(out, null, 2));
    const snap = async (v, name) => {
      await page.evaluate((val) => {
        const ta = document.getElementById('copilotInput');
        ta.value = val; ta.scrollTop = 0; ta.focus();
      }, v);
      await sleep(400);
      const el = await page.$('#composer');
      await el.screenshot({ path: path.join(OUT_DIR, name + '.png') });
      console.log('  [shot] ' + name + '.png');
    };
    await snap('', 'composer-placeholder');
    await snap('JESTES UUUUUU!', 'composer-single');
    await snap('Pierwsza linia\nDruga linia tekstu\nTrzecia linia', 'composer-multi');
    console.log('\nDONE. Evidence in ' + OUT_DIR);
  } finally { await browser.close(); }
}
main().catch((e) => { console.error('AUDIT_FAILED', e); process.exit(1); });

