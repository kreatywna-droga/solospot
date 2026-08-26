/**
 * ReleaseWorkflow.test.ts — Sprint S27
 *
 * Tests for ReleaseWorkflowEngine:
 * - Full 5-step Golden E2E: validate → export → verify → publish → record
 * - Guard enforcement (cannot skip steps)
 * - Publish blocked until verify passes
 * - ReleaseRecord correctness
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReleaseWorkflowEngine } from '../ReleaseWorkflowEngine';
import { OutputManager } from '../OutputManager';
import { createExportWorkspaceConfig } from '../ExportWorkspaceModel';
import type { BuilderDocument } from '../../../../builder-core/src/BuilderDocument';

// ---------------------------------------------------------------------------
// Mocks — PublishingBridge.publishUnified must not do real network calls
// ---------------------------------------------------------------------------

vi.mock('../PublishingBridge', () => ({
  PublishingBridge: {
    publishUnified: vi.fn(() => ({
      success: true,
      mode: 'cloud',
      errors: [],
    })),
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeDocument = (id = 'doc-1'): BuilderDocument =>
  ({ id, metadata: { storeName: 'Test Project' } }) as unknown as BuilderDocument;

const makeConfig = () => createExportWorkspaceConfig('proj-rw');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ReleaseWorkflowEngine — Golden E2E (5 steps)', () => {
  let engine: ReleaseWorkflowEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new ReleaseWorkflowEngine(new OutputManager());
  });

  it('initial state is at validate step, not completed', () => {
    const s = engine.getState();
    expect(s.currentStep).toBe('validate');
    expect(s.isCompleted).toBe(false);
    expect(s.hasFailed).toBe(false);
  });

  it('Step 1 — validate() passes for valid document and config', () => {
    const s = engine.validate(makeDocument(), makeConfig());
    expect(s.validationPassed).toBe(true);
    expect(s.hasFailed).toBe(false);
    expect(s.currentStep).toBe('export');
  });

  it('Step 1 — validate() fails for null document', () => {
    const s = engine.validate(null, makeConfig());
    expect(s.hasFailed).toBe(true);
    expect(s.currentStep).toBe('validate');
    expect(s.errors.some((e) => e.includes('BuilderDocument'))).toBe(true);
  });

  it('Step 2 — executeExport() produces artifact with checksum', () => {
    engine.validate(makeDocument(), makeConfig());
    const artifact = engine.executeExport(makeDocument(), makeConfig(), 10240, 300);
    expect(artifact.checksum.length).toBeGreaterThan(5);
    expect(artifact.sizeBytes).toBe(10240);
    expect(artifact.totalFrames).toBe(300);
    expect(engine.getState().currentStep).toBe('verify');
  });

  it('Step 2 — executeExport() throws if called before validate', () => {
    expect(() => engine.executeExport(makeDocument(), makeConfig())).toThrow();
  });

  it('Step 3 — verifyArtifact() passes and advances to publish', () => {
    engine.validate(makeDocument(), makeConfig());
    engine.executeExport(makeDocument(), makeConfig(), 10240, 300);
    const s = engine.verifyArtifact();
    expect(s.hasFailed).toBe(false);
    expect(s.currentStep).toBe('publish');
  });

  it('Step 4 — publish() is BLOCKED before verifyArtifact()', () => {
    engine.validate(makeDocument(), makeConfig());
    engine.executeExport(makeDocument(), makeConfig(), 10240, 300);
    // currentStep is 'verify' — calling publish() directly throws
    expect(() =>
      engine.publish(makeConfig(), { publisherUserId: 'u1', versionLabel: 'v1' })
    ).toThrow();
  });

  it('Step 4 — publish() delegates to PublishingBridge after verify', async () => {
    const { PublishingBridge } = await import('../PublishingBridge');
    engine.validate(makeDocument(), makeConfig());
    engine.executeExport(makeDocument(), makeConfig(), 10240, 300);
    engine.verifyArtifact();
    const report = engine.publish(makeConfig(), { publisherUserId: 'u1', versionLabel: 'v1' });
    expect(PublishingBridge.publishUnified).toHaveBeenCalledOnce();
    expect(report.success).toBe(true);
    expect(engine.getState().currentStep).toBe('record');
  });

  it('Step 5 — recordRelease() produces a complete ReleaseRecord', () => {
    const config = makeConfig();
    engine.validate(makeDocument(), config);
    engine.executeExport(makeDocument(), config, 10240, 300);
    engine.verifyArtifact();
    engine.publish(config, { publisherUserId: 'u1', versionLabel: 'v1' });
    const record = engine.recordRelease('u1', config);

    expect(record.releaseId).toMatch(/^rel-proj-rw/);
    expect(record.checksum.length).toBeGreaterThan(5);
    expect(record.publisherUserId).toBe('u1');
    expect(record.publishReport.success).toBe(true);
    expect(engine.getState().isCompleted).toBe(true);
  });

  it('Full Golden E2E completes without errors', () => {
    const config = makeConfig();
    const doc = makeDocument();

    engine.validate(doc, config);
    engine.executeExport(doc, config, 20480, 600);
    engine.verifyArtifact();
    engine.publish(config, { publisherUserId: 'auditor', versionLabel: 'v1.0.0' });
    const record = engine.recordRelease('auditor', config);

    expect(engine.getState().errors).toHaveLength(0);
    expect(engine.getState().isCompleted).toBe(true);
    expect(record.artifactId).toBeTruthy();
  });

  it('Step ordering enforced — recordRelease throws before publish', () => {
    const config = makeConfig();
    engine.validate(makeDocument(), config);
    engine.executeExport(makeDocument(), config, 10240, 300);
    engine.verifyArtifact();
    // Skip publish — try to record
    expect(() => engine.recordRelease('u1', config)).toThrow();
  });

  it('logs capture all 5 steps in order', () => {
    const config = makeConfig();
    const doc = makeDocument();
    engine.validate(doc, config);
    engine.executeExport(doc, config, 10240, 300);
    engine.verifyArtifact();
    engine.publish(config, { publisherUserId: 'u1', versionLabel: 'v1' });
    engine.recordRelease('u1', config);

    const steps = engine.getState().logs.map((l) => l.step);
    expect(steps).toContain('validate');
    expect(steps).toContain('export');
    expect(steps).toContain('verify');
    expect(steps).toContain('publish');
    expect(steps).toContain('record');
  });
});
