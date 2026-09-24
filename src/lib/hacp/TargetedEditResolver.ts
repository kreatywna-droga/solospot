/**
 * TargetedEditResolver.ts — Deterministic targeted-edit resolution for SHORT,
 * NATURAL commands on the CURRENTLY SELECTED element.
 *
 * WHY: the free model frequently answers "zmień czcionkę" with a clarifying
 * question or a promise ("Zmienię czcionkę…") and emits NO mutation tool call.
 * PHASE 10 rule: if the operation is unambiguous on the selected target —
 * EXECUTE. Never respond with text while the document stays unchanged.
 *
 * This resolver is a LAST-RESORT FALLBACK: it runs only when the normal
 * AI/deterministic flow produced ZERO BuilderCommands (see HacpBridge call
 * sites). Existing engine EXECUTE paths are untouched (regression-safe).
 *
 * Design Intelligence: typography/style qualifiers (luxury, modern, …) are
 * resolved through packages/design-system (font pairings/fonts) — the same
 * SSOT the catalog and HACP apply_* tools use. No Math.random, no fake data.
 *
 * Mutation goes through HacpBridge.executeToolCall → verifyCommandExecution
 * → BuilderCommand, so verification is real BEFORE any result is returned.
 */

import {
  findNode,
  type BuilderDocument,
  type BuilderNode,
} from '../../../packages/builder-core/src';
import { DesignSystem } from '../../../packages/design-system/src/index';
import { COLOR_MAP, type HacpBuilderContext } from './HacpTypes';
import type { HacpToolCall } from '../ai/AIProviderTypes';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TargetedEditIntent =
  | 'CHANGE_TYPOGRAPHY'
  | 'CHANGE_COLOR'
  | 'CHANGE_TEXT'
  | 'RESIZE'
  | 'ALIGN'
  | 'MOVE'
  | 'STYLE_MODIFICATION';

export type TargetedDomain =
  | 'TYPOGRAPHY'
  | 'COLOR'
  | 'TEXT'
  | 'SIZE'
  | 'ALIGN'
  | 'LAYOUT'
  | 'STYLE';

export type TargetedQualifier =
  | 'LUXURY'
  | 'MODERN'
  | 'BOLD'
  | 'EDITORIAL'
  | 'TECH'
  | 'MINIMAL';

export interface TargetedEditResolution {
  /** Machine intent (PHASE 6) */
  intent: TargetedEditIntent;
  /** Domain of the change (PHASE 8) */
  domain: TargetedDomain;
  /** Semantic qualifier (PHASE 7) */
  qualifier?: TargetedQualifier;
  /** Locked target — always the current selection (PHASE 4) */
  targetNodeId: string;
  /** The exact HACP tool call to execute (goes through verification) */
  toolCall: HacpToolCall;
  /** Honest Polish summary — only rendered AFTER verification passes */
  summary: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Lowercase + strip diacritics so PL commands match without keyword variants. */
function fold(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const COLOR_RE = /\bkolor|\bcolour|\bcolor|\bbarw/;
const SIZE_RE = /\bwieksz|\bmniejsz|\bpowieksz|\bpomniejsz|\bzmniejsz|\brozmiar|\bsize\b|\bbigger|\bsmaller|\bzwieksz/;
const BIGGER_RE = /\bwieksz|\bpowieksz|\bzwieksz|\bbigger|\bincrease/;
const MOVE_RE = /\bprzesun|\bprzenies|\bshift\b/;
const MOVE_HORIZONTAL_RE = /\bw prawo|\bw lewo|\bprawo|\blewo|\bw bok|\bside\b/;
/** Section-reorder vocabulary — handled by HacpIntentEngine, NOT by us. */
const MOVE_EXCLUDE_RE = /\bsekcj|\bsection|\bnizej|\bwyzej|\bw gore|\bw dol|\bna gore|\bna dol|\bdol\b|\bgor[ea]\b|\bnad \|\bponizej|\bnizej|next|prev/;
const VALUE_QUALIFIER_RE =
  /\bbardziej|\bwiecej|\btroch[eę]|\bnieco|\bmocniej|\bjeszcze\b|\bambio|\bna luks|\bbardzo\b/;

const QUALIFIER_RULES: Array<[TargetedQualifier, RegExp]> = [
  ['LUXURY', /\bluxur|\bluksus|\bpremium|\belegan|\bhigh[- ]?end|\bwytworn|\bszykown|\bklasyczn/],
  ['EDITORIAL', /\bredakcyj|\beditorial|\bmagazyn|\bprasow|\bnewspap/],
  ['TECH', /\btechnologicz|\bfuturysty|\bcyfrow|\bdigital|\btech\b/],
  ['BOLD', /\bwidoczn|\bbold\b|\bmocniejsz|\bwyrazniejsz|\bwyrozniaj|\bkontrast|\brzucaj/],
  ['MODERN', /\bnowoczes|\bmodern|\bminimalist|\bgeometr|\bwspolczes|\bcontemporary|\bscandi/],
  ['MINIMAL', /\bminimal|\bprost\w+|\bczyst\w+/],
];

function extractQualifier(text: string): TargetedQualifier | undefined {
  for (const [q, re] of QUALIFIER_RULES) {
    if (re.test(text)) return q;
  }
  return undefined;
}

/** Extract a literal new value from the RAW prompt (preserves case). */
function extractValueAfterNa(rawPrompt: string): string | undefined {
  const quoted = rawPrompt.match(/["'„”](.+?)["'„”]/);
  if (quoted && quoted[1].trim()) return quoted[1].trim();
  const m = rawPrompt.match(/\bna\s+(.+)$/i);
  if (!m) return undefined;
  const v = m[1].trim().replace(/[.!?,;:]+$/, '').trim();
  return v || undefined;
}

function looksLikeQualifierPhrase(v: string): boolean {
  const f = fold(v);
  if (VALUE_QUALIFIER_RE.test(f)) return true;
  return QUALIFIER_RULES.some(([, re]) => re.test(f));
}

/** Deterministic named/hex color extraction (extends COLOR_MAP matching). */
function extractColor(rawPrompt: string): string | undefined {
  const hex = rawPrompt.match(/#([0-9a-fA-F]{3,8})\b/);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    if (h.length === 6) return `#${h.toUpperCase()}`;
  }
  const f = fold(rawPrompt);
  for (const [name, value] of Object.entries(COLOR_MAP)) {
    if (f.includes(fold(name))) return value;
  }
  return undefined;
}

function parsePx(v: unknown): number | null {
  if (typeof v !== 'string' || !v) return null;
  const px = v.match(/^(-?\d+(?:\.\d+)?)px$/);
  if (px) return parseFloat(px[1]);
  const rem = v.match(/^(-?\d+(?:\.\d+)?)rem$/);
  if (rem) return parseFloat(rem[1]) * 16;
  const pt = v.match(/^(-?\d+(?:\.\d+)?)pt$/);
  if (pt) return (parseFloat(pt[1]) * 4) / 3;
  return null;
}

function defaultFontSizePx(node: BuilderNode): number {
  if (node.type === 'heading') {
    const level = (node.props?.level as string) || 'h2';
    if (level === 'h1') return 36;
    if (level === 'h3') return 20;
    if (level === 'h4') return 18;
    return 28;
  }
  if (node.type === 'button') return 14;
  if (node.type === 'text' || node.type === 'paragraph') return 16;
  return 16;
}

function currentNodeFont(node: BuilderNode): string | undefined {
  const s = (node.styles as Record<string, unknown> | undefined) || {};
  const p = node.props || {};
  return (s.fontFamily as string) || (p.fontFamily as string) || undefined;
}

/** Design Intelligence: pick a pairing font for a semantic qualifier (PHASE 8). */
function pickPairingFont(
  qualifier: TargetedQualifier | undefined,
  currentFont: string | undefined
): string | undefined {
  const styleLabel =
    qualifier === 'LUXURY'
      ? 'Luxury'
      : qualifier === 'MODERN'
        ? 'Modern'
        : qualifier === 'EDITORIAL'
          ? 'Editorial'
          : qualifier === 'TECH'
            ? 'Tech'
            : qualifier === 'MINIMAL'
              ? 'Minimal'
              : undefined;

  let pool = DesignSystem.fontPairings || [];
  if (styleLabel) {
    const filtered = pool.filter(
      (p: any) =>
        p.style === styleLabel ||
        (Array.isArray(p.tags) && p.tags.some((t: string) => fold(t) === fold(styleLabel!)))
    );
    if (filtered.length > 0) pool = filtered;
  }

  const candidates: string[] = [];
  for (const p of pool as any[]) {
    if (p?.displayFont?.name) candidates.push(p.displayFont.name);
    if (p?.bodyFont?.name) candidates.push(p.bodyFont.name);
  }
  const distinct = candidates.filter((n, i) => candidates.indexOf(n) === i);
  const notCurrent = distinct.find((n) => n !== currentFont);
  if (notCurrent) return notCurrent;
  return distinct[0];
}

const TEXTUAL_TYPES = new Set([
  'heading',
  'text',
  'paragraph',
  'button',
  'navbar',
  'link',
  'input',
  'contact',
]);

let toolSeq = 0;

// ---------------------------------------------------------------------------
// Resolver
// ---------------------------------------------------------------------------

export function resolveTargetedEdit(
  rawPrompt: string,
  context: HacpBuilderContext,
  document: BuilderDocument
): TargetedEditResolution | null {
  const raw = (rawPrompt || '').trim();
  const text = fold(raw);
  if (!text) return null;

  // PHASE 4 — TARGET LOCK: only the currently selected element.
  const targetId = context.selectedNodeId;
  if (!targetId) return null;
  const found = findNode(document, targetId);
  if (!found) return null;
  const node = found.node;
  const pageId = context.pageId || document.pages[0]?.id || 'page-home';
  const qualifier = extractQualifier(text);

  const tc = (name: string, args: Record<string, unknown>): HacpToolCall => ({
    id: `tc-te-${Date.now()}-${toolSeq++}`,
    name,
    arguments: args,
  });

  const targetLabel = node.label || node.type;

  // ── 1. CHANGE_COLOR ──────────────────────────────────────────────────────
  if (COLOR_RE.test(text)) {
    let color = extractColor(raw);
    if (!color) {
      // User explicitly named a color value we do not know
      // ("...na seledynowy nieokreślony") → honest: do NOT substitute a
      // random palette color (T20: unknown color must stay CLARIFY).
      const explicitValue = extractValueAfterNa(raw);
      if (!explicitValue) {
        // Bare "zmień kolor" (no value given) → deterministic Design System
        // palette pick that differs from the current value.
        const wantsBgBare = /\btlo|\btla|\bbackground\b/.test(text);
        const currentNodeColor =
          ((node.styles as Record<string, unknown> | undefined)?.[wantsBgBare ? 'backgroundColor' : 'color'] as string) ||
          ((node.props as Record<string, unknown> | undefined)?.[wantsBgBare ? 'backgroundColor' : 'color'] as string) ||
          undefined;
        const palettes = DesignSystem.colorPalettes || [];
        for (const p of palettes as any[]) {
          const candidate = wantsBgBare ? p?.background || p?.primary : p?.text || p?.primary || p?.accent;
          if (typeof candidate === 'string' && candidate !== currentNodeColor) {
            color = candidate;
            break;
          }
        }
        if (!color && !currentNodeColor) color = '#D9A86C';
      }
    }
    if (color) {
      const wantsBg =
        /\btlo|\btla|\bbackground\b/.test(text) ||
        (node.type === 'section' ||
          node.type === 'hero' ||
          node.type === 'box' ||
          node.type === 'container') &&
          !/\btekst|\btext\b/.test(text);
      const styles = wantsBg ? { backgroundColor: color } : { color };
      const current = (node.styles as any)?.[wantsBg ? 'backgroundColor' : 'color'];
      if (current !== color) {
        return {
          intent: 'CHANGE_COLOR',
          domain: 'COLOR',
          qualifier,
          targetNodeId: targetId,
          toolCall: tc('set_node_styles', { nodeId: targetId, pageId, styles }),
          summary: `Zmieniłem kolor ${wantsBg ? 'tła' : 'elementu'} zaznaczenia **${targetLabel}** na **${color}**.`,
        };
      }
      // Already the requested color → honest: let the normal flow decide.
    }
    // Unresolvable color → let the normal flow handle it (honest CLARIFY/CHAT).
  }

  // ── 2. RESIZE ────────────────────────────────────────────────────────────
  if (SIZE_RE.test(text)) {
    const bigger = BIGGER_RE.test(text);
    const dir = bigger || !/\bmniejsz|\bpomniejsz|\bzmniejsz|\bsmaller|\bdecrease/.test(text) ? 1 : -1;
    const styles = (node.styles as Record<string, unknown> | undefined) || {};
    const props = (node.props as Record<string, unknown> | undefined) || {};
    const currentRaw = (styles.fontSize as string) || (props.fontSize as string);
    const currentPx = parsePx(currentRaw) ?? defaultFontSizePx(node);
    let nextPx = dir > 0 ? Math.round(currentPx * 1.25) : Math.round(currentPx * 0.8);
    if (dir > 0 && nextPx <= currentPx) nextPx = currentPx + 4;
    if (dir < 0 && nextPx >= currentPx) nextPx = Math.max(8, currentPx - 4);
    nextPx = Math.min(240, Math.max(8, nextPx));
    if (nextPx !== currentPx || !currentRaw) {
      const fontSize = `${nextPx}px`;
      return {
        intent: 'RESIZE',
        domain: 'SIZE',
        qualifier,
        targetNodeId: targetId,
        toolCall: tc('set_node_styles', { nodeId: targetId, pageId, styles: { fontSize } }),
        summary: `Zmieniłem rozmiar tekstu zaznaczenia **${targetLabel}** na **${fontSize}**.`,
      };
    }
  }

  // ── 3. CHANGE_TEXT ───────────────────────────────────────────────────────
  const isTextVerb =
    /\b(zmien|ustaw|zmodyfikuj|podmien|wpisz|ustaw)\s+(tekst|tresc|naglowek|tytul|header|title|heading)\b/.test(
      text
    ) ||
    /\b(tytul|naglowek|tekst|tresc)\s+na\s+\S/.test(text) ||
    /\bzmien\s+(header|title|heading)\b/.test(text);
  if (isTextVerb) {
    const value = extractValueAfterNa(raw);
    if (value && !looksLikeQualifierPhrase(value)) {
      const props: Record<string, unknown> = {};
      const nodeProps = (node.props || {}) as Record<string, unknown>;
      const has = (k: string) => Object.prototype.hasOwnProperty.call(nodeProps, k);
      if (has('text') || (!has('title') && TEXTUAL_TYPES.has(node.type))) props.text = value;
      if (has('title')) props.title = value;
      if (has('cta') || has('ctaText')) {
        props.cta = value;
        props.ctaText = value;
      }
      if (Object.keys(props).length === 0) props.text = value;
      return {
        intent: 'CHANGE_TEXT',
        domain: 'TEXT',
        qualifier,
        targetNodeId: targetId,
        toolCall: tc('update_node_props', { sectionId: targetId, pageId, props }),
        summary: `Zmieniłem tekst zaznaczenia **${targetLabel}** na **„${value}”**.`,
      };
    }
  }

  // ── 4. CHANGE_TYPOGRAPHY ─────────────────────────────────────────────────
  if (/\bczcionk|\bfont|\btypografi|\bkroj pisma|\bfont-family/.test(text)) {
    const currentFont = currentNodeFont(node);
    const styles: Record<string, unknown> = {};
    if (qualifier === 'BOLD') {
      const curWeight =
        parseInt(String((node.styles as any)?.fontWeight || (node.props as any)?.fontWeight || ''), 10) ||
        (node.type === 'heading' ? 700 : 400);
      if (curWeight < 900) {
        styles.fontWeight = String(Math.min(900, curWeight + 100));
      } else {
        const currentRaw =
          (node.styles as any)?.fontSize || (node.props as any)?.fontSize;
        const currentPx = parsePx(currentRaw) ?? defaultFontSizePx(node);
        styles.fontSize = `${Math.min(240, Math.round(currentPx * 1.2))}px`;
      }
      styles.letterSpacing = '0.02em';
    } else {
      const font = pickPairingFont(qualifier, currentFont);
      if (font) styles.fontFamily = font;
      if (qualifier === 'LUXURY') styles.letterSpacing = '0.01em';
      else if (qualifier === 'TECH') styles.letterSpacing = '0.04em';
      else if (qualifier === 'MODERN') styles.letterSpacing = '-0.01em';
    }
    if (Object.keys(styles).length > 0) {
      const qualifierWord =
        qualifier === 'LUXURY'
          ? 'luksusową'
          : qualifier === 'MODERN'
            ? 'nowoczesną'
            : qualifier === 'BOLD'
              ? 'bardziej widoczną'
              : qualifier === 'EDITORIAL'
                ? 'redakcyjną'
                : qualifier === 'TECH'
                  ? 'technologiczną'
                  : undefined;
      const applied = Object.entries(styles)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      return {
        intent: 'CHANGE_TYPOGRAPHY',
        domain: 'TYPOGRAPHY',
        qualifier,
        targetNodeId: targetId,
        toolCall: tc('set_node_styles', { nodeId: targetId, pageId, styles }),
        summary: `Zastosowałem ${qualifierWord ? `${qualifierWord} ` : ''}typografię na zaznaczeniu **${targetLabel}** (${applied}).`,
      };
    }
  }

  // ── 5. ALIGN ─────────────────────────────────────────────────────────────
  {
    let align: 'center' | 'left' | 'right' | undefined;
    if (/\bwysrodkuj|\bwyrownaj do srodk|\bw srodku|\bdo srodka|\bcenter\b/.test(text)) align = 'center';
    else if (/\bdo lewej|\bwyrownaj do lewej|\bleft\b/.test(text)) align = 'left';
    else if (/\bdo prawej|\bwyrownaj do prawej|\bright\b/.test(text)) align = 'right';
    if (align) {
      const current = ((node.styles as any)?.textAlign ?? (node.props as any)?.textAlign) as string | undefined;
      if (current !== align) {
        return {
          intent: 'ALIGN',
          domain: 'ALIGN',
          qualifier,
          targetNodeId: targetId,
          toolCall: tc('set_node_styles', { nodeId: targetId, pageId, styles: { textAlign: align } }),
          summary: `Wyrównałem zaznaczenie **${targetLabel}** do: **${align}**.`,
        };
      }
    }
  }

  // ── 6. MOVE (horizontal pixel shift, canvas renders translateX) ──────────
  if (MOVE_RE.test(text) && !MOVE_EXCLUDE_RE.test(text)) {
    const horizontal = MOVE_HORIZONTAL_RE.test(text);
    if (horizontal) {
      const axis = /\bw lewo|\blewo\b/.test(text) ? 'X-' : 'X+';
      const styles: Record<string, unknown> = {};
      const cur = parsePx((node.styles as any)?.translateX) ?? 0;
      styles.translateX = `${axis === 'X+' ? cur + 24 : cur - 24}px`;
      return {
        intent: 'MOVE',
        domain: 'LAYOUT',
        qualifier,
        targetNodeId: targetId,
        toolCall: tc('set_node_styles', { nodeId: targetId, pageId, styles }),
        summary: `Przesunąłem zaznaczenie **${targetLabel}** o ${axis === 'X+' ? '24px w prawo' : '24px w lewo'}.`,
      };
    }
  }

  // ── 7. STYLE_MODIFICATION (semantic qualifier + explicit style noun) ───────
  if (qualifier) {
    const styleNoun = /\bstyl\b|\bstyle\b|\blook\b|\bwyglad\b|\bcharakter\b|\btypografi\b|\bcus\b|\bnowoczesn/;
    if (styleNoun.test(text)) {
    const styles: Record<string, unknown> = {};
    if (TEXTUAL_TYPES.has(node.type)) {
      const font = pickPairingFont(qualifier, currentNodeFont(node));
      if (font && font !== currentNodeFont(node)) styles.fontFamily = font;
      if (qualifier === 'BOLD') {
        const curWeight =
          parseInt(String((node.styles as any)?.fontWeight || (node.props as any)?.fontWeight || ''), 10) ||
          (node.type === 'heading' ? 700 : 400);
        styles.fontWeight = curWeight < 900 ? String(Math.min(900, curWeight + 100)) : '900';
      }
      if (qualifier === 'LUXURY') styles.letterSpacing = '0.03em';
      if (qualifier === 'TECH') styles.letterSpacing = '0.06em';
    } else {
      const currentRadius = (node.styles as any)?.borderRadius ?? (node.props as any)?.borderRadius;
      if (qualifier === 'LUXURY') {
        if (currentRadius !== '16px') styles.borderRadius = '16px';
        styles.boxShadow = '0 18px 48px rgba(0,0,0,0.35)';
      } else if (qualifier === 'MODERN' || qualifier === 'MINIMAL') {
        if (currentRadius !== '4px') styles.borderRadius = '4px';
        styles.boxShadow = '0 6px 24px rgba(0,0,0,0.18)';
      } else if (qualifier === 'BOLD') {
        styles.boxShadow = '0 14px 40px rgba(0,0,0,0.45)';
      } else {
        if (currentRadius !== '8px') styles.borderRadius = '8px';
        styles.boxShadow = '0 8px 28px rgba(0,0,0,0.22)';
      }
    }
    if (Object.keys(styles).length > 0) {
      const word =
        qualifier === 'LUXURY'
          ? 'luksusowy'
          : qualifier === 'MODERN'
            ? 'nowoczesny'
            : qualifier === 'BOLD'
              ? 'bardziej widoczny'
              : qualifier === 'EDITORIAL'
                ? 'redakcyjny'
                : qualifier === 'TECH'
                  ? 'technologiczny'
                  : 'minimalistyczny';
      return {
        intent: 'STYLE_MODIFICATION',
        domain: 'STYLE',
        qualifier,
        targetNodeId: targetId,
        toolCall: tc('set_node_styles', { nodeId: targetId, pageId, styles }),
        summary: `Nadałem zaznaczeniu **${targetLabel}** bardziej ${word} charakter (${Object.keys(styles).join(', ')}).`,
      };
    }
  }
  }

  return null;
}

export default resolveTargetedEdit;
