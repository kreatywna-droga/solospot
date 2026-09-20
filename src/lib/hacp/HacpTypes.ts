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

export interface HacpMessage {
  id: string;
  type: HacpMessageType;
  text: string;
  timestamp: string;
  card?: HacpExecutionCard;
  suggestedActions?: string[];
}

export type CapabilityCategory = 'READ' | 'BUILD' | 'EDIT' | 'VALIDATION';

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
}

export interface HacpExecutionResult {
  success: boolean;
  message: string;
  executionCard: HacpExecutionCard;
  commandsToDispatch: BuilderCommand[];
  eventsToEmit: HacpActivityEvent[];
  errorReason?: string;
}
