/**
 * PolicyEngine.ts — PM46 Policy Engine & Evaluation Contracts (ETAP 1)
 *
 * DECISION-095: Policy Engine opisuje wyłącznie deklaratywne polityki i kontrakty oceny.
 *
 * Declarative policy definitions, rules, scopes, and evaluator contracts.
 *
 * NO DOM, NO React, NO Browser API.
 */

export type PolicyScope = 'global' | 'workspace' | 'project' | 'user';

export interface PolicyRule {
  readonly ruleId: string;
  readonly name: string;
  readonly effect: 'allow' | 'deny';
  readonly targetAction: string; // e.g. "publish", "export", "delete"
  readonly conditionExpression?: string;
}

export interface PolicyDefinition {
  readonly policyId: string;
  readonly name: string;
  readonly description: string;
  readonly scope: PolicyScope;
  readonly rules: ReadonlyArray<PolicyRule>;
  readonly version: string;
}

export interface PolicyEvaluationRequest {
  readonly action: string;
  readonly scope: PolicyScope;
  readonly context: Record<string, unknown>;
}

export interface PolicyEvaluationResult {
  readonly allowed: boolean;
  readonly matchedPolicyId?: string;
  readonly matchedRuleId?: string;
  readonly reason: string;
}

export function evaluatePolicy(
  policies: ReadonlyArray<PolicyDefinition>,
  request: PolicyEvaluationRequest
): PolicyEvaluationResult {
  for (const policy of policies) {
    if (policy.scope === request.scope || policy.scope === 'global') {
      for (const rule of policy.rules) {
        if (rule.targetAction === request.action || rule.targetAction === '*') {
          if (rule.effect === 'deny') {
            return {
              allowed: false,
              matchedPolicyId: policy.policyId,
              matchedRuleId: rule.ruleId,
              reason: `Action "${request.action}" denied by rule "${rule.name}" in policy "${policy.name}".`,
            };
          }
          if (rule.effect === 'allow') {
            return {
              allowed: true,
              matchedPolicyId: policy.policyId,
              matchedRuleId: rule.ruleId,
              reason: `Action "${request.action}" allowed by rule "${rule.name}" in policy "${policy.name}".`,
            };
          }
        }
      }
    }
  }

  return {
    allowed: true,
    reason: `Action "${request.action}" allowed by default (no explicit deny rule matched).`,
  };
}
