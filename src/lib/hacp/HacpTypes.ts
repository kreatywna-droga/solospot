/**
 * HacpTypes.ts — SoloSpot HACP Protocol & AI Copilot Workspace Types
 *
 * Formal contracts for:
 * - HACP Connection & Runtime status
 * - Execution cards & deterministic step state machines
 * - Activity stream events
 * - Capability registry (READ, BUILD, EDIT, VALIDATION)
 * - Builder context awareness
 * - Applied changes & mutation results
 */

import type { BuilderCommand } from '../../../packages/builder-core/src';
import type { ExperienceSceneConfig } from '@/lib/experience/ExperienceRuntimeTypes';

export type HacpStatus = 'OFFLINE' | 'CONNECTING' | 'ONLINE' | 'BUSY' | 'ERROR';

export type HacpStepStatus = 'WAITING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'BLOCKED';

/** Honest execution status — NEVER return EXECUTED if no mutation occurred */
export type HacpExecutionStatus = 'EXECUTED' | 'CLARIFY' | 'FAILED' | 'UNSUPPORTED';

export type HacpMessageType = 'user' | 'ai' | 'system' | 'hacp_activity';

export interface HacpExecutionStep {
  id: string;
  name: string;
  status: HacpStepStatus;
  detail?: string;
  timestamp?: string;
}

export interface AppliedChangeItem {
  target: string;
  property: string;
  previousValue?: unknown;
  newValue?: unknown;
  summary: string;
}

export interface HacpExecutionCard {
  id: string;
  title: string;
  status: HacpStepStatus;
  steps: HacpExecutionStep[];
  startedAt: string;
  completedAt?: string;
  validationResult?: 'PASS' | 'WARN' | 'FAIL';
  appliedChanges?: AppliedChangeItem[];
}

export interface HacpActivityEvent {
  id: string;
  timestamp: string;
  type: 'CONNECT' | 'DISCONNECT' | 'READ' | 'MUTATE' | 'EXPERIENCE' | 'VALIDATE' | 'ERROR';
  title: string;
  description: string;
  nodeId?: string;
  capability?: string;
  status?: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR';
}

export type HacpIntentType =
  | 'CHAT'
  | 'INSPECT'
  | 'PROPOSE'
  | 'EXECUTE'
  | 'CLARIFY'
  | 'UNDO'
  | 'REDO'
  | 'PLATFORM_ENGINEERING'
  | 'AUDIT'
  | 'DEBUG';

export type HacpEngineeringScope = 'PAGE_DESIGN' | 'PLATFORM_ENGINEERING';

export interface HacpVisualMetrics {
  width: number;
  height: number;
  top: number;
  left: number;
  aspectRatio: number;
  isOutOfBounds?: boolean;
  computedStylesSummary?: string;
}

export interface HacpLayoutDiagnostics {
  whitespaceBalance: 'BALANCED' | 'LEFT_HEAVY' | 'RIGHT_HEAVY' | 'SPARSE';
  contentDensity: 'OPTIMAL' | 'OVERCROWDED' | 'EMPTY';
  contrastAssessment: 'PASS' | 'WARN' | 'FAIL';
  alignmentNotes?: string;
}

export interface HacpProposal {
  id: string;
  title: string;
  description: string;
  targetNodeId?: string;
  targetNodeType?: string;
  proposedCapability: string;
  proposedChanges: AppliedChangeItem[];
  executePayload?: {
    type: 'UPDATE_PROPS' | 'ADD_SECTION' | 'REMOVE_NODE';
    props?: Record<string, unknown>;
  };
}

export interface HacpConversationContext {
  lastIntent?: HacpIntentType;
  lastProposal?: HacpProposal;
  lastTargetNodeId?: string;
  lastActionSummary?: string;
  lastModifiedNodeId?: string;
  history: Array<{
    role: 'user' | 'ai';
    text: string;
    intent?: HacpIntentType;
    scope?: HacpEngineeringScope;
    timestamp: string;
  }>;
}

export interface HacpMessage {
  id: string;
  type: HacpMessageType;
  text: string;
  timestamp: string;
  intent?: HacpIntentType;
  scope?: HacpEngineeringScope;
  card?: HacpExecutionCard;
  suggestedActions?: string[];
  visualMetrics?: HacpVisualMetrics;
}

export type CapabilityCategory =
  | 'READ'
  | 'BUILD'
  | 'EDIT'
  | 'VALIDATION'
  | 'ENGINEERING';

export interface HacpCapability {
  id: string;
  name: string;
  category: CapabilityCategory;
  description: string;
  available: boolean;
  supportedNodeTypes?: string[];
}

export interface HacpBuilderContext {
  storeId: string;
  tenantId?: string;
  pageId: string;
  pageName: string;
  selectedNodeId?: string;
  selectedNodeType?: string;
  selectedNodeLabel?: string;
  selectedNodeProps?: Record<string, unknown>;
  experienceConfig?: Partial<ExperienceSceneConfig>;
  viewport: 'DESKTOP' | 'TABLET' | 'MOBILE';
  documentNodeCount: number;
  availableCapabilitiesCount: number;
  visualMetrics?: HacpVisualMetrics;
  layoutDiagnostics?: HacpLayoutDiagnostics;
  recentMutation?: string;
  activeTool?: string;
  engineeringScope?: HacpEngineeringScope;
}

export interface HacpExecutionResult {
  success: boolean;
  intent: HacpIntentType;
  scope?: HacpEngineeringScope;
  message: string;
  executionCard?: HacpExecutionCard;
  commandsToDispatch: BuilderCommand[];
  eventsToEmit: HacpActivityEvent[];
  errorReason?: string;
  updatedConversationContext?: Partial<HacpConversationContext>;
  shouldTriggerUndo?: boolean;
  /** Honest status: EXECUTED only if BuilderDocument actually changed */
  executionStatus?: HacpExecutionStatus;
  /** Structured before/after evidence */
  executionEvidence?: {
    operation: string;
    target: string;
    before: unknown;
    after: unknown;
    changed: boolean;
    property?: string;
  };
}

/** Color name → hex mapping for deterministic color resolution */
export const COLOR_MAP: Record<string, string> = {
  'czerwony': '#FF0000',
  'czerwone': '#FF0000',
  'red': '#FF0000',
  'zielony': '#00FF00',
  'green': '#00FF00',
  'niebieski': '#0000FF',
  'blue': '#0000FF',
  'żółty': '#FFFF00',
  'zolty': '#FFFF00',
  'yellow': '#FFFF00',
  'biały': '#FFFFFF',
  'białe': '#FFFFFF',
  'white': '#FFFFFF',
  'czarny': '#000000',
  'czarne': '#000000',
  'black': '#000000',
  'pomarańczowy': '#FFA500',
  'orange': '#FFA500',
  'fioletowy': '#800080',
  'purple': '#800080',
  'violet': '#800080',
  'różowy': '#FFC0CB',
  'pink': '#FFC0CB',
  'szary': '#808080',
  'gray': '#808080',
  'grey': '#808080',
  'złoty': '#D9A86C',
  'zloty': '#D9A86C',
  'gold': '#D9A86C',
  'srebrny': '#C0C0C0',
  'silver': '#C0C0C0',
};
