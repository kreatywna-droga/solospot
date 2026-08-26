/**
 * PublishingBridge.test.ts — Sprint S27
 *
 * Tests for PublishingBridge static delegation methods.
 * All infra dependencies (ProjectPublisher, DeploymentPipeline,
 * AnimationExportPipeline, ExportConnector) are mocked — we verify
 * that PublishingBridge ONLY delegates and does not implement
 * its own publishing/rendering logic.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PublishingBridge } from '../PublishingBridge';
import type { OutputArtifactMetadata } from '../OutputManager';
import type { CloudPublishOptions } from '../PublishingBridge';
import type { ExportConnectorContract, ExportRequest, ExportResult } from '../../connectors/ExportConnector';
import { createExportWorkspaceConfig } from '../ExportWorkspaceModel';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('../../cloud/ProjectPublisher', () => ({
  publishProject: vi.fn(() => ({ success: true, publishId: 'pub-1', channel: 'production', publishedAt: Date.now() })),
}));

vi.mock('../../cloud/DeploymentPipeline', () => ({
  validateDeploymentArtifacts: vi.fn(() => ({ isValid: true, unverifiedArtifactIds: [], errors: [] })),
}));

vi.mock('../../production/AnimationExportPipeline', () => ({
  validateExportTimeline: vi.fn(() => ({ isValid: true, errors: [], warnings: [] })),
  exportAnimationTimeline: vi.fn(() => ({ format: 'json', data: {}, exportedAt: Date.now() })),
}));

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const makeArtifact = (): OutputArtifactMetadata => ({
  artifactId: 'art-test-1',
  projectId: 'proj-bridge',
  filename: 'output_v1.mp4',
  format: 'mp4',
  version: 1,
  versionLabel: 'v1',
  checksum: 'chk-valid-checksum-123',
  sizeBytes: 10240,
  width: 1920,
  height: 1080,
  fps: 30,
  totalFrames: 300,
  durationMs: 10000,
  generatedAt: Date.now(),
});

const makeCloudOptions = (): CloudPublishOptions => ({
  publisherUserId: 'user-1',
  versionLabel: 'v1.0.0',
  channelId: 'production',
});

const makeConnector = (canExport = true): ExportConnectorContract => ({
  connectorId: 'connector-test',
  name: 'Test Connector',
  canExport: vi.fn(() => canExport),
  exportData: vi.fn((_req: ExportRequest): ExportResult => ({
    success: true,
    connectorId: 'connector-test',
    exportedAt: Date.now(),
  })),
} as unknown as ExportConnectorContract);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PublishingBridge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── publishToCloud ─────────────────────────────────────────────────────
  it('publishToCloud delegates to PM44 validateDeploymentArtifacts + publishProject', async () => {
    const { validateDeploymentArtifacts } = await import('../../cloud/DeploymentPipeline');
    const { publishProject } = await import('../../cloud/ProjectPublisher');

    const result = PublishingBridge.publishToCloud('proj-bridge', makeArtifact(), makeCloudOptions());

    expect(validateDeploymentArtifacts).toHaveBeenCalledOnce();
    expect(publishProject).toHaveBeenCalledOnce();
    expect(result.success).toBe(true);
  });

  it('publishToCloud throws if deployment validation fails', async () => {
    const { validateDeploymentArtifacts } = await import('../../cloud/DeploymentPipeline');
    vi.mocked(validateDeploymentArtifacts).mockReturnValueOnce({ isValid: false, unverifiedArtifactIds: [], errors: ['Bad artifact'] });

    expect(() =>
      PublishingBridge.publishToCloud('proj-bridge', makeArtifact(), makeCloudOptions())
    ).toThrow('Deployment verification failed');
  });

  // ── uploadToConnector ──────────────────────────────────────────────────
  it('uploadToConnector delegates to S8/S9 connector.exportData', () => {
    const connector = makeConnector(true);
    const config = createExportWorkspaceConfig('proj-bridge');
    const result = PublishingBridge.uploadToConnector(connector, makeArtifact(), config);

    expect(connector.canExport).toHaveBeenCalledOnce();
    expect(connector.exportData).toHaveBeenCalledOnce();
    expect(result.success).toBe(true);
  });

  it('uploadToConnector throws when connector rejects the request', () => {
    const connector = makeConnector(false);
    const config = createExportWorkspaceConfig('proj-bridge');

    expect(() =>
      PublishingBridge.uploadToConnector(connector, makeArtifact(), config)
    ).toThrow('does not accept export request');
  });

  // ── publishUnified ─────────────────────────────────────────────────────
  it('publishUnified reports success when cloud publish succeeds', async () => {
    const config = createExportWorkspaceConfig('proj-bridge');
    const report = PublishingBridge.publishUnified(
      'proj-bridge',
      makeArtifact(),
      config,
      makeCloudOptions()
    );
    expect(report.success).toBe(true);
    expect(report.errors).toHaveLength(0);
    expect(report.mode).toBe('cloud');
  });

  it('publishUnified mode is "dual" when connector provided', () => {
    const config = createExportWorkspaceConfig('proj-bridge');
    const connector = makeConnector(true);
    const report = PublishingBridge.publishUnified(
      'proj-bridge',
      makeArtifact(),
      config,
      makeCloudOptions(),
      connector
    );
    expect(report.mode).toBe('dual');
  });

  it('publishUnified aborts early if deployment validation fails', async () => {
    const { validateDeploymentArtifacts } = await import('../../cloud/DeploymentPipeline');
    vi.mocked(validateDeploymentArtifacts).mockReturnValueOnce({ isValid: false, unverifiedArtifactIds: [], errors: ['Validation failed'] });

    const config = createExportWorkspaceConfig('proj-bridge');
    const report = PublishingBridge.publishUnified(
      'proj-bridge',
      makeArtifact(),
      config,
      makeCloudOptions()
    );
    expect(report.success).toBe(false);
    expect(report.errors).toContain('Validation failed');
  });

  // ── validateTimelineForExport ──────────────────────────────────────────
  it('validateTimelineForExport delegates to AnimationExportPipeline', async () => {
    const { validateExportTimeline } = await import('../../production/AnimationExportPipeline');
    PublishingBridge.validateTimelineForExport(null);
    expect(validateExportTimeline).toHaveBeenCalledWith(null);
  });
});
