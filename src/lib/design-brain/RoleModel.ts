/**
 * RoleModel.ts — Logical design-brain roles (section 30)
 *
 * One project memory, one pipeline — roles are responsibilities, not
 * separate models or agents with independent state.
 */

import type { DesignBrainRole } from './types';
import { emitObservability } from './Observability';

export interface RoleAssignment {
  role: DesignBrainRole;
  phase: string;
  responsibilities: string[];
  forbidden: string[];
}

const PHASE_ROLE: Record<string, DesignBrainRole> = {
  analyze: 'ARCHITECT',
  brief: 'ARCHITECT',
  architecture: 'ARCHITECT',
  plan: 'ARCHITECT',
  direction: 'ART_DIRECTOR',
  'style-system': 'ART_DIRECTOR',
  constitution: 'ART_DIRECTOR',
  content: 'CONTENT_DESIGNER',
  'content-layout': 'CONTENT_DESIGNER',
  assets: 'ASSET_DIRECTOR',
  'art-direction': 'ASSET_DIRECTOR',
  responsive: 'RESPONSIVE_DESIGNER',
  'responsive-audit': 'RESPONSIVE_DESIGNER',
  ux: 'UX_DESIGNER',
  composition: 'UX_DESIGNER',
  critique: 'DESIGN_CRITIC',
  repair: 'DESIGN_CRITIC',
  audit: 'QA_AUDITOR',
  'visual-audit': 'QA_AUDITOR',
  accessibility: 'QA_AUDITOR',
  verification: 'QA_AUDITOR',
  'business-goal': 'QA_AUDITOR',
};

const ROLE_DETAIL: Record<DesignBrainRole, { responsibilities: string[]; forbidden: string[] }> = {
  ARCHITECT: {
    responsibilities: ['site-as-system IA', 'pages/journeys/conversion paths', 'page architecture plans'],
    forbidden: ['direct DOM/DB mutation', 'visual polish micro-edits'],
  },
  ART_DIRECTOR: {
    responsibilities: ['DesignDirection', 'constitution', 'style system decision'],
    forbidden: ['HacpBridge calls', 'BuilderDocument writes'],
  },
  UX_DESIGNER: {
    responsibilities: ['composition', 'journey friction', 'CTA clarity'],
    forbidden: ['inventing measurements that were not observed'],
  },
  CONTENT_DESIGNER: {
    responsibilities: ['content plan', 'content↔layout coordination', 'tone'],
    forbidden: ['placeholder/fake claims'],
  },
  ASSET_DIRECTOR: {
    responsibilities: ['art direction requirements', 'asset matching'],
    forbidden: ['random asset picks without score'],
  },
  RESPONSIVE_DESIGNER: {
    responsibilities: ['breakpoint rules', 'responsive audit'],
    forbidden: ['claiming responsive PASS without observations'],
  },
  DESIGN_CRITIC: {
    responsibilities: ['13-question critique', 'repair loop orchestration'],
    forbidden: ['mutating documents', 'infinite retries'],
  },
  QA_AUDITOR: {
    responsibilities: ['QA dimensions', 'accessibility/UX/business-goal evidence'],
    forbidden: ['single fake quality score', 'PASS without evidence'],
  },
};

export function resolveRoleForPhase(phase: string): RoleAssignment {
  const role = PHASE_ROLE[phase] || 'ARCHITECT';
  const detail = ROLE_DETAIL[role];
  emitObservability('phase', 'role-model', `phase=${phase} → role=${role}`);
  return { role, phase, responsibilities: detail.responsibilities, forbidden: detail.forbidden };
}

export function allRoles(): DesignBrainRole[] {
  return Object.keys(ROLE_DETAIL) as DesignBrainRole[];
}

export function describeRole(role: DesignBrainRole): { responsibilities: string[]; forbidden: string[] } {
  return { ...ROLE_DETAIL[role] };
}
