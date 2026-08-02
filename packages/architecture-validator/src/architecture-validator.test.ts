import { describe, it, expect } from 'vitest';
import {
  DEFAULT_RULES,
  DependencyValidator,
  StructureValidator,
  ArchitectureReportGenerator,
  ArchitectureValidatorCLI,
} from './index';

describe('Architecture Validator Platform Unit Tests', () => {
  it('should inspect default rules catalog', () => {
    expect(DEFAULT_RULES.length).toBeGreaterThan(0);
    expect(DEFAULT_RULES.some(r => r.id === 'ARCH-001')).toBe(true);
  });

  it('should detect forbidden layer imports', () => {
    const violations = DependencyValidator.validateLayerImports(
      '@web-factor/devtools',
      ['src/components/builder/Canvas.tsx']
    );

    expect(violations.length).toBe(1);
    expect(violations[0].ruleId).toBe('ARCH-002');
    expect(violations[0].severity).toBe('error');
  });

  it('should detect circular package dependency graph cycles', () => {
    const graphMap = new Map<string, string[]>([
      ['pkg-a', ['pkg-b']],
      ['pkg-b', ['pkg-a']],
    ]);

    const violations = DependencyValidator.checkCycles(graphMap);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].ruleId).toBe('ARCH-001');
    expect(violations[0].severity).toBe('critical');
  });

  it('should validate package structure completeness', () => {
    const violations = StructureValidator.validatePackageStructure('@web-factor/incomplete', ['src/index.ts']);
    expect(violations.length).toBe(1);
    expect(violations[0].ruleId).toBe('ARCH-003');
  });

  it('should calculate Architecture Score and generate Markdown & JSON report', () => {
    const violations = DependencyValidator.validateLayerImports('@web-factor/test', ['src/components/builder/Inspector.tsx']);
    const result = ArchitectureReportGenerator.generateResult(violations, 4);

    expect(result.score).toBe(85);
    expect(result.isValid).toBe(false);

    const md = ArchitectureReportGenerator.toMarkdown(result);
    expect(md).toContain('# Monorepo Architecture Validation Report');
    expect(md).toContain('`ARCH-002`');

    const json = ArchitectureReportGenerator.toJSON(result);
    expect(json).toContain('"score": 85');
  });

  it('should parse CLI arguments correctly', () => {
    const parseRes = ArchitectureValidatorCLI.parseArgs(['validate', '--target=packages/devtools']);
    expect(parseRes.command).toBe('validate');
    expect(parseRes.targetPath).toBe('packages/devtools');

    const help = ArchitectureValidatorCLI.getHelpText();
    expect(help).toContain('Usage: architecture-validator <command>');
  });
});
