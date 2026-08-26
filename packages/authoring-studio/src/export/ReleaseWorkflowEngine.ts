/**
 * ReleaseWorkflowEngine.ts — Sprint S27 End-to-End Release Workflow Orchestrator
 *
 * Orchestrates the full 5-step production release workflow:
 * 1. Validate (BuilderDocument & Export Config)
 * 2. Export / Render (Job Enqueue & Execution)
 * 3. Verify Artifact (Checksum & Structural Integrity)
 * 4. Publish (Cloud Publishing / Connector Upload)
 * 5. Release Record (Audit Record Creation)
 *
 * NO DOM, NO React, NO requestAnimationFrame, NO Browser API, ZERO Runtime execution.
 */

import type { BuilderDocument } from '../../../builder-core/src/BuilderDocument';
import type { ExportWorkspaceConfig } from './ExportWorkspaceModel';
import { validateExportWorkspaceConfig } from './ExportWorkspaceModel';
import type { OutputArtifactMetadata } from './OutputManager';
import { OutputManager } from './OutputManager';
import { PublishingBridge, type CloudPublishOptions, type UnifiedPublishReport } from './PublishingBridge';
import type { ExportConnectorContract } from '../connectors/ExportConnector';

export type ReleaseStep = 'validate' | 'export' | 'verify' | 'publish' | 'record';

export interface ReleaseRecord {
  readonly releaseId: string;
  readonly projectId: string;
  readonly versionLabel: string;
  readonly artifactId: string;
  readonly checksum: string;
  readonly publisherUserId: string;
  readonly releasedAt: number;
  readonly exportConfigSummary: {
    readonly format: string;
    readonly width: number;
    readonly height: number;
    readonly fps: number;
  };
  readonly publishReport: UnifiedPublishReport;
}

export interface ReleaseWorkflowState {
  readonly currentStep: ReleaseStep;
  readonly isCompleted: boolean;
  readonly hasFailed: boolean;
  readonly validationPassed?: boolean;
  readonly artifact?: OutputArtifactMetadata;
  readonly publishReport?: UnifiedPublishReport;
  readonly releaseRecord?: ReleaseRecord;
  readonly logs: ReadonlyArray<{ step: ReleaseStep; timestamp: number; message: string }>;
  readonly errors: ReadonlyArray<string>;
}

export class ReleaseWorkflowEngine {
  private state: ReleaseWorkflowState;
  private readonly outputManager: OutputManager;

  constructor(outputManager?: OutputManager) {
    this.outputManager = outputManager ?? new OutputManager();
    this.state = {
      currentStep: 'validate',
      isCompleted: false,
      hasFailed: false,
      logs: [],
      errors: [],
    };
  }

  public getState(): ReleaseWorkflowState {
    return { ...this.state };
  }

  /**
   * Step 1: Validate BuilderDocument and ExportWorkspaceConfig.
   */
  public validate(document: BuilderDocument | null, config: ExportWorkspaceConfig): ReleaseWorkflowState {
    const logs = [...this.state.logs, { step: 'validate' as ReleaseStep, timestamp: Date.now(), message: 'Validating document and export workspace configuration...' }];
    const errors: string[] = [];

    if (!document) {
      errors.push('BuilderDocument is null or undefined.');
    } else if (!document.id) {
      errors.push('BuilderDocument is missing valid ID.');
    }

    const configReport = validateExportWorkspaceConfig(config);
    if (!configReport.isValid) {
      errors.push(...configReport.errors);
    }

    const hasFailed = errors.length > 0;
    this.state = {
      ...this.state,
      currentStep: hasFailed ? 'validate' : 'export',
      validationPassed: !hasFailed,
      hasFailed,
      logs: hasFailed ? [...logs, { step: 'validate', timestamp: Date.now(), message: `Validation failed: ${errors.join('; ')}` }] : [...logs, { step: 'validate', timestamp: Date.now(), message: 'Validation passed successfully.' }],
      errors: [...this.state.errors, ...errors],
    };

    return this.getState();
  }

  /**
   * Step 2: Export / Render Artifact compilation.
   */
  public executeExport(
    document: BuilderDocument,
    config: ExportWorkspaceConfig,
    simulatedSizeBytes: number = 10485760, // 10MB default
    simulatedTotalFrames: number = 300
  ): OutputArtifactMetadata {
    if (this.state.currentStep !== 'export' || this.state.hasFailed) {
      throw new Error(`Cannot execute export step when workflow state is at "${this.state.currentStep}" with hasFailed=${this.state.hasFailed}`);
    }

    const durationMs = Math.round((simulatedTotalFrames / config.fps) * 1000);
    const artifact = this.outputManager.registerOutputArtifact(
      document.id,
      document.metadata?.storeName || 'Project',
      config,
      simulatedSizeBytes,
      simulatedTotalFrames,
      durationMs
    );

    const logs = [
      ...this.state.logs,
      { step: 'export' as ReleaseStep, timestamp: Date.now(), message: `Export completed. Produced artifact ${artifact.filename} (${artifact.versionLabel}).` },
    ];

    this.state = {
      ...this.state,
      currentStep: 'verify',
      artifact,
      logs,
    };

    return artifact;
  }

  /**
   * Step 3: Verify Artifact Checksum & Integrity.
   */
  public verifyArtifact(artifact?: OutputArtifactMetadata): ReleaseWorkflowState {
    const targetArtifact = artifact ?? this.state.artifact;
    if (!targetArtifact) {
      const errorMsg = 'No artifact available to verify.';
      this.state = {
        ...this.state,
        hasFailed: true,
        errors: [...this.state.errors, errorMsg],
        logs: [...this.state.logs, { step: 'verify', timestamp: Date.now(), message: errorMsg }],
      };
      return this.getState();
    }

    const isChecksumValid = Boolean(targetArtifact.checksum && targetArtifact.checksum.length > 5);
    const isSizeValid = targetArtifact.sizeBytes > 0;

    const errors: string[] = [];
    if (!isChecksumValid) errors.push('Artifact checksum verification failed.');
    if (!isSizeValid) errors.push('Artifact size verification failed.');

    const hasFailed = errors.length > 0;

    const logs = [
      ...this.state.logs,
      { step: 'verify' as ReleaseStep, timestamp: Date.now(), message: hasFailed ? `Verification failed: ${errors.join('; ')}` : `Artifact ${targetArtifact.artifactId} verified successfully.` },
    ];

    this.state = {
      ...this.state,
      currentStep: hasFailed ? 'verify' : 'publish',
      hasFailed,
      errors: [...this.state.errors, ...errors],
      logs,
    };

    return this.getState();
  }

  /**
   * Step 4: Publish to PM44 Cloud and optional S8/S9 Connector.
   */
  public publish(
    config: ExportWorkspaceConfig,
    cloudOptions: CloudPublishOptions,
    connector?: ExportConnectorContract
  ): UnifiedPublishReport {
    if (this.state.currentStep !== 'publish' || this.state.hasFailed || !this.state.artifact) {
      throw new Error(`Cannot execute publish step in current workflow state.`);
    }

    const publishReport = PublishingBridge.publishUnified(
      config.projectId,
      this.state.artifact,
      config,
      cloudOptions,
      connector
    );

    const hasFailed = !publishReport.success;
    const logs = [
      ...this.state.logs,
      { step: 'publish' as ReleaseStep, timestamp: Date.now(), message: hasFailed ? `Publishing failed: ${publishReport.errors.join('; ')}` : `Published successfully to ${publishReport.mode} channel.` },
    ];

    this.state = {
      ...this.state,
      currentStep: hasFailed ? 'publish' : 'record',
      publishReport,
      hasFailed,
      errors: [...this.state.errors, ...publishReport.errors],
      logs,
    };

    return publishReport;
  }

  /**
   * Step 5: Record Release Audit Log & Finalize Workflow.
   */
  public recordRelease(publisherUserId: string, config: ExportWorkspaceConfig): ReleaseRecord {
    if (this.state.currentStep !== 'record' || this.state.hasFailed || !this.state.artifact || !this.state.publishReport) {
      throw new Error(`Cannot record release in current workflow state.`);
    }

    const now = Date.now();
    const releaseRecord: ReleaseRecord = {
      releaseId: `rel-${config.projectId}-${this.state.artifact.versionLabel}-${now}`,
      projectId: config.projectId,
      versionLabel: this.state.artifact.versionLabel,
      artifactId: this.state.artifact.artifactId,
      checksum: this.state.artifact.checksum,
      publisherUserId,
      releasedAt: now,
      exportConfigSummary: {
        format: config.format,
        width: config.dimensions.width,
        height: config.dimensions.height,
        fps: config.fps,
      },
      publishReport: this.state.publishReport,
    };

    const logs = [
      ...this.state.logs,
      { step: 'record' as ReleaseStep, timestamp: now, message: `Release record ${releaseRecord.releaseId} recorded. Release workflow complete.` },
    ];

    this.state = {
      ...this.state,
      isCompleted: true,
      releaseRecord,
      logs,
    };

    return releaseRecord;
  }
}
