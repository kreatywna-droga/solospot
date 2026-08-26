/**
 * EndToEndWorkflows.ts — PM47 Declarative End-to-End Workflow Definitions (ETAP 2)
 *
 * DECISION-102: Workflow są deklaratywne i nie zawierają logiki Runtime.
 *
 * Declarative workflow specifications for full studio operations.
 *
 * NO DOM, NO React, NO Browser API.
 */

export interface E2EWorkflowStep {
  readonly stepId: string;
  readonly module: string;
  readonly description: string;
  readonly isMandatory: boolean;
}

export interface E2EWorkflowSpecification {
  readonly workflowKey: string;
  readonly title: string;
  readonly description: string;
  readonly steps: ReadonlyArray<E2EWorkflowStep>;
}

export const WORKFLOW_CREATE_ANIMATION: E2EWorkflowSpecification = {
  workflowKey: 'WorkflowCreateAnimation',
  title: 'Create Animation Workflow',
  description: 'Initializes timeline track and keyframes on target document node',
  steps: [
    { stepId: 's1', module: 'builder-core', description: 'Select target section node', isMandatory: true },
    { stepId: 's2', module: 'timeline', description: 'Create timeline track for opacity property', isMandatory: true },
    { stepId: 's3', module: 'inspector', description: 'Configure initial keyframe value in inspector', isMandatory: true },
  ],
};

export const WORKFLOW_EDIT_ANIMATION: E2EWorkflowSpecification = {
  workflowKey: 'WorkflowEditAnimation',
  title: 'Edit Animation Workflow',
  description: 'Adjusts keyframe timings, easings, or values immutably',
  steps: [
    { stepId: 's1', module: 'timeline', description: 'Drag keyframe to new time position', isMandatory: true },
    { stepId: 's2', module: 'inspector', description: 'Update easing preset to cubic-bezier', isMandatory: true },
  ],
};

export const WORKFLOW_PREVIEW_ANIMATION: E2EWorkflowSpecification = {
  workflowKey: 'WorkflowPreviewAnimation',
  title: 'Preview Animation Workflow',
  description: 'Configures live canvas synchronization adapter',
  steps: [
    { stepId: 's1', module: 'preview', description: 'Bind live preview adapter to document', isMandatory: true },
  ],
};

export const WORKFLOW_EXPORT_ANIMATION: E2EWorkflowSpecification = {
  workflowKey: 'WorkflowExportAnimation',
  title: 'Export Animation Workflow',
  description: 'Validates and exports DTO animation package manifest',
  steps: [
    { stepId: 's1', module: 'production', description: 'Validate production timeline constraints', isMandatory: true },
    { stepId: 's2', module: 'production', description: 'Generate export DTO manifest payload', isMandatory: true },
  ],
};

export const WORKFLOW_PUBLISH_ANIMATION: E2EWorkflowSpecification = {
  workflowKey: 'WorkflowPublishAnimation',
  title: 'Publish Animation Workflow',
  description: 'Publishes animation project to release channel',
  steps: [
    { stepId: 's1', module: 'cloud', description: 'Generate publish manifest for target channel', isMandatory: true },
  ],
};

export const WORKFLOW_CLOUD_SYNC: E2EWorkflowSpecification = {
  workflowKey: 'WorkflowCloudSync',
  title: 'Cloud Sync Workflow',
  description: 'Synchronizes project DTO metadata with cloud repository',
  steps: [
    { stepId: 's1', module: 'cloud', description: 'Initiate cloud sync session and resolve conflicts', isMandatory: true },
  ],
};

export const WORKFLOW_SNAPSHOT_RESTORE: E2EWorkflowSpecification = {
  workflowKey: 'WorkflowSnapshotRestore',
  title: 'Snapshot Restore Workflow',
  description: 'Restores project document to deterministic restore point snapshot',
  steps: [
    { stepId: 's1', module: 'cloud', description: 'Restore document state from snapshot manager', isMandatory: true },
  ],
};

export const WORKFLOW_AUTOMATION_RUN: E2EWorkflowSpecification = {
  workflowKey: 'WorkflowAutomationRun',
  title: 'Automation Run Workflow',
  description: 'Executes declarative studio automation workflow plan',
  steps: [
    { stepId: 's1', module: 'automation', description: 'Generate workflow execution plan and run steps', isMandatory: true },
  ],
};

export const ALL_E2E_WORKFLOWS: ReadonlyArray<E2EWorkflowSpecification> = [
  WORKFLOW_CREATE_ANIMATION,
  WORKFLOW_EDIT_ANIMATION,
  WORKFLOW_PREVIEW_ANIMATION,
  WORKFLOW_EXPORT_ANIMATION,
  WORKFLOW_PUBLISH_ANIMATION,
  WORKFLOW_CLOUD_SYNC,
  WORKFLOW_SNAPSHOT_RESTORE,
  WORKFLOW_AUTOMATION_RUN,
];
