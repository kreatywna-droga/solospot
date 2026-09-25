/**
 * AI COPILOT TEXTAREA — FIRST-LINE GEOMETRY v2 (READ-ONLY).
 * Mirror-div + caretRangeFromPoint scan → exact first-line offset
 * from textarea border-box top. Output → scratch/ai-geometry/.
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const BASE = process.env.AIGEO_BASE || 'https://www.solospot.pl';
const EMAIL = `aigeo2.bot+${Date.now()}@solospot-test.pl`;
const PASSWORD = 'AiGeo-Accept-2026!';
const OUT_DIR = path.join(__dirname, '..', 'scratch', 'ai-geometry');

const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const MEASURE_FIRST_LINE = () => {
  const round = (n) => Math.round(n * 100) / 100;
  const ta = document.querySelector('textarea[placeholder*="SoloSpot"]');
  if (!ta) return { found: false };
  const cs = getComputedStyle(ta);
  const r = ta.getBoundingClientRect();
  const padTop = parseFloat(cs.paddingTop);
  const lh = parseFloat(cs.lineHeight);
  const fs = parseFloat(cs.fontSize);
  const line0 = ta.value.split('\n')[0] || '';

  // 1) Mirror div: identical font/padding/width, span around first line.
  let mirrorSpanTop = null;
  try {
    const m = document.createElement('div');
    m.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;white-space:pre-wrap;overflow-wrap:break-word;'
      + `width:${r.width}px;font:${cs.font};letter-spacing:${cs.letterSpacing};`
      + `padding:${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft};border:0;line-height:${cs.lineHeight};`;
    const span = document.createElement('span');
    span.textContent = line0 || ta.placeholder;
    m.appendChild(span);
    document.body.appendChild(m);
    const mr = m.getBoundingClientRect();
    const sr = span.getBoundingClientRect();
    mirrorSpanTop = round(sr.top - mr.top);
    m.remove();
  } catch (e) { mirrorSpanTop = 'err:' + e.message; }

  // 2) Caret scan: first y where caretRangeFromPoint lands in ta, offset>0.
  let caretFirstY = null, caretOff = null;
  try {
    const x = r.left + r.width / 2;
    for (let y = Math.ceil(r.top); y < r.bottom; y += 1) {
      const pos = document.caretRangeFromPoint(x, y);
      if (pos && pos.startContainer) {
        let n = pos.startContainer, inside = n === ta;
        while (!inside && n && n.parentNode) { n = n.parentNode; if (n === ta) inside = true; }
        if (inside && pos.startOffset > 0) { caretFirstY = round(y - r.top); caretOff = pos.startOffset; break; }
      }
    }
  } catch (e) { caretFirstY = 'err:' + e.message; }

  return {
    found: true, valueLen: ta.value.length, firstVisualLine: line0.slice(0, 40),
    rectH: round(r.height), rectW: round(r.width),
    paddingTop: cs.paddingTop, paddingLeft: cs.paddingLeft, paddingBottom: cs.paddingBottom,
    lineHeight: cs.lineHeight, fontSize: cs.fontSize,
    halfLeadingPx: round((lh - fs) / 2),
    expectedGlyphTopPx: round(padTop + (lh - fs) / 2),
    mirrorSpanTopPx: mirrorSpanTop,
    caretScanFirstGlyphYPx: caretFirstY, caretOffsetAtHit: caretOff,
    display: cs.display, verticalAlign: cs.verticalAlign, textAlign: cs.textAlign,
    scrollTop: ta.scrollTop, scrollHeight: ta.scrollHeight, clientHeight: ta.clientHeight,
  };
};
