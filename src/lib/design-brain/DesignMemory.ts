/**
 * DesignMemory.ts — Project Design Memory (22) + Design Decision Records (23)
 *
 * Single logical memory per project (not multiple AI models).
 * Memory stores decisions — it never mutates BuilderDocument.
 */

import type {
  ProjectDesignMemory, DesignDecisionRecord, DesignDirection,
  DesignConstitution, DesignIssue, DecisionTrace,
} from './types';
import { emitObservability } from './Observability';

const memories = new Map<string, ProjectDesignMemory>();

export function createProjectDesignMemory(projectId: string): ProjectDesignMemory {
  const memory: ProjectDesignMemory = {
    projectId,
    visualDirection: null,
    typography: null,
    palette: null,
    stylePackId: null,
    acceptedPatterns: [],
    rejectedPatterns: [],
    designDecisions: [],
    componentConventions: {},
    responsiveRules: {},
    contentDecisions: {},
    assetDecisions: {},
    userApprovedChanges: [],
    updatedAt: new Date().toISOString(),
  };
  memories.set(projectId, memory);
  emitObservability('decision', 'design-memory', `Created memory for ${projectId}`);
  return memory;
}

export function getProjectDesignMemory(projectId: string): ProjectDesignMemory {
  const existing = memories.get(projectId);
  if (existing) return existing;
  return createProjectDesignMemory(projectId);
}

export function resetProjectDesignMemory(projectId: string): void {
  memories.delete(projectId);
}

export function listDesignMemories(): ProjectDesignMemory[] {
  return [...memories.values()];
}

// ── Record helpers ─────────────────────────────────────────────────

let decisionSeq = 0;

export function recordDesignDecision(
  memory: ProjectDesignMemory,
  input: {
    reason: string;
    source: string;
    affectedElements: string[];
    status?: DesignDecisionRecord['status'];
    knowledgeId?: string;
  },
): DesignDecisionRecord {
  const record: DesignDecisionRecord = {
    decisionId: `dm-${++decisionSeq}-${Date.now().toString(36)}`,
    reason: input.reason,
    source: input.source,
    affectedElements: input.affectedElements,
    timestamp: new Date().toISOString(),
    status: input.status || 'active',
    knowledgeId: input.knowledgeId,
  };
  // Supersede prior active decisions on same elements when provided
  if (input.affectedElements.length) {
    const affected = new Set(input.affectedElements);
    for (const d of memory.designDecisions) {
      if (d.status === 'active' && d.affectedElements.some((e) => affected.has(e))) {
        d.status = 'superseded';
      }
    }
  }
  memory.designDecisions.push(record);
  memory.updatedAt = record.timestamp;
  emitObservability('decision', 'design-memory', `Recorded ${record.decisionId}: ${input.reason.slice(0, 80)}`);
  return record;
}

export function rememberDirection(memory: ProjectDesignMemory, direction: DesignDirection): void {
  memory.visualDirection = direction.visualStyle;
  for (const rule of direction.compositionRules) {
    if (!memory.acceptedPatterns.includes(rule)) memory.acceptedPatterns.push(rule);
  }
  memory.updatedAt = new Date().toISOString();
  recordDesignDecision(memory, {
    reason: `DesignDirection visualStyle=${direction.visualStyle} density=${direction.density}`,
    source: 'design-director',
    affectedElements: ['DesignDirection'],
  });
}

export function rememberConstitution(memory: ProjectDesignMemory, constitution: DesignConstitution): void {
  memory.typography = {
    headingFont: constitution.typography.headingFont,
    bodyFont: constitution.typography.bodyFont,
  };
  memory.palette = { ...constitution.colors };
  memory.componentConventions = {
    radiusButton: constitution.radius.button,
    radiusCard: constitution.radius.card,
    buttonStyle: constitution.buttons.style,
    cardStyle: constitution.cards.style,
    iconStyle: constitution.icons.style,
    sectionMaxWidth: constitution.sections.maxWidth,
    sectionPadding: constitution.spacing.sectionPadding,
  };
  memory.updatedAt = new Date().toISOString();
  recordDesignDecision(memory, {
    reason: `Constitution fonts=${constitution.typography.headingFont}/${constitution.typography.bodyFont}`,
    source: 'constitution',
    affectedElements: ['typography', 'colors', 'components'],
  });
}

export function rememberStylePack(memory: ProjectDesignMemory, stylePackId: string): void {
  memory.stylePackId = stylePackId;
  memory.updatedAt = new Date().toISOString();
}

export function rejectPattern(memory: ProjectDesignMemory, pattern: string, reason: string): void {
  if (!memory.rejectedPatterns.includes(pattern)) memory.rejectedPatterns.push(pattern);
  memory.acceptedPatterns = memory.acceptedPatterns.filter((p) => p !== pattern);
  recordDesignDecision(memory, {
    reason: `Rejected pattern: ${pattern} (${reason})`,
    source: 'critique',
    affectedElements: [pattern],
    status: 'rejected',
  });
}

export function approveUserChange(memory: ProjectDesignMemory, changeId: string): void {
  if (!memory.userApprovedChanges.includes(changeId)) {
    memory.userApprovedChanges.push(changeId);
    memory.updatedAt = new Date().toISOString();
  }
}

export function rememberResponsiveRule(memory: ProjectDesignMemory, breakpoint: string, rule: unknown): void {
  memory.responsiveRules[breakpoint] = rule;
  memory.updatedAt = new Date().toISOString();
}

export function rememberContentDecision(memory: ProjectDesignMemory, key: string, value: string): void {
  memory.contentDecisions[key] = value;
  memory.updatedAt = new Date().toISOString();
}

export function rememberAssetDecision(memory: ProjectDesignMemory, key: string, value: string): void {
  memory.assetDecisions[key] = value;
  memory.updatedAt = new Date().toISOString();
}

// ── Memory-informed retrieval (bounded context) ────────────────────

export interface MemoryHints {
  visualDirection: string | null;
  typography: { headingFont: string; bodyFont: string } | null;
  palette: Record<string, string> | null;
  stylePackId: string | null;
  mustAvoid: string[];
  prefer: string[];
  activeDecisionCount: number;
}

export function readMemoryHints(memory: ProjectDesignMemory | null | undefined): MemoryHints {
  if (!memory) {
    return { visualDirection: null, typography: null, palette: null, stylePackId: null, mustAvoid: [], prefer: [], activeDecisionCount: 0 };
  }
  return {
    visualDirection: memory.visualDirection,
    typography: memory.typography,
    palette: memory.palette,
    stylePackId: memory.stylePackId,
    mustAvoid: [...memory.rejectedPatterns],
    prefer: memory.acceptedPatterns.slice(0, 12),
    activeDecisionCount: memory.designDecisions.filter((d) => d.status === 'active').length,
  };
}

/** Persist memory decisions as traces for DesignBrainOutput. */
export function memoryTraces(memory: ProjectDesignMemory): DecisionTrace[] {
  return memory.designDecisions.map((d) => ({
    decisionId: d.decisionId,
    why: d.reason,
    what: `status=${d.status} elements=${d.affectedElements.join(',')}`,
    where: 'ProjectDesignMemory',
    how: `source=${d.source}`,
    verify: 'memory decision visible in subsequent direction/constitution',
    source: 'memory' as const,
    knowledgeId: d.knowledgeId,
    timestamp: d.timestamp,
  }));
}

/** Guard: memory must never claim repair success without issues actually changing. */
export function assertNoFakeMemorySuccess(
  before: DesignIssue[],
  after: DesignIssue[],
  claimedFixed: string[],
): void {
  const afterIds = new Set(after.map((i) => i.issueId));
  const stillOpen = claimedFixed.filter((id) => afterIds.has(id));
  if (stillOpen.length) {
    throw new Error(`NO FAKE SUCCESS: issues still open after claimed repair: ${stillOpen.join(', ')}`);
  }
  void before;
}
