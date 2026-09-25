/**
 * IntentTaxonomy.ts — GATE v8.0 PHASE 2/3 (single vocabulary + single mapping).
 *
 * ONE place that answers three questions for every natural-language edit:
 *   1. which INTENT is being expressed   (NlIntentClass)
 *   2. which OPERATION is being applied  (NlOperation)
 *   3. how it is EXECUTED                (tool + legacy intent + domain)
 *
 * The parser (IntentParser) only classifies; the compiler (IntentCompiler)
 * only executes. Neither owns its own keyword lists — both read VOCAB and
 * INTENT_DESCRIPTORS from here, so Main Chat and Mini Inspector can never
 * drift into two dialects of the same language.
 */

import type { HacpToolCall } from '../../ai/AIProviderTypes';

// ---------------------------------------------------------------------------
// Legacy surface (kept byte-compatible with GATE v1/v6/v7 consumers)
// ---------------------------------------------------------------------------

export type TargetedEditIntent =
  | 'CHANGE_TYPOGRAPHY'
  | 'CHANGE_COLOR'
  | 'CHANGE_TEXT'
  | 'RESIZE'
  | 'ALIGN'
  | 'MOVE'
  | 'STYLE_MODIFICATION'
  /** GATE v8 — opacity / border-radius style edits (canvas-supported). */
  | 'CHANGE_APPEARANCE';

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
  /**
   * GATE v1.0 PHASE 7 — FAST-PATH ELIGIBILITY SIGNAL.
   * true  → the new value came LITERALLY from the user prompt (deterministic).
   * false → the value was derived/defaulted (design decision) → AI PATH only.
   */
  explicitValue?: boolean;
  /** GATE v8 — machine intent class (TEXT_CONTENT, LETTER_SPACING, …). */
  intentClass?: NlIntentClass;
  /** GATE v8 — semantic operation applied (SET, INCREASE, REPLACE, …). */
  operation?: NlOperation;
  /** GATE v8 — literal value written by the user (case preserved). */
  value?: string;
  /** GATE v8 — unit of the numeric argument (%, px, em, weight, step). */
  unit?: string;
  /** GATE v8 — 0..1 confidence; below CONFIDENCE_THRESHOLD → AI/CLARIFY. */
  confidence?: number;
  /** GATE v8 — audit reason (rule id + why this interpretation won). */
  reason?: string;
}

// ---------------------------------------------------------------------------
// GATE v8 — the natural-language intent object
// ---------------------------------------------------------------------------

export type NlIntentClass =
  | 'TEXT_CONTENT'
  | 'TEXT_COLOR'
  | 'BACKGROUND_COLOR'
  | 'FONT_SIZE'
  | 'FONT_FAMILY'
  | 'FONT_WEIGHT'
  | 'LETTER_SPACING'
  | 'LINE_HEIGHT'
  | 'TEXT_ALIGN'
  | 'WIDTH'
  | 'OPACITY'
  | 'BORDER_RADIUS'
  | 'MOVE'
  | 'STYLE_MODIFICATION';

export type NlOperation =
  | 'SET'
  | 'INCREASE'
  | 'DECREASE'
  | 'MAKE_MORE'
  | 'MAKE_LESS'
  | 'REPLACE'
  | 'TOGGLE'
  | 'RESET';

/** GATE v8 PHASE 11 — below this the prompt goes to AI/CLARIFY, never to dispatch. */
export const CONFIDENCE_THRESHOLD = 0.7;

/**
 * GATE v8 PHASE 11 — why the compiler REFUSED to build a tool call.
 * The eligibility gate maps these 1:1 onto a FastPathReason, so the user-facing
 * answer stays deterministic and honest (CLARIFY / AI PATH), never a mutation.
 */
export type EditRejectReason =
  /** No usable target (selection missing / not in the document). */
  | 'NOT_APPLICABLE'
  /** Value not resolvable (unknown colour/font) or capability unsupported. */
  | 'UNRESOLVED'
  /** The prompt names the property but not the new value. */
  | 'PARAMETERS_INCOMPLETE'
  /** GATE v8 anti-BOKI: the "value" is a direction, not text ("na boki"). */
  | 'TEXT_VALUE_REJECTED'
  /** Parsed intent is ambiguous (conf < threshold) → honest CLARIFY. */
  | 'LOW_CONFIDENCE';

export interface EditOutcome {
  kind: 'resolution';
  resolution: TargetedEditResolution;
}

export interface RejectOutcome {
  kind: 'reject';
  reason: EditRejectReason;
}

/** GATE v8 — the "current operation" carried between turns (PHASE 5). */
export interface EditContinuation {
  intent?: NlIntentClass;
  operation?: NlOperation;
  targetNodeId?: string;
}

export interface ParsedEditIntent {
  intent: NlIntentClass;
  operation: NlOperation;
  /** Literal replacement value taken from the prompt (case preserved). */
  value?: string;
  /**
   * What the user typed AFTER "na" when it could NOT be resolved
   * (unknown colour/font). Kept so the compiler can refuse honestly
   * instead of inventing a value.
   */
  rawValue?: string;
  /** Literal numeric argument ("o 20%" → 20, "o 0.1em" → 0.1). */
  amount?: number;
  /** Unit of `amount` as written ('%' | 'px' | 'pt' | 'em' | 'rem' | 'ratio'). */
  unit?: string;
  /** Direction for relative operations. */
  direction?: 'UP' | 'DOWN';
  qualifier?: TargetedQualifier;
  /** true → value/amount written literally by the user. */
  explicitValue: boolean;
  confidence: number;
  /** Audit trail: which rule produced this interpretation and why. */
  reason: string;
  /** Audit trail: id of the matching rule in the rule table. */
  rule: string;
}

// ---------------------------------------------------------------------------
// Vocabulary — folded (lowercase, ASCII, punctuation→space). Polished via
// fold() so 'ł/ś/ż/ć/ń/ó/ę' all collapse to ASCII aliases.
// ---------------------------------------------------------------------------

export function fold(s: string): string {
  return (s || '')
    .toLowerCase()
    // 'ł' has NO canonical decomposition under NFD — map it first (GATE v7).
    .replace(/[łŁ]/g, 'l')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,!?;:"'`„”()\[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const VOCAB = {
  moveVerb: /\b(przesun|przenies|przesunac|przesuwaj|shift|move)\b/,
  /** Section reorder / stacking belongs to HacpIntentEngine — never here. */
  moveExclude:
    /\bsekcj|\bsection|\bnizej|\bwyzej|\bw gore|\bw dol|\bna gore|\bna dol|\bdol\b|\bgor[ea]\b|ponizej|nizej|kolejnosc|next|prev|sortowan/,
  moveHorizontal: /\bw prawo|\bw lewo|\blewo\b|\bprawo\b|\bbok\b|\bside\b|\bw bok/,

  align:
    /\bwysrodkuj|\bwyrownaj\s+do\s+srodk|\bw srodku|\bdo srodka|\bcenter\b|\bdo lewej|\bwyrownaj\s+do\s+lewej|\bleft\b|\bdo prawej|\bwyrownaj\s+do\s+prawej|\bright\b/,

  colorNoun: /\bkolor|\bcolour|\bcolor|\bbarw|\btlo\b|\btla\b|\bbg\b|\bbackground\b|\btle\b/,

  textNoun:
    /\b(podtytul|tekst|tresc|napis|naglowek|tytul|nazw|etykiet|label|title|heading|header|podpis|opis|przycisk)\b/,
  textWriteVerb:
    /\b(napisz|napiszac|wpisz|wprowadz|ustaw|zmien|podmien|zamien|przepisz|sformuluj|zmodyfikuj|edytuj|nazwij|wypisz|przeredaguj)\b/,
  /** Verbs whose object IS the new text ("napisz Marcin Bernatowicz"). */
  bareTextVerb: /\b(napisz|wpisz|przepisz|wypisz|sformuluj|nazwij)\b/,

  sizeSignal:
    /\brozmiar|\bwieksz|\bmniejsz|\bpowieksz|\bpomniejsz|\bzmniejsz|\bzwieksz|\bwielkosc|\bsize\b|\bbigger|\bsmaller|\bwieksza|\bwięks|\bmniejsza|\bformat\b/,

  stretchVerb: /\brozciagn|\brozchyl|\brozloz|\brozciag/,
  trackingNoun: /\bodstep liter|\bletter[- ]?spacing|\btracking|\brozstrzel/,

  weightNoun:
    /\bpogrub|\bwaga\b|\bfont[- ]?weight|\bgrubosc|\bgrubsza|\bcien|\bna bold\b|\bextrabold|\bsemibold|\bbold\b|\bczcionk.*grub/,

  leadingNoun: /\binterlini|\bwysokosc\s+linii|\bodstep\s+linii|\bleading|\blini[ei]\b|\bwysokosc wiersza/,

  fontNoun: /\bczcionk|\bfont\b|\bkroj\s+pisma|\bkr[oo]j|\btypografi|\bfont-family|\bpismo\b/,

  widthNoun: /\bszerokosc|\bwidth\b|\bposzerz|\bna\s+szerokosc/,

  opacityNoun: /\bprzezroczyst|\bkrycie|\bopacity|\bnieprzezroczyst/,
  radiusNoun: /\bzaokragl|\bborder[- ]?radius|\bradius\b|\brog[ia]\b|\bzaokraglenie/,

  resetVerb: /\bprzywroc|\breset|\bdomysln|\bwroc\s+do\s+standardu/,
  toggleVerb: /\bprzelacz|\btoggle\b/,

  /** Relative amplifiers that carry NO noun — they inherit the last intent. */
  relative:
    /\bjeszcze\b|\bbardziej|\bmocniej|\bsilniej|\bwiecej|\btroch|\bnieco|\bdelikatniej|\bsubtelniej|\bluzniej|\blagodniej|\bnajbardziej|\bmniej|\bna maksa|\bna maxa|\bduzo\b/,

  styleNoun:
    /\bstyl\b|\bstyle\b|\blook\b|\bwyglad\b|\bcharakter\b|\bcus\b|\bnowoczesn|\bluksus|\bmodn|\bminimalist/,

  /** Values that may NEVER become new TEXT (GATE v8 anti-BOKI). */
  stopTextValue:
    /^(bok|boki|boku|bokiem|lewo|lewej|lewa|prawo|prawej|prawa|gora|gorze|dol|dole|dolem|srodek|srodku|centrum|przod|przodzie|tyl|tylu|szerokosc|szerokosci|wysokosc|wysokosci|szerzej|wyzzej|nizej|dalej|blizej|tutaj|tam)$/,

  /** Polish adverbs of colour ("na czarno") — continuation-friendly. */
  colorAdverb:
    /\b(czerwono|zielono|niebiesko|zolto|bialo|czarno|pomaranczowo|fioletowo|rozowo|szaro|srebrno|zlocie|bordo|granatowo|turkusowo|bezowo|kremowo|morsko|sliwkowo)\b/,
} as const;

/**
 * GATE v8 — style vocabulary inside a TEXT value makes the command ambiguous
 * ("zmień tekst na grubszy") → CLARIFY instead of guessing what to mutate.
 */
export const STYLE_VALUE_TOKEN =
  /kolor|czcionk|rozmiar|\btlo\b|font|interlin|szerokosc|wyrownaj|srodek|grub|odstep|przezroczyst|wieksz|mniejsz|\bbold\b|kursyw|letter|spacing/;

// ---------------------------------------------------------------------------
// Semantic qualifiers — DESIGN INTELLIGENCE decides these, never the fast path
// ---------------------------------------------------------------------------

export const QUALIFIER_RULES: Array<[TargetedQualifier, RegExp]> = [
  ['LUXURY', /\bluxur|\bluksus|\bpremium|\belegan|\bhigh[- ]?end|\bwytworn|\bszykown|\bklasyczn/],
  ['EDITORIAL', /\bredakcyj|\beditorial|\bmagazyn|\bprasow|\bnewspap/],
  ['TECH', /\btechnologicz|\bfuturysty|\bcyfrow|\bdigital|\btech\b/],
  ['BOLD', /\bwidoczn|\bbold\b|\bmocniejsz|\bwyrazniejsz|\bwyrozniaj|\bkontrast|\brzucaj/],
  ['MODERN', /\bnowoczes|\bmodern|\bminimalist|\bgeometr|\bwspolczes|\bcontemporary|\bscandi/],
  ['MINIMAL', /\bminimal|\bprost\w+|\bczyst\w+/],
];

export const VALUE_QUALIFIER_RE =
  /\bbardziej|\bwiecej|\btroch[eę]|\bnieco|\bmocniej|\bjeszcze\b|\bambio|\bna luks|\bbardzo\b/;

export function extractQualifier(text: string): TargetedQualifier | undefined {
  for (const [q, re] of QUALIFIER_RULES) {
    if (re.test(text)) return q;
  }
  return undefined;
}

export function looksLikeQualifierPhrase(v: string): boolean {
  const f = fold(v);
  if (VALUE_QUALIFIER_RE.test(f)) return true;
  return QUALIFIER_RULES.some(([, re]) => re.test(f));
}

// ---------------------------------------------------------------------------
// Execution mapping — one intent → one BuilderCommand (PHASE 16)
// ---------------------------------------------------------------------------

export interface IntentDescriptor {
  intent: NlIntentClass;
  tool: 'set_node_styles' | 'update_node_props';
  /** Style key written for set_node_styles intents. */
  styleKey?: string;
  legacy: TargetedEditIntent;
  domain: TargetedDomain;
}

export const INTENT_DESCRIPTORS: Readonly<Record<NlIntentClass, IntentDescriptor>> = {
  TEXT_CONTENT: { intent: 'TEXT_CONTENT', tool: 'update_node_props', legacy: 'CHANGE_TEXT', domain: 'TEXT' },
  TEXT_COLOR: { intent: 'TEXT_COLOR', tool: 'set_node_styles', styleKey: 'color', legacy: 'CHANGE_COLOR', domain: 'COLOR' },
  BACKGROUND_COLOR: { intent: 'BACKGROUND_COLOR', tool: 'set_node_styles', styleKey: 'backgroundColor', legacy: 'CHANGE_COLOR', domain: 'COLOR' },
  FONT_SIZE: { intent: 'FONT_SIZE', tool: 'set_node_styles', styleKey: 'fontSize', legacy: 'RESIZE', domain: 'SIZE' },
  FONT_FAMILY: { intent: 'FONT_FAMILY', tool: 'set_node_styles', styleKey: 'fontFamily', legacy: 'CHANGE_TYPOGRAPHY', domain: 'TYPOGRAPHY' },
  FONT_WEIGHT: { intent: 'FONT_WEIGHT', tool: 'set_node_styles', styleKey: 'fontWeight', legacy: 'CHANGE_TYPOGRAPHY', domain: 'TYPOGRAPHY' },
  LETTER_SPACING: { intent: 'LETTER_SPACING', tool: 'set_node_styles', styleKey: 'letterSpacing', legacy: 'CHANGE_TYPOGRAPHY', domain: 'TYPOGRAPHY' },
  LINE_HEIGHT: { intent: 'LINE_HEIGHT', tool: 'set_node_styles', styleKey: 'lineHeight', legacy: 'CHANGE_TYPOGRAPHY', domain: 'TYPOGRAPHY' },
  TEXT_ALIGN: { intent: 'TEXT_ALIGN', tool: 'set_node_styles', styleKey: 'textAlign', legacy: 'ALIGN', domain: 'ALIGN' },
  WIDTH: { intent: 'WIDTH', tool: 'set_node_styles', styleKey: 'width', legacy: 'RESIZE', domain: 'SIZE' },
  OPACITY: { intent: 'OPACITY', tool: 'set_node_styles', styleKey: 'opacity', legacy: 'CHANGE_APPEARANCE', domain: 'STYLE' },
  BORDER_RADIUS: { intent: 'BORDER_RADIUS', tool: 'set_node_styles', styleKey: 'borderRadius', legacy: 'CHANGE_APPEARANCE', domain: 'STYLE' },
  MOVE: { intent: 'MOVE', tool: 'set_node_styles', styleKey: 'translateX', legacy: 'MOVE', domain: 'LAYOUT' },
  STYLE_MODIFICATION: { intent: 'STYLE_MODIFICATION', tool: 'set_node_styles', legacy: 'STYLE_MODIFICATION', domain: 'STYLE' },
};

/**
 * GATE v8 PHASE 9 — keys the canvas renderer actually paints. A capability
 * that is not listed here is NEVER written (no silent no-op mutations).
 * Source of truth: BuilderCanvas node renderers (heading/text/button/…).
 */
export const CANVAS_STYLE_KEYS: ReadonlySet<string> = new Set([
  'color',
  'backgroundColor',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'letterSpacing',
  'fontFamily',
  'textAlign',
  'borderRadius',
  'boxShadow',
  'opacity',
  'width',
  'height',
  'padding',
  'margin',
  'translateX',
  'translateY',
  'rotate',
  'scale',
  'transform',
  'borderWidth',
  'borderColor',
  'borderStyle',
  'backgroundImage',
  'maxWidth',
  'minHeight',
  'gap',
  'display',
  'flexDirection',
  'alignItems',
  'justifyContent',
  'zIndex',
  'filter',
  'backdropFilter',
]);

export default INTENT_DESCRIPTORS;
