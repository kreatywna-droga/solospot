/**
 * BuilderOperationPlanner.ts — Multi-Step Builder Operation Planning
 *
 * Enables AI to execute complex tasks as planned operations:
 * - INSPECT current state
 * - PLAN multi-step changes
 * - EXECUTE mutations
 * - VERIFY results
 * - CORRECT issues
 *
 * This is a pure data layer — actual execution goes through HACP.
 */

import type { BuilderDocument, BuilderNode, NodeType } from '../../../packages/builder-core/src';
import { findNode, getNode, getParent, getChildren } from '../../../packages/builder-core/src/NodeTree';
import { getCapabilitiesForNodeType } from './BuilderCapabilityRegistry';
import type { BuilderCapability } from './BuilderCapabilityRegistry';

// ── Operation Plan Types ───────────────────────────────────────────

export type OperationPhase = 'INSPECT' | 'PLAN' | 'EXECUTE' | 'VERIFY' | 'CORRECT';

export type OperationType =
  | 'UPDATE_STYLE'
  | 'UPDATE_PROP'
  | 'INSERT_NODE'
  | 'REMOVE_NODE'
  | 'MOVE_NODE'
  | 'INSERT_SECTION'
  | 'REMOVE_SECTION'
  | 'MOVE_SECTION'
  | 'CONFIGURE_EXPERIENCE'
  | 'UPDATE_THEME'
  | 'BATCH';

export interface OperationStep {
  id: string;
  type: OperationType;
  targetNodeId: string;
  targetNodeType: NodeType;
  targetLabel: string;
  description: string;
  toolName: string;
  toolArgs: Record<string, unknown>;
  estimatedImpact: 'low' | 'medium' | 'high';
  dependencies: string[];
  verificationCriteria: string;
}

export interface OperationPlan {
  id: string;
  objective: string;
  targetNodeId: string;
  targetNodeType: NodeType;
  currentCapabilities: string[];
  steps: OperationStep[];
  estimatedResult: string;
  riskLevel: 'safe' | 'moderate' | 'risky';
  requiresConfirmation: boolean;
}

export interface PlanExecutionResult {
  planId: string;
  stepsExecuted: number;
  stepsTotal: number;
  stepsSucceeded: number;
  stepsFailed: number;
  results: Array<{
    stepId: string;
    success: boolean;
    message: string;
    verificationPassed: boolean;
  }>;
  overallSuccess: boolean;
  correctionsNeeded: string[];
}

// ── Plan Builder ───────────────────────────────────────────────────

export function buildOperationPlan(
  objective: string,
  doc: BuilderDocument,
  targetNodeId: string,
  activePageId: string
): OperationPlan | null {
  const found = findNode(doc, targetNodeId);
  if (!found) return null;

  const node = found.node;
  const capabilities = getCapabilitiesForNodeType(node.type);
  const capIds = capabilities.map(c => c.id);

  const steps = planStepsForObjective(objective, node, capabilities, doc, activePageId);

  return {
    id: `plan-${Date.now()}`,
    objective,
    targetNodeId: node.id,
    targetNodeType: node.type,
    currentCapabilities: capIds,
    steps,
    estimatedResult: `Operacja "${objective}" na elemencie "${node.label || node.type}" z ${steps.length} krokami.`,
    riskLevel: assessRisk(steps),
    requiresConfirmation: steps.some(s => s.estimatedImpact === 'high'),
  };
}

function planStepsForObjective(
  objective: string,
  node: BuilderNode,
  capabilities: BuilderCapability[],
  doc: BuilderDocument,
  pageId: string
): OperationStep[] {
  const lower = objective.toLowerCase();
  const steps: OperationStep[] = [];

  // "Make it premium" → multiple style improvements
  if (lower.includes('premium') || lower.includes('elegant') || lower.includes('luksus')) {
    if (node.type === 'section' || node.type === 'container') {
      // Improve typography
      const typographyCaps = capabilities.filter(c => c.category === 'typography');
      if (typographyCaps.length > 0) {
        steps.push(createStep('UPDATE_STYLE', node, 'Poprawa typografii', 'set_node_styles', {
          nodeId: node.id,
          styles: { fontWeight: '700', letterSpacing: '-0.02em' },
        }));
      }

      // Improve spacing
      const spacingCaps = capabilities.filter(c => c.category === 'spacing');
      if (spacingCaps.length > 0) {
        steps.push(createStep('UPDATE_STYLE', node, 'Zwiększenie paddingu', 'set_node_styles', {
          nodeId: node.id,
          styles: { padding: '80px 0' },
        }));
      }

      // Add Experience
      steps.push(createStep('CONFIGURE_EXPERIENCE', node, 'Dodanie efektów wizualnych', 'configure_experience', {
        pageId,
        sectionId: node.id,
        experienceConfig: {
          background: { type: 'mesh-gradient', colors: ['#D9A86C', '#F2C27F', '#1A1813', '#080B10'] },
          motion: { type: 'float', speed: 0.85 },
        },
      }));
    }
  }

  // "Fix contrast" → improve text color/background
  if (lower.includes('contrast') || lower.includes('kontrast') || lower.includes('czytelno')) {
    steps.push(createStep('UPDATE_STYLE', node, 'Poprawa kontrastu', 'set_node_styles', {
      nodeId: node.id,
      styles: { color: '#FFFFFF', backgroundColor: '#0A0A0F' },
    }));
  }

  // "Make bigger/smaller"
  if (lower.includes('większy') || lower.includes('bigger') || lower.includes('zwiększ')) {
    steps.push(createStep('UPDATE_STYLE', node, 'Zwiększenie rozmiaru', 'set_node_styles', {
      nodeId: node.id,
      styles: { fontSize: '64px' },
    }));
  }

  if (lower.includes('mniejszy') || lower.includes('smaller') || lower.includes('zmniejsz')) {
    steps.push(createStep('UPDATE_STYLE', node, 'Zmniejszenie rozmiaru', 'set_node_styles', {
      nodeId: node.id,
      styles: { fontSize: '36px' },
    }));
  }

  // Default: if no specific steps planned, create a generic inspection step
  if (steps.length === 0) {
    steps.push(createStep('UPDATE_STYLE', node, `Analiza i modyfikacja: ${objective}`, 'set_node_styles', {
      nodeId: node.id,
      styles: {},
    }));
  }

  return steps;
}

function createStep(
  type: OperationType,
  node: BuilderNode,
  description: string,
  toolName: string,
  toolArgs: Record<string, unknown>
): OperationStep {
  return {
    id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    targetNodeId: node.id,
    targetNodeType: node.type,
    targetLabel: node.label || node.type,
    description,
    toolName,
    toolArgs,
    estimatedImpact: type === 'REMOVE_NODE' || type === 'REMOVE_SECTION' ? 'high' : type === 'CONFIGURE_EXPERIENCE' ? 'medium' : 'low',
    dependencies: [],
    verificationCriteria: `Element ${node.id} został zmodyfikowany zgodnie z planem.`,
  };
}

function assessRisk(steps: OperationStep[]): 'safe' | 'moderate' | 'risky' {
  const hasHighImpact = steps.some(s => s.estimatedImpact === 'high');
  const hasManySteps = steps.length > 5;
  if (hasHighImpact) return 'risky';
  if (hasManySteps) return 'moderate';
  return 'safe';
}

// ── Plan Verification ──────────────────────────────────────────────

export function verifyPlanExecution(
  plan: OperationPlan,
  docBefore: BuilderDocument,
  docAfter: BuilderDocument
): PlanExecutionResult {
  const changed = JSON.stringify(docBefore) !== JSON.stringify(docAfter);

  return {
    planId: plan.id,
    stepsExecuted: plan.steps.length,
    stepsTotal: plan.steps.length,
    stepsSucceeded: changed ? plan.steps.length : 0,
    stepsFailed: changed ? 0 : plan.steps.length,
    results: plan.steps.map(step => ({
      stepId: step.id,
      success: changed,
      message: changed ? `Krok "${step.description}" wykonany.` : `Krok "${step.description}" nie powiódł się.`,
      verificationPassed: changed,
    })),
    overallSuccess: changed,
    correctionsNeeded: changed ? [] : ['Wymagana ręczna weryfikacja zmian w BuilderDocument.'],
  };
}
