/**
 * StyleMath.ts — GATE v8 PHASE 9 (shared style math, no duplicated helpers).
 *
 * Used by the intent compiler AND re-exported by TargetedEditResolver, so the
 * fast path, the AI fallback and the tests all read numbers the same way.
 */

import type { BuilderNode } from '../../../../packages/builder-core/src';
import { DesignSystem } from '../../../../packages/design-system/src/index';
import { fold, type TargetedQualifier } from './IntentTaxonomy';

export function parsePx(v: unknown): number | null {
  if (typeof v === 'string' || typeof v === 'number') {
    const s = String(v).trim();
    const px = s.match(/^(-?\d+(?:\.\d+)?)px$/i);
    if (px) return parseFloat(px[1]);
    const rem = s.match(/^(-?\d+(?:\.\d+)?)rem$/i);
    if (rem) return parseFloat(rem[1]) * 16;
    const pt = s.match(/^(-?\d+(?:\.\d+)?)pt$/i);
    if (pt) return (parseFloat(pt[1]) * 4) / 3;
    const bare = s.match(/^(-?\d+(?:\.\d+)?)$/);
    if (bare) return parseFloat(bare[1]);
  }
  return null;
}

/** Any CSS-ish length → { value, unit } ('value' = unitless, e.g. lineHeight). */
export function parseLength(v: unknown): { value: number; unit: string } | null {
  if (typeof v === 'number' && Number.isFinite(v)) return { value: v, unit: 'value' };
  if (typeof v !== 'string' || !v.trim()) return null;
  const m = v.trim().match(/^(-?\d+(?:\.\d+)?)\s*(px|pt|em|rem|%)?$/i);
  if (!m) return null;
  const value = parseFloat(m[1]);
  if (!Number.isFinite(value)) return null;
  return { value, unit: (m[2] || 'value').toLowerCase() };
}

export function trimNumber(n: number): string {
  const r = Math.round(n * 1000) / 1000;
  return String(r);
}

export function defaultFontSizePx(node: BuilderNode): number {
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

export function currentNodeFont(node: BuilderNode): string | undefined {
  const s = (node.styles as Record<string, unknown> | undefined) || {};
  const p = node.props || {};
  return (s.fontFamily as string) || (p.fontFamily as string) || undefined;
}

/** Design Intelligence: pick a pairing font for a semantic qualifier. */
export function pickPairingFont(
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

/**
 * Resolve an EXPLICIT font name against the Design System catalog (real
 * existing fonts only). Null for unknown fonts — never invent a name.
 */
export function resolveDesignSystemFont(rawName: string): { name: string } | null {
  const wanted = fold(rawName.trim());
  if (!wanted) return null;
  const names: string[] = [];
  for (const f of (DesignSystem.fonts || []) as Array<{ name?: string }>) {
    if (f?.name) names.push(f.name);
  }
  for (const p of (DesignSystem.fontPairings || []) as any[]) {
    if (p?.displayFont?.name) names.push(p.displayFont.name);
    if (p?.bodyFont?.name) names.push(p.bodyFont.name);
  }
  const distinct = names.filter((n, i) => names.indexOf(n) === i);
  const exact = distinct.find((n) => fold(n) === wanted);
  if (exact) return { name: exact };
  if (wanted.length >= 3) {
    const prefix = distinct.find((n) => fold(n).startsWith(wanted));
    if (prefix) return { name: prefix };
  }
  // GATE v8 — typo tolerance: ONE character of distance on a real font name.
  if (wanted.length >= 5) {
    const near = distinct.find((n) => {
      const a = fold(n);
      if (Math.abs(a.length - wanted.length) > 1) return false;
      let diff = 0;
      for (let i = 0; i < Math.max(a.length, wanted.length); i++) {
        if (a[i] !== wanted[i]) diff++;
        if (diff > 1) return false;
      }
      return diff === 1;
    });
    if (near) return { name: near };
  }
  return null;
}
