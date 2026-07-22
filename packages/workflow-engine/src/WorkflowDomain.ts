export interface Workflow {
  id: string;
  organizationId: string;
  name: string;
  versions: WorkflowVersion[];
  activeVersionId?: string;
}

export interface WorkflowVersion {
  id: string;
  workflowId: string;
  version: number;
  definition: WorkflowDefinition;
  createdAt: string;
}

export interface WorkflowDefinition {
  triggers: Trigger[];
  steps: Action[];
}

export interface Trigger {
  id: string;
  type: 'eventbus' | 'cron' | 'webhook' | 'manual' | 'schedule';
  config: Record<string, unknown>;
  enabled: boolean;
}

export interface Action {
  id: string;
  type: string;
  config: Record<string, unknown>;
  conditions?: Condition[];
  timeout?: number;
  retry?: number;
  compensation?: Action;
}

export interface Condition {
  type: 'equals' | 'contains' | 'greater' | 'less' | 'and' | 'or';
  field: string;
  value?: unknown;
  children?: Condition[];
}

export interface Execution {
  id: string;
  workflowId: string;
  triggerId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'canceled';
  startedAt: string;
  completedAt?: string;
}

export interface ExecutionLog {
  id: string;
  executionId: string;
  stepId?: string;
  message: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
}

export interface Variable {
  key: string;
  value: unknown;
  scope: 'workflow' | 'execution' | 'global';
}

export interface Secret {
  key: string;
  encryptedValue: string;
  scope: 'workflow' | 'organization';
}