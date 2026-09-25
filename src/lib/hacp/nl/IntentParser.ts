/**
 * IntentParser.ts — GATE v8.0 PHASE 3–5 / 10–11.
 *
 * Pure classification: prompt (+ optional previous turn) → ParsedEditIntent.
 *
 * Architecture: ONE ordered rule table. Each rule declares the intent it owns,
 * when it fires and how the literal value/amount is extracted. There is no
 * second parser for Main Chat vs Mini Inspector and no LLM involved.
 *
 * Why this matters (GATE v8 PHASE 1 forensic):
 *   "rozciągnij tytuł na boki" used to reach the TEXT rule because the rule
 *   matched the NOUN before it understood the VERB — it wrote text = "boki".
 *   Here the verb decides the intent first; the value is only ever read for
 *   the intent that was actually chosen.
 */

import { COLOR_MAP } from '../HacpTypes';
import {
  VOCAB,
  STYLE_VALUE_TOKEN,
  extractQualifier,
  fold,
  looksLikeQualifierPhrase,
  type EditContinuation,
  type NlIntentClass,
  type NlOperation,
  type ParsedEditIntent,
  type TargetedQualifier,
} from './IntentTaxonomy';

// ---------------------------------------------------------------------------
// Polish adverbs of colour ("na czarno") — deterministic, not a design pick
// ---------------------------------------------------------------------------

export const COLOR_ADVERBS: Record<string, string> = {
  czerwono: '#FF0000',
  zielono: '#00FF00',
  niebiesko: '#0000FF',
  zolto: '#FFFF00',
  bialo: '#FFFFFF',
  czarno: '#000000',
  pomaranczowo: '#FFA500',
  fioletowo: '#800080',
  rozowo: '#FFC0CB',
  szaro: '#808080',
  srebrno: '#C0C0C0',
  zlocie: '#D9A86C',
  bordo: '#7F1D1D',
  granatowo: '#1E3A8A',
  turkusowo: '#0D9488',
  bezowo: '#E7D3B3',
  kremowo: '#F5EFE6',
  morsko: '#115E59',
  sliwkowo: '#6B21A8',
};

// ---------------------------------------------------------------------------
// Value / amount extraction (raw prompt keeps the user's original casing)
// ---------------------------------------------------------------------------

function valueAfterNa(raw: string): string | undefined {
  const quoted = raw.match(/["'„”](.+?)["'„”]/);
  if (quoted && quoted[1].trim()) return quoted[1].trim();
  const m = raw.match(/\bna\s+(.+)$/i);
  if (!m) return undefined;
  const v = m[1].trim().replace(/[.!?,;:]+$/, '').trim();
  return v || undefined;
}

/** GATE v8 — value that FOLLOWS the writing verb ("napisz Marcin …"). */
function valueAfterVerb(raw: string, pattern: RegExp): string | undefined {
  const m = raw.match(new RegExp(`${pattern.source}\\s+(.+)$`, 'i'));
  if (!m) return undefined;
  // m[1] is the pattern's OWN capture group (the verb) — the tail is m[2].
  const tail = m[2] ?? m[1];
  const v = tail.trim().replace(/[.!?,;:]+$/, '').trim();
  return v || undefined;
}

/** "o 20%" / "o 10px" / "o 0.1em" / "o 4" → { amount, unit }. */
function amountFrom(raw: string): { amount: number; unit: string } | undefined {
  // NOTE: no \b after the unit group — '%' is a non-word character, so a
  // trailing \b would never match at end-of-string and "%" would degrade to a
  // unitless step (GATE v8 forensic: 16px + "20%" became +20px).
  const m = raw.match(/\bo\s+(-?\d+(?:[.,]\d+)?)\s*(%|px|pt|em|rem)?/i);
  if (!m) return undefined;
  const amount = Math.abs(parseFloat(m[1].replace(',', '.')));
  if (!Number.isFinite(amount)) return undefined;
  return { amount, unit: (m[2] || 'step').toLowerCase() };
}

/** "na 24px" / "na 1.6" / "na 50%" / "na 700" → numeric SET value. */
function numericAfterNa(raw: string): { amount: number; unit: string } | undefined {
  const literal = valueAfterNa(raw);
  if (!literal) return undefined;
  const m = literal.match(/^(-?\d+(?:[.,]\d+)?)\s*(px|pt|em|rem|%|deg)?$/i);
  if (!m) return undefined;
  const amount = parseFloat(m[1].replace(',', '.'));
  if (!Number.isFinite(amount)) return undefined;
  return { amount, unit: (m[2] || 'value').toLowerCase() };
}

function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (Math.abs(m - n) > 2) return 3;
  const dp: number[] = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[n];
}

/**
 * Colour literal → hex. Token match first (exact, then ≤1 typo), substring
 * last (GATE v6 compatibility). Returns the hex plus what the user typed.
 */
export function lookupColor(
  raw: string,
  colorMap: Record<string, string> = COLOR_MAP,
  adverbs: Record<string, string> = COLOR_ADVERBS
): { hex?: string; literal?: string } {
  const hex = raw.match(/#([0-9a-fA-F]{3,8})\b/);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    if (h.length === 6) return { hex: `#${h.toUpperCase()}`, literal: hex[0] };
  }
  const t = fold(raw);
  const tokens = t.split(' ').filter(Boolean);
  const names: Array<[string, string]> = [
    ...Object.entries(colorMap).map(([k, v]): [string, string] => [fold(k), v]),
    ...Object.entries(adverbs).map(([k, v]): [string, string] => [fold(k), v]),
  ];
  for (const token of tokens) {
    const exact = names.find(([name]) => name === token);
    if (exact) return { hex: exact[1], literal: token };
  }
  for (const token of tokens) {
    if (token.length < 5) continue;
    const near = names.find(([name]) => name.length >= 5 && editDistance(name, token) <= 1);
    if (near) return { hex: near[1], literal: token };
  }
  const sub = names.find(([name]) => name.length >= 4 && t.includes(name));
  if (sub) return { hex: sub[1], literal: sub[0] };
  return {};
}

// ---------------------------------------------------------------------------
// Operation vocabulary
// ---------------------------------------------------------------------------

const DOWN_RE =
  /\bmniejsz|\bpomniejsz|\bzmniejsz|\bsmaller|\bdecrease|\bodchudz|\bcien|\bmniej\b|\blagodniej|\bdelikatniej|\bsubtelniej|\bluzniej|\bnizej|\bmniejsza|\bw lewo|\blewo\b/;
const UP_RE =
  /\bwieksz|\bpowieksz|\bzwieksz|\bbigger|\bincrease|\bwiecej|\bmocniej|\bsilniej|\bbardziej|\bjeszcze\b|\bna maksa|\bna maxa|\bnajbardziej|\bpogrub|\bszerzej|\bwieksza|\bduzo\b|\brozciagn|\brozchyl|\brozloz|\brozstrzel|\bposzerz|\bzaokragl|\bw prawo|\bprawo\b/;

const AMPLIFIER_RE = /\bjeszcze\b|\bmocniej|\bbardziej|\bwiecej|\bsilniej|\bnajbardziej|\bna maksa|\bna maxa/;

/** A prompt that expresses DIRECTION — required before a step may execute. */
function hasDirection(t: string): boolean {
  return (
    UP_RE.test(t) ||
    DOWN_RE.test(t) ||
    AMPLIFIER_RE.test(t) ||
    VOCAB.moveHorizontal.test(t) ||
    VOCAB.align.test(t) ||
    VOCAB.resetVerb.test(t) ||
    // A TOGGLE is self-contained — it needs no value and no direction.
    VOCAB.toggleVerb.test(t)
  );
}

/**
 * GATE v8 — FONT_SIZE may NOT claim a prompt that is really about another
 * numeric property ("zwiększ zaokrąglenie rogów" is BORDER_RADIUS, not size).
 * sizeSignal is intentionally broad, so it yields to the specific nouns.
 */
function isFontSizeMode(t: string): boolean {
  if (!VOCAB.sizeSignal.test(t)) return false;
  return !(
    VOCAB.radiusNoun.test(t) ||
    VOCAB.opacityNoun.test(t) ||
    VOCAB.widthNoun.test(t) ||
    VOCAB.leadingNoun.test(t) ||
    VOCAB.trackingNoun.test(t) ||
    VOCAB.weightNoun.test(t)
    // fontNoun is intentionally NOT excluded: "zmniejsz czcionkę o 25%" is a
    // SIZE edit, while "zmień czcionkę na …" has no sizeSignal at all and
    // still reaches the FONT_FAMILY rule below.
  );
}

/** Subject vocabulary — a prompt with none of it cannot start a new edit. */
const SUBJECT_RE = new RegExp(
  [
    VOCAB.colorNoun.source,
    VOCAB.textNoun.source,
    VOCAB.textWriteVerb.source,
    VOCAB.sizeSignal.source,
    VOCAB.stretchVerb.source,
    VOCAB.trackingNoun.source,
    VOCAB.weightNoun.source,
    VOCAB.leadingNoun.source,
    VOCAB.fontNoun.source,
    VOCAB.widthNoun.source,
    VOCAB.opacityNoun.source,
    VOCAB.radiusNoun.source,
    VOCAB.align.source,
    VOCAB.moveVerb.source,
    VOCAB.styleNoun.source,
  ].join('|')
);

/** RESET needs a STYLE subject ("przywróć domyślny rozmiar"), not just a verb. */
const RESET_SUBJECT_RE = new RegExp(
  [
    VOCAB.colorNoun.source,
    VOCAB.textNoun.source,
    VOCAB.sizeSignal.source,
    VOCAB.trackingNoun.source,
    VOCAB.weightNoun.source,
    VOCAB.leadingNoun.source,
    VOCAB.fontNoun.source,
    VOCAB.widthNoun.source,
    VOCAB.opacityNoun.source,
    VOCAB.radiusNoun.source,
    VOCAB.align.source,
  ].join('|')
);

/** GATE v8 — "przywróć domyślny rozmiar" is a STYLE reset, never an undo. */
export function isStyleResetPrompt(foldedPrompt: string): boolean {
  return VOCAB.resetVerb.test(foldedPrompt) && RESET_SUBJECT_RE.test(foldedPrompt);
}

const BACKGROUND_HINT_RE = /\btlo\b|\btla\b|\bbackground\b|\bbg\b/;

// ---------------------------------------------------------------------------
// Rule contract
// ---------------------------------------------------------------------------

interface ValueInfo {
  value?: string;
  rawValue?: string;
  amount?: number;
  unit?: string;
  explicit: boolean;
  note?: string;
  rejected?: boolean;
  ambiguous?: boolean;
}

interface Rule {
  id: string;
  intent: NlIntentClass | ((t: string) => NlIntentClass | null);
  test: (t: string, raw: string) => boolean;
  operation: (t: string, v: ValueInfo) => NlOperation;
  value: (raw: string, t: string) => ValueInfo;
  qualifier?: (t: string) => TargetedQualifier | undefined;
}

function baseConfidence(v: ValueInfo): number {
  if (v.rejected) return 0.2;
  if (v.ambiguous) return 0.55;
  if (v.explicit && (v.value !== undefined || v.amount !== undefined)) return 0.95;
  if (v.explicit) return 0.9; // documented step — no literal value required
  return 0.45; // intent known, value missing → CLARIFY (design-pick territory)
}

/** Shared numeric-op resolution: literal → SET, "o N" → INCREASE/DECREASE. */
function numericOperation(t: string, v: ValueInfo): NlOperation {
  if (v.note === 'set-literal') return 'SET';
  if (v.amount !== undefined) return DOWN_RE.test(t) ? 'DECREASE' : 'INCREASE';
  if (DOWN_RE.test(t)) return 'MAKE_LESS';
  if (AMPLIFIER_RE.test(t)) return 'MAKE_MORE';
  if (v.note === 'amount-required') return 'INCREASE';
  return 'INCREASE';
}

function numericValue(raw: string, fallbackNote: string): ValueInfo {
  const n = numericAfterNa(raw);
  if (n) {
    const suffix = n.unit === 'value' ? '' : n.unit;
    return {
      value: `${n.amount}${suffix}`,
      amount: n.amount,
      unit: n.unit,
      explicit: true,
      note: 'set-literal',
    };
  }
  const a = amountFrom(raw);
  if (a) return { amount: a.amount, unit: a.unit, explicit: true };
  return { explicit: true, note: fallbackNote };
}
// ---------------------------------------------------------------------------
// The rule table (ORDER = specificity; first match wins)
// ---------------------------------------------------------------------------

const RULES: Rule[] = [
  // 1. MOVE — horizontal canvas shift (section reorder rejected before the table)
  {
    id: 'MOVE',
    intent: 'MOVE',
    test: (t) => VOCAB.moveVerb.test(t) && VOCAB.moveHorizontal.test(t),
    operation: (t) => (DOWN_RE.test(t) ? 'DECREASE' : 'INCREASE'),
    value: (raw) => {
      const a = amountFrom(raw);
      return a
        ? { amount: a.amount, unit: a.unit, explicit: true }
        : { explicit: true, note: 'step-24px' };
    },
  },

  // 2. TEXT_ALIGN
  {
    id: 'TEXT_ALIGN',
    intent: 'TEXT_ALIGN',
    test: (t) => VOCAB.align.test(t),
    operation: () => 'SET',
    value: (_raw, t) => {
      let side: string | undefined;
      if (/\bwysrodkuj|\bw srodku|\bdo srodka|\bcenter\b|\bwyrownaj\s+do\s+srodk/.test(t))
        side = 'center';
      else if (/\bdo lewej|\bleft\b|\bwyrownaj\s+do\s+lewej/.test(t)) side = 'left';
      else if (/\bdo prawej|\bright\b|\bwyrownaj\s+do\s+prawej/.test(t)) side = 'right';
      return side ? { value: side, explicit: true } : { explicit: false };
    },
  },

  // 3. LETTER_SPACING — "rozciągnij tytuł na boki" is TRACKING, never TEXT
  {
    id: 'LETTER_SPACING',
    intent: 'LETTER_SPACING',
    test: (t) => VOCAB.stretchVerb.test(t) || VOCAB.trackingNoun.test(t),
    operation: numericOperation,
    value: (raw) => numericValue(raw, 'step-004em'),
  },

  // 4. LINE_HEIGHT — interlinia / wysokość linii
  {
    id: 'LINE_HEIGHT',
    intent: 'LINE_HEIGHT',
    test: (t) => VOCAB.leadingNoun.test(t),
    operation: numericOperation,
    value: (raw) => numericValue(raw, 'step-010'),
  },

  // 5. FONT_WEIGHT — pogrub / waga / bold; TOGGLE lives here as well
  {
    id: 'FONT_WEIGHT',
    intent: 'FONT_WEIGHT',
    test: (t) => VOCAB.weightNoun.test(t),
    operation: (t, v) => {
      if (VOCAB.toggleVerb.test(t)) return 'TOGGLE';
      if (v.note === 'set-literal' || v.value !== undefined) return 'SET';
      if (DOWN_RE.test(t)) return 'DECREASE';
      if (/\bmniej\b/.test(t)) return 'MAKE_LESS';
      if (AMPLIFIER_RE.test(t)) return 'MAKE_MORE';
      return 'INCREASE';
    },
    value: (raw) => {
      const literal = valueAfterNa(raw);
      if (literal && !looksLikeQualifierPhrase(literal)) {
        const m = literal.match(/^(\d{2,3}|normal|medium|semibold|bold|extrabold|light)$/i);
        if (m) return { value: m[1].toLowerCase(), explicit: true, note: 'set-literal' };
      }
      const f = fold(raw);
      if (/\bwylacz/.test(f)) return { value: '400', explicit: true };
      if (/\bwlacz/.test(f)) return { value: '700', explicit: true };
      const a = amountFrom(raw);
      if (a) return { amount: a.amount, unit: a.unit, explicit: true };
      return { explicit: true, note: 'step-weight' };
    },
  },

  // 6. RESET — restore the SCHEMA default (SSOT = ComponentRegistry)
  {
    id: 'RESET',
    intent: (t) => {
      if (VOCAB.leadingNoun.test(t)) return 'LINE_HEIGHT';
      if (VOCAB.trackingNoun.test(t)) return 'LETTER_SPACING';
      if (VOCAB.weightNoun.test(t)) return 'FONT_WEIGHT';
      if (VOCAB.opacityNoun.test(t)) return 'OPACITY';
      if (VOCAB.radiusNoun.test(t)) return 'BORDER_RADIUS';
      if (VOCAB.widthNoun.test(t)) return 'WIDTH';
      if (VOCAB.align.test(t)) return 'TEXT_ALIGN';
      if (VOCAB.fontNoun.test(t)) return 'FONT_FAMILY';
      if (VOCAB.colorNoun.test(t)) return BACKGROUND_HINT_RE.test(t) ? 'BACKGROUND_COLOR' : 'TEXT_COLOR';
      if (isFontSizeMode(t)) return 'FONT_SIZE';
      if (VOCAB.textNoun.test(t)) return 'TEXT_CONTENT';
      if (VOCAB.styleNoun.test(t)) return null; // "przywróć wygląd" is not deterministic
      return 'FONT_SIZE';
    },
    test: (t) => VOCAB.resetVerb.test(t) && RESET_SUBJECT_RE.test(t),
    operation: () => 'RESET',
    value: () => ({ explicit: true, note: 'schema-default' }),
  },

  // 7. COLOR — colour noun, or a colour literal written in "na …" position
  {
    id: 'COLOR',
    intent: 'TEXT_COLOR',
    test: (t, raw) => {
      if (VOCAB.colorNoun.test(t)) return true;
      if (!/\bna\s+/.test(t)) return false;
      if (VOCAB.colorAdverb.test(t)) return true;
      return Boolean(lookupColor(raw).hex);
    },
    operation: () => 'SET',
    value: (raw, t) => {
      const literal = valueAfterNa(raw);
      if (!literal) return { explicit: false, note: 'design-pick' };
      const known = lookupColor(raw);
      if (!known.hex) return { rawValue: literal, explicit: true, note: 'unknown-color' };
      const hasColorNoun = VOCAB.colorNoun.test(t);
      const textSignal = VOCAB.textNoun.test(t) || VOCAB.textWriteVerb.test(t);
      if (textSignal && !hasColorNoun) {
        // "zmień tekst na czerwony" — colour or text? never guess.
        return {
          value: known.hex,
          rawValue: literal,
          explicit: true,
          ambiguous: true,
          note: 'color-or-text',
        };
      }
      return { value: known.hex, rawValue: literal, explicit: true };
    },
  },

  // 8. FONT_SIZE
  {
    id: 'FONT_SIZE',
    intent: 'FONT_SIZE',
    test: (t) => isFontSizeMode(t),
    operation: numericOperation,
    value: (raw) => numericValue(raw, 'step-25pct'),
  },

  // 9. FONT_FAMILY — czcionka / krój pisma / typography qualifier
  {
    id: 'FONT_FAMILY',
    intent: 'FONT_FAMILY',
    test: (t) => VOCAB.fontNoun.test(t),
    operation: () => 'SET',
    value: (raw) => {
      const literal = valueAfterNa(raw);
      if (literal && looksLikeQualifierPhrase(literal)) {
        return { explicit: false, note: 'qualifier' };
      }
      if (literal) return { value: literal, explicit: true };
      return { explicit: false, note: 'design-pick' };
    },
  },

  // 10. TEXT_CONTENT — only verbs that actually write content
  {
    id: 'TEXT_CONTENT',
    intent: 'TEXT_CONTENT',
    test: (t, raw) =>
      VOCAB.bareTextVerb.test(t) || (VOCAB.textWriteVerb.test(t) && VOCAB.textNoun.test(t)),
    operation: () => 'REPLACE',
    value: (raw, t) => {
      const literal =
        valueAfterNa(raw) ??
        (VOCAB.bareTextVerb.test(t) ? valueAfterVerb(raw, VOCAB.bareTextVerb) : undefined);
      if (!literal) return { explicit: false, note: 'value-missing' };
      const foldedValue = fold(literal);
      if (VOCAB.stopTextValue.test(foldedValue)) {
        return {
          value: literal,
          rawValue: literal,
          explicit: true,
          rejected: true,
          note: 'direction-not-text',
        };
      }
      if (STYLE_VALUE_TOKEN.test(foldedValue)) {
        return {
          value: literal,
          rawValue: literal,
          explicit: true,
          ambiguous: true,
          note: 'style-word-in-value',
        };
      }
      if (literal.length > 200) {
        return { value: literal, explicit: true, rejected: true, note: 'too-long' };
      }
      return { value: literal, explicit: true };
    },
  },

  // 11. WIDTH — only with an explicit amount (never a silent layout guess)
  {
    id: 'WIDTH',
    intent: 'WIDTH',
    test: (t) => VOCAB.widthNoun.test(t),
    operation: numericOperation,
    value: (raw) => {
      const a = amountFrom(raw);
      if (a) return { amount: a.amount, unit: a.unit, explicit: true };
      return { explicit: false, note: 'amount-required' };
    },
  },

  // 12. OPACITY — "zrób bardziej przezroczysty" = opacity DOWN, not UP
  {
    id: 'OPACITY',
    intent: 'OPACITY',
    test: (t) => VOCAB.opacityNoun.test(t),
    operation: (t, v) => {
      if (v.note === 'set-literal') return 'SET';
      if (/\bbardziej\s+przezroczyst|\bpolprzezroczyst|\bluzniejsz/.test(t)) return 'DECREASE';
      if (/\bmniej\s+przezroczyst|\bgestszy|\bkryjacy/.test(t)) return 'INCREASE';
      return numericOperation(t, v);
    },
    value: (raw) => numericValue(raw, 'step-010'),
  },

  // 13. BORDER_RADIUS
  {
    id: 'BORDER_RADIUS',
    intent: 'BORDER_RADIUS',
    test: (t) => VOCAB.radiusNoun.test(t),
    operation: numericOperation,
    value: (raw) => numericValue(raw, 'step-008px'),
  },

  // 14. STYLE_MODIFICATION — semantic qualifier + explicit style noun
  {
    id: 'STYLE_MODIFICATION',
    intent: 'STYLE_MODIFICATION',
    test: (t) => extractQualifier(t) !== undefined && VOCAB.styleNoun.test(t),
    operation: () => 'SET',
    value: () => ({ explicit: false, note: 'design-intelligence' }),
    qualifier: (t) => extractQualifier(t),
  },
];

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export function parseEditIntent(
  rawPrompt: string,
  options?: { previous?: EditContinuation | null }
): ParsedEditIntent | null {
  const raw = (rawPrompt || '').trim();
  const t = fold(raw);
  if (!t) return null;

  // Section reorder / stacking belongs to HacpIntentEngine — never here.
  if (VOCAB.moveVerb.test(t) && VOCAB.moveExclude.test(t)) return null;

  const prev = options?.previous;

  // PHASE 5 — contextual continuation: a relative prompt with no subject of
  // its own ("jeszcze bardziej") reuses the previous intent + operation.
  if (prev?.intent && !SUBJECT_RE.test(t) && VOCAB.relative.test(t)) {
    const direction: 'UP' | 'DOWN' = DOWN_RE.test(t) && !UP_RE.test(t) ? 'DOWN' : 'UP';
    return {
      intent: prev.intent,
      operation: direction === 'DOWN' ? 'MAKE_LESS' : 'MAKE_MORE',
      direction,
      explicitValue: true,
      confidence: 0.85,
      reason: `CONTINUATION:from=${prev.intent}${prev.operation ? `/${prev.operation}` : ''}`,
      rule: 'CONTINUATION',
    };
  }

  for (const rule of RULES) {
    if (!rule.test(t, raw)) continue;
    const intent = typeof rule.intent === 'function' ? rule.intent(t) : rule.intent;
    if (!intent) continue;
    let v = rule.value(raw, t);
    // A documented step may only execute when the prompt states a DIRECTION —
    // "zmień czcionkę" knows the intent but not the value → CLARIFY.
    if (v.explicit && v.value === undefined && v.amount === undefined && !hasDirection(t)) {
      v = { ...v, explicit: false, note: `${v.note || 'step'}:no-direction` };
    }
    const qualifier = rule.qualifier ? rule.qualifier(t) : extractQualifier(t);
    const operation = rule.operation(t, v);
    let confidence = baseConfidence(v);
    let reason = `${rule.id}:${operation}`;
    if (v.note) reason += `:${v.note}`;
    if (qualifier) {
      reason += ':design-intelligence';
      confidence = Math.min(confidence, 0.6);
    }
    return {
      intent,
      operation,
      value: v.value,
      rawValue: v.rawValue,
      amount: v.amount,
      unit: v.unit,
      direction: DOWN_RE.test(t) ? 'DOWN' : UP_RE.test(t) ? 'UP' : undefined,
      qualifier,
      explicitValue: v.explicit,
      confidence,
      reason,
      rule: rule.id,
    };
  }
  return null;
}

export default parseEditIntent;
