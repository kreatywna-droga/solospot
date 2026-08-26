import { describe, it, expect } from 'vitest';
import { evaluatePolicy, type PolicyDefinition } from '../PolicyEngine';

const mockPolicy: PolicyDefinition = {
  policyId: 'policy-sec-1',
  name: 'Security Policy',
  description: 'Prevents unauthorized exports',
  scope: 'global',
  version: '1.0.0',
  rules: [
    {
      ruleId: 'rule-deny-export',
      name: 'Deny Raw Export',
      effect: 'deny',
      targetAction: 'raw_export',
    },
    {
      ruleId: 'rule-allow-publish',
      name: 'Allow Publish',
      effect: 'allow',
      targetAction: 'publish',
    },
  ],
};

describe('PolicyEngine (PM46, ETAP 1 & DECISION-095)', () => {
  it('evaluates declarative policies without runtime execution (DECISION-095)', () => {
    const denyRes = evaluatePolicy([mockPolicy], {
      action: 'raw_export',
      scope: 'global',
      context: {},
    });
    expect(denyRes.allowed).toBe(false);
    expect(denyRes.matchedRuleId).toBe('rule-deny-export');

    const allowRes = evaluatePolicy([mockPolicy], {
      action: 'publish',
      scope: 'global',
      context: {},
    });
    expect(allowRes.allowed).toBe(true);
    expect(allowRes.matchedRuleId).toBe('rule-allow-publish');
  });
});
