import { describe, it, expect } from 'vitest';
import { validateAutomationRule, type AutomationRule } from '../AutomationRule';

const mockRule: AutomationRule = {
  ruleId: 'rule-auto-snapshot',
  name: 'Auto Snapshot on Publish',
  isEnabled: true,
  trigger: {
    eventType: 'asset_published',
  },
  actions: [
    {
      actionId: 'act-1',
      actionType: 'create_snapshot',
      payload: { label: 'Publish Auto Snapshot' },
    },
  ],
};

describe('AutomationRules (PM45, ETAP 2 & DECISION-091)', () => {
  it('validates automation rule contracts without executing side-effects (DECISION-091)', () => {
    const report = validateAutomationRule(mockRule);
    expect(report.isValid).toBe(true);
    expect(report.errors).toHaveLength(0);

    const invalidReport = validateAutomationRule(null);
    expect(invalidReport.isValid).toBe(false);
  });
});
