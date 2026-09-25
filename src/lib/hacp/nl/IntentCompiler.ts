/**
 * IntentCompiler.ts — GATE v8.0 PHASE 6–9 / 15–16.
 *
 * Turns a ParsedEditIntent into ONE TargetedEditResolution (tool call) — the
 * single execution mapping for Main Chat and Mini Inspector alike:
 *
 *   TEXT_CONTENT                       → update_node_props (schema-aware field)
 *   FONT_SIZE / FONT_FAMILY / TRACKING → set_node_styles
 *   TEXT_ALIGN / COLOR / OPACITY / …   → set_node_styles
 *
 * Guards enforced here (never in the caller):
 *   - anti-BOKI gate         (PHASE 11): refused text values never compile
 *   - capability gate        (PHASE 9):  only keys BuilderCanvas really paints
 *   - target-aware text field (PHASE 7): ComponentRegistry schema, not blind text
 *   - no-op gate: a resolution that would not change anything is refused
 * Confidence is stamped onto the resolution; FastPathEligibility enforces
 * CONFIDENCE_THRESHOLD before anything may be dispatched.
 */

import {
  createBuilderComponentRegistry,
  findNode,
  type BuilderComponentRegistry,
  type BuilderDocument,
  type BuilderNode,
} from '../../../../packages/builder-core/src';
import { DesignSystem } from '../../../../packages/design-system/src/index';
import type { HacpToolCall } from '../../ai/AIProviderTypes';
import type { HacpBuilderContext } from '../HacpTypes';
import {
  CANVAS_STYLE_KEYS,
  INTENT_DESCRIPTORS,
  extractQualifier,
  fold,
  type EditRejectReason,
  type NlIntentClass,
  type ParsedEditIntent,
  type TargetedDomain,
  type TargetedEditIntent,
  type TargetedEditResolution,
  type TargetedQualifier,
} from './IntentTaxonomy';
import {
  currentNodeFont,
  defaultFontSizePx,
  parseLength,
  parsePx,
  pickPairingFont,
  resolveDesignSystemFont,
  trimNumber,
} from './StyleMath';

export type CompileOutcome =
  | { kind: 'resolution'; resolution: TargetedEditResolution }
  | { kind: 'reject'; reason: EditRejectReason };

const reject = (reason: EditRejectReason): CompileOutcome => ({ kind: 'reject', reason });

let toolSeq = 0;
function tc(name: string, args: Record<string, unknown>): HacpToolCall {
  return { id: `tc-v8-${Date.now()}-${toolSeq++}`, name, arguments: args };
}

// ---------------------------------------------------------------------------
// Node schema (SSOT) — which prop actually holds this node's text
// ---------------------------------------------------------------------------

let registry: BuilderComponentRegistry | null = null;
function getRegistry(): BuilderComponentRegistry {
  if (!registry) registry = createBuilderComponentRegistry();
  return registry;
}

const CONTENT_FIELD_TYPES = new Set(['string', 'text']);

interface ContentField {
  key: string;
  label: string;
}

function contentFields(node: BuilderNode): ContentField[] {
  const descriptor = getRegistry().get(node.type);
  if (!descriptor) return [];
  return descriptor.schema
    .filter((f) => f.group === 'content' && CONTENT_FIELD_TYPES.has(f.type))
    .map((f) => ({ key: f.key, label: f.label || f.key }));
}

/** Schema default for a prop key (field defaultValue → defaultProps → undefined). */
function registryDefault(node: BuilderNode, key: string): string | undefined {
  const descriptor = getRegistry().get(node.type);
  if (!descriptor) return undefined;
  const field = descriptor.schema.find((f) => f.key === key);
  const fromField = field && 'defaultValue' in field ? (field as { defaultValue?: unknown }).defaultValue : undefined;
  if (fromField !== undefined && fromField !== null && fromField !== '') return String(fromField);
  const fromProps = (descriptor.defaultProps as Record<string, unknown> | undefined)?.[key];
  if (fromProps !== undefined && fromProps !== null && fromProps !== '') return String(fromProps);
  return undefined;
}

/** Content nouns used to pick the SCHEMA field — word anchored ('napisz' ≠ 'napis'). */
const TEXT_NOUN_TOKEN_RE =
  /\b(podtytul|etykiet\w*|nazw\w*|naglowek|tytul|napis|tekst|tresc|podpis|opis|przycisk|label|title|heading|header)\b/g;

function commonPrefix(a: string, b: string): number {
  const n = Math.min(a.length, b.length);
  let i = 0;
  while (i < n && a[i] === b[i]) i++;
  return i;
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

/**
 * GATE v8 PHASE 7 — the text field is chosen from the node's SCHEMA:
 *   1) schema field whose label matches the noun the user used
 *   2) schema field the node already carries (the one being edited)
 *   3) first content field of the schema
 *   4) legacy heuristic for types without a descriptor
 */
function buildTextProps(
  node: BuilderNode,
  value: string,
  foldedPrompt: string
): Record<string, unknown> | null {
  const fields = contentFields(node);
  const nodeProps = (node.props || {}) as Record<string, unknown>;
  const has = (k: string) => Object.prototype.hasOwnProperty.call(nodeProps, k);

  if (fields.length > 0) {
    const nouns = Array.from(foldedPrompt.matchAll(TEXT_NOUN_TOKEN_RE)).map((m) => m[0]);
    for (const noun of nouns) {
      const hit = fields.find((f) => {
        const words = fold(f.label).split(' ');
        return words.some((w) => commonPrefix(w, noun) >= 4);
      });
      if (hit) return { [hit.key]: value };
    }
    const present = fields.find((f) => has(f.key));
    if (present) return { [present.key]: value };
    return { [fields[0].key]: value };
  }

  const props: Record<string, unknown> = {};
  if (has('text') || (!has('title') && TEXTUAL_TYPES.has(node.type))) props.text = value;
  if (has('title')) props.title = value;
  if (has('cta') || has('ctaText')) {
    props.cta = value;
    props.ctaText = value;
  }
  if (Object.keys(props).length === 0) props.text = value;
  return props;
}

// ---------------------------------------------------------------------------
// Compile context
// ---------------------------------------------------------------------------

interface CompileCtx {
  parsed: ParsedEditIntent;
  raw: string;
  folded: string;
  node: BuilderNode;
  targetId: string;
  pageId: string;
  label: string;
}

function mk(
  c: CompileCtx,
  fields: {
    intent: TargetedEditIntent;
    domain: TargetedDomain;
    toolCall: HacpToolCall;
    summary: string;
    qualifier?: TargetedQualifier;
    explicitValue?: boolean;
    intentClass?: NlIntentClass;
    value?: string;
  }
): TargetedEditResolution {
  return {
    intent: fields.intent,
    domain: fields.domain,
    targetNodeId: c.targetId,
    toolCall: fields.toolCall,
    summary: fields.summary,
    qualifier: fields.qualifier ?? c.parsed.qualifier,
    explicitValue: fields.explicitValue ?? c.parsed.explicitValue,
    intentClass: fields.intentClass ?? c.parsed.intent,
    operation: c.parsed.operation,
    value: fields.value ?? c.parsed.value,
    unit: c.parsed.unit,
    confidence: c.parsed.confidence,
    reason: c.parsed.reason,
  };
}

function styleOutcome(
  c: CompileCtx,
  styles: Record<string, unknown>,
  summary: string,
  opts?: { explicitValue?: boolean; intentClass?: NlIntentClass; value?: string }
): CompileOutcome {
  const keys = Object.keys(styles);
  if (keys.length === 0) return reject('UNRESOLVED');
  // GATE v8 PHASE 9 — never write a key the canvas does not render.
  if (keys.some((k) => !CANVAS_STYLE_KEYS.has(k))) return reject('UNRESOLVED');
  const d = INTENT_DESCRIPTORS[c.parsed.intent];
  return {
    kind: 'resolution',
    resolution: mk(c, {
      intent: d.legacy,
      domain: d.domain,
      toolCall: tc('set_node_styles', { nodeId: c.targetId, pageId: c.pageId, styles }),
      summary,
      explicitValue: opts?.explicitValue,
      intentClass: opts?.intentClass,
      value: opts?.value,
    }),
  };
}

function propsOutcome(
  c: CompileCtx,
  props: Record<string, unknown>,
  summary: string,
  opts?: { value?: string }
): CompileOutcome {
  if (Object.keys(props).length === 0) return reject('UNRESOLVED');
  const d = INTENT_DESCRIPTORS[c.parsed.intent];
  return {
    kind: 'resolution',
    resolution: mk(c, {
      intent: d.legacy,
      domain: d.domain,
      toolCall: tc('update_node_props', { sectionId: c.targetId, pageId: c.pageId, props }),
      summary,
      value: opts?.value,
    }),
  };
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

const BACKGROUND_NODE_TYPES = new Set(['section', 'hero', 'box', 'container']);

function wantsBackground(c: CompileCtx): boolean {
  if (c.parsed.intent === 'BACKGROUND_COLOR') return true;
  if (/\btlo\b|\btla\b|\bbackground\b|\bbg\b/.test(c.folded)) return true;
  return BACKGROUND_NODE_TYPES.has(c.node.type) && !/\btekst|\btext\b/.test(c.folded);
}

function compileColor(c: CompileCtx): CompileOutcome {
  const isBg = wantsBackground(c);
  const styleKey = isBg ? 'backgroundColor' : 'color';
  const nodeStyles = (c.node.styles as Record<string, unknown>) || {};
  const nodeProps = (c.node.props as Record<string, unknown>) || {};
  const current = (nodeStyles[styleKey] as string) || (nodeProps[styleKey] as string) || undefined;

  let color = c.parsed.value;
  if (!color && c.parsed.rawValue) return reject('UNRESOLVED'); // unknown colour: never invent
  if (!color) {
    // Bare "zmień kolor" → documented Design System palette pick (PHASE 7 flag:
    // explicitValue=false, so the eligibility gate refuses to fast-path it).
    const palettes = (DesignSystem.colorPalettes || []) as unknown as Array<Record<string, unknown>>;
    for (const p of palettes) {
      const candidate = isBg
        ? ((p.background as string) || (p.primary as string))
        : ((p.text as string) || (p.primary as string) || (p.accent as string));
      if (typeof candidate === 'string' && candidate !== current) {
        color = candidate;
        break;
      }
    }
    if (!color && !current) color = '#D9A86C';
    if (!color) return reject('PARAMETERS_INCOMPLETE');
  }
  if (current === color) return reject('UNRESOLVED');

  return styleOutcome(
    c,
    { [styleKey]: color },
    `Zmieniłem kolor ${isBg ? 'tła' : 'elementu'} zaznaczenia **${c.label}** na **${color}**.`,
    { intentClass: isBg ? 'BACKGROUND_COLOR' : 'TEXT_COLOR' }
  );
}

function compileFontSize(c: CompileCtx): CompileOutcome {
  const p = c.parsed;
  const styles = (c.node.styles as Record<string, unknown>) || {};
  const props = (c.node.props as Record<string, unknown>) || {};
  const currentRaw = (styles.fontSize as string) || (props.fontSize as string);
  const currentPx = parsePx(currentRaw) ?? defaultFontSizePx(c.node);
  const down = p.operation === 'DECREASE' || p.operation === 'MAKE_LESS';
  let nextPx: number;

  if (p.operation === 'SET') {
    if (p.amount === undefined) return reject('PARAMETERS_INCOMPLETE');
    const unit = p.unit || 'value';
    if (unit === 'px') nextPx = Math.round(p.amount);
    else if (unit === 'pt') nextPx = Math.round((p.amount * 4) / 3);
    else if (unit === 'rem') nextPx = Math.round(p.amount * 16);
    else if (unit === '%') nextPx = Math.round(currentPx * (1 + p.amount / 100));
    else nextPx = Math.round(p.amount);
  } else if (p.operation === 'RESET') {
    nextPx = defaultFontSizePx(c.node);
  } else {
    const dir = down ? -1 : 1;
    if (p.amount !== undefined) {
      const unit = p.unit || '%';
      if (unit === '%') nextPx = Math.round(currentPx * (1 + (dir * p.amount) / 100));
      else if (unit === 'pt') nextPx = Math.round(currentPx + dir * ((p.amount * 4) / 3));
      else if (unit === 'rem') nextPx = Math.round(currentPx + dir * p.amount * 16);
      else nextPx = Math.round(currentPx + dir * p.amount);
    } else {
      nextPx = dir > 0 ? Math.round(currentPx * 1.25) : Math.round(currentPx * 0.8);
    }
    if (dir > 0 && nextPx <= currentPx) nextPx = currentPx + 4;
    if (dir < 0 && nextPx >= currentPx) nextPx = Math.max(8, currentPx - 4);
  }

  nextPx = Math.min(240, Math.max(8, Math.round(nextPx)));
  if (nextPx === currentPx && currentRaw) return reject('UNRESOLVED');

  const fontSize = `${nextPx}px`;
  return styleOutcome(
    c,
    { fontSize },
    `Zmieniłem rozmiar tekstu zaznaczenia **${c.label}** na **${fontSize}**.`
  );
}

function compileFontFamily(c: CompileCtx): CompileOutcome {
  const p = c.parsed;
  const currentFont = currentNodeFont(c.node);

  if (p.operation === 'RESET') {
    const fallback = registryDefault(c.node, 'fontFamily') || 'Inter';
    if (currentFont === fallback) return reject('UNRESOLVED');
    return styleOutcome(
      c,
      { fontFamily: fallback },
      `Przywróciłem domyślną czcionkę zaznaczenia **${c.label}** (**${fallback}**).`,
      { value: fallback }
    );
  }

  // Design Intelligence: semantic qualifier decides the pairing (never us).
  if (p.qualifier) {
    const styles: Record<string, unknown> = {};
    if (p.qualifier === 'BOLD') {
      const curWeight =
        parseInt(String((c.node.styles as any)?.fontWeight || (c.node.props as any)?.fontWeight || ''), 10) ||
        (c.node.type === 'heading' ? 700 : 400);
      if (curWeight < 900) styles.fontWeight = String(Math.min(900, curWeight + 100));
      else {
        const currentRaw =
          (c.node.styles as any)?.fontSize || (c.node.props as any)?.fontSize;
        const currentPx = parsePx(currentRaw) ?? defaultFontSizePx(c.node);
        styles.fontSize = `${Math.min(240, Math.round(currentPx * 1.2))}px`;
      }
      styles.letterSpacing = '0.02em';
    } else {
      const font = pickPairingFont(p.qualifier, currentFont);
      if (font) styles.fontFamily = font;
      if (p.qualifier === 'LUXURY') styles.letterSpacing = '0.01em';
      else if (p.qualifier === 'TECH') styles.letterSpacing = '0.04em';
      else if (p.qualifier === 'MODERN') styles.letterSpacing = '-0.01em';
    }
    if (Object.keys(styles).length === 0) return reject('UNRESOLVED');
    return styleOutcome(
      c,
      styles,
      `Zastosowałem ${qualifierWord(p.qualifier)} typografię na zaznaczeniu **${c.label}** (${Object.entries(
        styles
      )
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ')}).`,
      { explicitValue: false }
    );
  }

  if (p.value) {
    const match = resolveDesignSystemFont(p.value);
    if (!match) return reject('UNRESOLVED');
    if (match.name === currentFont) return reject('UNRESOLVED');
    return styleOutcome(
      c,
      { fontFamily: match.name },
      `Zmieniłem czcionkę zaznaczenia **${c.label}** na **${match.name}**.`,
      { value: match.name }
    );
  }

  // Bare "zmień czcionkę" → deterministic Design System pairing pick.
  const font = pickPairingFont(undefined, currentFont);
  if (!font || font === currentFont) return reject('PARAMETERS_INCOMPLETE');
  return styleOutcome(
    c,
    { fontFamily: font },
    `Zmieniłem czcionkę zaznaczenia **${c.label}** na **${font}**.`,
    { explicitValue: false }
  );
}

const WEIGHT_WORDS: Record<string, string> = {
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
};

function currentWeight(c: CompileCtx): number {
  const raw =
    (c.node.styles as Record<string, unknown> | undefined)?.fontWeight ??
    (c.node.props as Record<string, unknown> | undefined)?.fontWeight;
  const numeric = parseInt(String(raw ?? ''), 10);
  if (Number.isFinite(numeric) && numeric > 0) return numeric;
  const named = raw ? WEIGHT_WORDS[String(raw).toLowerCase()] : undefined;
  if (named) return parseInt(named, 10);
  return c.node.type === 'heading' ? 700 : 400;
}

function compileFontWeight(c: CompileCtx): CompileOutcome {
  const p = c.parsed;
  const cur = currentWeight(c);

  if (p.operation === 'RESET') {
    const fallback = registryDefault(c.node, 'fontWeight');
    if (!fallback) return reject('UNRESOLVED');
    const css = WEIGHT_WORDS[fallback.toLowerCase()] || fallback;
    return styleOutcome(
      c,
      { fontWeight: css },
      `Przywróciłem domyślną grubość czcionki zaznaczenia **${c.label}** (${css}).`,
      { value: css }
    );
  }

  let next: number;
  if (p.operation === 'SET') {
    const raw = String(p.value || '').toLowerCase();
    next = WEIGHT_WORDS[raw] ? parseInt(WEIGHT_WORDS[raw], 10) : parseInt(raw, 10);
    if (!Number.isFinite(next)) return reject('UNRESOLVED');
  } else if (p.operation === 'TOGGLE') {
    next = cur >= 600 ? 400 : 700;
  } else if (p.operation === 'DECREASE' || p.operation === 'MAKE_LESS') {
    next = Math.max(100, cur - 100);
  } else if (cur >= 900) {
    // Already maximally bold → the documented fallback is a size bump.
    const currentRaw =
      (c.node.styles as Record<string, unknown>)?.fontSize ||
      (c.node.props as Record<string, unknown>)?.fontSize;
    const currentPx = parsePx(currentRaw) ?? defaultFontSizePx(c.node);
    const fontSize = `${Math.min(240, Math.round(currentPx * 1.2))}px`;
    if (fontSize === currentRaw) return reject('UNRESOLVED');
    return styleOutcome(
      c,
      { fontSize },
      `Zaznaczenie **${c.label}** jest już maksymalnie pogrubione — zwiększyłem rozmiar do **${fontSize}**.`
    );
  } else {
    next = Math.min(900, cur + 100);
  }

  const fontWeight = String(next);
  if (fontWeight === String(cur)) return reject('UNRESOLVED');
  return styleOutcome(
    c,
    { fontWeight },
    p.operation === 'TOGGLE'
      ? `Przełączyłem pogrubienie zaznaczenia **${c.label}** na **${fontWeight}**.`
      : `Ustawiłem grubość czcionki zaznaczenia **${c.label}** na **${fontWeight}**.`,
    { value: fontWeight }
  );
}

const SPACING_STEP: Record<string, number> = { em: 0.04, px: 1, rem: 0.04, pt: 1 };

function compileLetterSpacing(c: CompileCtx): CompileOutcome {
  const p = c.parsed;
  const styles = (c.node.styles as Record<string, unknown>) || {};
  const props = (c.node.props as Record<string, unknown>) || {};
  const current = parseLength(styles.letterSpacing ?? props.letterSpacing) ?? { value: 0, unit: 'em' };
  const baseUnit =
    current.unit === 'px' || current.unit === 'pt' || current.unit === 'rem' ? current.unit : 'em';

  let unit = baseUnit;
  let next: number;

  if (p.operation === 'RESET') {
    unit = 'em';
    next = 0;
  } else if (p.operation === 'SET') {
    const rawUnit = p.unit || 'em';
    if (rawUnit === '%') {
      unit = 'em';
      next = (p.amount || 0) / 100;
    } else if (rawUnit === 'em' || rawUnit === 'px' || rawUnit === 'pt') {
      unit = rawUnit;
      next = p.amount || 0;
    } else if (rawUnit === 'rem' || rawUnit === 'value') {
      // Tracking is an em-based quantity: unitless and rem both land in em.
      unit = 'em';
      next = p.amount || 0;
    } else {
      return reject('UNRESOLVED');
    }
  } else {
    const dir = p.operation === 'DECREASE' || p.operation === 'MAKE_LESS' ? -1 : 1;
    const step = SPACING_STEP[baseUnit] ?? 0.04;
    next = current.value + dir * step;
  }

  const clamp = unit === 'px' || unit === 'pt' ? [-2, 12] : [-0.05, 0.5];
  next = Math.min(clamp[1], Math.max(clamp[0], next));
  const letterSpacing = `${trimNumber(next)}${unit}`;
  if (letterSpacing === String(styles.letterSpacing ?? props.letterSpacing ?? '')) {
    return reject('UNRESOLVED');
  }

  return styleOutcome(
    c,
    { letterSpacing },
    p.operation === 'RESET'
      ? `Przywróciłem domyślny odstęp liter zaznaczenia **${c.label}** (${letterSpacing}).`
      : `Zmieniłem odstęp liter zaznaczenia **${c.label}** na **${letterSpacing}**.`,
    { value: letterSpacing }
  );
}

function compileLineHeight(c: CompileCtx): CompileOutcome {
  const p = c.parsed;
  const styles = (c.node.styles as Record<string, unknown>) || {};
  const props = (c.node.props as Record<string, unknown>) || {};
  const current =
    parseLength(styles.lineHeight ?? props.lineHeight) ??
    { value: c.node.type === 'text' || c.node.type === 'paragraph' ? 1.6 : 1.2, unit: 'value' as string };
  const defaultRatio = registryDefault(c.node, 'lineHeight');
  const down = p.operation === 'DECREASE' || p.operation === 'MAKE_LESS';

  let unit = current.unit;
  let next: number;

  if (p.operation === 'RESET') {
    const raw = defaultRatio || (c.node.type === 'text' || c.node.type === 'paragraph' ? '1.6' : '1.2');
    const parsed = parseLength(raw);
    unit = parsed?.unit ?? 'value';
    next = parsed?.value ?? parseFloat(raw);
  } else if (p.operation === 'SET') {
    const rawUnit = p.unit || 'value';
    if (rawUnit === '%') {
      unit = '%';
      next = p.amount || 0;
    } else if (rawUnit === 'px') {
      unit = 'px';
      next = p.amount || 0;
    } else if (rawUnit === 'value' || rawUnit === 'em' || rawUnit === 'rem') {
      unit = 'value';
      next = p.amount || 0;
    } else {
      return reject('UNRESOLVED');
    }
  } else {
    const dir = down ? -1 : 1;
    if (p.amount !== undefined && p.unit !== 'step') {
      if (p.unit === '%') {
        unit = '%';
        next = current.value + dir * p.amount;
      } else if (p.unit === 'px') {
        unit = 'px';
        next = current.value + dir * p.amount;
      } else {
        next = current.value + dir * p.amount;
      }
    } else {
      next = current.value + dir * (unit === '%' ? 10 : unit === 'px' ? 4 : 0.1);
    }
  }

  if (!Number.isFinite(next)) return reject('UNRESOLVED');
  const clamp =
    unit === '%' ? [80, 300] : unit === 'px' ? [8, 120] : [0.8, 3];
  next = Math.min(clamp[1], Math.max(clamp[0], next));
  const lineHeight = unit === 'value' ? trimNumber(next) : `${trimNumber(next)}${unit}`;
  const previous = String(styles.lineHeight ?? props.lineHeight ?? '');
  if (lineHeight === previous && p.operation !== 'RESET') return reject('UNRESOLVED');

  return styleOutcome(
    c,
    { lineHeight },
    p.operation === 'RESET'
      ? `Przywróciłem domyślną interlinię zaznaczenia **${c.label}** (${lineHeight}).`
      : `Zmieniłem interlinię zaznaczenia **${c.label}** na **${lineHeight}**.`,
    { value: lineHeight }
  );
}

function compileAlign(c: CompileCtx): CompileOutcome {
  const p = c.parsed;
  const styles = (c.node.styles as Record<string, unknown>) || {};
  const props = (c.node.props as Record<string, unknown>) || {};
  let align: string;
  if (p.operation === 'RESET') {
    align = registryDefault(c.node, 'textAlign') || 'left';
  } else if (p.value === 'center' || p.value === 'left' || p.value === 'right') {
    align = p.value;
  } else {
    return reject('PARAMETERS_INCOMPLETE');
  }
  const current = (styles.textAlign as string) || (props.textAlign as string);
  if (current === align) return reject('UNRESOLVED');
  return styleOutcome(
    c,
    { textAlign: align },
    p.operation === 'RESET'
      ? `Przywróciłem domyślne wyrównanie zaznaczenia **${c.label}** (${align}).`
      : `Wyrównałem zaznaczenie **${c.label}** do: **${align}**.`,
    { value: align }
  );
}

function compileMove(c: CompileCtx): CompileOutcome {
  const p = c.parsed;
  const styles = (c.node.styles as Record<string, unknown>) || {};
  const current = parsePx(styles.translateX) ?? 0;
  const step =
    p.amount !== undefined && (p.unit === 'px' || p.unit === 'step' || p.unit === 'value')
      ? p.amount
      : 24;
  const dir = p.operation === 'DECREASE' || p.operation === 'MAKE_LESS' ? -1 : 1;
  const next = current + dir * step;
  const translateX = `${next}px`;
  if (translateX === String(styles.translateX ?? '')) return reject('UNRESOLVED');
  return styleOutcome(
    c,
    { translateX },
    `Przesunąłem zaznaczenie **${c.label}** o ${step}px ${dir > 0 ? 'w prawo' : 'w lewo'}.`
  );
}

function compileWidth(c: CompileCtx): CompileOutcome {
  const p = c.parsed;
  const styles = (c.node.styles as Record<string, unknown>) || {};
  const props = (c.node.props as Record<string, unknown>) || {};

  if (p.operation === 'RESET') {
    return styleOutcome(c, { width: 'auto' }, `Przywróciłem domyślną szerokość zaznaczenia **${c.label}**.`, {
      value: 'auto',
    });
  }

  const current = parseLength(styles.width ?? props.width);
  if (!current) return reject('PARAMETERS_INCOMPLETE'); // no measurable width → CLARIFY
  if (p.amount === undefined) return reject('PARAMETERS_INCOMPLETE');
  const dir = p.operation === 'DECREASE' || p.operation === 'MAKE_LESS' ? -1 : 1;

  let next: number;
  if (p.unit === '%') {
    if (current.unit !== '%') return reject('PARAMETERS_INCOMPLETE');
    next = current.value + dir * p.amount;
  } else {
    if (current.unit === '%') return reject('PARAMETERS_INCOMPLETE');
    next = current.value + dir * p.amount;
  }
  next = Math.max(8, next);
  const width = current.unit === '%' ? `${trimNumber(next)}%` : `${Math.round(next)}px`;
  if (width === String(styles.width ?? props.width ?? '')) return reject('UNRESOLVED');
  return styleOutcome(
    c,
    { width },
    `Zmieniłem szerokość zaznaczenia **${c.label}** na **${width}**.`,
    { value: width }
  );
}

function compileOpacity(c: CompileCtx): CompileOutcome {
  const p = c.parsed;
  const styles = (c.node.styles as Record<string, unknown>) || {};
  const props = (c.node.props as Record<string, unknown>) || {};
  const raw = styles.opacity ?? props.opacity;
  const current = typeof raw === 'number' ? raw : parseLength(raw)?.value ?? 1;
  const down = p.operation === 'DECREASE' || p.operation === 'MAKE_LESS';
  let next: number;

  if (p.operation === 'RESET') next = 1;
  else if (p.operation === 'SET') {
    if (p.amount === undefined) return reject('PARAMETERS_INCOMPLETE');
    next = p.unit === '%' ? p.amount / 100 : p.amount;
  } else {
    const dir = down ? -1 : 1;
    next = current + dir * 0.1;
  }

  if (!Number.isFinite(next)) return reject('UNRESOLVED');
  next = Math.round(Math.min(1, Math.max(0, next)) * 100) / 100;
  if (next === current && p.operation !== 'RESET') return reject('UNRESOLVED');

  return styleOutcome(
    c,
    { opacity: next },
    p.operation === 'RESET'
      ? `Przywróciłem pełną krycie zaznaczenia **${c.label}**.`
      : `Ustawiłem przezroczystość zaznaczenia **${c.label}** na **${next}**.`,
    { value: String(next) }
  );
}

function compileBorderRadius(c: CompileCtx): CompileOutcome {
  const p = c.parsed;
  const styles = (c.node.styles as Record<string, unknown>) || {};
  const props = (c.node.props as Record<string, unknown>) || {};
  const raw = styles.borderRadius ?? props.borderRadius;
  const current = parsePx(raw) ?? 0;
  const down = p.operation === 'DECREASE' || p.operation === 'MAKE_LESS';
  let next: number;

  if (p.operation === 'RESET') {
    const fallback = registryDefault(c.node, 'borderRadius');
    next = fallback ? (parsePx(fallback) ?? 0) : 0;
  } else if (p.operation === 'SET') {
    if (p.amount === undefined) return reject('PARAMETERS_INCOMPLETE');
    if (p.unit === 'px') next = p.amount;
    else if (p.unit === 'rem') next = p.amount * 16;
    else if (p.unit === 'pt') next = (p.amount * 4) / 3;
    else if (p.unit === 'value') next = p.amount;
    else return reject('PARAMETERS_INCOMPLETE');
  } else {
    next = down ? Math.max(0, current - 8) : current <= 0 ? 12 : Math.min(9999, current + 8);
  }

  if (!Number.isFinite(next)) return reject('UNRESOLVED');
  const borderRadius = `${Math.round(next)}px`;
  if (borderRadius === String(raw ?? '') && p.operation !== 'RESET') return reject('UNRESOLVED');

  return styleOutcome(
    c,
    { borderRadius },
    p.operation === 'RESET'
      ? `Przywróciłem domyślne zaokrąglenie rogów zaznaczenia **${c.label}** (${borderRadius}).`
      : `Ustawiłem zaokrąglenie rogów zaznaczenia **${c.label}** na **${borderRadius}**.`,
    { value: borderRadius }
  );
}

function compileText(c: CompileCtx): CompileOutcome {
  const p = c.parsed;
  let value = p.value;
  if (p.operation === 'RESET') {
    value = registryDefault(c.node, 'text') ?? registryDefault(c.node, 'title');
    if (!value) return reject('UNRESOLVED');
  }
  if (!value) return reject('PARAMETERS_INCOMPLETE');
  const props = buildTextProps(c.node, value, c.folded);
  if (!props) return reject('UNRESOLVED');
  return propsOutcome(
    c,
    props,
    p.operation === 'RESET'
      ? `Przywróciłem domyślny tekst zaznaczenia **${c.label}**.`
      : `Zmieniłem tekst zaznaczenia **${c.label}** na „${value}”.`,
    { value }
  );
}

/** Semantic qualifier + style noun — Design Intelligence decision (AI PATH). */
function compileStyleModification(c: CompileCtx): CompileOutcome {
  const qualifier = c.parsed.qualifier ?? extractQualifier(c.folded);
  if (!qualifier) return reject('UNRESOLVED');
  const styles: Record<string, unknown> = {};

  if (TEXTUAL_TYPES.has(c.node.type)) {
    const font = pickPairingFont(qualifier, currentNodeFont(c.node));
    if (font && font !== currentNodeFont(c.node)) styles.fontFamily = font;
    if (qualifier === 'BOLD') {
      const curWeight =
        parseInt(String((c.node.styles as any)?.fontWeight || (c.node.props as any)?.fontWeight || ''), 10) ||
        (c.node.type === 'heading' ? 700 : 400);
      styles.fontWeight = curWeight < 900 ? String(Math.min(900, curWeight + 100)) : '900';
    }
    if (qualifier === 'LUXURY') styles.letterSpacing = '0.03em';
    if (qualifier === 'TECH') styles.letterSpacing = '0.06em';
  } else {
    const currentRadius = (c.node.styles as any)?.borderRadius ?? (c.node.props as any)?.borderRadius;
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

  if (Object.keys(styles).length === 0) return reject('UNRESOLVED');
  return styleOutcome(
    c,
    styles,
    `Nadałem zaznaczeniu **${c.label}** bardziej ${qualifierWord(qualifier)} charakter (${Object.keys(styles).join(', ')}).`,
    { explicitValue: false }
  );
}

function qualifierWord(q: TargetedQualifier): string {
  return q === 'LUXURY'
    ? 'luksusową'
    : q === 'MODERN'
      ? 'nowoczesną'
      : q === 'BOLD'
        ? 'bardziej widoczną'
        : q === 'EDITORIAL'
          ? 'redakcyjną'
          : q === 'TECH'
            ? 'technologiczną'
            : 'minimalistyczną';
}

// ---------------------------------------------------------------------------
// Dispatch table — one intent → one handler (no scattered if/else)
// ---------------------------------------------------------------------------

type Handler = (c: CompileCtx) => CompileOutcome;

const COMPILE: Record<NlIntentClass, Handler> = {
  TEXT_CONTENT: compileText,
  TEXT_COLOR: compileColor,
  BACKGROUND_COLOR: compileColor,
  FONT_SIZE: compileFontSize,
  FONT_FAMILY: compileFontFamily,
  FONT_WEIGHT: compileFontWeight,
  LETTER_SPACING: compileLetterSpacing,
  LINE_HEIGHT: compileLineHeight,
  TEXT_ALIGN: compileAlign,
  WIDTH: compileWidth,
  OPACITY: compileOpacity,
  BORDER_RADIUS: compileBorderRadius,
  MOVE: compileMove,
  STYLE_MODIFICATION: compileStyleModification,
};

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export function compileEditIntent(
  parsed: ParsedEditIntent,
  rawPrompt: string,
  context: HacpBuilderContext,
  document: BuilderDocument
): CompileOutcome {
  const targetId = context.selectedNodeId;
  if (!targetId) return reject('NOT_APPLICABLE');
  const found = findNode(document, targetId);
  if (!found) return reject('NOT_APPLICABLE');

  // GATE v8 PHASE 11 — the anti-BOKI gate: a VALUE the parser refused
  // (direction word used as text, absurdly long string) never becomes a tool
  // call, no matter how confident the rule match was.
  if (parsed.reason.includes('direction-not-text') || parsed.reason.includes('too-long')) {
    return reject('TEXT_VALUE_REJECTED');
  }

  const handler = COMPILE[parsed.intent];
  if (!handler) return reject('UNRESOLVED');

  const node = found.node;
  const ctx: CompileCtx = {
    parsed,
    raw: rawPrompt,
    folded: fold(rawPrompt),
    node,
    targetId,
    pageId: context.pageId || document.pages[0]?.id || 'page-home',
    label: node.label || node.type,
  };

  const out = handler(ctx);
  if (out.kind === 'resolution' && out.resolution.confidence === undefined) {
    return reject('UNRESOLVED');
  }
  return out;
}

export default compileEditIntent;
