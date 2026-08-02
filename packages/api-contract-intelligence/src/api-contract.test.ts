import { describe, it, expect } from 'vitest';
import {
  APIContract,
  ContractAnalyzer,
  CompatibilityValidator,
  ContractReportGenerator,
  APIContractCLI,
} from './index';

describe('API Contract Intelligence Platform Unit Tests', () => {
  const baseContract: APIContract = {
    id: 'contract:builder-core',
    name: 'Builder Core Contract',
    version: { versionString: '2.0.0' },
    interfaces: [
      {
        name: 'BuilderDocument',
        properties: [
          { name: 'id', type: 'string', optional: false },
          { name: 'version', type: 'string', optional: false },
        ],
        methods: [
          {
            name: 'compile',
            parameters: [],
            returnType: { type: 'string', isAsync: false },
          },
        ],
      },
    ],
    metadata: { description: 'Base contract' },
  };

  const modifiedContract: APIContract = {
    ...baseContract,
    version: { versionString: '2.1.0' },
    interfaces: [
      {
        name: 'BuilderDocument',
        properties: [
          { name: 'id', type: 'string', optional: false },
          { name: 'version', type: 'number', optional: false }, // TYPE CHANGED!
        ],
        methods: [], // METHOD REMOVED!
      },
    ],
  };

  it('should detect breaking changes between base and candidate contracts', () => {
    const breaking = ContractAnalyzer.detectBreakingChanges(baseContract, modifiedContract);
    expect(breaking.length).toBe(2);
    expect(breaking.some(b => b.type === 'property_type_changed')).toBe(true);
    expect(breaking.some(b => b.type === 'method_removed')).toBe(true);
  });

  it('should validate backward compatibility and report errors', () => {
    const valRes = CompatibilityValidator.validateBackwardCompatibility(baseContract, modifiedContract);
    expect(valRes.isCompatible).toBe(false);
    expect(valRes.errors.length).toBeGreaterThan(0);
  });

  it('should calculate Compatibility Score and generate Markdown & JSON report', () => {
    const valRes = CompatibilityValidator.validateBackwardCompatibility(baseContract, modifiedContract);
    const report = ContractReportGenerator.generateReport(valRes);

    expect(report.compatibilityScore).toBeLessThan(100);
    expect(report.grade).toBeDefined();

    const md = ContractReportGenerator.toMarkdown(report);
    expect(md).toContain('# API Contract Intelligence Report');
    expect(md).toContain('Breaking Changes List');

    const json = ContractReportGenerator.toJSON(report);
    expect(json).toContain('"compatibilityScore"');
  });

  it('should parse CLI arguments correctly', () => {
    const cliRes = APIContractCLI.parseArgs(['validate', '--base=base.json', '--candidate=candidate.json']);
    expect(cliRes.command).toBe('validate');
    expect(cliRes.baseContractPath).toBe('base.json');
    expect(cliRes.candidateContractPath).toBe('candidate.json');

    const help = APIContractCLI.getHelpText();
    expect(help).toContain('Usage: api-contract-intelligence <command>');
  });
});
