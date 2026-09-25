/**
 * DesignQualityRules.ts — hard design-quality rules (Phase 11).
 *
 * These rules gate whether a Design System apply is allowed to be reported as
 * a PASS. A FAIL means the apply must not silently produce a broken page.
 */

import { evaluateContrast, type ContrastResult } from '../../../packages/design-system/src/contrast';

export type DesignQualityRuleId =
  | 'RULE_1_READABLE_TEXT'
  | 'RULE_2_NO_RANDOM_COMPONENTS'
  | 'RULE_3_NO_OUT_OF_SCOPE_OVERRIDE'
  | 'RULE_4_DETERMINISTIC'
  | 'RULE_5_REVERSIBLE'
  | 'RULE_6_UNDO_RESTORES'
  | 'RULE_7_REDO_RESTORES'
  | 'RULE_8_RELOAD_PERSISTS'
  | 'RULE_9_CANVAS_EQUALS_DOCUMENT'
  | 'RULE_10_PREVIEW_EQUALS_APPLY';

export interface DesignQualityRule {
  id: DesignQualityRuleId;
  title: string;
  check: string;
}

export const DESIGN_QUALITY_RULES: DesignQualityRule[] = [
  { id: 'RULE_1_READABLE_TEXT', title: 'Unreadable text = FAIL', check: 'Every text/surface pair must meet WCAG AA 4.5:1 for normal text.' },
  { id: 'RULE_2_NO_RANDOM_COMPONENTS', title: 'Random component mixing = FAIL', check: 'Apply may not combine components that were not part of the style scope.' },
  { id: 'RULE_3_NO_OUT_OF_SCOPE_OVERRIDE', title: 'No out-of-scope override', check: 'A Style Pack must not overwrite values outside its declared scope.' },
  { id: 'RULE_4_DETERMINISTIC', title: 'Deterministic apply', check: 'Same input + same document ⇒ same output, every time.' },
  { id: 'RULE_5_REVERSIBLE', title: 'Reversible apply', check: 'Apply must be reversible (inverse plan exists).' },
  { id: 'RULE_6_UNDO_RESTORES', title: 'Undo restores previous state', check: 'Undo must return the document to its pre-apply state.' },
  { id: 'RULE_7_REDO_RESTORES', title: 'Redo restores new state', check: 'Redo must re-apply the new state.' },
  { id: 'RULE_8_RELOAD_PERSISTS', title: 'Reload persists style', check: 'The applied style must survive a document reload.' },
  { id: 'RULE_9_CANVAS_EQUALS_DOCUMENT', title: 'Canvas equals BuilderDocument', check: 'Canvas must render exactly what BuilderDocument holds.' },
  { id: 'RULE_10_PREVIEW_EQUALS_APPLY', title: 'Preview and Apply share data', check: 'Preview and Apply must consume the same source of truth.' },
];

export interface DesignQualityViolation {
  rule: DesignQualityRuleId;
  message: string;
}

export interface DesignQualityReport {
  pass: boolean;
  violations: DesignQualityViolation[];
  checked: DesignQualityRuleId[];
}

/**
 * Check that a foreground/background pair is readable (RULE_1).
 */
export function checkReadableText(fg: string, bg: string, label = 'text'): ContrastResult {
  return evaluateContrast(fg, bg);
}

/**
 * Run the deterministic + readability rules over a resolved composition plan.
 * Undo/redo/reload/persistence rules are verified by integration tests
 * (they require the live BuilderContext history stack).
 */
export function validateDesignQuality(input: {
  deterministic?: boolean;
  fg?: string;
  bg?: string;
  label?: string;
}): DesignQualityReport {
  const violations: DesignQualityViolation[] = [];
  const checked: DesignQualityRuleId[] = [];

  checked.push('RULE_4_DETERMINISTIC');
  if (input.deterministic === false) {
    violations.push({ rule: 'RULE_4_DETERMINISTIC', message: 'Apply is not deterministic.' });
  }

  if (input.fg && input.bg) {
    checked.push('RULE_1_READABLE_TEXT');
    const c = checkReadableText(input.fg, input.bg, input.label);
    if (!c.passBody) {
      violations.push({
        rule: 'RULE_1_READABLE_TEXT',
        message: `${input.label || 'text'} ${c.ratio}:1 on background — below WCAG AA 4.5:1.`,
      });
    }
  }

  return { pass: violations.length === 0, violations, checked };
}

export default {
  DESIGN_QUALITY_RULES,
  checkReadableText,
  validateDesignQuality,
};
