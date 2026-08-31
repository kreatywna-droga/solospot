/**
 * PlatformIntegrationCheckpointAG1190.test.ts — G1-190 Platform Integration Checkpoint A
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  PlatformIntegrationCheckpointA,
  TypeScriptValidationInput,
  TestValidationInput,
  ScopeValidationInput,
  ArchitecturalBoundaryInput,
  HonestyBoundaryInput,
} from '../PlatformIntegrationCheckpointA';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tscInput(overrides?: Partial<TypeScriptValidationInput>): TypeScriptValidationInput {
  return { tscExitCode: 0, errorCount: 0, ...overrides };
}

function testInput(overrides?: Partial<TestValidationInput>): TestValidationInput {
  return { totalTests: 100, passedTests: 99, failedTests: 1, ...overrides };
}

function scopeInput(overrides?: Partial<ScopeValidationInput>): ScopeValidationInput {
  return { knownScopeFiles: [], unknownFiles: [], ...overrides };
}

function archInput(overrides?: Partial<ArchitecturalBoundaryInput>): ArchitecturalBoundaryInput {
  return {
    headlessInvariantHolds: true,
    inspectorImportsPlaybackController: false,
    bridgeDelegatesCorrectly: true,
    ...overrides,
  };
}

function honestyInput(overrides?: Partial<HonestyBoundaryInput>): HonestyBoundaryInput {
  return { fakeIntegrations: [], mockAsProduction: [], stubBypass: [], ...overrides };
}

function fullInput(overrides?: {
  tsc?: Partial<TypeScriptValidationInput>;
  tests?: Partial<TestValidationInput>;
  scope?: Partial<ScopeValidationInput>;
  arch?: Partial<ArchitecturalBoundaryInput>;
  honesty?: Partial<HonestyBoundaryInput>;
  tasks?: number[];
}) {
  return {
    tsc: tscInput(overrides?.tsc),
    tests: testInput(overrides?.tests),
    scope: scopeInput(overrides?.scope),
    architecture: archInput(overrides?.arch),
    honesty: honestyInput(overrides?.honesty),
    committedTaskIds: overrides?.tasks ?? [181, 182, 183, 184, 185, 186, 187, 188, 189],
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PlatformIntegrationCheckpointA', () => {
  let checkpoint: PlatformIntegrationCheckpointA;

  beforeEach(() => {
    checkpoint = new PlatformIntegrationCheckpointA();
  });

  // ── constructor / instantiation ──

  describe('instantiation', () => {
    it('creates an instance', () => {
      expect(checkpoint).toBeInstanceOf(PlatformIntegrationCheckpointA);
    });
  });

  // ── validateTypeScriptClean ──

  describe('validateTypeScriptClean()', () => {
    it('passes when zero errors and exit code 0', () => {
      expect(checkpoint.validateTypeScriptClean(tscInput())).toBe(true);
    });

    it('fails when errorCount > 0', () => {
      expect(checkpoint.validateTypeScriptClean(tscInput({ errorCount: 3 }))).toBe(false);
    });

    it('fails when exit code non-zero', () => {
      expect(checkpoint.validateTypeScriptClean(tscInput({ tscExitCode: 1 }))).toBe(false);
    });

    it('fails when both errorCount and exit code indicate failure', () => {
      expect(
        checkpoint.validateTypeScriptClean(tscInput({ errorCount: 5, tscExitCode: 1 })),
      ).toBe(false);
    });

    it('passes with exactly 0 errors and exit code 0', () => {
      expect(checkpoint.validateTypeScriptClean(tscInput({ errorCount: 0, tscExitCode: 0 }))).toBe(true);
    });
  });

  // ── validateTestPassRate ──

  describe('validateTestPassRate()', () => {
    it('passes when rate >= 95%', () => {
      expect(checkpoint.validateTestPassRate(testInput({ passedTests: 95, totalTests: 100 }))).toBe(true);
    });

    it('passes when rate = 100%', () => {
      expect(checkpoint.validateTestPassRate(testInput({ passedTests: 100, totalTests: 100 }))).toBe(true);
    });

    it('passes when rate = 99.33%', () => {
      expect(
        checkpoint.validateTestPassRate(testInput({ passedTests: 31149, totalTests: 31359 })),
      ).toBe(true);
    });

    it('fails when rate < 95%', () => {
      expect(checkpoint.validateTestPassRate(testInput({ passedTests: 90, totalTests: 100 }))).toBe(false);
    });

    it('fails when rate = 94.99%', () => {
      expect(checkpoint.validateTestPassRate(testInput({ passedTests: 94, totalTests: 100 }))).toBe(false);
    });

    it('handles zero total tests gracefully — returns false (NaN rate)', () => {
      expect(checkpoint.validateTestPassRate(testInput({ totalTests: 0, passedTests: 0 }))).toBe(false);
    });

    it('passes when rate exactly equals 95%', () => {
      expect(checkpoint.validateTestPassRate(testInput({ passedTests: 95, totalTests: 100 }))).toBe(true);
    });
  });

  // ── validateScopeCompliance ──

  describe('validateScopeCompliance()', () => {
    it('passes when no unknown files', () => {
      expect(checkpoint.validateScopeCompliance(scopeInput())).toBe(true);
    });

    it('passes with known files only', () => {
      expect(
        checkpoint.validateScopeCompliance(scopeInput({ knownScopeFiles: ['a.ts', 'b.ts'] })),
      ).toBe(true);
    });

    it('fails when unknown files present', () => {
      expect(
        checkpoint.validateScopeCompliance(scopeInput({ unknownFiles: ['rogue.ts'] })),
      ).toBe(false);
    });

    it('fails with multiple unknown files', () => {
      expect(
        checkpoint.validateScopeCompliance(scopeInput({ unknownFiles: ['a.ts', 'b.ts'] })),
      ).toBe(false);
    });
  });

  // ── validateArchitecturalBoundaries ──

  describe('validateArchitecturalBoundaries()', () => {
    it('passes when all boundaries intact', () => {
      expect(checkpoint.validateArchitecturalBoundaries(archInput())).toBe(true);
    });

    it('fails when headless invariant broken', () => {
      expect(
        checkpoint.validateArchitecturalBoundaries(archInput({ headlessInvariantHolds: false })),
      ).toBe(false);
    });

    it('fails when inspector imports PlaybackController', () => {
      expect(
        checkpoint.validateArchitecturalBoundaries(archInput({ inspectorImportsPlaybackController: true })),
      ).toBe(false);
    });

    it('fails when bridge delegation broken', () => {
      expect(
        checkpoint.validateArchitecturalBoundaries(archInput({ bridgeDelegatesCorrectly: false })),
      ).toBe(false);
    });

    it('fails when multiple violations exist', () => {
      expect(
        checkpoint.validateArchitecturalBoundaries(
          archInput({
            headlessInvariantHolds: false,
            inspectorImportsPlaybackController: true,
          }),
        ),
      ).toBe(false);
    });
  });

  // ── validateNoFakeIntegrations ──

  describe('validateNoFakeIntegrations()', () => {
    it('passes when no fakes', () => {
      expect(checkpoint.validateNoFakeIntegrations(honestyInput())).toBe(true);
    });

    it('fails when fakeIntegrations present', () => {
      expect(
        checkpoint.validateNoFakeIntegrations(honestyInput({ fakeIntegrations: ['fake-db'] })),
      ).toBe(false);
    });

    it('fails when mockAsProduction present', () => {
      expect(
        checkpoint.validateNoFakeIntegrations(honestyInput({ mockAsProduction: ['mock-auth'] })),
      ).toBe(false);
    });

    it('fails when stubBypass present', () => {
      expect(
        checkpoint.validateNoFakeIntegrations(honestyInput({ stubBypass: ['stub-cache'] })),
      ).toBe(false);
    });

    it('fails when multiple fake categories present', () => {
      expect(
        checkpoint.validateNoFakeIntegrations(
          honestyInput({
            fakeIntegrations: ['a'],
            mockAsProduction: ['b'],
            stubBypass: ['c'],
          }),
        ),
      ).toBe(false);
    });
  });

  // ── validateTasksComplete ──

  describe('validateTasksComplete()', () => {
    it('passes when all 9 tasks present', () => {
      expect(
        checkpoint.validateTasksComplete([181, 182, 183, 184, 185, 186, 187, 188, 189]),
      ).toBe(true);
    });

    it('fails when a task is missing', () => {
      expect(
        checkpoint.validateTasksComplete([181, 182, 183, 184, 185, 186, 187, 188]),
      ).toBe(false);
    });

    it('fails when no tasks committed', () => {
      expect(checkpoint.validateTasksComplete([])).toBe(false);
    });

    it('passes with extra tasks beyond range', () => {
      expect(
        checkpoint.validateTasksComplete([180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190]),
      ).toBe(true);
    });
  });

  // ── getArchitecturalDecision ──

  describe('getArchitecturalDecision()', () => {
    it('returns CONTINUE when all gates pass', async () => {
      const result = await checkpoint.runCheckpoint(fullInput());
      expect(result.architecturalDecision).toBe('CONTINUE');
    });

    it('returns STOP when any gate fails', async () => {
      const result = await checkpoint.runCheckpoint(
        fullInput({ tsc: { errorCount: 5, tscExitCode: 1 } }),
      );
      expect(result.architecturalDecision).toBe('STOP');
    });
  });

  // ── runCheckpoint (integration) ──

  describe('runCheckpoint()', () => {
    it('returns CONTINUE for clean inputs', async () => {
      const result = await checkpoint.runCheckpoint(fullInput());
      expect(result.architecturalDecision).toBe('CONTINUE');
      expect(result.checkpointId).toBe('G1-190');
      expect(result.tscErrors).toBe(0);
      expect(result.scopeViolations).toBe(0);
    });

    it('returns STOP on TSC failure', async () => {
      const result = await checkpoint.runCheckpoint(
        fullInput({ tsc: { errorCount: 2, tscExitCode: 1 } }),
      );
      expect(result.architecturalDecision).toBe('STOP');
      expect(result.tscErrors).toBe(2);
    });

    it('returns STOP on test failure below threshold', async () => {
      const result = await checkpoint.runCheckpoint(
        fullInput({ tests: { passedTests: 50, totalTests: 100, failedTests: 50 } }),
      );
      expect(result.architecturalDecision).toBe('STOP');
    });

    it('returns STOP on scope violation', async () => {
      const result = await checkpoint.runCheckpoint(
        fullInput({ scope: { unknownFiles: ['rogue.ts'], knownScopeFiles: [] } }),
      );
      expect(result.architecturalDecision).toBe('STOP');
      expect(result.scopeViolations).toBe(1);
    });

    it('returns STOP on architectural boundary violation', async () => {
      const result = await checkpoint.runCheckpoint(
        fullInput({ arch: { headlessInvariantHolds: false } }),
      );
      expect(result.architecturalDecision).toBe('STOP');
    });

    it('returns STOP on fake integrations', async () => {
      const result = await checkpoint.runCheckpoint(
        fullInput({ honesty: { fakeIntegrations: ['fake-db'] } }),
      );
      expect(result.architecturalDecision).toBe('STOP');
    });

    it('returns STOP when tasks incomplete', async () => {
      const result = await checkpoint.runCheckpoint(fullInput({ tasks: [181, 182] }));
      expect(result.architecturalDecision).toBe('STOP');
    });

    it('includes timestamp in ISO format', async () => {
      const result = await checkpoint.runCheckpoint(fullInput());
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('sets phase correctly', async () => {
      const result = await checkpoint.runCheckpoint(fullInput());
      expect(result.phase).toBe('Platform Integration Checkpoint A');
    });

    it('sets completedTasks count correctly', async () => {
      const result = await checkpoint.runCheckpoint(fullInput());
      expect(result.completedTasks).toBe(9);
    });

    it('sets totalTasks to 9', async () => {
      const result = await checkpoint.runCheckpoint(fullInput());
      expect(result.totalTasks).toBe(9);
    });

    it('populates evidence array', async () => {
      const result = await checkpoint.runCheckpoint(fullInput());
      expect(result.evidence.length).toBeGreaterThan(0);
    });

    it('populates gates array', async () => {
      const result = await checkpoint.runCheckpoint(fullInput());
      expect(result.gates.length).toBeGreaterThan(0);
    });

    it('sets rationale on CONTINUE', async () => {
      const result = await checkpoint.runCheckpoint(fullInput());
      expect(result.rationale).toContain('CONTINUE');
    });

    it('sets rationale on STOP', async () => {
      const result = await checkpoint.runCheckpoint(
        fullInput({ tsc: { errorCount: 1, tscExitCode: 1 } }),
      );
      expect(result.rationale).toContain('STOP');
    });

    it('returns correct testPassRate', async () => {
      const result = await checkpoint.runCheckpoint(
        fullInput({ tests: { passedTests: 95, totalTests: 100, failedTests: 5 } }),
      );
      expect(result.testPassRate).toBeCloseTo(0.95);
    });
  });

  // ── generateCheckpointReport ──

  describe('generateCheckpointReport()', () => {
    it('produces a report string', async () => {
      const result = await checkpoint.runCheckpoint(fullInput());
      const report = checkpoint.generateCheckpointReport(result);
      expect(typeof report).toBe('string');
      expect(report.length).toBeGreaterThan(0);
    });

    it('contains checkpoint ID', async () => {
      const result = await checkpoint.runCheckpoint(fullInput());
      const report = checkpoint.generateCheckpointReport(result);
      expect(report).toContain('G1-190');
    });

    it('contains DECISION line', async () => {
      const result = await checkpoint.runCheckpoint(fullInput());
      const report = checkpoint.generateCheckpointReport(result);
      expect(report).toContain('DECISION');
    });

    it('contains EVIDENCE section', async () => {
      const result = await checkpoint.runCheckpoint(fullInput());
      const report = checkpoint.generateCheckpointReport(result);
      expect(report).toContain('EVIDENCE');
    });

    it('contains RATIONALE section', async () => {
      const result = await checkpoint.runCheckpoint(fullInput());
      const report = checkpoint.generateCheckpointReport(result);
      expect(report).toContain('RATIONALE');
    });

    it('renders gate statuses with icons', async () => {
      const result = await checkpoint.runCheckpoint(fullInput());
      const report = checkpoint.generateCheckpointReport(result);
      expect(report).toContain('✓');
    });

    it('renders test pass rate percentage', async () => {
      const result = await checkpoint.runCheckpoint(fullInput());
      const report = checkpoint.generateCheckpointReport(result);
      expect(report).toMatch(/Test Rate\s+:\s+[\d.]+%/);
    });
  });
});
