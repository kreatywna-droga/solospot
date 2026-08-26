/**
 * AutomationRule.ts — PM45 Automation Rules & Contracts (ETAP 2)
 *
 * DECISION-091: Automation Rules nie wykonują akcji bezpośrednio, a jedynie definiują kontrakty.
 *
 * Declarative automation rule specifications, trigger conditions, action descriptors, and validator.
 *
 * NO DOM, NO React, NO Browser API.
 */

export type TriggerEventType = 'timeline_updated' | 'asset_published' | 'approval_granted' | 'snapshot_created';

export interface TriggerCondition {
  readonly eventType: TriggerEventType;
  readonly filterKey?: string;
  readonly filterValue?: string;
}

export interface ActionDescriptor {
  readonly actionId: string;
  readonly actionType: string;
  readonly payload: Record<string, unknown>;
}

export interface AutomationRule {
  readonly ruleId: string;
  readonly name: string;
  readonly trigger: TriggerCondition;
  readonly actions: ReadonlyArray<ActionDescriptor>;
  readonly isEnabled: boolean;
}

export interface RuleValidationReport {
  readonly isValid: boolean;
  readonly errors: ReadonlyArray<string>;
}

export function validateAutomationRule(rule: AutomationRule | null): RuleValidationReport {
  const errors: string[] = [];
  if (!rule) {
    errors.push('Automation rule is null.');
    return { isValid: false, errors };
  }

  if (!rule.ruleId || rule.ruleId.trim().length === 0) errors.push('Rule missing ruleId.');
  if (!rule.name || rule.name.trim().length === 0) errors.push('Rule missing name.');
  if (!rule.trigger || !rule.trigger.eventType) errors.push('Rule missing valid trigger condition.');
  if (!rule.actions || rule.actions.length === 0) errors.push('Rule must specify at least one action descriptor.');

  return {
    isValid: errors.length === 0,
    errors,
  };
}
