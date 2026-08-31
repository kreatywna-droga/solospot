/**
 * PlatformIntegrationCheckpointA — G1-190
 *
 * Platform Integration Checkpoint A: validates the full integrity of the
 * platform-core package across TypeScript compilation, test health,
 * scope compliance, architectural boundaries, and honesty boundary.
 *
 * Decision model:
 *   CONTINUE — all gates pass
 *   STOP     — any critical gate fails
 *   HOLD     — borderline / warning conditions present
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ArchitecturalDecision = 'CONTINUE' | 'STOP' | 'HOLD';

export type GateStatus = 'PASS' | 'FAIL' | 'WARN';

export interface CheckpointGate {
  readonly name: string;
  readonly status: GateStatus;
  readonly detail: string;
}

export interface CheckpointResult {
  readonly checkpointId: string;
  readonly timestamp: string;
  readonly phase: string;
  readonly totalTasks: number;
  readonly completedTasks: number;
  readonly tscErrors: number;
  readonly testPassRate: number;
  readonly scopeViolations: number;
  readonly architecturalDecision: ArchitecturalDecision;
  readonly evidence: string[];
  readonly rationale: string;
  readonly gates: CheckpointGate[];
}

export interface TypeScriptValidationInput {
  readonly tscExitCode: number;
  readonly errorCount: number;
}

export interface TestValidationInput {
  readonly totalTests: number;
  readonly passedTests: number;
  readonly failedTests: number;
}

export interface ScopeValidationInput {
  readonly knownScopeFiles: string[];
  readonly unknownFiles: string[];
}

export interface ArchitecturalBoundaryInput {
  readonly headlessInvariantHolds: boolean;
  readonly inspectorImportsPlaybackController: boolean;
  readonly bridgeDelegatesCorrectly: boolean;
}

export interface HonestyBoundaryInput {
  readonly fakeIntegrations: string[];
  readonly mockAsProduction: string[];
  readonly stubBypass: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHECKPOINT_ID = 'G1-190';
const PHASE = 'Platform Integration Checkpoint A';
const REQUIRED_TASK_RANGE = [181, 189] as const;
const MIN_TEST_PASS_RATE = 0.95;

// ---------------------------------------------------------------------------
// PlatformIntegrationCheckpointA
// ---------------------------------------------------------------------------

export class PlatformIntegrationCheckpointA {
  private evidence: string[] = [];
  private gates: CheckpointGate[] = [];

  // -- public API -----------------------------------------------------------

  async runCheckpoint(input: {
    tsc: TypeScriptValidationInput;
    tests: TestValidationInput;
    scope: ScopeValidationInput;
    architecture: ArchitecturalBoundaryInput;
    honesty: HonestyBoundaryInput;
    committedTaskIds: number[];
  }): Promise<CheckpointResult> {
    this.evidence = [];
    this.gates = [];

    const tscOk = this.validateTypeScriptClean(input.tsc);
    const testOk = this.validateTestPassRate(input.tests);
    const scopeOk = this.validateScopeCompliance(input.scope);
    const archOk = this.validateArchitecturalBoundaries(input.architecture);
    const honestyOk = this.validateNoFakeIntegrations(input.honesty);
    const tasksOk = this.validateTasksComplete(input.committedTaskIds);

    const decision = this.getArchitecturalDecision();

    const failedGates = this.gates.filter((g) => g.status === 'FAIL');
    const warnGates = this.gates.filter((g) => g.status === 'WARN');

    let rationale: string;
    if (failedGates.length > 0) {
      rationale = `STOP: ${failedGates.map((g) => g.name).join(', ')} failed critical gate(s).`;
    } else if (warnGates.length > 0) {
      rationale = `HOLD: ${warnGates.map((g) => g.name).join(', ')} produced warning(s).`;
    } else {
      rationale = 'CONTINUE: all gates pass — checkpoint A validated.';
    }

    const completedTasks = input.committedTaskIds.filter(
      (id) => id >= REQUIRED_TASK_RANGE[0] && id <= REQUIRED_TASK_RANGE[1],
    ).length;

    return {
      checkpointId: CHECKPOINT_ID,
      timestamp: new Date().toISOString(),
      phase: PHASE,
      totalTasks: REQUIRED_TASK_RANGE[1] - REQUIRED_TASK_RANGE[0] + 1,
      completedTasks,
      tscErrors: input.tsc.errorCount,
      testPassRate: input.tests.totalTests > 0
        ? input.tests.passedTests / input.tests.totalTests
        : 0,
      scopeViolations: input.scope.unknownFiles.length,
      architecturalDecision: decision,
      evidence: [...this.evidence],
      rationale,
      gates: [...this.gates],
    };
  }

  // -- individual gate checks -----------------------------------------------

  validateTypeScriptClean(input: TypeScriptValidationInput): boolean {
    const pass = input.errorCount === 0 && input.tscExitCode === 0;
    this.gates.push({
      name: 'TypeScript Clean',
      status: pass ? 'PASS' : 'FAIL',
      detail: `Errors: ${input.errorCount}, exit code: ${input.tscExitCode}`,
    });
    this.evidence.push(
      pass
        ? `[TSC] Zero TypeScript errors confirmed (exit code ${input.tscExitCode}).`
        : `[TSC] FAILED — ${input.errorCount} error(s) detected (exit code ${input.tscExitCode}).`,
    );
    return pass;
  }

  validateTestPassRate(input: TestValidationInput): boolean {
    const rate = input.totalTests > 0 ? input.passedTests / input.totalTests : 0;
    const pass = rate >= MIN_TEST_PASS_RATE;
    const pct = (rate * 100).toFixed(2);
    this.gates.push({
      name: 'Test Pass Rate',
      status: pass ? 'PASS' : 'FAIL',
      detail: `${pct}% (${input.passedTests}/${input.totalTests})`,
    });
    this.evidence.push(
      pass
        ? `[TEST] Pass rate ${pct}% meets ≥95% threshold.`
        : `[TEST] FAILED — pass rate ${pct}% below 95% threshold.`,
    );
    return pass;
  }

  validateScopeCompliance(input: ScopeValidationInput): boolean {
    const pass = input.unknownFiles.length === 0;
    this.gates.push({
      name: 'Scope Compliance',
      status: pass ? 'PASS' : 'FAIL',
      detail: pass
        ? 'No scope violations detected.'
        : `${input.unknownFiles.length} unknown file(s): ${input.unknownFiles.join(', ')}`,
    });
    this.evidence.push(
      pass
        ? '[SCOPE] All files belong to known scope.'
        : `[SCOPE] FAILED — ${input.unknownFiles.length} out-of-scope file(s) detected.`,
    );
    return pass;
  }

  validateArchitecturalBoundaries(input: ArchitecturalBoundaryInput): boolean {
    const violations: string[] = [];
    if (!input.headlessInvariantHolds) violations.push('headless invariant broken');
    if (input.inspectorImportsPlaybackController)
      violations.push('inspector imports PlaybackController');
    if (!input.bridgeDelegatesCorrectly) violations.push('bridge delegation broken');

    const pass = violations.length === 0;
    this.gates.push({
      name: 'Architectural Boundaries',
      status: pass ? 'PASS' : 'FAIL',
      detail: pass ? 'All boundaries intact.' : violations.join('; '),
    });
    this.evidence.push(
      pass
        ? '[ARCH] Headless invariant, inspector separation, and bridge delegation all valid.'
        : `[ARCH] FAILED — ${violations.join('; ')}.`,
    );
    return pass;
  }

  validateNoFakeIntegrations(input: HonestyBoundaryInput): boolean {
    const allFake = [
      ...input.fakeIntegrations,
      ...input.mockAsProduction,
      ...input.stubBypass,
    ];
    const pass = allFake.length === 0;
    this.gates.push({
      name: 'Honesty Boundary',
      status: pass ? 'PASS' : 'FAIL',
      detail: pass
        ? 'No fake integrations detected.'
        : `${allFake.length} fake integration(s): ${allFake.join(', ')}`,
    });
    this.evidence.push(
      pass
        ? '[HONESTY] Zero fake integrations — honesty boundary clean.'
        : `[HONESTY] FAILED — ${allFake.length} fake integration(s) found.`,
    );
    return pass;
  }

  validateTasksComplete(committedTaskIds: number[]): boolean {
    const required = Array.from(
      { length: REQUIRED_TASK_RANGE[1] - REQUIRED_TASK_RANGE[0] + 1 },
      (_, i) => REQUIRED_TASK_RANGE[0] + i,
    );
    const missing = required.filter((id) => !committedTaskIds.includes(id));
    const pass = missing.length === 0;
    this.gates.push({
      name: 'Task Completion',
      status: pass ? 'PASS' : missing.length > 0 ? 'FAIL' : 'PASS',
      detail: pass
        ? `All tasks G1-${REQUIRED_TASK_RANGE[0]}..G1-${REQUIRED_TASK_RANGE[1]} present.`
        : `Missing: ${missing.map((id) => `G1-${id}`).join(', ')}`,
    });
    this.evidence.push(
      pass
        ? `[TASKS] All ${required.length} tasks committed (G1-${REQUIRED_TASK_RANGE[0]}..G1-${REQUIRED_TASK_RANGE[1]}).`
        : `[TASKS] FAILED — missing ${missing.length} task(s).`,
    );
    return pass;
  }

  // -- decision engine ------------------------------------------------------

  getArchitecturalDecision(): ArchitecturalDecision {
    const failedCount = this.gates.filter((g) => g.status === 'FAIL').length;
    const warnCount = this.gates.filter((g) => g.status === 'WARN').length;

    if (failedCount > 0) return 'STOP';
    if (warnCount > 0) return 'HOLD';
    return 'CONTINUE';
  }

  // -- report generation ----------------------------------------------------

  generateCheckpointReport(result: CheckpointResult): string {
    const lines: string[] = [];
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push(`  PLATFORM INTEGRATION CHECKPOINT A — ${result.checkpointId}`);
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push(`  Timestamp   : ${result.timestamp}`);
    lines.push(`  Phase       : ${result.phase}`);
    lines.push(`  Tasks       : ${result.completedTasks}/${result.totalTasks} complete`);
    lines.push(`  TSC Errors  : ${result.tscErrors}`);
    lines.push(`  Test Rate   : ${(result.testPassRate * 100).toFixed(2)}%`);
    lines.push(`  Scope Vios  : ${result.scopeViolations}`);
    lines.push('───────────────────────────────────────────────────────────────');
    lines.push(`  DECISION    : ${result.architecturalDecision}`);
    lines.push('───────────────────────────────────────────────────────────────');
    for (const gate of result.gates) {
      const icon = gate.status === 'PASS' ? '✓' : gate.status === 'FAIL' ? '✗' : '⚠';
      lines.push(`  ${icon} ${gate.name}: ${gate.detail}`);
    }
    lines.push('───────────────────────────────────────────────────────────────');
    lines.push('  EVIDENCE:');
    for (const e of result.evidence) {
      lines.push(`    ${e}`);
    }
    lines.push('───────────────────────────────────────────────────────────────');
    lines.push(`  RATIONALE: ${result.rationale}`);
    lines.push('═══════════════════════════════════════════════════════════════');
    return lines.join('\n');
  }
}
