/**
 * OutputManager.test.ts — Sprint S27
 *
 * Tests for OutputManager class and standalone helpers:
 * validateOutputArtifact, renderNamingTemplate, getNextVersion,
 * registerOutputArtifact, version increment, output history, clearHistory.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  OutputManager,
  validateOutputArtifact,
  renderNamingTemplate,
  DEFAULT_NAMING_TEMPLATE,
  type OutputArtifactMetadata,
} from '../OutputManager';
import { createExportWorkspaceConfig } from '../ExportWorkspaceModel';

const makeConfig = (projectId = 'proj-1') => createExportWorkspaceConfig(projectId);

// Minimal valid artifact for testing
const makeArtifact = (overrides: Partial<OutputArtifactMetadata> = {}): OutputArtifactMetadata => ({
  artifactId: 'art-1',
  projectId: 'proj-1',
  filename: 'test_standard_1080p_v1.mp4',
  format: 'mp4',
  version: 1,
  versionLabel: 'v1',
  checksum: 'chk-proj-1-1-1000',
  sizeBytes: 1024,
  width: 1920,
  height: 1080,
  fps: 30,
  totalFrames: 300,
  durationMs: 10000,
  generatedAt: 1000,
  ...overrides,
});

describe('validateOutputArtifact', () => {
  it('returns valid for correct artifact', () => {
    const report = validateOutputArtifact(makeArtifact());
    expect(report.isValid).toBe(true);
    expect(report.errors).toHaveLength(0);
  });

  it('returns invalid for null artifact', () => {
    const report = validateOutputArtifact(null);
    expect(report.isValid).toBe(false);
    expect(report.errors.length).toBeGreaterThan(0);
  });

  it('rejects artifact with empty artifactId', () => {
    const report = validateOutputArtifact(makeArtifact({ artifactId: '' }));
    expect(report.isValid).toBe(false);
    expect(report.errors.some((e) => e.includes('ID'))).toBe(true);
  });

  it('rejects artifact with empty checksum', () => {
    const report = validateOutputArtifact(makeArtifact({ checksum: '' }));
    expect(report.isValid).toBe(false);
    expect(report.errors.some((e) => e.includes('checksum'))).toBe(true);
  });

  it('rejects artifact with sizeBytes <= 0', () => {
    const report = validateOutputArtifact(makeArtifact({ sizeBytes: 0 }));
    expect(report.isValid).toBe(false);
  });

  it('rejects artifact with invalid dimensions', () => {
    const report = validateOutputArtifact(makeArtifact({ width: 0, height: 0 }));
    expect(report.isValid).toBe(false);
  });
});

describe('renderNamingTemplate', () => {
  it('renders all tokens correctly', () => {
    const result = renderNamingTemplate(DEFAULT_NAMING_TEMPLATE, {
      project_name: 'My Project',
      preset: 'web',
      resolution: '1080p',
      fps: 30,
      version: 'v2',
      format: 'mp4',
    });
    expect(result).toContain('My_Project');
    expect(result).toContain('web');
    expect(result).toContain('1080p');
    expect(result).toContain('v2');
    expect(result).toContain('.mp4');
  });

  it('sanitizes special characters in project name', () => {
    const result = renderNamingTemplate(DEFAULT_NAMING_TEMPLATE, {
      project_name: 'Project: A/B',
      preset: 'web',
      resolution: '1080p',
      version: 'v1',
      format: 'mp4',
    });
    // Colon and slash replaced with underscores
    expect(result).not.toContain(':');
    expect(result).not.toContain('/');
  });

  it('uses defaults for missing tokens', () => {
    const result = renderNamingTemplate(DEFAULT_NAMING_TEMPLATE, {});
    expect(result).toContain('Untitled_Project');
    expect(result).toContain('standard');
    expect(result).toContain('v1');
  });
});

describe('OutputManager', () => {
  let manager: OutputManager;

  beforeEach(() => {
    manager = new OutputManager();
  });

  it('getNextVersion starts at v1 for new project', () => {
    const { versionNumber, versionLabel } = manager.getNextVersion('proj-a');
    expect(versionNumber).toBe(1);
    expect(versionLabel).toBe('v1');
  });

  it('registerOutputArtifact increments version monotonically', () => {
    const config = makeConfig('proj-v');
    const a1 = manager.registerOutputArtifact('proj-v', 'MyProject', config, 1024, 300, 10000);
    const a2 = manager.registerOutputArtifact('proj-v', 'MyProject', config, 2048, 300, 10000);
    expect(a1.version).toBe(1);
    expect(a2.version).toBe(2);
    expect(a1.versionLabel).toBe('v1');
    expect(a2.versionLabel).toBe('v2');
  });

  it('artifact IDs are unique per registration', () => {
    const config = makeConfig('proj-id');
    const a1 = manager.registerOutputArtifact('proj-id', 'P', config, 1024, 300, 10000);
    const a2 = manager.registerOutputArtifact('proj-id', 'P', config, 1024, 300, 10000);
    expect(a1.artifactId).not.toBe(a2.artifactId);
  });

  it('registerOutputArtifact produces valid artifact (passes validateOutputArtifact)', () => {
    const config = makeConfig();
    const artifact = manager.registerOutputArtifact('proj-1', 'Test', config, 10240, 300, 10000);
    const report = validateOutputArtifact(artifact);
    expect(report.isValid).toBe(true);
  });

  it('getOutputHistory returns all artifacts for project', () => {
    const config = makeConfig('proj-h');
    manager.registerOutputArtifact('proj-h', 'A', config, 1024, 300, 10000);
    manager.registerOutputArtifact('proj-h', 'A', config, 1024, 300, 10000);
    manager.registerOutputArtifact('proj-x', 'B', makeConfig('proj-x'), 1024, 300, 10000);
    expect(manager.getOutputHistory('proj-h')).toHaveLength(2);
    expect(manager.getOutputHistory('proj-x')).toHaveLength(1);
    expect(manager.getOutputHistory()).toHaveLength(3);
  });

  it('clearHistory removes artifacts for specific project only', () => {
    const config = makeConfig('proj-c');
    manager.registerOutputArtifact('proj-c', 'C', config, 1024, 300, 10000);
    manager.registerOutputArtifact('proj-keep', 'K', makeConfig('proj-keep'), 1024, 300, 10000);
    manager.clearHistory('proj-c');
    expect(manager.getOutputHistory('proj-c')).toHaveLength(0);
    expect(manager.getOutputHistory('proj-keep')).toHaveLength(1);
  });

  it('version counters are restored from initialHistory constructor param', () => {
    const existing = makeArtifact({ projectId: 'proj-r', version: 5, versionLabel: 'v5' });
    const mgr = new OutputManager([existing]);
    const { versionNumber } = mgr.getNextVersion('proj-r');
    expect(versionNumber).toBe(6);
  });
});
