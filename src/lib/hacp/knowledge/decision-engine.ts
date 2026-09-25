import { Capability } from './types';
export interface DesignContext { intent?: string; pageType?: string; industry?: string; audience?: string; pageGoal?: string; contentHierarchy?: string; visualDirection?: string; responsiveRequired?: boolean; accessibilityRequired?: boolean; existingPageState?: string; availableCapabilities?: string[]; verificationState?: string; unknowns?: string[] }
export interface DesignDecision { problem: string; principle: string; selected: string; reason: string; pageOrSection: string; capabilityId: string; expectedVisualResult: string; verificationReq: string; evidenceStatus: string; originIntent: string }
export type ExecutionState = 'PLANNED' | 'EXECUTED' | 'VERIFIED' | 'FAILED' | 'INSUFFICIENT_EVIDENCE';
export interface ExecutionResult { state: ExecutionState; evidenceSource?: string; proofLength?: number; visualQAState?: string; verified?: boolean; note?: string }

export const buildContext = (partial: Partial<DesignContext>): DesignContext => ({ ...partial, unknowns: (partial.unknowns || []).concat([!(partial.intent) ? 'intent' : null, !(partial.pageType) ? 'pageType' : null].filter(Boolean) as string[]) });

export const makeDecision = (context: DesignContext, principle: string, problem: string, selected: string, cap: Capability | null): DesignDecision | null => {
  if (!cap) return null; // never fabricate capability
  return { problem, principle, selected, reason: `selected ${cap.name} for ${context.industry || 'general'} (${context.intent || 'no intent'})`, pageOrSection: context.pageType || 'page', capabilityId: cap.id, expectedVisualResult: cap.verify, verificationReq: cap.verify, evidenceStatus: 'planned', originIntent: context.intent || 'unknown' };
};

export const checkDecisionQuality = (d: DesignDecision, cap: Capability | null): string | null => {
  if (!cap) return 'FAIL: missing capability';
  if (!d.capabilityId || d.capabilityId !== cap.id) return 'FAIL: capability mismatch';
  if (d.evidenceStatus === 'planned' && d.expectedVisualResult === '') return 'FAIL: missing verification';
  return null; // pass
};

export const executePipeline = (intent: string, context: Partial<DesignContext>, capMap: (id: string) => Capability | null): ExecutionResult => {
  const ctx = buildContext(context);
  // determination step: not a second orchestrator — only selects and validates
  const cap = capMap('Hero') || capMap('Layout') || null; // real or null only
  if (!cap) return { state: 'INSUFFICIENT_EVIDENCE', note: 'no real capability for intent' };
  const decision = makeDecision(ctx, 'visual hierarchy', `build for ${intent}`, 'use ' + cap.name, cap);
  if (!decision) return { state: 'INSUFFICIENT_EVIDENCE', note: 'decision null (cap missing)' };
  const quality = checkDecisionQuality(decision, cap);
  if (quality) return { state: 'FAIL', note: quality };
  return { state: 'PLANNED', note: `decision=${decision.capabilityId}; execution must use BuilderDocuments/commands; HACP does not execute mutation` };
};
