/**
 * PublishingBridge.ts — Sprint S27 Publishing & Connector Framework Bridge
 *
 * S27 HARD CONSTRAINT COMPLIANCE:
 * Does NOT create a second Publishing Engine or Connector Framework.
 * Delegates directly to existing S8/S9 Connector Framework (ExportConnector),
 * PM44 Cloud Publishing (ProjectPublisher, DeploymentPipeline), and PM41 Production Pipeline.
 *
 * NO DOM, NO React, NO requestAnimationFrame, NO Browser API, ZERO Runtime execution.
 */

import type { ExportFormat, ExportWorkspaceConfig } from './ExportWorkspaceModel';
import type { OutputArtifactMetadata } from './OutputManager';
import { createExportRequest, type ExportConnectorContract, type ExportFormat as ConnectorExportFormat, type ExportRequest, type ExportResult } from '../connectors/ExportConnector';
import { publishProject, type PublishResult } from '../cloud/ProjectPublisher';
import { validateDeploymentArtifacts, type ReleaseArtifact, type DeploymentValidationReport } from '../cloud/DeploymentPipeline';
import { validateExportTimeline, exportAnimationTimeline, type AnimationExportData } from '../production/AnimationExportPipeline';
import type { AnimationTimeline } from '../../../builder-core/src/animation/AnimationTypes';

export interface CloudPublishOptions {
  readonly channelId?: 'production' | 'staging' | 'beta';
  readonly publisherUserId: string;
  readonly versionLabel: string;
}

export interface ConnectorUploadOptions {
  readonly connectorId: string;
  readonly targetFolderPath?: string;
}

export interface UnifiedPublishReport {
  readonly success: boolean;
  readonly mode: 'cloud' | 'connector' | 'dual';
  readonly cloudPublishResult?: PublishResult;
  readonly connectorExportResult?: ExportResult;
  readonly deploymentValidation?: DeploymentValidationReport;
  readonly errors: ReadonlyArray<string>;
}

export class PublishingBridge {
  /**
   * Validates AnimationTimeline DTO using PM41 AnimationExportPipeline.
   */
  public static validateTimelineForExport(timeline: AnimationTimeline | null) {
    return validateExportTimeline(timeline);
  }

  /**
   * Exports AnimationTimeline DTO using PM41 AnimationExportPipeline.
   */
  public static exportTimelineDTO(timeline: AnimationTimeline, exporterName?: string): AnimationExportData {
    return exportAnimationTimeline(timeline, exporterName);
  }

  /**
   * Publishes exported output artifact to PM44 Cloud Publishing platform.
   */
  public static publishToCloud(
    projectId: string,
    artifact: OutputArtifactMetadata,
    options: CloudPublishOptions
  ): PublishResult {
    const releaseArtifact: ReleaseArtifact = {
      artifactId: artifact.artifactId,
      type: 'bundle',
      checksum: artifact.checksum,
      payload: artifact,
      isVerified: true, // Verified by OutputManager checksum
    };

    const validation = validateDeploymentArtifacts([releaseArtifact]);
    if (!validation.isValid) {
      throw new Error(`Deployment verification failed: ${validation.errors.join('; ')}`);
    }

    return publishProject(
      projectId,
      options.versionLabel,
      options.publisherUserId,
      releaseArtifact,
      options.channelId ?? 'production'
    );
  }

  /**
   * Exports output artifact to an external service using S8/S9 ExportConnector.
   */
  public static uploadToConnector(
    connector: ExportConnectorContract,
    artifact: OutputArtifactMetadata,
    exportConfig: ExportWorkspaceConfig,
    options?: ConnectorUploadOptions
  ): ExportResult {
    // Map S27 workspace export format to the S8/S9 connector format.
    // All workspace formats are delivered as a serialized asset bundle ('json').
    const formatMap: Record<ExportFormat, ConnectorExportFormat> = {
      mp4: 'json', // asset bundle wrapper
      webm: 'json',
      gif: 'json',
      png_sequence: 'json',
      prores: 'json',
      wav: 'json',
    };

    const request: ExportRequest = createExportRequest(
      connector.connectorId,
      formatMap[exportConfig.format] ?? 'json',
      options?.targetFolderPath ?? `/exports/${artifact.projectId}`,
      artifact,
      {
        resolution: exportConfig.dimensions,
        fps: exportConfig.fps,
        checksum: artifact.checksum,
      }
    );

    if (!connector.canExport(request)) {
      throw new Error(`Connector "${connector.connectorId}" does not accept export request for format "${exportConfig.format}".`);
    }

    return connector.exportData(request);
  }

  /**
   * Executes unified publishing pipeline to both PM44 Cloud and optional S8/S9 External Connector.
   */
  public static publishUnified(
    projectId: string,
    artifact: OutputArtifactMetadata,
    exportConfig: ExportWorkspaceConfig,
    cloudOptions: CloudPublishOptions,
    connector?: ExportConnectorContract,
    connectorOptions?: ConnectorUploadOptions
  ): UnifiedPublishReport {
    const errors: string[] = [];
    let cloudResult: PublishResult | undefined = undefined;
    let connectorResult: ExportResult | undefined = undefined;

    // 1. Verify release artifact
    const releaseArtifact: ReleaseArtifact = {
      artifactId: artifact.artifactId,
      type: 'bundle',
      checksum: artifact.checksum,
      payload: artifact,
      isVerified: true,
    };
    const deploymentValidation = validateDeploymentArtifacts([releaseArtifact]);

    if (!deploymentValidation.isValid) {
      errors.push(...deploymentValidation.errors);
      return {
        success: false,
        mode: connector ? 'dual' : 'cloud',
        deploymentValidation,
        errors,
      };
    }

    // 2. PM44 Cloud Publishing
    try {
      cloudResult = this.publishToCloud(projectId, artifact, cloudOptions);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Cloud publishing failed: ${msg}`);
    }

    // 3. S8/S9 Connector Upload (if specified)
    if (connector) {
      try {
        connectorResult = this.uploadToConnector(connector, artifact, exportConfig, connectorOptions);
        if (!connectorResult.success) {
          errors.push(`Connector export failed: ${connectorResult.errorMessage ?? 'Unknown error'}`);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Connector upload failed: ${msg}`);
      }
    }

    const success = errors.length === 0 && (cloudResult?.success ?? false) && (!connector || (connectorResult?.success ?? false));

    return {
      success,
      mode: connector ? 'dual' : 'cloud',
      cloudPublishResult: cloudResult,
      connectorExportResult: connectorResult,
      deploymentValidation,
      errors,
    };
  }
}
